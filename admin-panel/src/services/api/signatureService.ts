import { apiRequest } from '@/utils/api';

const CACHE_KEY = 'pdf_default_sig_basknsignature';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 saat
const CACHE_TIME_KEY = 'pdf_default_sig_basknsignature_ts';

/**
 * Başkan imzasını Firebase'den çeker.
 * Sonucu localStorage'da 1 saatlik cache olarak tutar;
 * böylece her modal açılışında API çağrısı yapılmaz.
 */
export async function fetchBaskanSignature(): Promise<string | null> {
  // Önce cache'e bak
  const ts = Number(localStorage.getItem(CACHE_TIME_KEY) ?? '0');
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached !== null && Date.now() - ts < CACHE_TTL_MS) {
    return cached || null; // boş string → null (imza silinmiş)
  }

  try {
    const res = await apiRequest<{ dataUrl: string | null }>('/api/settings/signature');
    const dataUrl = res.dataUrl ?? null;

    // Cache'i güncelle
    localStorage.setItem(CACHE_KEY, dataUrl ?? '');
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));

    return dataUrl;
  } catch {
    // Ağ hatası → cache'deki eski değeri dön (varsa)
    return cached || null;
  }
}

/**
 * Başkan imzasını Firebase'e kaydeder ve cache'i günceller.
 * Sadece superadmin çağırabilir (backend tarafında da kontrol edilir).
 */
export async function saveBaskanSignature(dataUrl: string | null): Promise<void> {
  await apiRequest('/api/settings/signature', {
    method: 'PUT',
    body: JSON.stringify({ dataUrl }),
  });

  // Cache'i hemen güncelle
  localStorage.setItem(CACHE_KEY, dataUrl ?? '');
  localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
}

/**
 * Cache'i geçersiz kıl — bir sonraki fetchBaskanSignature çağrısında
 * API'den taze veri çekilir.
 */
export function invalidateBaskanSignatureCache(): void {
  localStorage.removeItem(CACHE_TIME_KEY);
}
