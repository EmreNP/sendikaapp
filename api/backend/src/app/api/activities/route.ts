import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { 
  Activity, 
  CreateActivityRequest, 
  UpdateActivityRequest 
} from '@shared/types/activity';
import { 
  successResponse, 
  serializeActivityTimestamps,
  unauthorizedError,
  authenticationError,
  validationError,
  serverError,
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';
import { paginateHybrid, parsePaginationParams, searchInBatches } from '@/lib/utils/pagination';

// GET /api/activities - List activities (filtered by role)
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    // Kullanıcının rolünü kontrol et
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error || !currentUserData) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    const url = new URL(request.url);
    const paginationParams = parsePaginationParams(url);
    const search = url.searchParams.get('search');
    
    let query: FirebaseFirestore.Query = db.collection('activities');

    // Filter based on user role
    if (currentUserData.role === USER_ROLE.ADMIN || currentUserData.role === USER_ROLE.SUPERADMIN) {
      // Admin/Superadmin can see all activities
      query = query.orderBy('createdAt', 'desc');
    } else if (currentUserData.role === USER_ROLE.BRANCH_MANAGER) {
      // Branch managers can see activities from their branch only
      query = query
        .where('branchId', '==', currentUserData.branchId)
        .orderBy('createdAt', 'desc');
    } else {
      // Regular users can only see published activities
      query = query
        .where('isPublished', '==', true)
        .orderBy('createdAt', 'desc');
    }

    if (search) {
      const searchLower = search.toLowerCase();
      
      const result = await searchInBatches<any>(
        query,
        paginationParams,
        (doc) => ({ id: doc.id, ...doc.data() }),
        (a) => (a.name || '').toLowerCase().includes(searchLower) ||
               (a.description || '').toLowerCase().includes(searchLower)
      );

      const serializedActivities = result.items.map(serializeActivityTimestamps);

      return successResponse('Aktiviteler başarıyla getirildi', {
        activities: serializedActivities,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil((result.total || 0) / result.limit)
      });
    }

    // Server-side pagination with Firestore
    const paginatedResult = await paginateHybrid(
      query,
      paginationParams,
      (doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      },
      'createdAt'
    );

    const serializedActivities = paginatedResult.items.map(serializeActivityTimestamps);

    return successResponse('Aktiviteler başarıyla getirildi', {
      activities: serializedActivities,
      total: paginatedResult.total,
      page: paginatedResult.page,
      limit: paginatedResult.limit,
      hasMore: paginatedResult.hasMore,
      nextCursor: paginatedResult.nextCursor,
    });
  });
});

// POST /api/activities - Create activity (branch manager + admin)
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    // Kullanıcının rolünü kontrol et
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error || !currentUserData) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    // Check permissions
    if (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN && currentUserData.role !== USER_ROLE.BRANCH_MANAGER) {
      throw new AppAuthorizationError('Bu işlem için yeterli yetkiniz yok');
    }

    const body: CreateActivityRequest = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim().length < 2 || body.name.trim().length > 200) {
      throw new AppValidationError('Aktivite adı 2-200 karakter arasında olmalıdır');
    }

    if (!body.description || body.description.trim().length < 10) {
      throw new AppValidationError('Açıklama en az 10 karakter olmalıdır');
    }

    if (!body.categoryId) {
      throw new AppValidationError('Kategori ID zorunludur');
    }

    if (!body.activityDate) {
      throw new AppValidationError('Aktivite tarihi zorunludur');
    }

    if (body.images && body.images.length > 10) {
      throw new AppValidationError('En fazla 10 resim eklenebilir');
    }

    // Validate branch permissions
    let branchId: string;
    if (currentUserData.role === USER_ROLE.BRANCH_MANAGER) {
      // Branch managers can only create activities for their own branch
      branchId = currentUserData.branchId!;
    } else if (!body.branchId) {
      throw new AppValidationError('Admin için şube ID zorunludur');
    } else {
      branchId = body.branchId;
    }

    // Validate category exists
    const categoryDoc = await db.collection('activity_categories').doc(body.categoryId).get();
    if (!categoryDoc.exists) {
      throw new AppValidationError('Geçersiz kategori');
    }

    // Validate branch exists
    const branchDoc = await db.collection('branches').doc(branchId).get();
    if (!branchDoc.exists) {
      throw new AppValidationError('Geçersiz şube');
    }

    // Create activity
    const activityData = {
      name: body.name.trim(),
      description: body.description.trim(),
      categoryId: body.categoryId,
      branchId: branchId,
      isPublished: body.isPublished !== undefined ? body.isPublished : false,
      activityDate: new Date(body.activityDate),
      images: body.images || [],
      documents: body.documents || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: user.uid
    };

    const docRef = await db.collection('activities').add(activityData);
    const activity: Activity = {
      id: docRef.id,
      ...activityData
    };

    return successResponse('Aktivite başarıyla oluşturuldu', 
      { activity: serializeActivityTimestamps(activity) }, 
      201
    );
  });
});
