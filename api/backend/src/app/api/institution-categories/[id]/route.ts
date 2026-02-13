import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { InstitutionCategory, UpdateInstitutionCategoryRequest } from '@shared/types/contracted-institution';
import { 
  successResponse, 
  serializeContractedInstitutionTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';
import { logger } from '../../../../lib/utils/logger';

const COLLECTION_NAME = 'institution_categories';

// GET - Tek kategori detayı
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    const categoryId = params.id;
    
    const doc = await db.collection(COLLECTION_NAME).doc(categoryId).get();
    
    if (!doc.exists) {
      throw new AppNotFoundError('Kategori');
    }
    
    const category = { id: doc.id, ...doc.data() } as InstitutionCategory;
    const serialized = serializeContractedInstitutionTimestamps(category);
    
    return successResponse('Kategori başarıyla getirildi', { category: serialized });
  });
});

// PUT - Kategori güncelle (sadece admin/superadmin)
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    const categoryId = params.id;
    
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
    
    if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
    }
    
    const doc = await db.collection(COLLECTION_NAME).doc(categoryId).get();
    if (!doc.exists) {
      throw new AppNotFoundError('Kategori');
    }
    
    const body = await parseJsonBody<UpdateInstitutionCategoryRequest>(req);
    
    const updateData: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.uid,
    };
    
    if (body.name !== undefined) {
      if (body.name.trim().length < 2) {
        throw new AppValidationError('Kategori adı en az 2 karakter olmalıdır');
      }
      // İsim benzersizlik kontrolü
      const nameCheck = await db.collection(COLLECTION_NAME)
        .where('name', '==', body.name.trim())
        .get();
      const otherWithName = nameCheck.docs.find(d => d.id !== categoryId);
      if (otherWithName) {
        throw new AppValidationError('Bu kategori adı zaten kullanılıyor');
      }
      updateData.name = body.name.trim();
    }
    
    if (body.order !== undefined) updateData.order = body.order;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    
    await db.collection(COLLECTION_NAME).doc(categoryId).update(updateData);
    
    const updatedDoc = await db.collection(COLLECTION_NAME).doc(categoryId).get();
    const category = { id: updatedDoc.id, ...updatedDoc.data() } as InstitutionCategory;
    const serialized = serializeContractedInstitutionTimestamps(category);
    
    return successResponse(
      'Kategori başarıyla güncellendi',
      { category: serialized },
      200,
      'INSTITUTION_CATEGORY_UPDATE_SUCCESS'
    );
  });
});

// DELETE - Kategori sil (sadece admin/superadmin)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    const categoryId = params.id;
    
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
    
    if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
    }
    
    const doc = await db.collection(COLLECTION_NAME).doc(categoryId).get();
    if (!doc.exists) {
      throw new AppNotFoundError('Kategori');
    }
    
    // Bu kategoriye ait kurum var mı kontrol et
    const institutionsCheck = await db.collection('contracted_institutions')
      .where('categoryId', '==', categoryId)
      .limit(1)
      .get();
    
    if (!institutionsCheck.empty) {
      throw new AppValidationError(
        'Bu kategoriye ait anlaşmalı kurumlar mevcut. Önce kurumların kategorisini değiştirin veya silin.'
      );
    }
    
    await db.collection(COLLECTION_NAME).doc(categoryId).delete();
    
    logger.log(`✅ Institution category ${categoryId} deleted`);
    
    return successResponse(
      'Kategori başarıyla silindi',
      undefined,
      200,
      'INSTITUTION_CATEGORY_DELETE_SUCCESS'
    );
  });
});
