/**
 * Görsel validasyon fonksiyonları
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Dosya formatını kontrol eder
 */
export const validateImageType = (mimeType: string): ImageValidationResult => {
  if (!mimeType) {
    return { valid: false, error: 'Dosya tipi belirtilmemiş' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Geçersiz dosya formatı. İzin verilen formatlar: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
};

/**
 * Dosya boyutunu kontrol eder
 */
export const validateImageSize = (size: number): ImageValidationResult => {
  if (!size || size <= 0) {
    return { valid: false, error: 'Geçersiz dosya boyutu' };
  }

  if (size > MAX_IMAGE_SIZE) {
    const maxSizeMB = MAX_IMAGE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `Dosya boyutu çok büyük. Maksimum boyut: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
};

/**
 * Dosya adını sanitize eder (güvenlik için)
 */
export const sanitizeFileName = (fileName: string): string => {
  // Dosya adından tehlikeli karakterleri temizle
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255); // Max dosya adı uzunluğu
};

/**
 * Dosya uzantısını kontrol eder
 */
export const validateImageExtension = (fileName: string): ImageValidationResult => {
  if (!fileName) {
    return { valid: false, error: 'Dosya adı belirtilmemiş' };
  }

  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Geçersiz dosya uzantısı. İzin verilen uzantılar: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
};

/**
 * Tüm görsel validasyonlarını yapar
 */
export const validateImage = (
  mimeType: string,
  size: number,
  fileName: string
): ImageValidationResult => {
  // MIME type kontrolü
  const typeValidation = validateImageType(mimeType);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Boyut kontrolü
  const sizeValidation = validateImageSize(size);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Uzantı kontrolü
  const extensionValidation = validateImageExtension(fileName);
  if (!extensionValidation.valid) {
    return extensionValidation;
  }

  return { valid: true };
};

