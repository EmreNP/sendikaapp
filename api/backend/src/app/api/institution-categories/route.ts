import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { InstitutionCategory, CreateInstitutionCategoryRequest } from '@shared/types/contracted-institution';
import { 
  successResponse, 
  serializeContractedInstitutionTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';

const COLLECTION_NAME = 'institution_categories';

// GET - Tüm kategorileri listele
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
    
    const userRole = currentUserData!.role;
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('activeOnly');
    
    let query = db.collection(COLLECTION_NAME) as admin.firestore.Query;
    
    // Normal kullanıcılar sadece aktif kategorileri görsün
    if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER || activeOnly === 'true') {
      query = query.where('isActive', '==', true);
    }
    
    query = query.orderBy('order', 'asc');
    
    const snapshot = await query.get();
    const categories: InstitutionCategory[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as InstitutionCategory[];
    
    const serialized = categories.map(c => serializeContractedInstitutionTimestamps(c));
    
    return successResponse('Kategoriler başarıyla getirildi', {
      categories: serialized,
      total: serialized.length,
    });
  });
});

// POST - Yeni kategori oluştur (sadece admin/superadmin)
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
    
    if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
    }
    
    const body = await parseJsonBody<CreateInstitutionCategoryRequest>(req);
    
    // Validation
    if (!body.name || body.name.trim().length < 2) {
      throw new AppValidationError('Kategori adı en az 2 karakter olmalıdır');
    }
    
    // İsim benzersizlik kontrolü
    const nameCheck = await db.collection(COLLECTION_NAME)
      .where('name', '==', body.name.trim())
      .get();
    
    if (!nameCheck.empty) {
      throw new AppValidationError('Bu kategori adı zaten kullanılıyor');
    }
    
    // Order hesapla
    let finalOrder = body.order || 1;
    if (!body.order) {
      const lastDoc = await db.collection(COLLECTION_NAME)
        .orderBy('order', 'desc')
        .limit(1)
        .get();
      finalOrder = lastDoc.empty ? 1 : (lastDoc.docs[0].data().order || 0) + 1;
    }
    
    const categoryData = {
      name: body.name.trim(),
      order: finalOrder,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: user.uid,
    };
    
    const docRef = await db.collection(COLLECTION_NAME).add(categoryData);
    const doc = await docRef.get();
    
    const category = { id: doc.id, ...doc.data() } as InstitutionCategory;
    const serialized = serializeContractedInstitutionTimestamps(category);
    
    return successResponse(
      'Kategori başarıyla oluşturuldu',
      { category: serialized },
      201,
      'INSTITUTION_CATEGORY_CREATE_SUCCESS'
    );
  });
});
