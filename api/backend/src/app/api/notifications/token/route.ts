import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth } from '@/lib/middleware/auth';
import { 
  DEVICE_TYPE, 
  NOTIFICATION_RESPONSE_CODE,
  NOTIFICATION_RESPONSE_MESSAGE,
  NOTIFICATION_ERROR_MESSAGE,
  type DeviceType 
} from '@shared/constants/notifications';
import { 
  successResponse
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError } from '@/lib/utils/errors/AppError';

import { logger } from '../../../../lib/utils/logger';
interface RegisterTokenRequest {
  token: string;
  deviceId?: string;
  deviceType?: DeviceType;
}

/**
 * POST /api/notifications/token
 * FCM token'ı kaydet veya güncelle
 * 
 * Kullanım:
 * - Kullanıcı uygulamayı ilk açtığında token alınır ve buraya gönderilir
 * - Kullanıcı farklı cihazda giriş yaptığında yeni token kaydedilir
 * - Mevcut token zaten varsa güncellenir (deviceId değişmiş olabilir)
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    // 1. Request body'yi parse et
    const body = await parseJsonBody<RegisterTokenRequest>(req);
    const { token, deviceId, deviceType } = body;
    
    // 2. Validasyon - token zorunlu
    if (!token || token.trim().length === 0) {
      throw new AppValidationError(NOTIFICATION_ERROR_MESSAGE.TOKEN_REQUIRED);
    }
    
    // Device type validasyonu
    if (deviceType && deviceType !== DEVICE_TYPE.IOS && deviceType !== DEVICE_TYPE.ANDROID) {
      throw new AppValidationError(NOTIFICATION_ERROR_MESSAGE.INVALID_DEVICE_TYPE);
    }
    
    // 3. Bu token zaten kayıtlı mı kontrol et
    // Aynı token birden fazla kullanıcıda olabilir (cihaz paylaşımı durumu)
    // Ama genelde bir token bir kullanıcıya aittir
    const existingTokenQuery = await db.collection('fcmTokens')
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (existingTokenQuery.empty) {
      // 4a. YENİ TOKEN KAYDI
      // İlk kez bu token kaydediliyor
      await db.collection('fcmTokens').add({
        userId: user.uid,           // Hangi kullanıcının token'ı
        token: token,                // FCM token
        deviceId: deviceId || null,  // Cihaz bilgisi
        deviceType: deviceType || null, // iOS/Android
        isActive: true,              // Aktif mi?
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      logger.log(`✅ Yeni FCM token kaydedildi: ${user.uid} - ${token.substring(0, 20)}...`);
    } else {
      // 4b. MEVCUT TOKEN GÜNCELLEMESİ
      // Token zaten var, sadece bilgileri güncelle
      const tokenDoc = existingTokenQuery.docs[0];
      
      // Eğer token başka bir kullanıcıya aitse, bu normal (cihaz değişimi)
      // Sadece güncelle
      await tokenDoc.ref.update({
        userId: user.uid,           // Yeni kullanıcıya ata
        deviceId: deviceId || null,
        deviceType: deviceType || null,
        isActive: true,              // Aktif yap
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      logger.log(`✅ FCM token güncellendi: ${user.uid} - ${token.substring(0, 20)}...`);
    }
    
    // 5. Başarılı response döndür
    // Diğer endpoint'lerle tutarlı olması için data gönderiyoruz
    // Örnek: activate endpoint'i { user: { uid, isActive } } gönderiyor
    const wasNew = existingTokenQuery.empty;
    return successResponse(
      NOTIFICATION_RESPONSE_MESSAGE.TOKEN_REGISTERED,
      {
        isNew: wasNew, // Yeni token mı yoksa güncelleme mi?
        deviceType: deviceType || null,
        deviceId: deviceId || null,
      },
      201, // POST için 201 (Created) kullanıyoruz, diğer endpoint'ler gibi
      NOTIFICATION_RESPONSE_CODE.TOKEN_REGISTERED
    );
  });
});

/**
 * DELETE /api/notifications/token
 * Token'ı pasif yap (kullanıcı logout olduğunda)
 * 
 * Kullanım:
 * - Kullanıcı logout yaptığında bu endpoint çağrılır
 * - Token silinmez, sadece isActive: false yapılır
 * - Böylece geçmiş bildirimler için log tutulabilir
 */
export const DELETE = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const body = await parseJsonBody<{ token: string }>(req);
    const { token } = body;
    
    if (!token) {
      throw new AppValidationError(NOTIFICATION_ERROR_MESSAGE.TOKEN_REQUIRED);
    }
    
    // Sadece bu kullanıcıya ait token'ları pasif yap
    const tokenQuery = await db.collection('fcmTokens')
      .where('token', '==', token)
      .where('userId', '==', user.uid)
      .limit(1)
      .get();
    
    if (!tokenQuery.empty) {
      await tokenQuery.docs[0].ref.update({
        isActive: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      logger.log(`✅ FCM token pasif yapıldı: ${user.uid}`);
    }
    
    // Diğer endpoint'lerle tutarlı olması için data gönderiyoruz
    return successResponse(
      NOTIFICATION_RESPONSE_MESSAGE.TOKEN_DELETED,
      {
        token: token.substring(0, 20) + '...', // Güvenlik için sadece kısmi token
        isActive: false,
      },
      200, // DELETE için 200 doğru
      NOTIFICATION_RESPONSE_CODE.TOKEN_DELETED
    );
  });
});

