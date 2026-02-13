/**
 * App Update Kontrolü
 * 
 * Uygulama sürümünü uzak yapılandırma ile karşılaştırarak
 * zorunlu veya önerilen güncellemeleri kullanıcıya bildirir.
 * 
 * Firestore 'config/app' dokümanından minimum sürüm bilgisini alır.
 * Doküman yapısı:
 * {
 *   minVersion: "1.0.0",          // Zorunlu minimum sürüm
 *   latestVersion: "1.2.0",       // En son sürüm
 *   updateUrl: {
 *     android: "https://play.google.com/store/apps/details?id=com.buyukfuat.sendikaapp",
 *     ios: "https://apps.apple.com/app/id..."
 *   },
 *   maintenanceMode: false,        // Bakım modu
 *   maintenanceMessage: ""         // Bakım mesajı
 * }
 */

import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';

export interface AppVersionConfig {
  minVersion: string;
  latestVersion: string;
  updateUrl?: {
    android?: string;
    ios?: string;
  };
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
}

export interface UpdateCheckResult {
  needsUpdate: boolean;
  isForceUpdate: boolean;
  isMaintenance: boolean;
  currentVersion: string;
  latestVersion: string;
  maintenanceMessage?: string;
  updateUrl?: string;
}

/**
 * Sürüm string'lerini karşılaştırır
 * @returns -1 (a < b), 0 (a == b), 1 (a > b)
 */
const compareVersions = (a: string, b: string): number => {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  const maxLen = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLen; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
};

/**
 * Mevcut uygulama sürümünü alır
 */
const getCurrentVersion = (): string => {
  return Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';
};

/**
 * Platform'a uygun store URL'ini alır
 */
const getStoreUrl = (config: AppVersionConfig): string | undefined => {
  if (!config.updateUrl) return undefined;
  return Platform.OS === 'ios' ? config.updateUrl.ios : config.updateUrl.android;
};

/**
 * Firestore'dan uygulama sürüm yapılandırmasını alır
 */
const fetchVersionConfig = async (): Promise<AppVersionConfig | null> => {
  try {
    const db = getFirestore(getApp());
    const configDoc = await getDoc(doc(db, 'config', 'app'));

    if (configDoc.exists()) {
      return configDoc.data() as AppVersionConfig;
    }
    return null;
  } catch (error) {
    console.warn('Sürüm yapılandırması alınamadı:', error);
    return null;
  }
};

/**
 * Uygulama güncelleme kontrolü yapar
 */
export const checkForUpdate = async (): Promise<UpdateCheckResult> => {
  const currentVersion = getCurrentVersion();

  const defaultResult: UpdateCheckResult = {
    needsUpdate: false,
    isForceUpdate: false,
    isMaintenance: false,
    currentVersion,
    latestVersion: currentVersion,
  };

  try {
    const config = await fetchVersionConfig();
    if (!config) return defaultResult;

    // Bakım modu kontrolü
    if (config.maintenanceMode) {
      return {
        ...defaultResult,
        isMaintenance: true,
        maintenanceMessage: config.maintenanceMessage || 'Uygulama şu anda bakımdadır. Lütfen daha sonra tekrar deneyin.',
        latestVersion: config.latestVersion || currentVersion,
      };
    }

    const storeUrl = getStoreUrl(config);

    // Zorunlu güncelleme kontrolü (mevcut sürüm < minimum sürüm)
    if (config.minVersion && compareVersions(currentVersion, config.minVersion) < 0) {
      return {
        needsUpdate: true,
        isForceUpdate: true,
        isMaintenance: false,
        currentVersion,
        latestVersion: config.latestVersion || config.minVersion,
        updateUrl: storeUrl,
      };
    }

    // Önerilen güncelleme kontrolü (mevcut sürüm < son sürüm)
    if (config.latestVersion && compareVersions(currentVersion, config.latestVersion) < 0) {
      return {
        needsUpdate: true,
        isForceUpdate: false,
        isMaintenance: false,
        currentVersion,
        latestVersion: config.latestVersion,
        updateUrl: storeUrl,
      };
    }

    return {
      ...defaultResult,
      latestVersion: config.latestVersion || currentVersion,
    };
  } catch (error) {
    console.warn('Güncelleme kontrolü başarısız:', error);
    return defaultResult;
  }
};

/**
 * Store sayfasını açar
 */
export const openStoreForUpdate = async (url?: string): Promise<void> => {
  const defaultUrls: Record<string, string> = {
    android: 'https://play.google.com/store/apps/details?id=com.buyukfuat.sendikaapp',
    ios: 'https://apps.apple.com/app/id-henuz-yok', // App Store ID eklenecek
  };

  const targetUrl = url || defaultUrls[Platform.OS] || defaultUrls.android;

  try {
    const canOpen = await Linking.canOpenURL(targetUrl);
    if (canOpen) {
      await Linking.openURL(targetUrl);
    }
  } catch (error) {
    console.warn('Store açılamadı:', error);
  }
};
