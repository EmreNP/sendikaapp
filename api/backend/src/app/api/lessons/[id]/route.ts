import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { Lesson, UpdateLessonRequest } from '@shared/types/training';
import { validateUpdateLesson } from '@/lib/utils/validation/lessonValidation';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { shiftOrdersUp } from '@/lib/utils/orderManagement';
import { 
  successResponse, 
  serializeLessonTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';

import { logger } from '../../../../lib/utils/logger';
// GET - Tek ders detayı
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const lessonId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      const userRole = currentUserData!.role;
      
      const lessonDoc = await db.collection('lessons').doc(lessonId).get();
      
      if (!lessonDoc.exists) {
      throw new AppNotFoundError('Ders');
      }
      
      const lessonData = lessonDoc.data();
      
      // USER/BRANCH_MANAGER için sadece aktif dersler
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        if (!lessonData?.isActive) {
        throw new AppNotFoundError('Ders');
        }
      }
      
      const lesson: Lesson = {
        id: lessonDoc.id,
        ...lessonData,
      } as Lesson;
      
      const serializedLesson = serializeLessonTimestamps(lesson);
      
      return successResponse(
        'Ders başarıyla getirildi',
        { lesson: serializedLesson }
      );
  });
});

// PUT - Ders güncelle (sadece admin)
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const lessonId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const lessonDoc = await db.collection('lessons').doc(lessonId).get();
      
      if (!lessonDoc.exists) {
      throw new AppNotFoundError('Ders');
      }
      
    const body = await parseJsonBody<UpdateLessonRequest>(req);
      const validation = validateUpdateLesson(body);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
      throw new AppValidationError(firstError);
      }
      
      const currentLessonData = lessonDoc.data();
      const currentOrder = currentLessonData?.order || 0;
      const trainingId = currentLessonData?.trainingId;
      
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
      if (body.order !== undefined && body.order !== currentOrder && trainingId) {
        const newOrder = body.order;
        
        // Yeni order mevcut order'dan farklıysa ve > 0 ise shift işlemi yap
        if (newOrder > 0) {
          await shiftOrdersUp('lessons', 'trainingId', trainingId, newOrder, lessonId);
        }
        
        updateData.order = newOrder;
      }
      
      await db.collection('lessons').doc(lessonId).update(updateData);
      
      // Güncellenmiş dersi getir
      const updatedLessonDoc = await db.collection('lessons').doc(lessonId).get();
      const updatedLessonData = updatedLessonDoc.data();
      const lesson: Lesson = {
        id: lessonId,
        ...updatedLessonData,
      } as Lesson;
      
      const serializedLesson = serializeLessonTimestamps(lesson);
      
      return successResponse(
        'Ders başarıyla güncellendi',
        { lesson: serializedLesson },
        200,
        'LESSON_UPDATE_SUCCESS'
      );
  });
});

// DELETE - Ders sil (sadece admin, hard delete + cascade content'ler)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const lessonId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const lessonDoc = await db.collection('lessons').doc(lessonId).get();
      
      if (!lessonDoc.exists) {
      throw new AppNotFoundError('Ders');
      }
      
      // Cascade delete: Altındaki content'leri sil
      const contentDeletes: Promise<any>[] = [];
      
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
      
      // Tüm content'leri sil
      await Promise.all(contentDeletes);
      
      // Lesson'ı sil
      await db.collection('lessons').doc(lessonId).delete();
      
      logger.log(`✅ Lesson ${lessonId} deleted with cascade`);
      
      return successResponse(
        'Ders başarıyla silindi',
        undefined,
        200,
        'LESSON_DELETE_SUCCESS'
      );
  });
});

