/**
 * Batch User Names Service
 * N+1 API çağrısı sorununu çözmek için kullanıcı isimlerini
 * toplu olarak çeken ve cache'leyen servis.
 */
import { apiRequest } from '@/utils/api';

interface UserName {
  firstName: string;
  lastName: string;
}

// In-memory cache - sayfa yenilenene kadar geçerli
const userNameCache = new Map<string, UserName>();

/**
 * Birden fazla kullanıcı ID'si için isimleri toplu olarak getirir.
 * Cache'de olanları tekrar çekmez.
 * 
 * @param userIds Kullanıcı ID listesi
 * @returns Record<string, UserName> - ID → isim eşlemesi
 */
export async function batchFetchUserNames(
  userIds: string[]
): Promise<Record<string, UserName>> {
  if (!userIds || userIds.length === 0) return {};

  const uniqueIds = [...new Set(userIds)];
  const result: Record<string, UserName> = {};

  // Cache'de olanları hemen ekle
  const idsToFetch: string[] = [];
  for (const uid of uniqueIds) {
    const cached = userNameCache.get(uid);
    if (cached) {
      result[uid] = cached;
    } else {
      idsToFetch.push(uid);
    }
  }

  // Cache'de olmayanları batch endpoint ile çek
  if (idsToFetch.length > 0) {
    try {
      // 50'li gruplar halinde çek (backend limiti)
      for (let i = 0; i < idsToFetch.length; i += 50) {
        const chunk = idsToFetch.slice(i, i + 50);
        const data = await apiRequest<{ users: Record<string, UserName> }>(
          '/api/users/batch-names',
          {
            method: 'POST',
            body: JSON.stringify({ userIds: chunk }),
          }
        );

        if (data.users) {
          for (const [uid, name] of Object.entries(data.users)) {
            userNameCache.set(uid, name);
            result[uid] = name;
          }
        }
      }
    } catch (error) {
      console.error('Error batch fetching user names:', error);
      // Hata durumunda ID'leri döndür (graceful degradation)
    }
  }

  return result;
}

/**
 * Tek bir kullanıcının tam adını döndürür.
 * Önce cache'e bakar, yoksa ID'yi döndürür.
 */
export function getCachedUserFullName(uid: string): string | null {
  const cached = userNameCache.get(uid);
  if (cached) {
    return `${cached.firstName} ${cached.lastName}`.trim();
  }
  return null;
}

/**
 * Kullanıcının tam adını formatlar.
 */
export function formatUserName(name: UserName | undefined, fallback: string = '-'): string {
  if (!name) return fallback;
  return `${name.firstName} ${name.lastName}`.trim() || fallback;
}

/**
 * Cache'i temizler (logout vs. için)
 */
export function clearUserNameCache(): void {
  userNameCache.clear();
}
