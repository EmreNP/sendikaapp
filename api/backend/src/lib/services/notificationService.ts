import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { AppValidationError } from '@/lib/utils/errors/AppError';
import { 
  NOTIFICATION_LIMITS,
  NOTIFICATION_ERROR_MESSAGE,
  type NotificationType 
} from '@shared/constants/notifications';

/**
 * Notification Service
 * Bildirim gönderme ve yönetimi için helper fonksiyonlar
 */

/**
 * Çoklu bildirim gönderme
 * 
 * @param tokens FCM token listesi
 * @param title Bildirim başlığı
 * @param body Bildirim içeriği
 * @param type İçerik tipi
 * @param contentId İçerik ID'si (deep linking için)
 * @param imageUrl Görsel URL
 * @param data Ek veriler (deep linking için)
 * @param branchId Şube ID'si
 * @returns Gönderim sonuçları
 */
export async function sendMulticastNotification(
  tokens: string[],
  title: string,
  body: string,
  type: NotificationType,
  contentId?: string,
  imageUrl?: string,
  data?: Record<string, string>,
  branchId?: string
): Promise<{ successCount: number; failureCount: number }> {
  
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }
  
  // FCM mesaj yapısı
  const message: admin.messaging.MulticastMessage = {
    notification: {
      title,
      body,
      ...(imageUrl && { imageUrl }),
    },
    data: {
      type,
      ...(contentId && { contentId }),
      ...(branchId && { branchId }),
      ...data,
    },
    android: {
      priority: 'high' as const,
      notification: {
        sound: 'default',
        channelId: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
    tokens,
  };
  
  try {
    // 500'den fazla token varsa chunk'lar halinde gönder
    // FCM sendEachForMulticast max 500 token destekler
    if (tokens.length > NOTIFICATION_LIMITS.FCM_MULTICAST_MAX_TOKENS) {
      const chunkSize = NOTIFICATION_LIMITS.FCM_MULTICAST_MAX_TOKENS;
      let totalSuccess = 0;
      let totalFailed = 0;
      
      for (let i = 0; i < tokens.length; i += chunkSize) {
        const chunk = tokens.slice(i, i + chunkSize);
        const chunkMessage = { ...message, tokens: chunk };
        
        const response = await admin.messaging().sendEachForMulticast(chunkMessage);
        totalSuccess += response.successCount;
        totalFailed += response.failureCount;
        
        // Başarısız token'ları temizle
        await cleanupFailedTokens(response, chunk);
      }
      
      return { successCount: totalSuccess, failureCount: totalFailed };
    }
    
    // 500 veya daha az token
    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Başarısız token'ları temizle
    await cleanupFailedTokens(response, tokens);
    
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('❌ FCM notification error:', error);
    throw new AppValidationError(NOTIFICATION_ERROR_MESSAGE.NOTIFICATION_SEND_ERROR);
  }
}

/**
 * Başarısız token'ları temizle
 * Geçersiz veya kayıtlı olmayan token'ları Firestore'da pasif yap
 * 
 * @param response FCM BatchResponse
 * @param tokens Token listesi (response ile eşleşmeli)
 */
async function cleanupFailedTokens(
  response: admin.messaging.BatchResponse,
  tokens: string[]
): Promise<void> {
  if (response.failureCount === 0) return;
  
  await Promise.all(
    response.responses.map(async (resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        
        // Geçersiz veya kayıtlı olmayan token'ları pasif yap
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          try {
            const tokenSnapshots = await db.collection('fcmTokens')
              .where('token', '==', tokens[idx])
              .get();
            
            await Promise.all(
              tokenSnapshots.docs.map(doc =>
                doc.ref.update({ 
                  isActive: false,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                })
              )
            );
            
            console.log(`⚠️ Geçersiz token pasif yapıldı: ${tokens[idx].substring(0, 20)}...`);
          } catch (error) {
            console.error('Token temizleme hatası:', error);
          }
        }
      }
    })
  );
}

/**
 * Bildirim geçmişini Firestore'a kaydet
 * 
 * @param notification Bildirim bilgileri
 */
export async function saveNotificationHistory(notification: {
  title: string;
  body: string;
  type: NotificationType;
  contentId?: string;
  sentBy: string;          // Kim gönderdi (user UID)
  targetAudience: string;  // 'all', 'active', 'branch'
  branchId?: string;       // Şube ID'si
  sentCount: number;       // Kaç kişiye gönderildi
  failedCount: number;     // Kaç kişiye gönderilemedi
  imageUrl?: string;       // Görsel URL
  data?: Record<string, string>; // Ek veriler
}): Promise<void> {
  try {
    // Firestore undefined değerleri kabul etmez, sadece tanımlı alanları ekle
    const historyData: Record<string, any> = {
      title: notification.title,
      body: notification.body,
      type: notification.type,
      sentBy: notification.sentBy,
      targetAudience: notification.targetAudience,
      sentCount: notification.sentCount,
      failedCount: notification.failedCount,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Opsiyonel alanları sadece tanımlıysa ekle
    if (notification.contentId) {
      historyData.contentId = notification.contentId;
    }
    
    if (notification.branchId) {
      historyData.branchId = notification.branchId;
    }
    
    if (notification.imageUrl) {
      historyData.imageUrl = notification.imageUrl;
    }
    
    if (notification.data) {
      historyData.data = notification.data;
    }
    
    await db.collection('notificationHistory').add(historyData);
    
    console.log(`✅ Bildirim geçmişi kaydedildi: ${notification.title}`);
  } catch (error) {
    console.error('❌ Bildirim geçmişi kaydetme hatası:', error);
    // Hata olsa bile bildirim gönderilmiş sayılır
    // Sadece log kaydedilemedi
  }
}

