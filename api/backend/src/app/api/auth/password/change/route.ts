import { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase/admin';
import { withAuth } from '@/lib/middleware/auth';
import { validatePassword } from '@/lib/utils/validation/authValidation';
import { 
  successResponse, 
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppInternalServerError } from '@/lib/utils/errors/AppError';
import { isErrorWithMessage } from '@/lib/utils/response';
import { logger } from '../../../../../lib/utils/logger';

interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const body = await parseJsonBody<PasswordChangeRequest>(req);
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      throw new AppValidationError('Mevcut şifre ve yeni şifre gerekli');
    }

    if (currentPassword === newPassword) {
      throw new AppValidationError('Yeni şifre mevcut şifre ile aynı olamaz');
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new AppValidationError(passwordValidation.error || 'Geçersiz şifre');
    }

    const userRecord = await auth.getUser(user.uid);
    if (!userRecord.email) {
      throw new AppValidationError('Kullanıcının e-posta adresi bulunamadı');
    }

    // Mevcut şifreyi Firebase Auth REST API ile doğrula
    const firebaseWebApiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!firebaseWebApiKey) {
      logger.error('❌ FIREBASE_WEB_API_KEY not configured');
      throw new AppInternalServerError('Sunucu yapılandırma hatası');
    }

    try {
      const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseWebApiKey}`;
      const signInResponse = await fetch(signInUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userRecord.email,
          password: currentPassword,
          returnSecureToken: true,
        }),
      });

      if (!signInResponse.ok) {
        const signInError = await signInResponse.json();
        const errorMessage = signInError.error?.message || '';
        if (errorMessage.includes('INVALID_PASSWORD') || errorMessage.includes('INVALID_LOGIN_CREDENTIALS')) {
          throw new AppValidationError('Mevcut şifre hatalı');
        }
        logger.error('❌ Password verification error:', errorMessage);
        throw new AppValidationError('Mevcut şifre doğrulanamadı');
      }
    } catch (verifyError: unknown) {
      if (verifyError instanceof AppValidationError) throw verifyError;
      const msg = isErrorWithMessage(verifyError) ? verifyError.message : 'Bilinmeyen hata';
      logger.error('❌ Password verification error:', msg);
      throw new AppInternalServerError('Mevcut şifre doğrulanırken bir hata oluştu');
    }

    await auth.updateUser(user.uid, { password: newPassword });
    logger.log(`✅ Password changed for user: ${user.uid}`);

    return successResponse(
      'Şifre başarıyla değiştirildi',
      undefined,
      200,
      'PASSWORD_CHANGE_SUCCESS'
    );
  });
});

