import { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase/admin';
import { validateEmail } from '@/lib/utils/validation/commonValidation';
import { sendPasswordResetEmail } from '@/lib/services/firebaseEmailService';
import { 
  successResponse, 
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError } from '@/lib/utils/errors/AppError';
import { isErrorWithCode } from '@/lib/utils/response';

import { logger } from '../../../../../lib/utils/logger';
interface PasswordResetRequestRequest {
  email: string;
}

export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await parseJsonBody<PasswordResetRequestRequest>(request);
    const { email } = body;
    
    // 1️⃣ VALIDATION
    if (!email) {
    throw new AppValidationError('E-posta adresi gerekli');
    }
    
    if (!validateEmail(email)) {
    throw new AppValidationError('Geçersiz e-posta adresi formatı');
    }
    
    // 2️⃣ KULLANICI VAR MI KONTROL ET
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error: unknown) {
      // Güvenlik için: Kullanıcı yoksa da başarılı mesajı döndür
      // Böylece email enumeration saldırıları önlenir
      if (isErrorWithCode(error) && error.code === 'auth/user-not-found') {
        logger.log(`⚠️ Password reset requested for non-existent email: ${email}`);
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
      logger.log(`✅ Password reset email sent to ${email}`);
    } catch (emailError: unknown) {
      // Email gönderilemese bile güvenlik için aynı mesajı döndür
      // Böylece email enumeration saldırıları önlenir
    const errorMessage = emailError instanceof Error ? emailError.message : 'Bilinmeyen hata';
      logger.error('❌ Password reset email error:', errorMessage);
      // Hata olsa bile devam et (güvenlik için aynı response)
    }
    
    // 4️⃣ BAŞARILI RESPONSE
    return successResponse(
      'Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama linki gönderildi',
      undefined,
      200,
      'PASSWORD_RESET_REQUEST_SUCCESS'
    );
});

