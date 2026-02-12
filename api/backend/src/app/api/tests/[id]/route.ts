import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { TestContent, UpdateTestContentRequest, TestQuestion } from '@shared/types/training';
import { validateUpdateTestContent } from '@/lib/utils/validation/testContentValidation';
import { shiftOrdersUp } from '@/lib/utils/orderManagement';
import { 
  successResponse, 
  serializeTestContentTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';

import { logger } from '../../../../lib/utils/logger';
// GET - Test detayı
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const testId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      const userRole = currentUserData!.role;
      
      const testDoc = await db.collection('test_contents').doc(testId).get();
      
      if (!testDoc.exists) {
      throw new AppNotFoundError('Test');
      }
      
      const testData = testDoc.data();
      
      // USER/BRANCH_MANAGER için sadece aktif testler
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        if (!testData?.isActive) {
        throw new AppNotFoundError('Test');
        }
      }
      
      const test: TestContent = {
        id: testDoc.id,
        type: 'test',
        ...testData,
      } as TestContent;
      
      const serializedTest = serializeTestContentTimestamps(test);
      
      return successResponse(
        'Test başarıyla getirildi',
        { test: serializedTest }
      );
  });
});

// PUT - Test güncelle (sadece admin)
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const testId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const testDoc = await db.collection('test_contents').doc(testId).get();
      
      if (!testDoc.exists) {
      throw new AppNotFoundError('Test');
      }
      
    const body = await parseJsonBody<UpdateTestContentRequest>(req);
      const validation = validateUpdateTestContent(body);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
      throw new AppValidationError(firstError);
      }
      
      const currentTestData = testDoc.data();
      const currentOrder = currentTestData?.order || 0;
      const lessonId = currentTestData?.lessonId;
      
      const updateData: Record<string, any> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: user.uid,
      };
      
      // Sadece gönderilen alanları güncelle
      if (body.title !== undefined) updateData.title = body.title.trim();
      if (body.description !== undefined) updateData.description = body.description?.trim() || null;
      
      if (body.questions !== undefined) {
        // Questions için ID'leri oluştur (eğer yoksa)
        const questionsWithIds: TestQuestion[] = body.questions.map((q, index) => ({
          ...q,
          id: (q as any).id || crypto.randomUUID(),
          options: q.options.map((opt, optIndex) => ({
            ...opt,
            id: (opt as any).id || crypto.randomUUID(),
          })),
        }));
        updateData.questions = questionsWithIds;
      }
      if (body.timeLimit !== undefined) updateData.timeLimit = body.timeLimit || null;
      
      // Order yönetimi
      if (body.order !== undefined && body.order !== currentOrder && lessonId) {
        const newOrder = body.order;
        
        // Yeni order mevcut order'dan farklıysa ve > 0 ise shift işlemi yap
        if (newOrder > 0) {
          await shiftOrdersUp('test_contents', 'lessonId', lessonId, newOrder, testId);
        }
        
        updateData.order = newOrder;
      }
      
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      
      await db.collection('test_contents').doc(testId).update(updateData);
      
      // Güncellenmiş testi getir
      const updatedTestDoc = await db.collection('test_contents').doc(testId).get();
      const updatedTestData = updatedTestDoc.data();
      const test: TestContent = {
        id: testId,
        type: 'test',
        ...updatedTestData,
      } as TestContent;
      
      const serializedTest = serializeTestContentTimestamps(test);
      
      return successResponse(
        'Test başarıyla güncellendi',
        { test: serializedTest },
        200,
        'TEST_CONTENT_UPDATE_SUCCESS'
      );
  });
});

// DELETE - Test sil (sadece admin, hard delete)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const testId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const testDoc = await db.collection('test_contents').doc(testId).get();
      
      if (!testDoc.exists) {
      throw new AppNotFoundError('Test');
      }
      
      // Hard delete
      await db.collection('test_contents').doc(testId).delete();
      
      logger.log(`✅ Test ${testId} deleted`);
      
      return successResponse(
        'Test başarıyla silindi',
        undefined,
        200,
        'TEST_CONTENT_DELETE_SUCCESS'
      );
  });
});

