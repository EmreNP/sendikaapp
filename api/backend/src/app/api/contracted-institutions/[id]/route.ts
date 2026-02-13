import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { ContractedInstitution, UpdateContractedInstitutionRequest } from '@shared/types/contracted-institution';
import { validateUpdateContractedInstitution } from '@/lib/utils/validation/contractedInstitutionValidation';
import { 
  successResponse, 
  serializeContractedInstitutionTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';
import { logger } from '../../../../lib/utils/logger';

const COLLECTION_NAME = 'contracted_institutions';

// GET - Tek anlaşmalı kurum detayı
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    const institutionId = params.id;
    
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
    
    const userRole = currentUserData!.role;
    
    const doc = await db.collection(COLLECTION_NAME).doc(institutionId).get();
    
    if (!doc.exists) {
      throw new AppNotFoundError('Anlaşmalı kurum');
    }
    
    const data = doc.data();
    
    // USER/BRANCH_MANAGER için sadece yayınlanan kurumlar
    if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
      if (!data?.isPublished) {
        throw new AppNotFoundError('Anlaşmalı kurum');
      }
    }
    
    const institution: ContractedInstitution = {
      id: doc.id,
      ...data,
    } as ContractedInstitution;
    
    // Kategori adını çek
    if (institution.categoryId) {
      try {
        const categoryDoc = await db.collection('institution_categories').doc(institution.categoryId).get();
        if (categoryDoc.exists) {
          institution.categoryName = categoryDoc.data()?.name || '';
        }
      } catch (e) {
        logger.warn('Kategori adı alınamadı', { categoryId: institution.categoryId });
      }
    }
    
    const serialized = serializeContractedInstitutionTimestamps(institution);
    
    return successResponse(
      'Anlaşmalı kurum başarıyla getirildi',
      { institution: serialized }
    );
  });
});

// PUT - Anlaşmalı kurum güncelle (sadece admin/superadmin)
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    const institutionId = params.id;
    
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
    
    if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
    }
    
    const doc = await db.collection(COLLECTION_NAME).doc(institutionId).get();
    
    if (!doc.exists) {
      throw new AppNotFoundError('Anlaşmalı kurum');
    }
    
    const body = await parseJsonBody<UpdateContractedInstitutionRequest>(req);
    const currentData = doc.data();
    
    const validation = validateUpdateContractedInstitution(body);
    if (!validation.valid) {
      const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
      throw new AppValidationError(firstError);
    }
    
    const currentOrder = currentData?.order || 0;
    
    const updateData: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.uid,
    };
    
    // Sadece gönderilen alanları güncelle
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.categoryId !== undefined) {
      // Kategori varlık kontrolü
      const categoryDoc = await db.collection('institution_categories').doc(body.categoryId).get();
      if (!categoryDoc.exists) {
        throw new AppValidationError('Seçilen kategori bulunamadı');
      }
      updateData.categoryId = body.categoryId;
    }
    if (body.badgeText !== undefined) updateData.badgeText = body.badgeText.trim();
    if (body.coverImageUrl !== undefined) updateData.coverImageUrl = body.coverImageUrl.trim();
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl?.trim() || null;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    
    // How to use steps güncelleme
    if (body.howToUseSteps !== undefined) {
      updateData.howToUseSteps = body.howToUseSteps.map((step, index) => ({
        stepNumber: index + 1,
        title: step.title.trim(),
        description: step.description.trim(),
      }));
    }
    
    // Order yönetimi
    if (body.order !== undefined && body.order !== currentOrder) {
      const newOrder = body.order;
      
      if (newOrder > 0) {
        const snapshot = await db.collection(COLLECTION_NAME)
          .where('order', '>=', newOrder)
          .get();
        
        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.docs.forEach((docItem) => {
            if (docItem.id === institutionId) return;
            const docOrder = docItem.data().order || 0;
            batch.update(docItem.ref, {
              order: docOrder + 1,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          await batch.commit();
        }
      }
      
      updateData.order = newOrder;
    }
    
    await db.collection(COLLECTION_NAME).doc(institutionId).update(updateData);
    
    // Güncellenmiş belgeyi getir
    const updatedDoc = await db.collection(COLLECTION_NAME).doc(institutionId).get();
    const institution: ContractedInstitution = {
      id: institutionId,
      ...updatedDoc.data(),
    } as ContractedInstitution;
    
    const serialized = serializeContractedInstitutionTimestamps(institution);
    
    return successResponse(
      'Anlaşmalı kurum başarıyla güncellendi',
      { institution: serialized },
      200,
      'CONTRACTED_INSTITUTION_UPDATE_SUCCESS'
    );
  });
});

// DELETE - Anlaşmalı kurum sil (sadece admin/superadmin, hard delete)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    const institutionId = params.id;
    
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
    
    if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
    }
    
    const doc = await db.collection(COLLECTION_NAME).doc(institutionId).get();
    
    if (!doc.exists) {
      throw new AppNotFoundError('Anlaşmalı kurum');
    }
    
    await db.collection(COLLECTION_NAME).doc(institutionId).delete();
    
    logger.log(`✅ Contracted institution ${institutionId} deleted`);
    
    return successResponse(
      'Anlaşmalı kurum başarıyla silindi',
      undefined,
      200,
      'CONTRACTED_INSTITUTION_DELETE_SUCCESS'
    );
  });
});
