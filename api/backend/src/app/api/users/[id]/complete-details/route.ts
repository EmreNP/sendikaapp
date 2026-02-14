import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { validateUserPhone, validateTCKimlikNo } from '@/lib/utils/validation/userValidation';
import { USER_STATUS } from '@shared/constants/status';
import { EDUCATION_LEVEL } from '@shared/constants/education';
import type { UserRegisterDetailsUpdateData } from '@shared/types/user';
import { createRegistrationLog } from '@/lib/services/registrationLogService';
import { 
  successResponse,
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppNotFoundError, AppConflictError, AppAuthorizationError } from '@/lib/utils/errors/AppError';

import { logger } from '../../../../../lib/utils/logger';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CompleteDetailsRequest {
  tcKimlikNo?: string;
  fatherName?: string;
  motherName?: string;
  birthPlace?: string;
  education?: string;
  kurumSicil?: string;
  kadroUnvani?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  branchId: string;
}

export const PATCH = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  return withAuth(request, async (req, user) => {
    const userId = params.id;
    
    // Get full user data including role and branchId
    const { error: userError, user: adminUser } = await getCurrentUser(user.uid);
    if (userError || !adminUser) {
      return userError!;
    }
    
    // Only admin or branch_manager can complete details for other users
    if (adminUser.role !== 'admin' && adminUser.role !== 'branch_manager') {
      throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
    }
    
    const body = await parseJsonBody<CompleteDetailsRequest>(req);
    const {
      tcKimlikNo,
      fatherName,
      motherName,
      birthPlace,
      education,
      kurumSicil,
      kadroUnvani,
      phone,
      address,
      city,
      district,
      branchId,
    } = body;
    
    // 1️⃣ USER BELGESİNİ KONTROL ET
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new AppNotFoundError('Kullanıcı');
    }
    
    const userData = userDoc.data();
    
    // İlk adım tamamlanmamışsa
    if (!userData?.firstName || !userData?.lastName) {
      throw new AppValidationError('Önce temel bilgileri tamamlayın');
    }
    
    // Zaten aktif veya onay bekliyorsa
    if (userData?.status === USER_STATUS.ACTIVE || 
        userData?.status === USER_STATUS.PENDING_BRANCH_REVIEW) {
      throw new AppValidationError('Kayıt zaten tamamlanmış veya onay bekliyor');
    }
    
    // 2️⃣ VALIDATION
    // branchId zorunlu
    if (!branchId) {
      throw new AppValidationError('Şube ID (branchId) zorunludur');
    }
    
    // Branch manager can only assign users to their own branch
    if (adminUser.role === 'branch_manager' && adminUser.branchId !== branchId) {
      throw new AppAuthorizationError('Sadece kendi şubenize kullanıcı ekleyebilirsiniz');
    }
    
    // Branch'in gerçekten var olup olmadığını kontrol et
    const branchDoc = await db.collection('branches').doc(branchId).get();
    if (!branchDoc.exists) {
      throw new AppValidationError('Geçersiz şube ID');
    }
    
    const branchData = branchDoc.data();
    if (!branchData?.isActive) {
      throw new AppValidationError('Bu şube aktif değil');
    }
    
    if (tcKimlikNo) {
      const tcValidation = validateTCKimlikNo(tcKimlikNo);
      if (!tcValidation.valid) {
        throw new AppValidationError(tcValidation.error || 'Geçersiz TC Kimlik No');
      }
      
      // TC Kimlik No'nun başka kullanıcıda olup olmadığını kontrol et
      const existingUser = await db.collection('users')
        .where('tcKimlikNo', '==', tcKimlikNo)
        .where('uid', '!=', userId)
        .limit(1)
        .get();
      
      if (!existingUser.empty) {
        throw new AppConflictError('Bu TC Kimlik No zaten kullanılıyor');
      }
    }
    
    if (phone) {
      const phoneValidation = validateUserPhone(phone);
      if (!phoneValidation.valid) {
        throw new AppValidationError(phoneValidation.error || 'Geçersiz telefon numarası');
      }
    }
    
    if (education && !Object.values(EDUCATION_LEVEL).includes(education as any)) {
      throw new AppValidationError('Geçersiz eğitim seviyesi');
    }
    
    // 3️⃣ STATUS BELİRLEME
    // branchId zorunlu olduğu için her zaman PENDING_BRANCH_REVIEW
    const newStatus = USER_STATUS.PENDING_BRANCH_REVIEW;
    
    // 4️⃣ USER BELGESİNİ GÜNCELLE
    const updateData: UserRegisterDetailsUpdateData = {
      status: newStatus,
      branchId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Optional alanları ekle (sadece gönderilenleri)
    if (tcKimlikNo !== undefined) updateData.tcKimlikNo = tcKimlikNo;
    if (fatherName !== undefined) updateData.fatherName = fatherName;
    if (motherName !== undefined) updateData.motherName = motherName;
    if (birthPlace !== undefined) updateData.birthPlace = birthPlace;
    if (education !== undefined) updateData.education = education as any;
    if (kurumSicil !== undefined) updateData.kurumSicil = kurumSicil;
    if (kadroUnvani !== undefined) updateData.kadroUnvani = kadroUnvani;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    
    await db.collection('users').doc(userId).update(updateData as any);
    
    // 4.5️⃣ REGISTRATION LOG OLUŞTUR
    await createRegistrationLog({
      userId: userId,
      action: 'register_details',
      performedBy: adminUser.uid, // Admin/branch manager tamamlıyor
      performedByRole: adminUser.role,
      previousStatus: userData?.status || USER_STATUS.PENDING_DETAILS,
      newStatus: newStatus,
      metadata: {
        branchId: branchId, // Branch ID metadata'da tutuluyor
      },
    });
    
    logger.log(`✅ User ${userId} details completed by ${adminUser.role}, status: ${newStatus}`);
    
    // 5️⃣ BAŞARILI RESPONSE
    return successResponse(
      'Detaylar kaydedildi! Şube onayı bekleniyor.',
      {
        user: {
          uid: userId,
          status: newStatus,
        },
      },
      200,
      'COMPLETE_DETAILS_SUCCESS'
    );
  });
});
