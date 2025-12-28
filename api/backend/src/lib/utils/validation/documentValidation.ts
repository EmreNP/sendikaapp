/**
 * Döküman (PDF) validasyon fonksiyonları
 */

export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf'];
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

export interface DocumentValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Dosya formatını kontrol eder
 */
export const validateDocumentType = (mimeType: string): DocumentValidationResult => {
  if (!mimeType) {
    return { valid: false, error: 'Dosya tipi belirtilmemiş' };
  }

  if (!ALLOWED_DOCUMENT_TYPES.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Geçersiz dosya formatı. İzin verilen format: PDF`,
    };
  }

  return { valid: true };
};

/**
 * Dosya boyutunu kontrol eder
 */
export const validateDocumentSize = (size: number): DocumentValidationResult => {
  if (!size || size <= 0) {
    return { valid: false, error: 'Geçersiz dosya boyutu' };
  }

  if (size > MAX_DOCUMENT_SIZE) {
    const maxSizeMB = MAX_DOCUMENT_SIZE / (1024 * 1024);
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
export const validateDocumentExtension = (fileName: string): DocumentValidationResult => {
  if (!fileName) {
    return { valid: false, error: 'Dosya adı belirtilmemiş' };
  }

  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Geçersiz dosya uzantısı. İzin verilen uzantı: PDF`,
    };
  }

  return { valid: true };
};

/**
 * Tüm döküman validasyonlarını yapar
 */
export const validateDocument = (
  mimeType: string,
  size: number,
  fileName: string
): DocumentValidationResult => {
  // MIME type kontrolü
  const typeValidation = validateDocumentType(mimeType);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Boyut kontrolü
  const sizeValidation = validateDocumentSize(size);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Uzantı kontrolü
  const extensionValidation = validateDocumentExtension(fileName);
  if (!extensionValidation.valid) {
    return extensionValidation;
  }

  return { valid: true };
};

