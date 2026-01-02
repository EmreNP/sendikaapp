# Bildirim Sistemi Dokümantasyonu

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Sistem Mimarisi](#sistem-mimarisi)
3. [Backend API Endpoint'leri](#backend-api-endpointleri)
4. [Frontend Entegrasyonu (Mobil Uygulama)](#frontend-entegrasyonu-mobil-uygulama)
5. [Admin Panel Kullanımı](#admin-panel-kullanımı)
6. [Bildirim Tipleri ve Hedef Kitleler](#bildirim-tipleri-ve-hedef-kitleler)
7. [Örnek Kodlar](#örnek-kodlar)
8. [Test Senaryoları](#test-senaryoları)
9. [Troubleshooting](#troubleshooting)
10. [Güvenlik ve Yetkilendirme](#güvenlik-ve-yetkilendirme)

---

## Genel Bakış

SendikaApp bildirim sistemi, Firebase Cloud Messaging (FCM) kullanarak mobil kullanıcılara push notification göndermeyi sağlar. Sistem şu ana bileşenlerden oluşur:

- **Backend API**: Bildirim gönderme ve token yönetimi
- **Admin Panel**: Bildirim gönderme arayüzü ve geçmiş görüntüleme
- **Mobil Uygulama**: FCM token kaydı ve bildirim alma

### Özellikler

- ✅ Çoklu hedef kitle desteği (Tüm kullanıcılar, Aktif kullanıcılar, Belirli şube)
- ✅ Bildirim geçmişi kaydı
- ✅ Başarısız token temizleme
- ✅ Deep linking desteği
- ✅ Görsel bildirimler
- ✅ Yetki bazlı erişim kontrolü

---

## Sistem Mimarisi

```
┌─────────────────┐
│  Admin Panel    │
│  (Next.js)      │
└────────┬────────┘
         │
         │ POST /api/notifications/send
         ▼
┌─────────────────┐
│  Backend API    │
│  (Next.js API)  │
└────────┬────────┘
         │
         │ FCM API
         ▼
┌─────────────────┐
│  Firebase FCM   │
└────────┬────────┘
         │
         │ Push Notification
         ▼
┌─────────────────┐
│  Mobil Cihazlar │
│  (iOS/Android)  │
└─────────────────┘
```

### Veri Akışı

1. **Token Kaydı**: Mobil uygulama FCM token'ı backend'e kaydeder
2. **Bildirim Gönderme**: Admin panel üzerinden bildirim oluşturulur
3. **Token Filtreleme**: Backend hedef kitleye göre token'ları filtreler
4. **FCM Gönderimi**: Firebase FCM API üzerinden bildirimler gönderilir
5. **Sonuç Kaydı**: Gönderim sonuçları geçmişe kaydedilir

---

## Backend API Endpoint'leri

### 1. Token Kaydetme

**Endpoint:** `POST /api/notifications/token`

**Yetki:** Authenticated kullanıcılar

**Request Body:**
```json
{
  "token": "fcm_token_string",
  "deviceId": "device_unique_id",  // Opsiyonel
  "deviceType": "ios" | "android"  // Opsiyonel
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Token başarıyla kaydedildi",
  "code": "TOKEN_REGISTERED",
  "data": {
    "isNew": true,
    "deviceType": "android",
    "deviceId": "device_123"
  }
}
```

**Kullanım Senaryosu:**
- Kullanıcı uygulamayı ilk açtığında
- Kullanıcı farklı cihazda giriş yaptığında
- Token yenilendiğinde (FCM tarafından)

**Örnek Kod:**
```typescript
const response = await fetch('/api/notifications/token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: fcmToken,
    deviceId: deviceId,
    deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
  }),
});
```

---

### 2. Token Silme (Pasif Yapma)

**Endpoint:** `DELETE /api/notifications/token`

**Yetki:** Authenticated kullanıcılar

**Request Body:**
```json
{
  "token": "fcm_token_string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token başarıyla silindi",
  "code": "TOKEN_DELETED",
  "data": {
    "token": "fcm_token_string...",
    "isActive": false
  }
}
```

**Kullanım Senaryosu:**
- Kullanıcı logout yaptığında
- Token geçersiz hale geldiğinde

---

### 3. Bildirim Gönderme

**Endpoint:** `POST /api/notifications/send`

**Yetki:** Admin veya Branch Manager

**Request Body:**
```json
{
  "title": "Bildirim Başlığı",
  "body": "Bildirim mesajı",
  "type": "announcement" | "news",
  "contentId": "content_id_string",  // Opsiyonel - Deep linking için
  "imageUrl": "https://example.com/image.jpg",  // Opsiyonel
  "targetAudience": "all" | "active" | "branch",
  "branchId": "branch_id_string",  // targetAudience='branch' ise zorunlu
  "data": {  // Opsiyonel - Ek veriler
    "customKey": "customValue"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Bildirim gönderildi",
  "code": "NOTIFICATION_SENT",
  "data": {
    "sent": 150,
    "failed": 2
  }
}
```

**Validasyon Kuralları:**
- `title`: Zorunlu, maksimum 100 karakter
- `body`: Zorunlu, maksimum 500 karakter
- `type`: Zorunlu, `announcement` veya `news`
- `targetAudience`: Varsayılan `all`
- Branch Manager `all` hedef kitleye bildirim gönderemez
- Branch Manager sadece kendi şubesine bildirim gönderebilir

---

### 4. Bildirim Geçmişi

**Endpoint:** `GET /api/notifications/history`

**Yetki:** Admin veya Branch Manager

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 20, max: 100)
- `type`: Bildirim tipi (`announcement` | `news`)
- `targetAudience`: Hedef kitle (`all` | `active` | `branch`)
- `branchId`: Şube ID'si (sadece admin)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Bildirim geçmişi başarıyla getirildi",
  "data": {
    "notifications": [
      {
        "id": "notification_id",
        "title": "Bildirim Başlığı",
        "body": "Bildirim mesajı",
        "type": "news",
        "contentId": "content_id",
        "imageUrl": "https://example.com/image.jpg",
        "sentBy": "user_uid",
        "targetAudience": "all",
        "branchId": "branch_id",
        "sentCount": 150,
        "failedCount": 2,
        "data": {},
        "createdAt": "2026-01-02T12:59:34.000Z",
        "branch": {
          "id": "branch_id",
          "name": "Şube Adı"
        },
        "sentByUser": {
          "uid": "user_uid",
          "firstName": "Ad",
          "lastName": "Soyad"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

## Frontend Entegrasyonu (Mobil Uygulama)

### 1. Gereksinimler

**React Native için:**
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

**Expo için:**
```bash
expo install expo-notifications expo-device
```

### 2. FCM Token Alma

#### React Native Firebase

```typescript
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    return true;
  }
  return false;
}

async function getFCMToken() {
  try {
    const hasPermission = await requestUserPermission();
    if (!hasPermission) {
      console.log('Notification permission denied');
      return null;
    }

    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}
```

#### Expo

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}
```

### 3. Token'ı Backend'e Kaydetme

```typescript
import { auth } from './firebase'; // Firebase Auth instance
import { getAuth } from 'firebase/auth';

async function registerTokenToBackend(token: string, deviceId: string) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const idToken = await user.getIdToken();
    
    const response = await fetch('https://your-api.com/api/notifications/token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        deviceId: deviceId,
        deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Token registered successfully:', data);
    } else {
      console.error('Token registration failed:', data.message);
    }
  } catch (error) {
    console.error('Error registering token:', error);
  }
}
```

### 4. Bildirim Dinleme

#### React Native Firebase

```typescript
import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';

// Foreground bildirimleri için
messaging().onMessage(async remoteMessage => {
  console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
  
  // Bildirim göster
  Alert.alert(
    remoteMessage.notification?.title || 'Bildirim',
    remoteMessage.notification?.body || '',
    [{ text: 'OK' }]
  );
});

// Background/Quit durumunda bildirim tıklama
messaging().onNotificationOpenedApp(remoteMessage => {
  console.log('Notification caused app to open from background state:', remoteMessage);
  handleNotificationNavigation(remoteMessage);
});

// Uygulama kapalıyken bildirim tıklama
messaging()
  .getInitialNotification()
  .then(remoteMessage => {
    if (remoteMessage) {
      console.log('Notification caused app to open from quit state:', remoteMessage);
      handleNotificationNavigation(remoteMessage);
    }
  });

// Token yenileme
messaging().onTokenRefresh(token => {
  console.log('FCM Token refreshed:', token);
  registerTokenToBackend(token, deviceId);
});
```

#### Expo

```typescript
import * as Notifications from 'expo-notifications';

// Bildirim handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Bildirim alındığında
useEffect(() => {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  return () => subscription.remove();
}, []);

// Bildirim tıklandığında
useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    handleNotificationNavigation(response.notification);
  });

  return () => subscription.remove();
}, []);
```

### 5. Deep Linking İşleme

```typescript
function handleNotificationNavigation(notification: any) {
  const data = notification.data;
  
  if (!data) return;
  
  // Bildirim tipine göre yönlendirme
  switch (data.type) {
    case 'announcement':
      if (data.contentId) {
        navigation.navigate('AnnouncementDetail', { id: data.contentId });
      }
      break;
      
    case 'news':
      if (data.contentId) {
        navigation.navigate('NewsDetail', { id: data.contentId });
      }
      break;
      
    default:
      navigation.navigate('Home');
  }
}
```

### 6. Logout'ta Token Silme

```typescript
async function logout() {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const idToken = await user.getIdToken();
    const fcmToken = await messaging().getToken(); // veya expo token
    
    // Token'ı pasif yap
    await fetch('https://your-api.com/api/notifications/token', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: fcmToken,
      }),
    });

    // Firebase Auth logout
    await auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
}
```

### 7. Tam Entegrasyon Örneği

```typescript
import React, { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { auth } from './firebase';

export function useNotifications() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    // Device ID al
    const getDeviceId = async () => {
      // React Native için DeviceInfo kullanın
      // const deviceId = await DeviceInfo.getUniqueId();
      setDeviceId('device_unique_id');
    };
    getDeviceId();

    // FCM Token al ve kaydet
    const initializeNotifications = async () => {
      try {
        // İzin iste
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('Notification permission denied');
          return;
        }

        // Token al
        const token = await messaging().getToken();
        setFcmToken(token);

        // Kullanıcı giriş yaptıysa token'ı kaydet
        if (auth.currentUser && token) {
          await registerToken(token);
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    // Foreground bildirimleri
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || 'Bildirim',
        remoteMessage.notification?.body || ''
      );
    });

    // Background bildirimleri
    messaging().onNotificationOpenedApp(remoteMessage => {
      handleNotificationNavigation(remoteMessage);
    });

    // Token yenileme
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async token => {
      setFcmToken(token);
      if (auth.currentUser) {
        await registerToken(token);
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeTokenRefresh();
    };
  }, []);

  // Kullanıcı giriş yaptığında token kaydet
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && fcmToken) {
        await registerToken(fcmToken);
      }
    });

    return unsubscribe;
  }, [fcmToken]);

  const registerToken = async (token: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const idToken = await user.getIdToken();
      
      const response = await fetch('https://your-api.com/api/notifications/token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          deviceId: deviceId,
          deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log('Token registered:', data.data.isNew ? 'New' : 'Updated');
      }
    } catch (error) {
      console.error('Error registering token:', error);
    }
  };

  return { fcmToken };
}
```

---

## Admin Panel Kullanımı

### Bildirim Gönderme

1. **Haberler & Duyurular** sayfasına gidin
2. Bir haber veya duyuru satırında **zil ikonu** butonuna tıklayın
3. Açılan modal'da:
   - Başlık ve mesajı kontrol edin (değiştirebilirsiniz)
   - Hedef kitleyi seçin:
     - **Tüm Kullanıcılar**: Tüm aktif token'lara gönderilir (sadece admin)
     - **Aktif Kullanıcılar**: Sadece aktif durumdaki kullanıcılara gönderilir
     - **Belirli Şube**: Seçilen şubedeki kullanıcılara gönderilir
   - Şube seçin (hedef kitle "Belirli Şube" ise)
4. **Bildirim Gönder** butonuna tıklayın

### Bildirim Geçmişi Görüntüleme

1. Sidebar'dan **Bildirim Geçmişi** menüsüne tıklayın
2. Filtreler:
   - **Bildirim Tipi**: Duyuru veya Haber
   - **Hedef Kitle**: Tümü, Tüm Kullanıcılar, Aktif Kullanıcılar, Belirli Şube
   - **Şube**: Belirli bir şubeyi filtrele (sadece admin)
3. Herhangi bir satıra tıklayarak detayları görüntüleyin

---

## Bildirim Tipleri ve Hedef Kitleler

### Bildirim Tipleri

- **`announcement`**: Duyuru bildirimleri
- **`news`**: Haber bildirimleri

### Hedef Kitleler

- **`all`**: Tüm aktif token'lara gönderilir (sadece admin)
- **`active`**: Sadece aktif durumdaki kullanıcılara gönderilir
- **`branch`**: Belirli bir şubedeki kullanıcılara gönderilir

### Yetki Kısıtlamaları

- **Admin**: Tüm hedef kitlelere bildirim gönderebilir
- **Branch Manager**: 
  - `all` hedef kitleye bildirim gönderemez
  - Sadece kendi şubesine (`branch`) bildirim gönderebilir
  - `active` hedef kitleye bildirim gönderebilir (kendi şubesi dahil)

---

## Örnek Kodlar

### Tam Entegrasyon Örneği (React Native)

```typescript
// App.tsx veya ana component
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import { useNotifications } from './hooks/useNotifications';

function App() {
  const { fcmToken } = useNotifications();

  useEffect(() => {
    // Uygulama kapalıyken bildirim tıklama
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          handleNotificationNavigation(remoteMessage);
        }
      });

    // Background bildirim tıklama
    messaging().onNotificationOpenedApp(remoteMessage => {
      handleNotificationNavigation(remoteMessage);
    });
  }, []);

  const handleNotificationNavigation = (remoteMessage: any) => {
    const data = remoteMessage.data;
    if (!data) return;

    // Navigation logic here
    if (data.type === 'news' && data.contentId) {
      // Navigate to news detail
    } else if (data.type === 'announcement' && data.contentId) {
      // Navigate to announcement detail
    }
  };

  return (
    <NavigationContainer>
      {/* Your app navigation */}
    </NavigationContainer>
  );
}
```

---

## Test Senaryoları

### 1. Token Kaydı Testi

```bash
# Token kaydetme
curl -X POST http://localhost:3001/api/notifications/token \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test_fcm_token_12345",
    "deviceType": "android",
    "deviceId": "device_123"
  }'
```

### 2. Bildirim Gönderme Testi

```bash
# Admin olarak bildirim gönderme
curl -X POST http://localhost:3001/api/notifications/send \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Bildirimi",
    "body": "Bu bir test bildirimidir",
    "type": "news",
    "targetAudience": "all"
  }'
```

### 3. Bildirim Geçmişi Testi

```bash
# Bildirim geçmişini getir
curl -X GET "http://localhost:3001/api/notifications/history?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Troubleshooting

### Token Kaydedilmiyor

**Sorun:** Token kaydetme endpoint'i hata veriyor.

**Çözümler:**
1. Firebase Authentication token'ının geçerli olduğundan emin olun
2. Request body formatını kontrol edin
3. Backend loglarını kontrol edin

### Bildirimler Gelmiyor

**Sorun:** Bildirimler mobil cihaza ulaşmıyor.

**Çözümler:**
1. FCM token'ın geçerli olduğundan emin olun
2. Cihazın internet bağlantısını kontrol edin
3. Bildirim izinlerinin verildiğinden emin olun
4. Firebase Console'da FCM test bildirimi gönderin
5. Backend loglarında başarılı gönderim sayısını kontrol edin

### Token Geçersiz Hatası

**Sorun:** FCM "invalid-registration-token" hatası.

**Çözümler:**
1. Token'ın güncel olduğundan emin olun
2. Token yenileme mekanizmasını kontrol edin
3. Backend otomatik olarak geçersiz token'ları temizler

### Deep Linking Çalışmıyor

**Sorun:** Bildirime tıklayınca doğru ekrana yönlenmiyor.

**Çözümler:**
1. `data` objesinde `type` ve `contentId` alanlarının gönderildiğinden emin olun
2. Navigation handler'ın doğru çalıştığını kontrol edin
3. Content ID'nin geçerli olduğundan emin olun

---

## Güvenlik ve Yetkilendirme

### Yetki Kontrolleri

1. **Token Kaydı**: Tüm authenticated kullanıcılar token kaydedebilir
2. **Bildirim Gönderme**: Sadece Admin ve Branch Manager bildirim gönderebilir
3. **Bildirim Geçmişi**: Admin ve Branch Manager görüntüleyebilir (Branch Manager sadece kendi şubesini görür)

### Güvenlik Önlemleri

- Tüm endpoint'ler authentication gerektirir
- Token'lar Firestore'da güvenli şekilde saklanır
- Branch Manager kısıtlamaları backend'de kontrol edilir
- Geçersiz token'lar otomatik temizlenir

---

## Firestore Koleksiyonları

### fcmTokens

```typescript
{
  userId: string;           // Kullanıcı UID
  token: string;            // FCM token
  deviceId?: string;        // Cihaz ID
  deviceType?: 'ios' | 'android';
  isActive: boolean;       // Aktif mi?
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### notificationHistory

```typescript
{
  title: string;
  body: string;
  type: 'announcement' | 'news';
  contentId?: string;      // Deep linking için
  imageUrl?: string;       // Görsel URL
  sentBy: string;          // Gönderen kullanıcı UID
  targetAudience: 'all' | 'active' | 'branch';
  branchId?: string;       // Şube ID'si
  sentCount: number;       // Başarılı gönderim sayısı
  failedCount: number;     // Başarısız gönderim sayısı
  data?: Record<string, string>;  // Ek veriler
  createdAt: Timestamp;
}
```

---

## Limitler ve Kısıtlamalar

- **Başlık**: Maksimum 100 karakter
- **Mesaj**: Maksimum 500 karakter
- **FCM Multicast**: Maksimum 500 token (otomatik chunking yapılır)
- **Firestore 'in' operatörü**: Maksimum 10 item (otomatik chunking yapılır)
- **Sayfalama**: Maksimum 100 kayıt per sayfa

---

## İletişim ve Destek

Sorularınız için:
- Backend loglarını kontrol edin
- Firebase Console'da FCM durumunu kontrol edin
- Admin panel'de bildirim geçmişini inceleyin

---

**Son Güncelleme:** 2026-01-02
**Versiyon:** 1.0.0

