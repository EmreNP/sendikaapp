/**
 * Video validasyon fonksiyonları
 */

export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm'];
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

export interface VideoValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Dosya formatını kontrol eder
 */
export const validateVideoType = (mimeType: string): VideoValidationResult => {
  if (!mimeType) {
    return { valid: false, error: 'Dosya tipi belirtilmemiş' };
  }

  if (!ALLOWED_VIDEO_TYPES.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Geçersiz dosya formatı. İzin verilen formatlar: ${ALLOWED_VIDEO_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
};

/**
 * Dosya boyutunu kontrol eder
 */
export const validateVideoSize = (size: number): VideoValidationResult => {
  if (!size || size <= 0) {
    return { valid: false, error: 'Geçersiz dosya boyutu' };
  }

  if (size > MAX_VIDEO_SIZE) {
    const maxSizeMB = MAX_VIDEO_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `Dosya boyutu çok büyük. Maksimum boyut: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
};

/**
 * Dosya uzantısını kontrol eder
 */
export const validateVideoExtension = (fileName: string): VideoValidationResult => {
  if (!fileName) {
    return { valid: false, error: 'Dosya adı belirtilmemiş' };
  }

  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  if (!ALLOWED_VIDEO_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Geçersiz dosya uzantısı. İzin verilen uzantılar: ${ALLOWED_VIDEO_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
};

/**
 * Tüm video validasyonlarını yapar
 */
export const validateVideo = (
  mimeType: string,
  size: number,
  fileName: string
): VideoValidationResult => {
  // MIME type kontrolü
  const typeValidation = validateVideoType(mimeType);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Boyut kontrolü
  const sizeValidation = validateVideoSize(size);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Uzantı kontrolü
  const extensionValidation = validateVideoExtension(fileName);
  if (!extensionValidation.valid) {
    return extensionValidation;
  }

  return { valid: true };
};

