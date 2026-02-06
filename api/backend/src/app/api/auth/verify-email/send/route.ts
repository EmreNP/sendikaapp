import { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase/admin';
import { withAuth } from '@/lib/middleware/auth';
import { sendEmailVerificationWithIdToken } from '@/lib/services/firebaseEmailService';
import { 
  successResponse, 
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppValidationError } from '@/lib/utils/errors/AppError';

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split('Bearer ')[1] || null;
}

export const POST = asyncHandler(async (request: NextRequest) => {
  // Email doğrulama gönderme endpoint'i için email doğrulama kontrolünü bypass et
  // Çünkü kullanıcı email doğrulamak için bu endpoint'e erişmeli
  return withAuth(request, async (req, user) => {
      // 1️⃣ KULLANICI BİLGİLERİNİ AL
      const userRecord = await auth.getUser(user.uid);
      
      // Email zaten doğrulanmış mı kontrol et
      if (userRecord.emailVerified) {
      throw new AppValidationError('E-posta adresi zaten doğrulanmış');
      }
      
      if (!userRecord.email) {
      throw new AppValidationError('Kullanıcının e-posta adresi bulunamadı');
      }
      
      // 2️⃣ DOĞRULAMA EMAİLİ GÖNDER
      // Firebase Auth REST API VERIFY_EMAIL, kullanıcı idToken ister
      const idToken = getBearerToken(req);
      if (!idToken) {
        throw new AppValidationError('Yetkilendirme token\'ı gerekli');
      }
      await sendEmailVerificationWithIdToken(idToken);
      
      console.log(`✅ Email verification sent to ${userRecord.email}`);
      
      // 3️⃣ BAŞARILI RESPONSE
      return successResponse(
        'E-posta doğrulama emaili gönderildi. Lütfen email kutunuzu kontrol edin.',
        undefined,
        200,
        'VERIFY_EMAIL_SEND_SUCCESS'
      );
  }, { skipEmailVerification: true });
});

