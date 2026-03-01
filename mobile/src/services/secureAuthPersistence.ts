/**
 * secureAuthPersistence.ts — Firebase Auth için şifreli persistence adapter.
 *
 * Firebase Auth session token'larını expo-secure-store ile Android Keystore /
 * iOS Keychain üzerinden şifreli saklar. SecureStore kullanılamazsa
 * AsyncStorage'a otomatik fallback yapar.
 *
 * İlk çalıştırmada mevcut AsyncStorage verisi otomatik olarak SecureStore'a
 * migrate edilir — kullanıcı yeniden giriş yapmak zorunda kalmaz.
 *
 * Firebase'in getReactNativePersistence() beklediği ReactNativeAsyncStorage
 * arayüzünü (getItem / setItem / removeItem) uygular.
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

/**
 * AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY — cihaz ilk kez açıldıktan sonra
 * arka planda da erişilebilir. Firebase arka planda token yenileyebildiği
 * için WHEN_UNLOCKED yerine bu seviye tercih edildi.
 */
const AUTH_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/** SecureStore erişilebilirlik durumu (ilk çağrıda test edilir) */
let _secureStoreAvailable: boolean | null = null;

/**
 * SecureStore'un çalışıp çalışmadığını test eder.
 * Bazı release build senaryolarında native modül yüklenemeyebilir.
 */
async function isSecureStoreAvailable(): Promise<boolean> {
  if (_secureStoreAvailable !== null) return _secureStoreAvailable;

  try {
    const testKey = '__firebase_secure_test__';
    await SecureStore.setItemAsync(testKey, '1', AUTH_STORE_OPTIONS);
    await SecureStore.deleteItemAsync(testKey, AUTH_STORE_OPTIONS);
    _secureStoreAvailable = true;
  } catch {
    _secureStoreAvailable = false;
    logger.warn(
      '[SecureAuthPersistence] SecureStore kullanılamıyor, AsyncStorage fallback aktif'
    );
  }

  return _secureStoreAvailable;
}

/**
 * Firebase Auth persistence adapter.
 * ReactNativeAsyncStorage arayüzünü uygular:
 *   getItem(key)   → Promise<string | null>
 *   setItem(key,v) → Promise<void>
 *   removeItem(key) → Promise<void>
 */
export const SecureAuthPersistence = {
  async getItem(key: string): Promise<string | null> {
    if (await isSecureStoreAvailable()) {
      try {
        // Önce SecureStore'da ara
        const secureValue = await SecureStore.getItemAsync(key, AUTH_STORE_OPTIONS);
        if (secureValue !== null) return secureValue;

        // SecureStore'da yok — AsyncStorage'dan migration dene
        const asyncValue = await AsyncStorage.getItem(key);
        if (asyncValue !== null) {
          logger.info(
            `[SecureAuthPersistence] Auth verisi AsyncStorage → SecureStore'a migrate ediliyor`
          );
          await SecureStore.setItemAsync(key, asyncValue, AUTH_STORE_OPTIONS);
          await AsyncStorage.removeItem(key);
          return asyncValue;
        }

        return null;
      } catch (error) {
        logger.warn(
          `[SecureAuthPersistence] SecureStore okuma hatası, AsyncStorage fallback: ${error}`
        );
        _secureStoreAvailable = false;
      }
    }

    // Fallback: AsyncStorage
    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (await isSecureStoreAvailable()) {
      try {
        await SecureStore.setItemAsync(key, value, AUTH_STORE_OPTIONS);
        // Eski AsyncStorage verisini temizle (migration sonrası artık)
        try {
          await AsyncStorage.removeItem(key);
        } catch {
          /* migration temizlik hatası önemsiz */
        }
        return;
      } catch (error) {
        logger.warn(
          `[SecureAuthPersistence] SecureStore yazma hatası, AsyncStorage fallback: ${error}`
        );
        _secureStoreAvailable = false;
      }
    }

    // Fallback: AsyncStorage
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    // Her iki store'dan da sil — migration geçiş döneminde
    // eski veri kalmaması için
    const errors: Error[] = [];

    try {
      await SecureStore.deleteItemAsync(key, AUTH_STORE_OPTIONS);
    } catch (e) {
      errors.push(e instanceof Error ? e : new Error(String(e)));
    }

    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      errors.push(e instanceof Error ? e : new Error(String(e)));
    }

    // Her iki store da başarısız olduysa logla (ama fırlatma — Firebase bunu tolere eder)
    if (errors.length === 2) {
      logger.warn(`[SecureAuthPersistence] '${key}' iki store'dan da silinemedi`);
    }
  },
};
