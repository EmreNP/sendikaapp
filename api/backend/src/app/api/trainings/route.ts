import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { Training, CreateTrainingRequest } from '@shared/types/training';
import { validateCreateTraining } from '@/lib/utils/validation/trainingValidation';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { getNextTrainingOrder } from '@/lib/utils/orderManagement';
import { 
  successResponse, 
  validationError,
  unauthorizedError,
  serverError,
  isErrorWithMessage,
  serializeTrainingTimestamps
} from '@/lib/utils/response';

// GET - Tüm eğitimleri listele
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      const userRole = currentUserData!.role;
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const isActiveParam = searchParams.get('isActive');
      const search = searchParams.get('search');
      
      let query = db.collection('trainings') as admin.firestore.Query;
      
      // USER/BRANCH_MANAGER için sadece aktif eğitimler
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        query = query.where('isActive', '==', true);
      } else if (userRole === USER_ROLE.ADMIN) {
        // Admin için isActive filtresi kullanılabilir
        if (isActiveParam !== null) {
          query = query.where('isActive', '==', isActiveParam === 'true');
        }
      }
      
      const snapshot = await query.orderBy('order', 'asc').orderBy('createdAt', 'desc').get();
      
      let trainings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Training[];
      
      // Search filtresi
      if (search) {
        const searchLower = search.toLowerCase();
        trainings = trainings.filter((t: Training) => {
          const title = (t.title || '').toLowerCase();
          return title.includes(searchLower);
        });
      }
      
      // Sayfalama
      const total = trainings.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTrainings = trainings.slice(startIndex, endIndex);
      
      const serializedTrainings = paginatedTrainings.map(t => serializeTrainingTimestamps(t));
      
      return successResponse(
        'Eğitimler başarıyla getirildi',
        {
          trainings: serializedTrainings,
          total,
          page,
          limit,
        }
      );
    } catch (error: unknown) {
      console.error('❌ Get trainings error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Eğitimler getirilirken bir hata oluştu', errorMessage);
    }
  });
}

// POST - Yeni eğitim oluştur (sadece admin)
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const body: CreateTrainingRequest = await request.json();
      const validation = validateCreateTraining(body);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
        return validationError(firstError);
      }
      
      // Description sanitization
      let sanitizedDescription = body.description;
      if (body.description) {
        sanitizedDescription = sanitizeHtml(body.description);
      }
      
      // Order yönetimi
      let finalOrder: number;
      if (body.order !== undefined && body.order !== null && body.order > 0) {
        // Kullanıcı order belirtmişse, shift işlemi yap
        finalOrder = body.order;
        // Training için özel shift işlemi (filter yok, tüm trainings)
        const snapshot = await db.collection('trainings')
          .where('order', '>=', finalOrder)
          .get();
        
        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.docs.forEach((doc) => {
            const currentOrder = doc.data().order || 0;
            batch.update(doc.ref, {
              order: currentOrder + 1,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          await batch.commit();
        }
      } else {
        // Order belirtilmemişse, en yüksek order + 1
        finalOrder = await getNextTrainingOrder();
      }
      
      const trainingData = {
        title: body.title.trim(),
        description: sanitizedDescription || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        order: finalOrder,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: user.uid,
      };
      
      const trainingRef = await db.collection('trainings').add(trainingData);
      const trainingDoc = await trainingRef.get();
      const training: Training = {
        id: trainingDoc.id,
        ...trainingDoc.data(),
      } as Training;
      
      const serializedTraining = serializeTrainingTimestamps(training);
      
      return successResponse(
        'Eğitim başarıyla oluşturuldu',
        { training: serializedTraining },
        201,
        'TRAINING_CREATE_SUCCESS'
      );
    } catch (error: unknown) {
      console.error('❌ Create training error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Eğitim oluşturulurken bir hata oluştu', errorMessage);
    }
  });
}

