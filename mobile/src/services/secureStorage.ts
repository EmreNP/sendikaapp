/**
 * secureStorage.ts — Hassas verilerin güvenli depolanması.
 *
 * expo-secure-store kullanarak veriler Android Keystore / iOS Keychain
 * üzerinden şifrelenir. AsyncStorage'a fallback YAPILMAZ; eğer SecureStore
 * kullanılamıyorsa hata fırlatılır.
 *
 * Kullanım:
 *   import { secureStorage } from '../services/secureStorage';
 *   await secureStorage.setItem('auth_token', token);
 *   const token = await secureStorage.getItem('auth_token');
 *   await secureStorage.removeItem('auth_token');
 */
import * as SecureStore from 'expo-secure-store';

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  // iOS: Yalnızca cihaz kilitli değilken erişilebilir, yedekleme/transfer ile taşınmaz
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secureStorage = {
  /**
   * Güvenli depolamadan bir değer okur.
   * @returns Değer veya bulunamazsa null.
   * @throws SecureStore erişim hatası durumunda.
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
    } catch (error) {
      throw new Error(
        `[SecureStorage] '${key}' okunamadı: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  /**
   * Güvenli depolamaya bir değer yazar.
   * @throws SecureStore erişim hatası durumunda.
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
    } catch (error) {
      throw new Error(
        `[SecureStorage] '${key}' yazılamadı: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  /**
   * Güvenli depolamadan bir değeri siler.
   * @throws SecureStore erişim hatası durumunda.
   */
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
    } catch (error) {
      throw new Error(
        `[SecureStorage] '${key}' silinemedi: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
};

export default secureStorage;
