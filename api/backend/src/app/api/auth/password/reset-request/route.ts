import { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase/admin';
import { validateEmail } from '@/lib/utils/validation/commonValidation';
import { sendPasswordResetEmail } from '@/lib/services/firebaseEmailService';
import { 
  successResponse, 
  validationError, 
  serverError,
  isErrorWithMessage,
  isErrorWithCode
} from '@/lib/utils/response';

interface PasswordResetRequestRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PasswordResetRequestRequest = await request.json();
    const { email } = body;
    
    // 1️⃣ VALIDATION
    if (!email) {
      return validationError('E-posta adresi gerekli');
    }
    
    if (!validateEmail(email)) {
      return validationError('Geçersiz e-posta adresi formatı');
    }
    
    // 2️⃣ KULLANICI VAR MI KONTROL ET
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error: unknown) {
      // Güvenlik için: Kullanıcı yoksa da başarılı mesajı döndür
      // Böylece email enumeration saldırıları önlenir
      if (isErrorWithCode(error) && error.code === 'auth/user-not-found') {
        console.log(`⚠️ Password reset requested for non-existent email: ${email}`);
        return successResponse(
          'Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama linki gönderildi',
          undefined,
          200,
          'PASSWORD_RESET_REQUEST_SUCCESS'
        );
      }
      throw error;
    }
    
    // 3️⃣ ŞİFRE SIFIRLAMA EMAİLİ GÖNDER
    // Firebase'in kendi email servisini kullanarak email gönder
    try {
      await sendPasswordResetEmail(email);
      console.log(`✅ Password reset email sent to ${email}`);
    } catch (emailError: unknown) {
      // Email gönderilemese bile güvenlik için aynı mesajı döndür
      // Böylece email enumeration saldırıları önlenir
      const errorMessage = isErrorWithMessage(emailError) ? emailError.message : 'Bilinmeyen hata';
      console.error('❌ Password reset email error:', errorMessage);
      // Hata olsa bile devam et (güvenlik için aynı response)
    }
    
    // 4️⃣ BAŞARILI RESPONSE
    return successResponse(
      'Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama linki gönderildi',
      undefined,
      200,
      'PASSWORD_RESET_REQUEST_SUCCESS'
    );
    
  } catch (error: unknown) {
    console.error('❌ Password reset request error:', error);
    
    const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
    return serverError(
      'Şifre sıfırlama isteği oluşturulurken bir hata oluştu',
      errorMessage
    );
  }
}

