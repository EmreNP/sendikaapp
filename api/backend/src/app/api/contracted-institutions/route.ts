import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { ContractedInstitution, CreateContractedInstitutionRequest } from '@shared/types/contracted-institution';
import { validateCreateContractedInstitution } from '@/lib/utils/validation/contractedInstitutionValidation';
import { getNextContractedInstitutionOrder } from '@/lib/utils/orderManagement';
import { 
  successResponse, 
  serializeContractedInstitutionTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';
import { paginateHybrid, parsePaginationParams, searchInBatches } from '@/lib/utils/pagination';

const COLLECTION_NAME = 'contracted_institutions';

// GET - Tüm anlaşmalı kurumları listele
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
    
    const userRole = currentUserData!.role;
    const url = new URL(request.url);
    const paginationParams = parsePaginationParams(url);
    const isPublishedParam = url.searchParams.get('isPublished');
    const search = url.searchParams.get('search');
    const categoryId = url.searchParams.get('categoryId');
    
    let query = db.collection(COLLECTION_NAME) as admin.firestore.Query;
    
    // USER/BRANCH_MANAGER için sadece yayınlanan kurumlar
    if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
      query = query.where('isPublished', '==', true);
    } else if (userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN) {
      // Admin/Superadmin için isPublished filtresi
      if (isPublishedParam !== null) {
        query = query.where('isPublished', '==', isPublishedParam === 'true');
      }
    }
    
    // Kategori filtresi
    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }

    // Kategori isimlerini çekmek için helper
    const populateCategoryNames = async (items: ContractedInstitution[]): Promise<ContractedInstitution[]> => {
      const categoryIds = [...new Set(items.map(i => i.categoryId).filter(Boolean))];
      if (categoryIds.length === 0) return items;

      const categoryMap = new Map<string, string>();
      // Firestore 'in' query max 30 item destekler, batch halinde çek
      for (let i = 0; i < categoryIds.length; i += 30) {
        const batch = categoryIds.slice(i, i + 30);
        const snap = await db.collection('institution_categories').where(admin.firestore.FieldPath.documentId(), 'in', batch).get();
        snap.docs.forEach(doc => {
          categoryMap.set(doc.id, doc.data().name || '');
        });
      }

      return items.map(item => ({
        ...item,
        categoryName: categoryMap.get(item.categoryId) || item.categoryName || '',
      }));
    };

    // Search with batch-based pagination
    if (search) {
      const searchLower = search.toLowerCase();
      const orderedQuery = query.orderBy('order', 'asc').orderBy('createdAt', 'desc');
      
      const result = await searchInBatches<ContractedInstitution>(
        orderedQuery,
        paginationParams,
        (doc) => ({ id: doc.id, ...doc.data() }) as ContractedInstitution,
        (item) => {
          const title = (item.title || '').toLowerCase();
          const description = (item.description || '').toLowerCase();
          const badgeText = (item.badgeText || '').toLowerCase();
          return title.includes(searchLower) || description.includes(searchLower) || badgeText.includes(searchLower);
        }
      );
      
      const itemsWithCategory = await populateCategoryNames(result.items);
      const serializedItems = itemsWithCategory.map(item => serializeContractedInstitutionTimestamps(item));
      
      return successResponse('Anlaşmalı kurumlar başarıyla getirildi', {
        institutions: serializedItems,
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore,
      });
    }
    
    // Server-side pagination with Firestore
    query = query.orderBy('order', 'asc').orderBy('createdAt', 'desc');
    
    const paginatedResult = await paginateHybrid(
      query,
      paginationParams,
      (doc) => ({ id: doc.id, ...doc.data() }) as ContractedInstitution,
      'order'
    );
    
    const itemsWithCategoryPaged = await populateCategoryNames(paginatedResult.items);
    const serializedItems = itemsWithCategoryPaged.map(item => serializeContractedInstitutionTimestamps(item));
    
    return successResponse(
      'Anlaşmalı kurumlar başarıyla getirildi',
      {
        institutions: serializedItems,
        total: paginatedResult.total,
        page: paginatedResult.page,
        limit: paginatedResult.limit,
        hasMore: paginatedResult.hasMore,
        nextCursor: paginatedResult.nextCursor,
      }
    );
  });
});

// POST - Yeni anlaşmalı kurum oluştur (sadece admin/superadmin)
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    // Admin kontrolü
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
    
    if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
    }
    
    const body = await parseJsonBody<CreateContractedInstitutionRequest>(req);
    
    // Validation
    const validation = validateCreateContractedInstitution(body);
    if (!validation.valid) {
      const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
      throw new AppValidationError(firstError);
    }
    
    // Order yönetimi
    let finalOrder: number;
    if (body.order !== undefined && body.order !== null && body.order > 0) {
      finalOrder = body.order;
      // Shift işlemi
      const snapshot = await db.collection(COLLECTION_NAME)
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
      finalOrder = await getNextContractedInstitutionOrder();
    }
    
    // Adımları normalize et
    const normalizedSteps = (body.howToUseSteps || []).map((step, index) => ({
      stepNumber: index + 1,
      title: step.title.trim(),
      description: step.description.trim(),
    }));
    
    // Kategori varlık kontrolü
    if (body.categoryId) {
      const categoryDoc = await db.collection('institution_categories').doc(body.categoryId).get();
      if (!categoryDoc.exists) {
        throw new AppValidationError('Seçilen kategori bulunamadı');
      }
    }
    
    // Yeni anlaşmalı kurum oluştur
    const institutionData = {
      title: body.title.trim(),
      description: body.description.trim(),
      categoryId: body.categoryId,
      badgeText: body.badgeText.trim(),
      coverImageUrl: body.coverImageUrl.trim(),
      logoUrl: body.logoUrl?.trim() || null,
      howToUseSteps: normalizedSteps,
      isPublished: body.isPublished !== undefined ? body.isPublished : false,
      order: finalOrder,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: user.uid,
    };
    
    const docRef = await db.collection(COLLECTION_NAME).add(institutionData);
    
    // Oluşturulan belgeyi getir
    const doc = await docRef.get();
    const institution: ContractedInstitution = {
      id: doc.id,
      ...doc.data(),
    } as ContractedInstitution;
    
    const serialized = serializeContractedInstitutionTimestamps(institution);
    
    return successResponse(
      'Anlaşmalı kurum başarıyla oluşturuldu',
      { institution: serialized },
      201,
      'CONTRACTED_INSTITUTION_CREATE_SUCCESS'
    );
  });
});
