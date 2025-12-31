import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { Lesson, CreateLessonRequest } from '@shared/types/training';
import { validateCreateLesson } from '@/lib/utils/validation/lessonValidation';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { getNextLessonOrder, shiftOrdersUp } from '@/lib/utils/orderManagement';
import { 
  successResponse, 
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage,
  serializeLessonTimestamps
} from '@/lib/utils/response';

// GET - Eğitimin derslerini listele
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
      const { searchParams } = new URL(request.url);
      const isActiveParam = searchParams.get('isActive');
      
      // Training'in var olup olmadığını kontrol et
      const trainingDoc = await db.collection('trainings').doc(trainingId).get();
      if (!trainingDoc.exists) {
        return notFoundError('Eğitim');
      }
      
      let query = db.collection('lessons')
        .where('trainingId', '==', trainingId) as admin.firestore.Query;
      
      // USER/BRANCH_MANAGER için sadece aktif dersler
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        query = query.where('isActive', '==', true);
      } else if (userRole === USER_ROLE.ADMIN) {
        if (isActiveParam !== null) {
          query = query.where('isActive', '==', isActiveParam === 'true');
        }
      }
      
      const snapshot = await query.orderBy('order', 'asc').get();
      
      const lessons = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Lesson[];
      
      const serializedLessons = lessons.map(l => serializeLessonTimestamps(l));
      
      return successResponse(
        'Dersler başarıyla getirildi',
        { lessons: serializedLessons }
      );
    } catch (error: unknown) {
      console.error('❌ Get lessons error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Dersler getirilirken bir hata oluştu', errorMessage);
    }
  });
}

// POST - Yeni ders oluştur (sadece admin)
export async function POST(
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
      
      // Training'in var olup olmadığını kontrol et
      const trainingDoc = await db.collection('trainings').doc(trainingId).get();
      if (!trainingDoc.exists) {
        return notFoundError('Eğitim');
      }
      
      const body: CreateLessonRequest = await request.json();
      
      // lessonId'yi body'den al veya params'tan kullan
      const lessonData: CreateLessonRequest = {
        ...body,
        trainingId: body.trainingId || trainingId,
      };
      
      const validation = validateCreateLesson(lessonData);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
        return validationError(firstError);
      }
      
      // Description sanitization
      let sanitizedDescription = lessonData.description;
      if (lessonData.description) {
        sanitizedDescription = sanitizeHtml(lessonData.description);
      }
      
      // Order yönetimi
      let finalOrder: number;
      if (lessonData.order !== undefined && lessonData.order !== null && lessonData.order > 0) {
        // Kullanıcı order belirtmişse, shift işlemi yap
        finalOrder = lessonData.order;
        await shiftOrdersUp('lessons', 'trainingId', trainingId, finalOrder);
      } else {
        // Order belirtilmemişse, aynı training içindeki en yüksek order + 1
        finalOrder = await getNextLessonOrder(trainingId);
      }
      
      const contentData = {
        trainingId: lessonData.trainingId,
        title: lessonData.title.trim(),
        description: sanitizedDescription || null,
        order: finalOrder,
        isActive: lessonData.isActive !== undefined ? lessonData.isActive : true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: user.uid,
      };
      
      const lessonRef = await db.collection('lessons').add(contentData);
      const lessonDoc = await lessonRef.get();
      const lesson: Lesson = {
        id: lessonDoc.id,
        ...lessonDoc.data(),
      } as Lesson;
      
      const serializedLesson = serializeLessonTimestamps(lesson);
      
      return successResponse(
        'Ders başarıyla oluşturuldu',
        { lesson: serializedLesson },
        201,
        'LESSON_CREATE_SUCCESS'
      );
    } catch (error: unknown) {
      console.error('❌ Create lesson error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Ders oluşturulurken bir hata oluştu', errorMessage);
    }
  });
}

