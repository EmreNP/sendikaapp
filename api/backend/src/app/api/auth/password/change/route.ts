import { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase/admin';
import { withAuth } from '@/lib/middleware/auth';
import { validatePassword } from '@/lib/utils/validation/authValidation';
import { 
  successResponse, 
  validationError, 
  handleFirebaseAuthError,
  serverError,
  isErrorWithMessage,
  isFirebaseError
} from '@/lib/utils/response';

interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body: PasswordChangeRequest = await request.json();
      const { currentPassword, newPassword } = body;
      
      // 1️⃣ VALIDATION
      if (!currentPassword || !newPassword) {
        return validationError('Mevcut şifre ve yeni şifre gerekli');
      }
      
      if (currentPassword === newPassword) {
        return validationError('Yeni şifre mevcut şifre ile aynı olamaz');
      }
      
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return validationError(passwordValidation.error || 'Geçersiz şifre');
      }
      
      // 2️⃣ KULLANICI BİLGİLERİNİ AL
      const userRecord = await auth.getUser(user.uid);
      
      if (!userRecord.email) {
        return validationError('Kullanıcının e-posta adresi bulunamadı');
      }
      
      // 3️⃣ MEVCUT ŞİFREYİ DOĞRULA (Firebase Auth REST API ile)
      const firebaseWebApiKey = process.env.FIREBASE_WEB_API_KEY;
      
      if (!firebaseWebApiKey) {
        console.error('❌ FIREBASE_WEB_API_KEY not configured');
        return serverError('Sunucu yapılandırma hatası');
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
            return validationError('Mevcut şifre hatalı');
          }
          
          // Diğer hatalar için
          console.error('❌ Password verification error:', errorMessage);
          return validationError('Mevcut şifre doğrulanamadı');
        }
        
        console.log(`✅ Current password verified for user: ${user.uid}`);
      } catch (verifyError: unknown) {
        const errorMessage = isErrorWithMessage(verifyError) ? verifyError.message : 'Bilinmeyen hata';
        console.error('❌ Password verification error:', errorMessage);
        return serverError('Mevcut şifre doğrulanırken bir hata oluştu');
      }
      
      // 4️⃣ ŞİFREYİ GÜNCELLE
      await auth.updateUser(user.uid, {
        password: newPassword
      });
      
      console.log(`✅ Password changed for user: ${user.uid}`);
      
      // 5️⃣ BAŞARILI RESPONSE
      return successResponse(
        'Şifre başarıyla değiştirildi',
        undefined,
        200,
        'PASSWORD_CHANGE_SUCCESS'
      );
      
    } catch (error: unknown) {
      console.error('❌ Password change error:', error);
      
      // Firebase Auth hatalarını yakala
      if (isFirebaseError(error) && error.code.startsWith('auth/')) {
        return handleFirebaseAuthError(error);
      }
      
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Şifre değiştirilirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

