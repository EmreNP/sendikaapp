import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { UpdateActivityCategoryRequest } from '@shared/types/activity-category';
import { 
  successResponse, 
  serializeActivityCategoryTimestamps,
  unauthorizedError,
  authenticationError,
  validationError,
  serverError,
  notFoundError
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';

// GET /api/activity-categories/[id] - Get single category (admin only)
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    // Kullanıcının rolünü kontrol et
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error || !currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
    }

    const categoryDoc = await db.collection('activity_categories').doc(params.id).get();
    
    if (!categoryDoc.exists) {
      return notFoundError('Kategori');
    }

    const category = {
      id: categoryDoc.id,
      ...categoryDoc.data()
    };

    return successResponse('Kategori başarıyla getirildi', 
      { category: serializeActivityCategoryTimestamps(category) }
    );
  });
});

// PUT /api/activity-categories/[id] - Update category (admin only)
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    // Kullanıcının rolünü kontrol et
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error || !currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
    }

    const body: UpdateActivityCategoryRequest = await request.json();
    
    // Validate name if provided
    if (body.name !== undefined) {
      if (!body.name || body.name.trim().length < 2 || body.name.trim().length > 200) {
        throw new AppValidationError('Kategori adı 2-200 karakter arasında olmalıdır');
      }
    }

    // Check if category exists
    const categoryDoc = await db.collection('activity_categories').doc(params.id).get();
    if (!categoryDoc.exists) {
      return notFoundError('Kategori');
    }

    // Check for duplicate name (if name is being updated)
    if (body.name && body.name.trim() !== categoryDoc.data()?.name) {
      const existingCategory = await db
        .collection('activity_categories')
        .where('name', '==', body.name.trim())
        .get();

      if (!existingCategory.empty && existingCategory.docs[0].id !== params.id) {
        throw new AppValidationError('Bu isimde bir kategori zaten mevcut');
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.uid
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;

    await db.collection('activity_categories').doc(params.id).update(updateData);

    const updatedCategoryDoc = await db.collection('activity_categories').doc(params.id).get();
    const updatedCategory = {
      id: updatedCategoryDoc.id,
      ...updatedCategoryDoc.data()
    };

    return successResponse('Kategori başarıyla güncellendi', 
      { category: serializeActivityCategoryTimestamps(updatedCategory) }
    );
  });
});

// DELETE /api/activity-categories/[id] - Delete category (admin only)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    // Kullanıcının rolünü kontrol et
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error || !currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
    }

    // Check if category exists
    const categoryDoc = await db.collection('activity_categories').doc(params.id).get();
    if (!categoryDoc.exists) {
      return notFoundError('Kategori');
    }

    // Check if category is being used by any activities
    const activitiesUsingCategory = await db
      .collection('activities')
      .where('categoryId', '==', params.id)
      .limit(1)
      .get();

    if (!activitiesUsingCategory.empty) {
      throw new AppValidationError('Kategori silinemez: Bu kategori aktiviteler tarafından kullanılıyor');
    }

    // Hard delete
    await db.collection('activity_categories').doc(params.id).delete();

    return successResponse('Kategori başarıyla silindi');
  });
});
