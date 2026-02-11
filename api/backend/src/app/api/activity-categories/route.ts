import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { 
  ActivityCategory, 
  CreateActivityCategoryRequest, 
  UpdateActivityCategoryRequest 
} from '@shared/types/activity-category';
import { 
  successResponse, 
  serializeActivityCategoryTimestamps,
  unauthorizedError,
  authenticationError,
  validationError,
  serverError,
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';

// GET /api/activity-categories - List all categories (all authenticated users)
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    // Fetch categories
    const categoriesSnapshot = await db
      .collection('activity_categories')
      .orderBy('createdAt', 'desc')
      .get();

    const categories: ActivityCategory[] = [];
    categoriesSnapshot.forEach(doc => {
      const data = doc.data();
      const category = {
        id: doc.id,
        ...data
      };
      categories.push(serializeActivityCategoryTimestamps(category));
    });

    return successResponse('Kategoriler başarıyla getirildi', { categories });
  });
});

// POST /api/activity-categories - Create new category (admin only)
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    // Kullanıcının rolünü kontrol et
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error || !currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
    }

    const body: CreateActivityCategoryRequest = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim().length < 2 || body.name.trim().length > 200) {
      throw new AppValidationError('Kategori adı 2-200 karakter arasında olmalıdır');
    }

    // Check for duplicate name
    const existingCategory = await db
      .collection('activity_categories')
      .where('name', '==', body.name.trim())
      .get();

    if (!existingCategory.empty) {
      throw new AppValidationError('Bu isimde bir kategori zaten mevcut');
    }

    // Create category
    const categoryData = {
      name: body.name.trim(),
      description: body.description?.trim() || undefined,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: user.uid
    };

    const docRef = await db.collection('activity_categories').add(categoryData);
    const category: ActivityCategory = {
      id: docRef.id,
      ...categoryData
    };

    return successResponse('Kategori başarıyla oluşturuldu', 
      { category: serializeActivityCategoryTimestamps(category) }, 
      201
    );
  });
});
