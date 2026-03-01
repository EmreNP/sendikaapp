// Notification Service - FCM Token yönetimi ve push bildirim işlemleri
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { secureStorage } from './secureStorage';
import { logger } from '../utils/logger';
import type { EventSubscription } from 'expo-modules-core';

const FCM_TOKEN_KEY = '@fcm_token';

/**
 * Expo Go ortamında mı çalıştığımızı kontrol et.
 * SDK 53+ itibarıyla push bildirimler Expo Go'da desteklenmiyor,
 * sadece development build / standalone build'de çalışır.
 */
export function isExpoGo(): boolean {
  try {
    // 1. Birincil kontrol: executionEnvironment (SDK 46+)
    if (Constants.executionEnvironment === 'storeClient') return true;
    // 2. Yedek kontrol: appOwnership (eski sürümler için)
    const legacyOwnership = (Constants as Record<string, unknown>).appOwnership;
    if (legacyOwnership === 'expo') return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Bildirim davranışını yapılandır
 * Uygulama ön plandayken bildirimlerin nasıl gösterileceğini belirler
 */
export function configureNotificationHandler() {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    logger.warn('Bildirim handler yapılandırılamadı:', error);
  }
}

/**
 * Android için bildirim kanalı oluştur (Android 8+ gereksinimi)
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Varsayılan',
      description: 'Genel bildirimler',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
      sound: 'default',
    });
  }
}

/**
 * Bildirim izni iste ve Expo Push Token al
 * @returns FCM/Expo push token veya null
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Expo Go'da push bildirimler SDK 53+ itibarıyla desteklenmiyor
  if (isExpoGo()) {
    logger.warn('⚠️ Push bildirimler Expo Go\'da desteklenmiyor. Development build kullanın.');
    return null;
  }

  // Fiziksel cihaz kontrolü - emülatörde FCM çalışmaz ama Expo Push Token çalışabilir
  if (!Device.isDevice) {
    logger.warn('Push bildirimler sadece fiziksel cihazlarda tam çalışır. Emülatörde token alınmaya çalışılacak.');
  }

  try {
    // 1. Mevcut izin durumunu kontrol et
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 2. İzin yoksa iste
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // 3. İzin reddedildiyse çık
    if (finalStatus !== 'granted') {
      logger.warn('Bildirim izni verilmedi');
      return null;
    }

    // 4. Android bildirim kanalını kur
    await setupNotificationChannel();

    // 5. Native FCM/APNs token al (backend firebase-admin ile doğrudan gönderim yapar)
    // NOT: getExpoPushTokenAsync yerine getDevicePushTokenAsync kullanıyoruz
    // çünkü backend FCM token bekliyor (admin.messaging().sendEachForMulticast)
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    const token = tokenResponse.data as string;
    logger.log('📱 Push token alındı:', token.substring(0, 30) + '...');

    // 6. Token'ı güvenli depoya kaydet (logout'ta kullanmak için)
    await secureStorage.setItem(FCM_TOKEN_KEY, token);

    return token;
  } catch (error) {
    logger.warn('Push token alınamadı:', error);
    return null;
  }
}

/**
 * Kayıtlı token'ı local storage'dan al
 */
export async function getStoredToken(): Promise<string | null> {
  try {
    return await secureStorage.getItem(FCM_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Local storage'daki token'ı temizle
 */
export async function clearStoredToken(): Promise<void> {
  try {
    await secureStorage.removeItem(FCM_TOKEN_KEY);
  } catch (error) {
    logger.warn('Stored token temizlenemedi:', error);
  }
}

/**
 * Cihaz tipini döndür (backend'in beklediği format)
 */
export function getDeviceType(): 'ios' | 'android' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

/**
 * FCM token yenileme dinleyicisi başlat.
 * OS, token'ı yenilediğinde (uygulama güncellemesi, yedekten geri yükleme vb.)
 * yeni token'ı backend'e otomatik kaydeder.
 *
 * @param onTokenRefresh Yeni token backend'e gönderilmek üzere çağrılır.
 *                       Genellikle ApiService.registerPushToken(token, deviceType) kullanılır.
 * @returns Aboneliği iptal etmek için kullanılabilecek Subscription nesnesi.
 */
export function listenForTokenRefresh(
  onTokenRefresh: (token: string) => Promise<void>,
): EventSubscription | null {
  // Expo Go'da addPushTokenListener desteklenmiyor (SDK 53+)
  if (isExpoGo()) {
    logger.warn('⚠️ Token yenileme dinleyicisi Expo Go\'da desteklenmiyor.');
    return null;
  }

  try {
    return Notifications.addPushTokenListener(async (event) => {
      const newToken = event.data as string;
      if (!newToken) return;

      try {
        const oldToken = await secureStorage.getItem(FCM_TOKEN_KEY);
        if (newToken !== oldToken) {
          logger.log('🔄 FCM token yenilendi, backend\'e kaydediliyor…');
          await secureStorage.setItem(FCM_TOKEN_KEY, newToken);
          await onTokenRefresh(newToken);
          logger.log('✅ Yeni FCM token backend\'e başarıyla kaydedildi.');
        }
      } catch (error) {
        logger.warn('FCM token yenileme sırasında hata:', error);
      }
    });
  } catch (error) {
    logger.warn('Push token dinleyicisi başlatılamadı:', error);
    return null;
  }
}
