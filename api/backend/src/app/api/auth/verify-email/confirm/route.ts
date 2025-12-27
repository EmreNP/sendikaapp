import { NextRequest } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { 
  successResponse, 
  validationError, 
  notFoundError,
  handleFirebaseAuthError,
  serverError,
  isErrorWithMessage,
  isFirebaseError
} from '@/lib/utils/response';

interface VerifyEmailConfirmRequest {
  uid: string; // Client-side'da action code verify edildikten sonra UID gönderilir
}

/**
 * Email doğrulama onaylama endpoint'i
 * 
 * NOT: Firebase Admin SDK'da action code'u direkt verify edemiyoruz.
 * Bu yüzden client-side'da action code verify edilmeli ve UID backend'e gönderilmeli.
 * 
 * Client-side flow:
 * 1. applyActionCode(oobCode) ile action code'u verify et
 * 2. Verify edildikten sonra UID'yi backend'e gönder
 * 3. Backend email'i verified olarak işaretler
 */
export async function POST(request: NextRequest) {
  try {
    const body: VerifyEmailConfirmRequest = await request.json();
    const { uid } = body;
    
    // 1️⃣ VALIDATION
    if (!uid) {
      return validationError('Kullanıcı ID (uid) gerekli');
    }
    
    // 2️⃣ KULLANICIYI KONTROL ET
    const userRecord = await auth.getUser(uid);
    
    if (userRecord.emailVerified) {
      return validationError('E-posta adresi zaten doğrulanmış');
    }
    
    // 3️⃣ EMAIL'İ DOĞRULANMIŞ OLARAK İŞARETLE
    await auth.updateUser(uid, {
      emailVerified: true
    });
    
    // 4️⃣ FIRESTORE'DA DA GÜNCELLE (eğer varsa)
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      await db.collection('users').doc(uid).update({
        emailVerified: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log(`✅ Email verified for user: ${uid}`);
    
    // 5️⃣ BAŞARILI RESPONSE
    return successResponse(
      'E-posta adresi başarıyla doğrulandı',
      {
        email: userRecord.email,
      },
      200,
      'VERIFY_EMAIL_CONFIRM_SUCCESS'
    );
    
  } catch (error: unknown) {
    console.error('❌ Verify email confirm error:', error);
    
    // Firebase Auth hatalarını yakala
    if (isFirebaseError(error) && error.code.startsWith('auth/')) {
      return handleFirebaseAuthError(error);
    }
    
    const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
    return serverError(
      'E-posta doğrulama sırasında bir hata oluştu',
      errorMessage
    );
  }
}

