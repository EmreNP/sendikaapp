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
  
  if (!validatePhoneNumber(phone)) {
    return { valid: false, error: 'Geçersiz telefon numarası formatı' };
  }
  
  return { valid: true };
};

export const validateBranchCode = (code: string): { valid: boolean; error?: string } => {
  if (!code) {
    return { valid: true }; // Opsiyonel alan
  }
  
  const lengthValidation = validateStringLength(code, 'Şube kodu', 1, 20);
  if (!lengthValidation.valid) {
    return lengthValidation;
  }
  
  // Şube kodu sadece harf, rakam ve tire/alt çizgi içerebilir
  if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
    return { valid: false, error: 'Şube kodu sadece harf, rakam, tire ve alt çizgi içerebilir' };
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
  code?: string;
  email?: string;
  phone?: string;
}): BranchValidationResult => {
  const errors: Record<string, string> = {};
  
  const nameValidation = validateBranchName(data.name || '');
  if (!nameValidation.valid) {
    errors.name = nameValidation.error || 'Geçersiz şube adı';
  }
  
  if (data.code) {
    const codeValidation = validateBranchCode(data.code);
    if (!codeValidation.valid) {
      errors.code = codeValidation.error || 'Geçersiz şube kodu';
    }
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

