// Offline Cache Service - News & Announcements caching
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const CACHE_KEYS = {
  NEWS: '@sendika_cache_news',
  ANNOUNCEMENTS: '@sendika_cache_announcements',
  HOME_DATA: '@sendika_cache_home',
  CACHE_TIMESTAMPS: '@sendika_cache_timestamps',
};

// Cache validity: 30 minutes
const CACHE_TTL = 30 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Save data to cache
 */
async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    logger.warn('Cache write failed:', error);
  }
}

/**
 * Get data from cache, returns null if expired or missing
 */
async function getCache<T>(key: string, ignoreExpiry = false): Promise<T | null> {
  try {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return null;
    
    const entry: CacheEntry<T> = JSON.parse(stored);
    
    // Check TTL (skip check if ignoreExpiry — used when offline)
    if (!ignoreExpiry && Date.now() - entry.timestamp > CACHE_TTL) {
      return null;
    }
    
    return entry.data;
  } catch (error) {
    logger.warn('Cache read failed:', error);
    return null;
  }
}

// ---- Public API ----

export async function cacheNews(data: any): Promise<void> {
  await setCache(CACHE_KEYS.NEWS, data);
}

/**
 * Get cached news.
 * @param isOnline - true when network is available; TTL is enforced only when online.
 */
export async function getCachedNews(isOnline = false): Promise<any | null> {
  return getCache(CACHE_KEYS.NEWS, !isOnline); // Online: respect TTL, Offline: ignore expiry
}

export async function cacheAnnouncements(data: any): Promise<void> {
  await setCache(CACHE_KEYS.ANNOUNCEMENTS, data);
}

/**
 * Get cached announcements.
 * @param isOnline - true when network is available; TTL is enforced only when online.
 */
export async function getCachedAnnouncements(isOnline = false): Promise<any | null> {
  return getCache(CACHE_KEYS.ANNOUNCEMENTS, !isOnline); // Online: respect TTL, Offline: ignore expiry
}

export async function cacheHomeData(data: any): Promise<void> {
  await setCache(CACHE_KEYS.HOME_DATA, data);
}

/**
 * Get cached home data.
 * @param isOnline - true when network is available; TTL is enforced only when online.
 */
export async function getCachedHomeData(isOnline = false): Promise<any | null> {
  return getCache(CACHE_KEYS.HOME_DATA, !isOnline); // Online: respect TTL, Offline: ignore expiry
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
  } catch (error) {
    logger.warn('Cache clear failed:', error);
  }
}
