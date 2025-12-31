import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { BulkTrainingActionRequest, BulkTrainingActionResult } from '@shared/types/training';
import {
  successResponse,
  validationError,
  unauthorizedError,
  serverError,
  isErrorWithMessage,
} from '@/lib/utils/response';

// POST - Toplu işlem (sadece admin)
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const body: BulkTrainingActionRequest = await request.json();
      const { action, trainingIds } = body;
      
      // Validation
      if (!action || !['delete', 'activate', 'deactivate'].includes(action)) {
        return validationError('Geçersiz işlem tipi. İzin verilen: delete, activate, deactivate');
      }
      
      if (!trainingIds || !Array.isArray(trainingIds) || trainingIds.length === 0) {
        return validationError('Eğitim ID listesi boş veya geçersiz');
      }
      
      if (trainingIds.length > 100) {
        return validationError('Maksimum 100 eğitim için toplu işlem yapılabilir');
      }
      
      const results: BulkTrainingActionResult = {
        success: true,
        successCount: 0,
        failureCount: 0,
        errors: [],
      };
      
      // Her eğitim için işlemi yap
      const promises = trainingIds.map(async (trainingId: string) => {
        try {
          const trainingDoc = await db.collection('trainings').doc(trainingId).get();
          
          if (!trainingDoc.exists) {
            results.failureCount++;
            results.errors?.push({
              trainingId,
              error: 'Eğitim bulunamadı',
            });
            return;
          }
          
          switch (action) {
            case 'delete':
              // Hard delete + cascade
              const lessonsSnapshot = await db.collection('lessons')
                .where('trainingId', '==', trainingId)
                .get();
              
              const lessonIds = lessonsSnapshot.docs.map(doc => doc.id);
              
              // Content'leri sil
              const contentDeletes: Promise<any>[] = [];
              for (const lessonId of lessonIds) {
                const videoSnapshot = await db.collection('video_contents')
                  .where('lessonId', '==', lessonId)
                  .get();
                videoSnapshot.docs.forEach(doc => contentDeletes.push(doc.ref.delete()));
                
                const documentSnapshot = await db.collection('document_contents')
                  .where('lessonId', '==', lessonId)
                  .get();
                documentSnapshot.docs.forEach(doc => contentDeletes.push(doc.ref.delete()));
                
                const testSnapshot = await db.collection('test_contents')
                  .where('lessonId', '==', lessonId)
                  .get();
                testSnapshot.docs.forEach(doc => contentDeletes.push(doc.ref.delete()));
              }
              await Promise.all(contentDeletes);
              
              // Lesson'ları sil
              const lessonDeletes = lessonsSnapshot.docs.map(doc => doc.ref.delete());
              await Promise.all(lessonDeletes);
              
              // Training'i sil
              await db.collection('trainings').doc(trainingId).delete();
              results.successCount++;
              break;
              
            case 'activate':
              await db.collection('trainings').doc(trainingId).update({
                isActive: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
              });
              results.successCount++;
              break;
              
            case 'deactivate':
              await db.collection('trainings').doc(trainingId).update({
                isActive: false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
              });
              results.successCount++;
              break;
              
            default:
              results.failureCount++;
              results.errors?.push({
                trainingId,
                error: 'Geçersiz işlem tipi',
              });
          }
        } catch (error: unknown) {
          results.failureCount++;
          const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
          results.errors?.push({
            trainingId,
            error: errorMessage,
          });
        }
      });
      
      await Promise.all(promises);
      
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
    } catch (error: unknown) {
      console.error('❌ Bulk training action error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Toplu işlem sırasında bir hata oluştu', errorMessage);
    }
  });
}

