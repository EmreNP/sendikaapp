/**
 * Magic Byte (Dosya İmzası) Doğrulaması
 * 
 * Dosya içeriğinin gerçek formatını, başlangıç byte'larını (magic bytes)
 * kontrol ederek doğrular. Bu sayede sahte MIME type ile yüklenen
 * zararlı dosyalar (malware) tespit edilir.
 *
 * MIME type ve uzantı kontrolü kolayca atlatılabilir (rename + Content-Type header),
 * ancak dosya imzası dosyanın gerçek formatını gösterir.
 */

export interface MagicByteValidationResult {
  valid: boolean;
  detectedType?: string;
  error?: string;
}

/**
 * Bilinen dosya formatlarının magic byte imzaları.
 * Her format için byte offset'i ve beklenen byte dizisi tanımlıdır.
 */
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
  // Görsel formatları
  'image/jpeg': [
    { offset: 0, bytes: [0xFF, 0xD8, 0xFF] },
  ],
  'image/png': [
    { offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  ],
  'image/webp': [
    // RIFF....WEBP
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    // 4 byte atlama (dosya boyutu), sonra WEBP
  ],
  'image/gif': [
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8 (GIF87a veya GIF89a)
  ],

  // Video formatları
  'video/mp4': [
    // ISO Base Media: ....ftyp
    { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
  ],
  'video/webm': [
    // EBML header (Matroska/WebM)
    { offset: 0, bytes: [0x1A, 0x45, 0xDF, 0xA3] },
  ],

  // Döküman formatları
  'application/pdf': [
    { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  ],
};

/**
 * WebP formatı için özel kontrol.
 * RIFF container + WEBP identifier (offset 8-11)
 */
function isWebP(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  // RIFF header
  const isRIFF = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  // WEBP identifier at offset 8
  const isWEBP = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  return isRIFF && isWEBP;
}

/**
 * Buffer'ın belirli bir offset'ten itibaren beklenen byte'larla eşleşip eşleşmediğini kontrol eder.
 */
function matchesSignature(buffer: Buffer, offset: number, expected: number[]): boolean {
  if (buffer.length < offset + expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (buffer[offset + i] !== expected[i]) return false;
  }
  return true;
}

/**
 * Buffer'dan gerçek dosya tipini tespit eder.
 */
function detectFileType(buffer: Buffer): string | null {
  // WebP özel kontrolü (RIFF container)
  if (isWebP(buffer)) return 'image/webp';

  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    if (mimeType === 'image/webp') continue; // WebP yukarıda kontrol edildi
    for (const sig of signatures) {
      if (matchesSignature(buffer, sig.offset, sig.bytes)) {
        return mimeType;
      }
    }
  }

  return null;
}

/**
 * MIME type → izin verilen gerçek formatlar eşlemesi.
 * Örneğin image/jpg aslında image/jpeg'dir.
 */
const MIME_EQUIVALENTS: Record<string, string[]> = {
  'image/jpeg': ['image/jpeg', 'image/jpg'],
  'image/jpg': ['image/jpeg', 'image/jpg'],
  'image/png': ['image/png'],
  'image/webp': ['image/webp'],
  'image/gif': ['image/gif'],
  'video/mp4': ['video/mp4'],
  'video/webm': ['video/webm'],
  'application/pdf': ['application/pdf'],
};

/**
 * Dosya içeriğinin beyan edilen MIME type ile uyumlu olup olmadığını doğrular.
 *
 * @param buffer  Dosya içeriğinin ilk N byte'ı (en az 12 byte önerilir)
 * @param claimedMimeType  HTTP Content-Type / FormData'dan gelen MIME type
 * @returns Doğrulama sonucu
 */
export function validateMagicBytes(
  buffer: Buffer,
  claimedMimeType: string,
): MagicByteValidationResult {
  if (!buffer || buffer.length < 4) {
    return {
      valid: false,
      error: 'Dosya içeriği doğrulanamadı: dosya çok küçük',
    };
  }

  const detectedType = detectFileType(buffer);

  if (!detectedType) {
    // Tanınmayan dosya formatı — güvenlik açısından reddet
    return {
      valid: false,
      error: 'Dosya formatı tanınamadı. Lütfen desteklenen bir dosya formatı yükleyin.',
    };
  }

  // Beyan edilen MIME type ile gerçek format eşleşiyor mu?
  const normalizedClaimed = claimedMimeType.toLowerCase().trim();
  const allowedTypes = MIME_EQUIVALENTS[normalizedClaimed] || [normalizedClaimed];

  if (!allowedTypes.includes(detectedType)) {
    return {
      valid: false,
      detectedType,
      error: `Dosya içeriği beyan edilen formatla uyuşmuyor. Beyan edilen: ${normalizedClaimed}, Tespit edilen: ${detectedType}`,
    };
  }

  return {
    valid: true,
    detectedType,
  };
}
