import { NextRequest } from 'next/server';
import { db, auth } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth } from '@/lib/middleware/auth';
import { validateUserPhone, validateTCKimlikNo } from '@/lib/utils/validation/userValidation';
import { USER_STATUS } from '@shared/constants/status';
import { USER_ROLE } from '@shared/constants/roles';
import { EDUCATION_LEVEL } from '@shared/constants/education';
import type { UserRegisterDetailsUpdateData } from '@shared/types/user';
import { createRegistrationLog } from '@/lib/services/registrationLogService';
import { 
  successResponse, 
  notFoundError,
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppNotFoundError, AppConflictError } from '@/lib/utils/errors/AppError';

interface RegisterDetailsRequest {
  tcKimlikNo: string;
  fatherName: string;
  motherName: string;
  birthPlace: string;
  education: string;
  kurumSicil: string;
  kadroUnvani: string;
  kadroUnvanKodu: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  branchId: string;
  // Admin overrides
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export const POST = asyncHandler(async (request: NextRequest) => {
  // Kayıt detayları endpoint'i için email doğrulama kontrolünü bypass et
  // Kullanıcı henüz email doğrulamadan kayıt detaylarını tamamlayabilmeli
  return withAuth(request, async (req, user) => {
    const body = await parseJsonBody<RegisterDetailsRequest>(req);
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
        userId: targetUserIdParam,
        firstName,
        lastName,
        email,
      } = body;

      // Caller info
      const callerDoc = await db.collection('users').doc(user.uid).get();
      const callerRole = callerDoc.exists ? callerDoc.data()?.role : null;
      
      let targetUserId = user.uid;
      const isAdmin = callerRole === USER_ROLE.ADMIN || callerRole === USER_ROLE.SUPERADMIN;

      // Admin ise hedef kullanıcıyı seçebilir
      if (isAdmin && targetUserIdParam) {
        targetUserId = targetUserIdParam;
      }
      
      // 1️⃣ USER BELGESİNİ KONTROL ET
      let userDoc = await db.collection('users').doc(targetUserId).get();
      
      // Eğer admin işlem yapıyorsa ve kullanıcı yoksa, oluşturmayı dene
      if (!userDoc.exists && isAdmin) {
        let userEmail = email;
        let userFirstName = firstName;
        let userLastName = lastName;

        // E-posta vb. eksikse Auth'dan çekmeyi dene
        if (!userEmail || !userFirstName || !userLastName) {
           try {
             const authUser = await auth.getUser(targetUserId);
             if (!userEmail) userEmail = authUser.email;
             
             if ((!userFirstName || !userLastName) && authUser.displayName) {
                const parts = authUser.displayName.split(' ');
                if (!userFirstName) userFirstName = parts[0];
                if (!userLastName) userLastName = parts.slice(1).join(' ');
             }
           } catch (e) {
             console.error('Error fetching auth user for creation:', e);
           }
        }

        // Minimal doc oluştur
        const initialDoc: any = {
          uid: targetUserId,
          email: userEmail || null,
          firstName: userFirstName || '',
          lastName: userLastName || '',
          role: USER_ROLE.USER,
          status: USER_STATUS.PENDING_DETAILS,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          branchId: branchId || undefined
        };

        // Remove undefined fields
        Object.keys(initialDoc).forEach(key => 
            initialDoc[key] === undefined && delete initialDoc[key]
        );

        await db.collection('users').doc(targetUserId).set(initialDoc);
        userDoc = await db.collection('users').doc(targetUserId).get();
      }

      if (!userDoc.exists) {
        throw new AppNotFoundError('Kullanıcı');
      }
      
      const userData = userDoc.data();
      
      // İlk adım tamamlanmamışsa (Admin değilse kontrol et)
      if (!isAdmin && (!userData?.firstName || !userData?.lastName)) {
        throw new AppValidationError('Önce temel bilgileri tamamlayın');
      }
      
      // Admin ise, update gibi davransın, status check'i es geçelim veya uyaralım.
      // Ama user talebi "update işlemi çalışmıyor... detail register yapılsın".
      // Bu durumda detail register'ın kısıtlamaları (aktif olmama vs) admin için esnetilebilir.
      if (!isAdmin && (userData?.status === USER_STATUS.ACTIVE || 
          userData?.status === USER_STATUS.PENDING_BRANCH_REVIEW)) {
        throw new AppValidationError('Kayıt zaten tamamlanmış veya onay bekliyor');
      }
      
      // 2️⃣ VALIDATION
      
      // Tüm zorunlu alanları kontrol et
      if (!branchId || (typeof branchId === 'string' && branchId.trim() === '')) {
        throw new AppValidationError('Şube seçimi zorunludur');
      }
      
      if (!tcKimlikNo || tcKimlikNo.trim() === '') {
        throw new AppValidationError('TC Kimlik No zorunludur');
      }
      
      if (!phone || phone.trim() === '') {
        throw new AppValidationError('Telefon numarası zorunludur');
      }
      
      if (!fatherName || fatherName.trim() === '') {
        throw new AppValidationError('Baba adı zorunludur');
      }
      
      if (!motherName || motherName.trim() === '') {
        throw new AppValidationError('Anne adı zorunludur');
      }
      
      if (!birthPlace || birthPlace.trim() === '') {
        throw new AppValidationError('Doğum yeri zorunludur');
      }
      
      if (!education || education.trim() === '') {
        throw new AppValidationError('Eğitim seviyesi zorunludur');
      }
      
      if (!kurumSicil || kurumSicil.trim() === '') {
        throw new AppValidationError('Kurum sicil numarası zorunludur');
      }
      
      if (!kadroUnvani || kadroUnvani.trim() === '') {
        throw new AppValidationError('Kadro ünvanı zorunludur');
      }
      
      if (!kadroUnvanKodu || kadroUnvanKodu.trim() === '') {
        throw new AppValidationError('Kadro ünvan kodu zorunludur');
      }
      
      if (!address || address.trim() === '') {
        throw new AppValidationError('Adres zorunludur');
      }
      
      if (!city || city.trim() === '') {
        throw new AppValidationError('Şehir zorunludur');
      }
      
      if (!district || district.trim() === '') {
        throw new AppValidationError('İlçe zorunludur');
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
      
      // TC Kimlik No validasyonu
      const tcValidation = validateTCKimlikNo(tcKimlikNo);
      if (!tcValidation.valid) {
        throw new AppValidationError(tcValidation.error || 'Geçersiz TC Kimlik No');
      }
      
      // TC Kimlik No'nun başka kullanıcıda olup olmadığını kontrol et
      const existingUser = await db.collection('users')
        .where('tcKimlikNo', '==', tcKimlikNo)
        .where('uid', '!=', targetUserId)
        .limit(1)
        .get();
      
      if (!existingUser.empty) {
        throw new AppConflictError('Bu TC Kimlik No zaten kullanılıyor');
      }
      
      // Telefon validasyonu
      const phoneValidation = validateUserPhone(phone);
      if (!phoneValidation.valid) {
        throw new AppValidationError(phoneValidation.error || 'Geçersiz telefon numarası');
      }
      
      // Eğitim seviyesi validasyonu
      if (!Object.values(EDUCATION_LEVEL).includes(education as any)) {
        throw new AppValidationError('Geçersiz eğitim seviyesi');
      }
      
      // 3️⃣ UPDATE
      const updateData: any = {
        tcKimlikNo: tcKimlikNo || '',
        fatherName: fatherName || '',
        motherName: motherName || '',
        birthPlace: birthPlace || '',
        education: education as any,
        kurumSicil: kurumSicil || '',
        kadroUnvani: kadroUnvani || '',
        kadroUnvanKodu: kadroUnvanKodu || '',
        phone: phone || '',
        address: address || '',
        city: city || '',
        district: district || '',
        branchId: branchId,
        status: USER_STATUS.PENDING_BRANCH_REVIEW, // Onaya gönder
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        registrationCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Admin güncelliyorsa name/email update de yapabilir
      if (isAdmin) {
          if (firstName) updateData.firstName = firstName;
          if (lastName) updateData.lastName = lastName;
          if (email) updateData.email = email;
      }
      
      // Boş string kontrolü - hiçbir zorunlu alan boş olmamalı
      const requiredFields = ['tcKimlikNo', 'fatherName', 'motherName', 'birthPlace', 'education', 
                              'kurumSicil', 'kadroUnvani', 'kadroUnvanKodu', 'phone', 
                              'address', 'city', 'district', 'branchId'];
      
      for (const field of requiredFields) {
        if (!updateData[field] || (typeof updateData[field] === 'string' && updateData[field].trim() === '')) {
          throw new AppValidationError(`${field} alanı boş olamaz`);
        }
      }
      
      // Remove undefined fields
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );
      
      await db.collection('users').doc(targetUserId).update(updateData);
      
      // 4️⃣ LOG
      const logData: any = {
        userId: targetUserId,
        action: 'register_details',
        performedBy: user.uid,
        performedByRole: callerRole as any || USER_ROLE.USER, 
        metadata: {
          ...updateData
        }
      };

      // Add note if present in body (casted to any since it might not be in interface yet)
      if ((body as any).note) {
          logData.note = (body as any).note;
      }

      await createRegistrationLog(logData);
      
      return successResponse(
        'Kayıt detayları başarıyla kaydedildi ve onay işlemine gönderildi',
        { 
          success: true,
          status: USER_STATUS.PENDING_BRANCH_REVIEW 
        }
      );
  });
});
