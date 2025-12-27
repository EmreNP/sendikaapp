/**
 * Ortak kullanılan validasyon fonksiyonları
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Türkiye telefon numarası formatı
  const phoneRegex = /^(\+90|0)?[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
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

