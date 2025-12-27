import { NextRequest } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import { withAuth } from '@/lib/middleware/auth';
import { sendEmailVerification } from '@/lib/services/firebaseEmailService';
import { 
  successResponse, 
  validationError, 
  notFoundError,
  handleFirebaseAuthError,
  serverError,
  isErrorWithMessage,
  isFirebaseError
} from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  // Email doğrulama gönderme endpoint'i için email doğrulama kontrolünü bypass et
  // Çünkü kullanıcı email doğrulamak için bu endpoint'e erişmeli
  return withAuth(request, async (req, user) => {
    try {
      // 1️⃣ KULLANICI BİLGİLERİNİ AL
      const userRecord = await auth.getUser(user.uid);
      
      // Email zaten doğrulanmış mı kontrol et
      if (userRecord.emailVerified) {
        return validationError('E-posta adresi zaten doğrulanmış');
      }
      
      if (!userRecord.email) {
        return validationError('Kullanıcının e-posta adresi bulunamadı');
      }
      
      // 2️⃣ DOĞRULAMA EMAİLİ GÖNDER
      // Firebase'in kendi email servisini kullanarak email gönder
      await sendEmailVerification(userRecord.email);
      
      console.log(`✅ Email verification sent to ${userRecord.email}`);
      
      // 3️⃣ BAŞARILI RESPONSE
      return successResponse(
        'E-posta doğrulama emaili gönderildi. Lütfen email kutunuzu kontrol edin.',
        undefined,
        200,
        'VERIFY_EMAIL_SEND_SUCCESS'
      );
      
    } catch (error: unknown) {
      console.error('❌ Verify email send error:', error);
      
      // Firebase Auth hatalarını yakala
      if (isFirebaseError(error) && error.code.startsWith('auth/')) {
        return handleFirebaseAuthError(error);
      }
      
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'E-posta doğrulama linki oluşturulurken bir hata oluştu',
        errorMessage
      );
    }
  }, { skipEmailVerification: true });
}

