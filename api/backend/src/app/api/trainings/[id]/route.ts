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
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage,
  serializeTrainingTimestamps
} from '@/lib/utils/response';

// GET - Tek eğitim detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const trainingId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      const userRole = currentUserData!.role;
      
      const trainingDoc = await db.collection('trainings').doc(trainingId).get();
      
      if (!trainingDoc.exists) {
        return notFoundError('Eğitim');
      }
      
      const trainingData = trainingDoc.data();
      
      // USER/BRANCH_MANAGER için sadece aktif eğitimler
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        if (!trainingData?.isActive) {
          return notFoundError('Eğitim');
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
    } catch (error: unknown) {
      console.error('❌ Get training error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Eğitim getirilirken bir hata oluştu', errorMessage);
    }
  });
}

// PUT - Eğitim güncelle (sadece admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const trainingId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const trainingDoc = await db.collection('trainings').doc(trainingId).get();
      
      if (!trainingDoc.exists) {
        return notFoundError('Eğitim');
      }
      
      const body: UpdateTrainingRequest = await request.json();
      const validation = validateUpdateTraining(body);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
        return validationError(firstError);
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
    } catch (error: unknown) {
      console.error('❌ Update training error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Eğitim güncellenirken bir hata oluştu', errorMessage);
    }
  });
}

// DELETE - Eğitim sil (sadece admin, hard delete + cascade)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const trainingId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const trainingDoc = await db.collection('trainings').doc(trainingId).get();
      
      if (!trainingDoc.exists) {
        return notFoundError('Eğitim');
      }
      
      // Cascade delete: Altındaki lesson'ları getir
      const lessonsSnapshot = await db.collection('lessons')
        .where('trainingId', '==', trainingId)
        .get();
      
      const lessonIds = lessonsSnapshot.docs.map(doc => doc.id);
      
      // Cascade delete: Altındaki content'leri getir ve sil
      const contentDeletes: Promise<any>[] = [];
      
      for (const lessonId of lessonIds) {
        // Video contents
        const videoSnapshot = await db.collection('video_contents')
          .where('lessonId', '==', lessonId)
          .get();
        videoSnapshot.docs.forEach(doc => {
          contentDeletes.push(doc.ref.delete());
        });
        
        // Document contents
        const documentSnapshot = await db.collection('document_contents')
          .where('lessonId', '==', lessonId)
          .get();
        documentSnapshot.docs.forEach(doc => {
          contentDeletes.push(doc.ref.delete());
        });
        
        // Test contents
        const testSnapshot = await db.collection('test_contents')
          .where('lessonId', '==', lessonId)
          .get();
        testSnapshot.docs.forEach(doc => {
          contentDeletes.push(doc.ref.delete());
        });
      }
      
      // Tüm content'leri sil
      await Promise.all(contentDeletes);
      
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
    } catch (error: unknown) {
      console.error('❌ Delete training error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Eğitim silinirken bir hata oluştu', errorMessage);
    }
  });
}

