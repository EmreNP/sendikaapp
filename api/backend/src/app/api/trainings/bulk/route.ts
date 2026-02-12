import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { BulkTrainingActionRequest, BulkTrainingActionResult } from '@shared/types/training';
import {
  successResponse,
  isErrorWithMessage,
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';
import { deleteLessonsContentsBatch } from '@/lib/utils/batchQueries';

// POST - Toplu işlem (sadece admin)
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
    const body = await parseJsonBody<BulkTrainingActionRequest>(req);
      const { action, trainingIds } = body;
      
      // Validation
      if (!action || !['delete', 'activate', 'deactivate'].includes(action)) {
      throw new AppValidationError('Geçersiz işlem tipi. İzin verilen: delete, activate, deactivate');
      }
      
      if (!trainingIds || !Array.isArray(trainingIds) || trainingIds.length === 0) {
      throw new AppValidationError('Eğitim ID listesi boş veya geçersiz');
      }
      
      if (trainingIds.length > 100) {
      throw new AppValidationError('Maksimum 100 eğitim için toplu işlem yapılabilir');
      }
      
      // Her eğitim için işlemi yap
      const promises = trainingIds.map(async (trainingId: string) => {
        try {
          const trainingDoc = await db.collection('trainings').doc(trainingId).get();
          
          if (!trainingDoc.exists) {
            return {
              success: false,
              trainingId,
              error: 'Eğitim bulunamadı',
            };
          }
          
          switch (action) {
            case 'delete':
              // Hard delete + cascade
              const lessonsSnapshot = await db.collection('lessons')
                .where('trainingId', '==', trainingId)
                .get();
              
              const lessonIds = lessonsSnapshot.docs.map(doc => doc.id);
              
              // Content'leri batch olarak sil (N+1 query çözüldü ✅)
              await deleteLessonsContentsBatch(lessonIds);
              
              // Lesson'ları sil
              const lessonDeletes = lessonsSnapshot.docs.map(doc => doc.ref.delete());
              await Promise.all(lessonDeletes);
              
              // Training'i sil
              await db.collection('trainings').doc(trainingId).delete();
              return { success: true, trainingId };
              
            case 'activate':
              await db.collection('trainings').doc(trainingId).update({
                isActive: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
              });
              return { success: true, trainingId };
              
            case 'deactivate':
              await db.collection('trainings').doc(trainingId).update({
                isActive: false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
              });
              return { success: true, trainingId };
              
            default:
              return {
                success: false,
                trainingId,
                error: 'Geçersiz işlem tipi',
              };
          }
        } catch (error: unknown) {
          const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
          return {
            success: false,
            trainingId,
            error: errorMessage,
          };
        }
      });
      
      // Tüm işlemleri bekle ve sonuçları topla
      const operationResults = await Promise.all(promises);
      
      // Sonuçları reduce ile say (race condition yok)
      const results: BulkTrainingActionResult = operationResults.reduce(
        (acc, result) => {
          if (result.success) {
            acc.successCount++;
          } else {
            acc.failureCount++;
            acc.errors?.push({
              trainingId: result.trainingId,
              error: result.error || 'Bilinmeyen hata',
            });
          }
          return acc;
        },
        {
          success: true,
          successCount: 0,
          failureCount: 0,
          errors: [] as Array<{ trainingId: string; error: string }>,
        } as BulkTrainingActionResult
      );
      
      results.success = results.failureCount === 0;
      
      if (results.success) {
        return successResponse(
          `${results.successCount} eğitim için toplu işlem başarıyla tamamlandı`,
          results,
          200,
          'BULK_TRAINING_ACTION_SUCCESS'
        );
      } else {
        return successResponse(
          `Toplu işlem kısmen tamamlandı. Başarılı: ${results.successCount}, Başarısız: ${results.failureCount}`,
          results,
          207,
          'BULK_TRAINING_ACTION_PARTIAL'
        );
      }
  });
});

