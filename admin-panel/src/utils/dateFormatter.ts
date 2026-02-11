/**
 * Firestore Timestamp veya Date nesnesini formatlar
 * Desteklenen formatlar:
 * - Firestore Timestamp: { seconds, nanoseconds } veya { _seconds, _nanoseconds }
 * - ISO String: "2024-01-01T00:00:00.000Z"
 * - Date nesnesi
 * 
 * @param date - Formatlanacak tarih
 * @param includeTime - Saat bilgisi dahil edilsin mi (default: true)
 * @returns Formatlanmış tarih string'i veya '-' (geçersiz tarih için)
 */
export function formatDate(
  date: string | Date | { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number } | undefined,
  includeTime: boolean = true
): string {
  if (!date) return '-';
  
  let d: Date;
  
  // Firestore Timestamp formatını kontrol et ({ seconds, nanoseconds } veya { _seconds, _nanoseconds })
  if (typeof date === 'object' && !('getTime' in date) && ('seconds' in date || '_seconds' in date)) {
    const seconds = (date as any).seconds || (date as any)._seconds || 0;
    const nanoseconds = (date as any).nanoseconds || (date as any)._nanoseconds || 0;
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
    month: 'long',
    day: 'numeric',
  };
  
  // Saat bilgisi dahil edilecekse
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Intl.DateTimeFormat('tr-TR', options).format(d);
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
    const seconds = (date as any).seconds || (date as any)._seconds || 0;
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
