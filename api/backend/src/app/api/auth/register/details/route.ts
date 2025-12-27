import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth } from '@/lib/middleware/auth';
import { validateUserPhone, validateTCKimlikNo } from '@/lib/utils/validation/userValidation';
import { USER_STATUS } from '@shared/constants/status';
import { EDUCATION_LEVEL } from '@shared/constants/education';
import type { UserRegisterDetailsUpdateData } from '@shared/types/user';
import { createRegistrationLog } from '@/lib/services/registrationLogService';
import { 
  successResponse, 
  validationError, 
  notFoundError,
  serverError,
  isErrorWithMessage
} from '@/lib/utils/response';

interface RegisterDetailsRequest {
  tcKimlikNo?: string;
  fatherName?: string;
  motherName?: string;
  birthPlace?: string;
  education?: string;
  kurumSicil?: string;
  kadroUnvani?: string;
  kadroUnvanKodu?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  branchId: string;
}

export async function POST(request: NextRequest) {
  // Kayıt detayları endpoint'i için email doğrulama kontrolünü bypass et
  // Kullanıcı henüz email doğrulamadan kayıt detaylarını tamamlayabilmeli
  return withAuth(request, async (req, user) => {
    try {
      const body: RegisterDetailsRequest = await request.json();
      const {
        tcKimlikNo,
        fatherName,
        motherName,
        birthPlace,
        education,
        kurumSicil,
        kadroUnvani,
        kadroUnvanKodu,
        phone,
        address,
        city,
        district,
        branchId,
      } = body;
      
      // 1️⃣ USER BELGESİNİ KONTROL ET
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        return notFoundError('Kullanıcı');
      }
      
      const userData = userDoc.data();
      
      // İlk adım tamamlanmamışsa
      if (!userData?.firstName || !userData?.lastName) {
        return validationError('Önce temel bilgileri tamamlayın');
      }
      
      // Zaten aktif veya onay bekliyorsa
      if (userData?.status === USER_STATUS.ACTIVE || 
          userData?.status === USER_STATUS.PENDING_BRANCH_REVIEW ||
          userData?.status === USER_STATUS.PENDING_ADMIN_APPROVAL) {
        return validationError('Kayıt zaten tamamlanmış veya onay bekliyor');
      }
      
      // 2️⃣ VALIDATION
      // branchId zorunlu
      if (!branchId) {
        return validationError('Şube ID (branchId) zorunludur');
      }
      
      // Branch'in gerçekten var olup olmadığını kontrol et
      const branchDoc = await db.collection('branches').doc(branchId).get();
      if (!branchDoc.exists) {
        return validationError('Geçersiz şube ID');
      }
      
      const branchData = branchDoc.data();
      if (!branchData?.isActive) {
        return validationError('Bu şube aktif değil');
      }
      
      if (tcKimlikNo) {
        const tcValidation = validateTCKimlikNo(tcKimlikNo);
        if (!tcValidation.valid) {
          return validationError(tcValidation.error || 'Geçersiz TC Kimlik No');
        }
        
        // TC Kimlik No'nun başka kullanıcıda olup olmadığını kontrol et
        const existingUser = await db.collection('users')
          .where('tcKimlikNo', '==', tcKimlikNo)
          .where('uid', '!=', user.uid)
          .limit(1)
          .get();
        
        if (!existingUser.empty) {
          return validationError('Bu TC Kimlik No zaten kullanılıyor');
        }
      }
      
      if (phone) {
        const phoneValidation = validateUserPhone(phone);
        if (!phoneValidation.valid) {
          return validationError(phoneValidation.error || 'Geçersiz telefon numarası');
        }
      }
      
      if (education && !Object.values(EDUCATION_LEVEL).includes(education)) {
        return validationError('Geçersiz eğitim seviyesi');
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
      if (education !== undefined) updateData.education = education;
      if (kurumSicil !== undefined) updateData.kurumSicil = kurumSicil;
      if (kadroUnvani !== undefined) updateData.kadroUnvani = kadroUnvani;
      if (kadroUnvanKodu !== undefined) updateData.kadroUnvanKodu = kadroUnvanKodu;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (district !== undefined) updateData.district = district;
      
      await db.collection('users').doc(user.uid).update(updateData);
      
      // 4.5️⃣ REGISTRATION LOG OLUŞTUR
      await createRegistrationLog({
        userId: user.uid,
        action: 'register_details',
        performedBy: user.uid, // Kullanıcı kendisi detayları dolduruyor
        performedByRole: 'user',
        previousStatus: userData?.status || USER_STATUS.PENDING_DETAILS,
        newStatus: newStatus,
        metadata: {
          branchId: branchId, // Branch ID metadata'da tutuluyor
        },
      });
      
      console.log(`✅ User ${user.uid} details saved, status: ${newStatus}`);
      
      // 5️⃣ BAŞARILI RESPONSE
      return successResponse(
        'Detaylar kaydedildi! Şube onayı bekleniyor.',
        {
          user: {
            uid: user.uid,
            status: newStatus,
          },
        },
        200,
        'REGISTER_DETAILS_SUCCESS'
      );
      
    } catch (error: unknown) {
      console.error('❌ Register details error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Detayları kaydederken bir hata oluştu',
        errorMessage
      );
    }
  }, { skipEmailVerification: true });
}

