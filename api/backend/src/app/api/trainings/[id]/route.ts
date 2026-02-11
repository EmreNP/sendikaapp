import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { Training, UpdateTrainingRequest } from '@shared/types/training';
import { validateUpdateTraining } from '@/lib/utils/validation/trainingValidation';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { 
  successResponse, 
  serializeTrainingTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';
import { deleteLessonsContentsBatch } from '@/lib/utils/batchQueries';

// GET - Tek eğitim detayı
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const trainingId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      const userRole = currentUserData!.role;
      
      const trainingDoc = await db.collection('trainings').doc(trainingId).get();
      
      if (!trainingDoc.exists) {
      throw new AppNotFoundError('Eğitim');
      }
      
      const trainingData = trainingDoc.data();
      
      // USER/BRANCH_MANAGER için sadece aktif eğitimler
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        if (!trainingData?.isActive) {
        throw new AppNotFoundError('Eğitim');
        }
      }
      
      const training: Training = {
        id: trainingDoc.id,
        ...trainingData,
      } as Training;
      
      const serializedTraining = serializeTrainingTimestamps(training);
      
      return successResponse(
        'Eğitim başarıyla getirildi',
        { training: serializedTraining }
      );
  });
});

// PUT - Eğitim güncelle (sadece admin)
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const trainingId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const trainingDoc = await db.collection('trainings').doc(trainingId).get();
      
      if (!trainingDoc.exists) {
      throw new AppNotFoundError('Eğitim');
      }
      
    const body = await parseJsonBody<UpdateTrainingRequest>(req);
      const validation = validateUpdateTraining(body);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
      throw new AppValidationError(firstError);
      }
      
      const currentTrainingData = trainingDoc.data();
      const currentOrder = currentTrainingData?.order || 0;
      
      const updateData: Record<string, any> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: user.uid,
      };
      
      // Sadece gönderilen alanları güncelle
      if (body.title !== undefined) updateData.title = body.title.trim();
      
      if (body.description !== undefined) {
        updateData.description = body.description ? sanitizeHtml(body.description) : null;
      }
      
      if (body.isActive !== undefined) {
        updateData.isActive = body.isActive;
      }
      
      // Order yönetimi
      if (body.order !== undefined && body.order !== currentOrder) {
        const newOrder = body.order;
        
        // Yeni order mevcut order'dan farklıysa ve > 0 ise shift işlemi yap
        if (newOrder > 0) {
          // Training için özel shift işlemi (filter yok, tüm trainings)
          const snapshot = await db.collection('trainings')
            .where('order', '>=', newOrder)
            .get();
          
          if (!snapshot.empty) {
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
              // Mevcut item'ı atla
              if (doc.id === trainingId) {
                return;
              }
              const docOrder = doc.data().order || 0;
              batch.update(doc.ref, {
                order: docOrder + 1,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            });
            await batch.commit();
          }
        }
        
        updateData.order = newOrder;
      }
      
      await db.collection('trainings').doc(trainingId).update(updateData);
      
      // Güncellenmiş eğitimi getir
      const updatedTrainingDoc = await db.collection('trainings').doc(trainingId).get();
      const updatedTrainingData = updatedTrainingDoc.data();
      const training: Training = {
        id: trainingId,
        ...updatedTrainingData,
      } as Training;
      
      const serializedTraining = serializeTrainingTimestamps(training);
      
      return successResponse(
        'Eğitim başarıyla güncellendi',
        { training: serializedTraining },
        200,
        'TRAINING_UPDATE_SUCCESS'
      );
  });
});

// DELETE - Eğitim sil (sadece admin, hard delete + cascade)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const trainingId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const trainingDoc = await db.collection('trainings').doc(trainingId).get();
      
      if (!trainingDoc.exists) {
      throw new AppNotFoundError('Eğitim');
      }
      
      // Cascade delete: Altındaki lesson'ları getir
      const lessonsSnapshot = await db.collection('lessons')
        .where('trainingId', '==', trainingId)
        .get();
      
      const lessonIds = lessonsSnapshot.docs.map(doc => doc.id);
      
      // Cascade delete: Altındaki content'leri batch olarak sil (N+1 query çözüldü ✅)
      await deleteLessonsContentsBatch(lessonIds);
      
      // Lesson'ları sil
      const lessonDeletes = lessonsSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(lessonDeletes);
      
      // Training'i sil
      await db.collection('trainings').doc(trainingId).delete();
      
      console.log(`✅ Training ${trainingId} deleted with cascade`);
      
      return successResponse(
        'Eğitim başarıyla silindi',
        undefined,
        200,
        'TRAINING_DELETE_SUCCESS'
      );
  });
});

