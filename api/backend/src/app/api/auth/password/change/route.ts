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
      
      // 1️⃣ VALIDATION
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
      
      // 2️⃣ KULLANICI BİLGİLERİNİ AL
      const userRecord = await auth.getUser(user.uid);
      
      if (!userRecord.email) {
      throw new AppValidationError('Kullanıcının e-posta adresi bulunamadı');
      }
      
      // 3️⃣ MEVCUT ŞİFREYİ DOĞRULA (Firebase Auth REST API ile)
      const firebaseWebApiKey = process.env.FIREBASE_WEB_API_KEY;
      
      if (!firebaseWebApiKey) {
        logger.error('❌ FIREBASE_WEB_API_KEY not configured');
        throw new AppInternalServerError('Sunucu yapılandırma hatası');
      }
      
      try {
        // Firebase Auth REST API ile mevcut şifre ile sign-in denemesi
        const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseWebApiKey}`;
        const signInResponse = await fetch(signInUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userRecord.email,
            password: currentPassword,
            returnSecureToken: true,
          }),
        });
        
        if (!signInResponse.ok) {
          const signInError = await signInResponse.json();
          const errorMessage = signInError.error?.message || 'Bilinmeyen hata';
          
          // Şifre hatalı ise
          if (errorMessage.includes('INVALID_PASSWORD') || errorMessage.includes('INVALID_LOGIN_CREDENTIALS')) {
            throw new AppValidationError('Mevcut şifre hatalı');
          }
          
          // Diğer hatalar için
          logger.error('❌ Password verification error:', errorMessage);
          throw new AppValidationError('Mevcut şifre doğrulanamadı');
        }
        
        logger.log(`✅ Current password verified for user: ${user.uid}`);
      } catch (verifyError: unknown) {
        // Eğer zaten AppError ise, re-throw et
        if (verifyError instanceof AppValidationError) {
          throw verifyError;
        }
        // Diğer hatalar için
        const errorMessage = isErrorWithMessage(verifyError) ? verifyError.message : 'Bilinmeyen hata';
        logger.error('❌ Password verification error:', errorMessage);
        throw new AppInternalServerError('Mevcut şifre doğrulanırken bir hata oluştu');
      }
      
      // 4️⃣ ŞİFREYİ GÜNCELLE
      await auth.updateUser(user.uid, {
        password: newPassword
      });
      
      logger.log(`✅ Password changed for user: ${user.uid}`);
      
      // 5️⃣ BAŞARILI RESPONSE
      return successResponse(
        'Şifre başarıyla değiştirildi',
        undefined,
        200,
        'PASSWORD_CHANGE_SUCCESS'
      );
  });
  });

