import { NextRequest } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import { authenticateUser, getCurrentUser } from '@/lib/middleware/auth';
import { validateEmail } from '@/lib/utils/validation/commonValidation';
import { validatePassword } from '@/lib/utils/validation/authValidation';
import { validateAge } from '@/lib/utils/validation/userValidation';
import { USER_STATUS } from '@shared/constants/status';
import { USER_ROLE } from '@shared/constants/roles';
import { createRegistrationLog } from '@/lib/services/registrationLogService';
import { 
  successResponse, 
  validationError, 
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppConflictError } from '@/lib/utils/errors/AppError';
import { isErrorWithMessage } from '@/lib/utils/response';
import admin from 'firebase-admin';

import { logger } from '../../../../../lib/utils/logger';
interface RegisterBasicRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  birthDate: string;
  district: string; // Görev ilçesi
  kadroUnvani: string; // Kadro Ünvanı
  gender: 'male' | 'female';
}

export const POST = asyncHandler(async (request: NextRequest) => {
  // JSON body parsing with error handling
  const body = await parseJsonBody<RegisterBasicRequest & { branchId?: string }>(request);
    const {
      firstName,
      lastName,
      phone,
      email,
      password,
      birthDate,
      district,
      kadroUnvani,
      gender,
      branchId: requestedBranchId,
    } = body;
    
    // 1️⃣ VALIDATION
    if (!firstName || !lastName || !phone || !email || !password || !birthDate || !district || !kadroUnvani || !gender) {
    throw new AppValidationError('Tüm alanlar zorunludur');
    }
    
    if (!validateEmail(email)) {
    throw new AppValidationError('Geçersiz e-posta adresi');
    }
    
    // Telefon format kontrolü (basit)
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    throw new AppValidationError('Geçersiz telefon numarası. 10-11 haneli numara giriniz.');
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
    throw new AppValidationError(passwordValidation.error || 'Geçersiz şifre');
    }
    
    const ageValidation = validateAge(birthDate);
    if (!ageValidation.valid) {
    throw new AppValidationError(ageValidation.error || 'Geçersiz doğum tarihi');
    }
    
    // Gender sadece male veya female olabilir
    if (gender !== 'male' && gender !== 'female') {
    throw new AppValidationError('Geçersiz cinsiyet değeri. Sadece male veya female olabilir.');
    }
    
    // Email uniqueness kontrolü
    const existingUserByEmail = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!existingUserByEmail.empty) {
    throw new AppConflictError('Bu e-posta adresi zaten kullanılıyor.');
    }
    
    // Telefon uniqueness kontrolü
    const existingUserByPhone = await db.collection('users').where('phone', '==', phone).limit(1).get();
    if (!existingUserByPhone.empty) {
    throw new AppConflictError('Bu telefon numarası zaten kullanılıyor.');
    }

    // Optional: check if request is authenticated (admin/branch_manager creating user)
    const authResult = await authenticateUser(request);
    let creator: any = null;
    if (authResult.authenticated && authResult.user) {
      const { error: getErr, user: creatorUser } = await getCurrentUser(authResult.user.uid);
      if (!getErr && creatorUser) {
        creator = creatorUser;
      }
    }
    
    // 2️⃣ FIREBASE AUTH USER OLUŞTUR
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: true,
    });
    
    logger.log(`✅ Auth user created: ${userRecord.uid}`);
    
    // 3️⃣ USER BELGESİNİ OLUŞTUR
    // NOT: Document'in var olup olmadığını kontrol et
    // Eğer varsa bu bir hata durumu (normalde olmamalı)
    const userDocRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      // Bu durumda auth user'ı sil ve hata döndür
      try {
        await auth.deleteUser(userRecord.uid);
        logger.warn(`⚠️  User ${userRecord.uid} already exists in Firestore, cleaned up auth user`);
      } catch (cleanupError) {
        logger.error('❌ Failed to cleanup auth user:', cleanupError);
      }
      throw new AppConflictError('Bu kullanıcı daha önce oluşturulmuş. Lütfen giriş yapın.');
    }
    
    const birthDateTimestamp = admin.firestore.Timestamp.fromDate(new Date(birthDate));
    
    // Determine initial status and branch assignment based on creator role
    let initialStatus = USER_STATUS.PENDING_DETAILS;
    let branchToAssign: string | undefined = undefined;

    if (creator) {
      if (creator.role === USER_ROLE.ADMIN || creator.role === USER_ROLE.SUPERADMIN) {
        initialStatus = USER_STATUS.ACTIVE;
        // allow admin to assign requestedBranchId if provided
        if (requestedBranchId) {
          const branchDoc = await db.collection('branches').doc(requestedBranchId).get();
          if (!branchDoc.exists) {
            throw new AppValidationError('Geçersiz şube ID');
          }
          branchToAssign = requestedBranchId;
        }
      } else if (creator.role === USER_ROLE.BRANCH_MANAGER) {
        // If branch manager creates a user, assign them to the branch and mark as
        // pending details (detaylar bekleniyor) rather than requiring branch approval.
        initialStatus = USER_STATUS.PENDING_DETAILS;
        // force assign branch to creator's branch
        if (!creator.branchId) {
          throw new AppValidationError('Branch Manager için şube bilgisi bulunamadı');
        }
        branchToAssign = creator.branchId;
      }
    }

    // Yeni document oluştur
    const newUserDoc: any = {
      uid: userRecord.uid,
      email,
      phone,
      firstName,
      lastName,
      birthDate: birthDateTimestamp,
      district,
      kadroUnvani,
      gender,
      role: USER_ROLE.USER,
      status: initialStatus,
      isActive: true,
      emailVerified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (branchToAssign) newUserDoc.branchId = branchToAssign;

    await userDocRef.set(newUserDoc);
    logger.log(`✅ User document created with basic info`);
    
    // 3.5️⃣ REGISTRATION LOG OLUŞTUR
    const logMetadata: any = {
      email,
    };
    if (branchToAssign) {
      logMetadata.branchId = branchToAssign;
    }

    await createRegistrationLog({
      userId: userRecord.uid,
      action: 'register_basic',
      performedBy: creator ? creator.uid : userRecord.uid,
      performedByRole: creator ? creator.role : USER_ROLE.USER,
      newStatus: initialStatus,
      metadata: logMetadata,
    });
    
    // Email verification is disabled: no verification email sent.
    
    // 5️⃣ CUSTOM TOKEN OLUŞTUR
    // Client bu token ile Firebase'e sign in yapacak
    let customToken: string | undefined;
    try {
      customToken = await auth.createCustomToken(userRecord.uid);
      logger.log(`✅ Custom token created for user: ${userRecord.uid}`);
    } catch (tokenError: unknown) {
      const errorMessage = isErrorWithMessage(tokenError) ? tokenError.message : 'Bilinmeyen hata';
      logger.error('⚠️ Custom token oluşturulamadı:', errorMessage);
      // Token oluşturulamasa bile kayıt başarılı
    }
    
    // 6️⃣ BAŞARILI RESPONSE
    return successResponse(
      'Kayıt başarılı! Custom token ile Firebase Auth\'a sign in yapabilirsiniz.',
      {
        uid: userRecord.uid,
        email: email,
        customToken: customToken,
        nextStep: '/register/details',
      },
      201,
      'REGISTER_BASIC_SUCCESS'
    );
});

