// Firebase Configuration
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// @ts-expect-error — Metro bundler react-native entry point'u çözümler; tarayıcı type'larında export yok
import { getReactNativePersistence } from 'firebase/auth';
import { SecureAuthPersistence } from '../services/secureAuthPersistence';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth with SecureStore-backed persistence.
// Auth token'ları Android Keystore / iOS Keychain ile şifrelenir.
// SecureStore kullanılamazsa otomatik AsyncStorage fallback yapılır.
// Mevcut AsyncStorage verisi ilk okumada SecureStore'a migrate edilir.
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(SecureAuthPersistence),
  });
} catch {
  // initializeAuth zaten çağrıldıysa (hot-reload vb.) mevcut instance'ı döndür
  auth = getAuth(app);
}

export { auth };
export default app;
