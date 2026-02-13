// Notification Service - FCM Token yönetimi ve push bildirim işlemleri
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FCM_TOKEN_KEY = '@fcm_token';

/**
 * Bildirim davranışını yapılandır
 * Uygulama ön plandayken bildirimlerin nasıl gösterileceğini belirler
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
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
  // Fiziksel cihaz kontrolü - emülatörde FCM çalışmaz ama Expo Push Token çalışabilir
  if (!Device.isDevice) {
    console.warn('Push bildirimler sadece fiziksel cihazlarda tam çalışır. Emülatörde token alınmaya çalışılacak.');
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
      console.warn('Bildirim izni verilmedi');
      return null;
    }

    // 4. Android bildirim kanalını kur
    await setupNotificationChannel();

    // 5. Native FCM/APNs token al (backend firebase-admin ile doğrudan gönderim yapar)
    // NOT: getExpoPushTokenAsync yerine getDevicePushTokenAsync kullanıyoruz
    // çünkü backend FCM token bekliyor (admin.messaging().sendEachForMulticast)
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    const token = tokenResponse.data as string;
    console.log('📱 Push token alındı:', token.substring(0, 30) + '...');

    // 6. Token'ı local storage'a kaydet (logout'ta kullanmak için)
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);

    return token;
  } catch (error) {
    console.error('Push token alınamadı:', error);
    return null;
  }
}

/**
 * Kayıtlı token'ı local storage'dan al
 */
export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(FCM_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Local storage'daki token'ı temizle
 */
export async function clearStoredToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.error('Stored token temizlenemedi:', error);
  }
}

/**
 * Cihaz tipini döndür (backend'in beklediği format)
 */
export function getDeviceType(): 'ios' | 'android' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}
