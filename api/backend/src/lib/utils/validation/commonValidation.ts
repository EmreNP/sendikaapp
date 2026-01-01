/**
 * Ortak kullanılan validasyon fonksiyonları
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Türkiye telefon numarası formatı
  // Sabit hat: 02161234567 (11 haneli, 0 ile başlar) veya +902161234567 (13 haneli)
  // Cep telefonu: 05321234567 (11 haneli, 0 ile başlar) veya +905321234567 (13 haneli)
  // Normalize edilmiş format (boşluklar ve tire/parantez gibi karakterler kaldırılmış)
  const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // 0 ile başlayan 11 haneli (sabit hat veya cep)
  // Örn: 02161234567, 05321234567
  if (/^0[0-9]{10}$/.test(normalizedPhone)) {
    return true;
  }
  
  // +90 ile başlayan 13 haneli (sabit hat veya cep)
  // Örn: +902161234567, +905321234567
  if (/^\+90[0-9]{10}$/.test(normalizedPhone)) {
    return true;
  }
  
  return false;
};

export const validateStringLength = (
  value: string,
  fieldName: string,
  min: number = 1,
  max: number = 255
): { valid: boolean; error?: string } => {
  if (!value || value.trim().length < min) {
    return { valid: false, error: `${fieldName} en az ${min} karakter olmalıdır` };
  }
  if (value.length > max) {
    return { valid: false, error: `${fieldName} en fazla ${max} karakter olabilir` };
  }
  return { valid: true };
};

export const validateRequired = (
  value: unknown,
  fieldName: string
): { valid: boolean; error?: string } => {
  if (value === undefined || value === null || value === '') {
    return { valid: false, error: `${fieldName} zorunludur` };
  }
  return { valid: true };
};

