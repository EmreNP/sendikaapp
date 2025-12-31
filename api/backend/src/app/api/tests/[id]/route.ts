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
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage,
  serializeTestContentTimestamps
} from '@/lib/utils/response';

// GET - Test detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const testId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      const userRole = currentUserData!.role;
      
      const testDoc = await db.collection('test_contents').doc(testId).get();
      
      if (!testDoc.exists) {
        return notFoundError('Test');
      }
      
      const testData = testDoc.data();
      
      // USER/BRANCH_MANAGER için sadece aktif testler
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        if (!testData?.isActive) {
          return notFoundError('Test');
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
    } catch (error: unknown) {
      console.error('❌ Get test error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Test getirilirken bir hata oluştu', errorMessage);
    }
  });
}

// PUT - Test güncelle (sadece admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const testId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const testDoc = await db.collection('test_contents').doc(testId).get();
      
      if (!testDoc.exists) {
        return notFoundError('Test');
      }
      
      const body: UpdateTestContentRequest = await request.json();
      const validation = validateUpdateTestContent(body);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
        return validationError(firstError);
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
          id: q.id || `q_${Date.now()}_${index}`,
          options: q.options.map((opt, optIndex) => ({
            ...opt,
            id: opt.id || `opt_${Date.now()}_${index}_${optIndex}`,
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
    } catch (error: unknown) {
      console.error('❌ Update test error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Test güncellenirken bir hata oluştu', errorMessage);
    }
  });
}

// DELETE - Test sil (sadece admin, hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const testId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const testDoc = await db.collection('test_contents').doc(testId).get();
      
      if (!testDoc.exists) {
        return notFoundError('Test');
      }
      
      // Hard delete
      await db.collection('test_contents').doc(testId).delete();
      
      console.log(`✅ Test ${testId} deleted`);
      
      return successResponse(
        'Test başarıyla silindi',
        undefined,
        200,
        'TEST_CONTENT_DELETE_SUCCESS'
      );
    } catch (error: unknown) {
      console.error('❌ Delete test error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Test silinirken bir hata oluştu', errorMessage);
    }
  });
}

