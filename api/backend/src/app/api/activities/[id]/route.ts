import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { UpdateActivityRequest } from '@shared/types/activity';
import { 
  successResponse, 
  serializeActivityTimestamps,
  unauthorizedError,
  authenticationError,
  validationError,
  serverError,
  notFoundError
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';

// GET /api/activities/[id] - Get single activity
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    // Kullanıcının rolünü kontrol et
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error || !currentUserData) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    const activityDoc = await db.collection('activities').doc(params.id).get();
    
    if (!activityDoc.exists) {
      return notFoundError('Aktivite');
    }

    const activityData = activityDoc.data();

    // Check read permissions
    if (currentUserData.role === USER_ROLE.USER) {
      // Users can only see published activities
      if (!activityData?.isPublished) {
        return notFoundError('Aktivite');
      }
    } else if (currentUserData.role === USER_ROLE.BRANCH_MANAGER) {
      // Branch managers can only see activities from their branch
      if (activityData?.branchId !== currentUserData.branchId) {
        throw new AppAuthorizationError('Bu aktiviteye erişim izniniz yok');
      }
    }
    // Admin can see all activities

    const activity = {
      id: activityDoc.id,
      ...activityData
    };

    return successResponse('Aktivite başarıyla getirildi', 
      { activity: serializeActivityTimestamps(activity) }
    );
  });
});

// PUT /api/activities/[id] - Update activity
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
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

    const body: UpdateActivityRequest = await request.json();
    
    // Validate name if provided
    if (body.name !== undefined) {
      if (!body.name || body.name.trim().length < 2 || body.name.trim().length > 200) {
        throw new AppValidationError('Aktivite adı 2-200 karakter arasında olmalıdır');
      }
    }

    // Check if activity exists
    const activityDoc = await db.collection('activities').doc(params.id).get();
    if (!activityDoc.exists) {
      return notFoundError('Aktivite');
    }

    const activityData = activityDoc.data();

    // Check update permissions
    if (currentUserData.role === USER_ROLE.BRANCH_MANAGER) {
      // Branch managers can only update activities from their branch
      if (activityData?.branchId !== currentUserData.branchId) {
        throw new AppAuthorizationError('Bu aktiviteyi güncelleme yetkiniz yok');
      }
    }

    // Validate category if provided
    if (body.categoryId) {
      const categoryDoc = await db.collection('activity_categories').doc(body.categoryId).get();
      if (!categoryDoc.exists) {
        throw new AppValidationError('Geçersiz kategori');
      }
    }

    if (body.images && body.images.length > 10) {
      throw new AppValidationError('En fazla 10 resim eklenebilir');
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.uid
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.activityDate !== undefined) updateData.activityDate = new Date(body.activityDate);
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.documents !== undefined) updateData.documents = body.documents;

    await db.collection('activities').doc(params.id).update(updateData);

    const updatedActivityDoc = await db.collection('activities').doc(params.id).get();
    const updatedActivity = {
      id: updatedActivityDoc.id,
      ...updatedActivityDoc.data()
    };

    return successResponse('Aktivite başarıyla güncellendi', 
      { activity: serializeActivityTimestamps(updatedActivity) }
    );
  });
});

// DELETE /api/activities/[id] - Delete activity (hard delete)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
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

    // Check if activity exists
    const activityDoc = await db.collection('activities').doc(params.id).get();
    if (!activityDoc.exists) {
      return notFoundError('Aktivite');
    }

    const activityData = activityDoc.data();

    // Check delete permissions
    if (currentUserData.role === USER_ROLE.BRANCH_MANAGER) {
      // Branch managers can only delete activities from their branch
      if (activityData?.branchId !== currentUserData.branchId) {
        throw new AppAuthorizationError('Bu aktiviteyi silme yetkiniz yok');
      }
    }

    // Hard delete
    await db.collection('activities').doc(params.id).delete();

    return successResponse('Aktivite başarıyla silindi');
  });
});
