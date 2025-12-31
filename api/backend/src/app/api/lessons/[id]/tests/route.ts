import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { TestContent, CreateTestContentRequest, TestQuestion } from '@shared/types/training';
import { validateCreateTestContent } from '@/lib/utils/validation/testContentValidation';
import { getNextContentOrder, shiftOrdersUp } from '@/lib/utils/orderManagement';
import { 
  successResponse, 
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage,
  serializeTestContentTimestamps
} from '@/lib/utils/response';

// GET - Dersin testlerini listele
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      const userRole = currentUserData!.role;
      const lessonId = params.id;
      const { searchParams } = new URL(request.url);
      const isActiveParam = searchParams.get('isActive');
      
      // Lesson'ın var olup olmadığını kontrol et
      const lessonDoc = await db.collection('lessons').doc(lessonId).get();
      if (!lessonDoc.exists) {
        return notFoundError('Ders');
      }
      
      let query = db.collection('test_contents')
        .where('lessonId', '==', lessonId) as admin.firestore.Query;
      
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        query = query.where('isActive', '==', true);
      } else if (userRole === USER_ROLE.ADMIN && isActiveParam !== null) {
        query = query.where('isActive', '==', isActiveParam === 'true');
      }
      
      const snapshot = await query.orderBy('order', 'asc').get();
      
      const tests = snapshot.docs.map((doc) => ({
        id: doc.id,
        type: 'test' as const,
        ...doc.data(),
      })) as TestContent[];
      
      const serializedTests = tests.map(t => serializeTestContentTimestamps(t));
      
      return successResponse(
        'Testler başarıyla getirildi',
        { tests: serializedTests }
      );
    } catch (error: unknown) {
      console.error('❌ Get tests error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Testler getirilirken bir hata oluştu', errorMessage);
    }
  });
}

// POST - Yeni test ekle (sadece admin)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const lessonId = params.id;
      
      // Lesson'ın var olup olmadığını kontrol et
      const lessonDoc = await db.collection('lessons').doc(lessonId).get();
      if (!lessonDoc.exists) {
        return notFoundError('Ders');
      }
      
      const body: CreateTestContentRequest = await request.json();
      
      // lessonId'yi body'den al veya params'tan kullan
      const testData: CreateTestContentRequest = {
        ...body,
        lessonId: body.lessonId || lessonId,
      };
      
      // Validation
      const validation = validateCreateTestContent(testData);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
        return validationError(firstError);
      }
      
      // Questions için ID'leri oluştur
      const questionsWithIds: TestQuestion[] = testData.questions.map((q, index) => ({
        ...q,
        id: `q_${Date.now()}_${index}`,
        options: q.options.map((opt, optIndex) => ({
          ...opt,
          id: opt.id || `opt_${Date.now()}_${index}_${optIndex}`,
        })),
      }));
      
      // Order yönetimi
      let finalOrder: number;
      if (testData.order !== undefined && testData.order !== null && testData.order > 0) {
        // Kullanıcı order belirtmişse, shift işlemi yap
        finalOrder = testData.order;
        await shiftOrdersUp('test_contents', 'lessonId', lessonId, finalOrder);
      } else {
        // Order belirtilmemişse, aynı lesson içindeki en yüksek order + 1
        finalOrder = await getNextContentOrder(lessonId, 'test');
      }
      
      const contentData = {
        lessonId: testData.lessonId,
        title: testData.title.trim(),
        description: testData.description?.trim() || null,
        questions: questionsWithIds,
        timeLimit: testData.timeLimit || null,
        order: finalOrder,
        isActive: testData.isActive !== undefined ? testData.isActive : true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: user.uid,
      };
      
      const testRef = await db.collection('test_contents').add(contentData);
      const testDoc = await testRef.get();
      
      if (!testDoc.exists) {
        return serverError('Test oluşturuldu ancak veri alınamadı');
      }
      
      const docData = testDoc.data();
      const test: TestContent = {
        id: testDoc.id,
        type: 'test',
        ...docData,
      } as TestContent;
      
      const serializedTest = serializeTestContentTimestamps(test);
      
      return successResponse(
        'Test başarıyla oluşturuldu',
        { test: serializedTest },
        201,
        'TEST_CONTENT_CREATE_SUCCESS'
      );
    } catch (error: unknown) {
      console.error('❌ Create test content error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Test oluşturulurken bir hata oluştu', errorMessage);
    }
  });
}

