import { validateEmail, validatePhoneNumber, validateStringLength } from './commonValidation';

export const validateBranchName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Şube adı zorunludur' };
  }
  
  const lengthValidation = validateStringLength(name, 'Şube adı', 2, 100);
  if (!lengthValidation.valid) {
    return lengthValidation;
  }
  
  return { valid: true };
};

export const validateBranchEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: true }; // Opsiyonel alan
  }
  
  if (!validateEmail(email)) {
    return { valid: false, error: 'Geçersiz e-posta adresi' };
  }
  
  return { valid: true };
};

export const validateBranchPhone = (phone: string): { valid: boolean; error?: string } => {
  if (!phone) {
    return { valid: true }; // Opsiyonel alan
  }
  
  // Telefon numarasını normalize et (boşlukları ve özel karakterleri kaldır)
  const normalizedPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
  
  if (!normalizedPhone) {
    return { valid: true }; // Sadece boşluklardan oluşuyorsa opsiyonel kabul et
  }
  
  // Karakter sayısını kontrol et
  if (normalizedPhone.length < 11 || normalizedPhone.length > 13) {
    return { 
      valid: false, 
      error: `Telefon numarası ${normalizedPhone.length} karakter. Sabit hat için 11 karakter (02161234567) veya 13 karakter (+902161234567) olmalıdır.` 
    };
  }
  
  if (!validatePhoneNumber(normalizedPhone)) {
    return { 
      valid: false, 
      error: `Geçersiz telefon numarası formatı. Sabit hat için: 02161234567 (11 karakter) veya +902161234567 (13 karakter). Girdiğiniz: ${normalizedPhone}` 
    };
  }
  
  return { valid: true };
};

// Create/Update branch request validasyonu
export interface BranchValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

export const validateCreateBranch = (data: {
  name?: string;
  email?: string;
  phone?: string;
}): BranchValidationResult => {
  const errors: Record<string, string> = {};
  
  const nameValidation = validateBranchName(data.name || '');
  if (!nameValidation.valid) {
    errors.name = nameValidation.error || 'Geçersiz şube adı';
  }
  
  if (data.email) {
    const emailValidation = validateBranchEmail(data.email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.error || 'Geçersiz e-posta';
    }
  }
  
  if (data.phone) {
    const phoneValidation = validateBranchPhone(data.phone);
    if (!phoneValidation.valid) {
      errors.phone = phoneValidation.error || 'Geçersiz telefon';
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

