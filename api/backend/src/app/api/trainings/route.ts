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
  serializeTrainingTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody, parseQueryParamAsNumber } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';
import { paginateHybrid, parsePaginationParams } from '@/lib/utils/pagination';

// GET - Tüm eğitimleri listele
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      const userRole = currentUserData!.role;
    const url = new URL(request.url);
    const paginationParams = parsePaginationParams(url);
    const isActiveParam = url.searchParams.get('isActive');
    const search = url.searchParams.get('search');
      
      let query = db.collection('trainings') as admin.firestore.Query;
      
      // USER/BRANCH_MANAGER için sadece aktif eğitimler
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        query = query.where('isActive', '==', true);
      } else if (userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN) {
        // Admin/Superadmin için isActive filtresi kullanılabilir
        if (isActiveParam !== null) {
          query = query.where('isActive', '==', isActiveParam === 'true');
        }
      }

      // ⚠️ IMPORTANT: Search filter handled client-side
      if (search) {
        const snapshot = await query.orderBy('order', 'asc').orderBy('createdAt', 'desc').limit(500).get();
        const searchLower = search.toLowerCase();
        const allDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Training[];
        let trainings = allDocs.filter((t: Training) => (t.title || '').toLowerCase().includes(searchLower));
        
        const total = trainings.length;
        const startIndex = (paginationParams.page - 1) * paginationParams.limit;
        const endIndex = startIndex + paginationParams.limit;
        const paginatedTrainings = trainings.slice(startIndex, endIndex);
        const hasMore = endIndex < total;
        
        const serializedTrainings = paginatedTrainings.map(t => serializeTrainingTimestamps(t));
        
        return successResponse('Eğitimler başarıyla getirildi', {
          trainings: serializedTrainings,
          total,
          page: paginationParams.page,
          limit: paginationParams.limit,
          hasMore,
        });
      }
      
      // Server-side pagination - Note: Using 'order' field as primary sort
      query = query.orderBy('order', 'asc').orderBy('createdAt', 'desc');
      
      const paginatedResult = await paginateHybrid(
        query,
        paginationParams,
        (doc) => ({ id: doc.id, ...doc.data() }) as Training,
        'order'
      );
      
      const serializedTrainings = paginatedResult.items.map(t => serializeTrainingTimestamps(t));
      
      return successResponse(
        'Eğitimler başarıyla getirildi',
        {
          trainings: serializedTrainings,
          total: paginatedResult.total,
          page: paginatedResult.page,
          limit: paginatedResult.limit,
          hasMore: paginatedResult.hasMore,
          nextCursor: paginatedResult.nextCursor,
        }
      );
  });
});

// POST - Yeni eğitim oluştur (sadece admin)
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
    const body = await parseJsonBody<CreateTrainingRequest>(req);
      const validation = validateCreateTraining(body);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
      throw new AppValidationError(firstError);
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
  });
});

