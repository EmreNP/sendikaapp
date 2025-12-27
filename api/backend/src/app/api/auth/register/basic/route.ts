import { NextRequest } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import { validateEmail } from '@/lib/utils/validation/commonValidation';
import { validatePassword } from '@/lib/utils/validation/authValidation';
import { validateAge } from '@/lib/utils/validation/userValidation';
import { USER_STATUS } from '@shared/constants/status';
import { USER_ROLE } from '@shared/constants/roles';
import { sendEmailVerification } from '@/lib/services/firebaseEmailService';
import { createRegistrationLog } from '@/lib/services/registrationLogService';
import { 
  successResponse, 
  validationError, 
  handleFirebaseAuthError, 
  handleFirestoreError,
  serverError,
  isErrorWithMessage,
  isErrorWithCode,
  isFirebaseError
} from '@/lib/utils/response';
import admin from 'firebase-admin';

interface RegisterBasicRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthDate: string;
  gender: 'male' | 'female';
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterBasicRequest = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      birthDate,
      gender,
    } = body;
    
    // 1️⃣ VALIDATION
    if (!firstName || !lastName || !email || !password || !birthDate || !gender) {
      return validationError('Tüm alanlar zorunludur');
    }
    
    if (!validateEmail(email)) {
      return validationError('Geçersiz e-posta adresi');
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return validationError(passwordValidation.error || 'Geçersiz şifre');
    }
    
    const ageValidation = validateAge(birthDate);
    if (!ageValidation.valid) {
      return validationError(ageValidation.error || 'Geçersiz doğum tarihi');
    }
    
    // Gender sadece male veya female olabilir
    if (gender !== 'male' && gender !== 'female') {
      return validationError('Geçersiz cinsiyet değeri. Sadece male veya female olabilir.');
    }
    
    // 2️⃣ FIREBASE AUTH USER OLUŞTUR
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false, // Tüm kullanıcılar email doğrulamalı
    });
    
    console.log(`✅ Auth user created: ${userRecord.uid}`);
    
    // 3️⃣ USER BELGESİNİ OLUŞTUR
    // NOT: Document'in var olup olmadığını kontrol et
    // Eğer varsa bu bir hata durumu (normalde olmamalı)
    const userDocRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      // Bu durumda auth user'ı sil ve hata döndür
      try {
        await auth.deleteUser(userRecord.uid);
        console.warn(`⚠️  User ${userRecord.uid} already exists in Firestore, cleaned up auth user`);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup auth user:', cleanupError);
      }
      return validationError('Bu kullanıcı daha önce oluşturulmuş. Lütfen giriş yapın.');
    }
    
    const birthDateTimestamp = admin.firestore.Timestamp.fromDate(new Date(birthDate));
    
    // Yeni document oluştur
    await userDocRef.set({
      uid: userRecord.uid,
      email,
      firstName,
      lastName,
      birthDate: birthDateTimestamp,
      gender,
      role: USER_ROLE.USER,
      status: USER_STATUS.PENDING_DETAILS,
      isActive: true,
      emailVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ User document created with basic info`);
    
    // 3.5️⃣ REGISTRATION LOG OLUŞTUR
    await createRegistrationLog({
      userId: userRecord.uid,
      action: 'register_basic',
      performedBy: userRecord.uid, // Kullanıcı kendisi kayıt oluyor
      performedByRole: USER_ROLE.USER,
      newStatus: USER_STATUS.PENDING_DETAILS,
      metadata: {
        email: email, // Email metadata'da tutuluyor
      },
    });
    
    // 4️⃣ E-POSTA DOĞRULAMA EMAİLİ GÖNDER
    try {
      // Firebase'in kendi email servisini kullanarak email gönder
      await sendEmailVerification(email);
      console.log(`✅ Email verification sent to ${email}`);
    } catch (emailError: unknown) {
      const errorMessage = isErrorWithMessage(emailError) ? emailError.message : 'Bilinmeyen hata';
      console.error('❌ Email verification error:', errorMessage);
      // Hata olsa bile devam et (kullanıcı kaydı başarılı)
      // Email gönderilemese bile kullanıcı sonradan manuel olarak email doğrulayabilir
    }
    
    // 5️⃣ CUSTOM TOKEN OLUŞTUR
    // Client bu token ile Firebase'e sign in yapacak
    let customToken: string | undefined;
    try {
      customToken = await auth.createCustomToken(userRecord.uid);
      console.log(`✅ Custom token created for user: ${userRecord.uid}`);
    } catch (tokenError: unknown) {
      const errorMessage = isErrorWithMessage(tokenError) ? tokenError.message : 'Bilinmeyen hata';
      console.error('⚠️ Custom token oluşturulamadı:', errorMessage);
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
    
  } catch (error: unknown) {
    console.error('❌ Register basic error:', error);
    
    // Firebase Auth hatalarını yakala
    if (isFirebaseError(error) && error.code.startsWith('auth/')) {
      return handleFirebaseAuthError(error);
    }
    
    // Firestore hatalarını yakala
    if (isErrorWithCode(error) && (error.code === 'permission-denied' || error.code === 'not-found')) {
      return handleFirestoreError(error);
    }
    
    // Genel hata
    const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
    return serverError(
      'Kayıt sırasında bir hata oluştu',
      errorMessage
    );
  }
}

