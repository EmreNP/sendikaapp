import { validateEmail } from './commonValidation';

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 6) {
    return { valid: false, error: 'Şifre en az 6 karakter olmalıdır' };
  }
  
  return { valid: true };
};

export const validateAuthEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: 'E-posta adresi zorunludur' };
  }
  
  if (!validateEmail(email)) {
    return { valid: false, error: 'Geçersiz e-posta adresi' };
  }
  
  return { valid: true };
};

// Register basic request validasyonu
export interface RegisterBasicValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

export const validateRegisterBasic = (data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  birthDate?: string;
  gender?: string;
}): RegisterBasicValidationResult => {
  const errors: Record<string, string> = {};
  
  if (!data.firstName || data.firstName.trim() === '') {
    errors.firstName = 'Ad zorunludur';
  }
  
  if (!data.lastName || data.lastName.trim() === '') {
    errors.lastName = 'Soyad zorunludur';
  }
  
  const emailValidation = validateAuthEmail(data.email || '');
  if (!emailValidation.valid) {
    errors.email = emailValidation.error || 'Geçersiz e-posta';
  }
  
  const passwordValidation = validatePassword(data.password || '');
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error || 'Geçersiz şifre';
  }
  
  if (!data.birthDate) {
    errors.birthDate = 'Doğum tarihi zorunludur';
  }
  
  if (!data.gender || (data.gender !== 'male' && data.gender !== 'female')) {
    errors.gender = 'Cinsiyet zorunludur (male veya female)';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

