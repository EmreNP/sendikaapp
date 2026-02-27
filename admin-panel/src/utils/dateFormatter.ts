/**
 * Firestore Timestamp veya Date nesnesini formatlar
 * Desteklenen formatlar:
 * - Firestore Timestamp: { seconds, nanoseconds } veya { _seconds, _nanoseconds }
 * - ISO String: "2024-01-01T00:00:00.000Z"
 * - Date nesnesi
 * - Epoch number (milisaniye)
 * 
 * @param date - Formatlanacak tarih
 * @param includeTime - Saat bilgisi dahil edilsin mi (default: true)
 * @param monthFormat - Ay formatı: 'long' (Ocak), 'short' (Oca), '2-digit' (01), 'numeric' (1) (default: 'long')
 * @returns Formatlanmış tarih string'i veya '-' (geçersiz tarih için)
 */
export function formatDate(
  date: string | number | Date | { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number } | undefined | null,
  includeTime: boolean = true,
  monthFormat: 'long' | 'short' | '2-digit' | 'numeric' = 'long'
): string {
  if (!date && date !== 0) return '-';
  
  let d: Date;
  
  try {
    // Epoch number (milisaniye)
    if (typeof date === 'number') {
      d = new Date(date);
    }
    // Firestore Timestamp formatını kontrol et ({ seconds, nanoseconds } veya { _seconds, _nanoseconds })
    else if (typeof date === 'object' && date !== null && !('getTime' in date) && ('seconds' in date || '_seconds' in date)) {
      const ts = date as { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number };
      const seconds = ts.seconds || ts._seconds || 0;
      const nanoseconds = ts.nanoseconds || ts._nanoseconds || 0;
      d = new Date(seconds * 1000 + nanoseconds / 1000000);
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      return '-';
    }
    
    // Geçerli bir tarih olup olmadığını kontrol et
    if (isNaN(d.getTime())) {
      return '-';
    }
    
    // Tarih formatı
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: monthFormat,
      day: 'numeric',
    };
    
    // Saat bilgisi dahil edilecekse
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return new Intl.DateTimeFormat('tr-TR', options).format(d);
  } catch {
    return '-';
  }
}

/**
 * Tarihi göreli formatta gösterir (örn: "2 saat önce", "3 gün önce")
 * 
 * @param date - Formatlanacak tarih
 * @returns Göreli tarih string'i veya '-' (geçersiz tarih için)
 */
export function formatRelativeDate(
  date: string | Date | { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number } | undefined
): string {
  if (!date) return '-';
  
  let d: Date;
  
  // Firestore Timestamp formatını kontrol et
  if (typeof date === 'object' && !('getTime' in date) && ('seconds' in date || '_seconds' in date)) {
    const ts = date as { seconds?: number; _seconds?: number };
    const seconds = ts.seconds || ts._seconds || 0;
    d = new Date(seconds * 1000);
  } else if (typeof date === 'string') {
    d = new Date(date);
  } else if (date instanceof Date) {
    d = date;
  } else {
    return '-';
  }
  
  // Geçerli bir tarih olup olmadığını kontrol et
  if (isNaN(d.getTime())) {
    return '-';
  }
  
  return formatDate(date);
}

/**
 * Firestore Timestamp | Date | unknown nesnesini güvenli bir şekilde Date'e çevirir.
 * Tüm date rendering işlemlerinde `new Date(val)` yerine bu fonksiyon kullanılmalıdır.
 */
export function toSafeDate(
  val: unknown
): Date {
  if (!val) return new Date(0);
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  const obj = val as Record<string, unknown>;
  if (typeof obj.toDate === 'function') return (obj.toDate as () => Date)();
  const seconds = Number(obj.seconds ?? obj._seconds);
  if (!isNaN(seconds)) return new Date(seconds * 1000);
  return new Date(0);
}
