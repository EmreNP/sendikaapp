import { validatePhoneNumber, validateStringLength } from './commonValidation';

export const validateTCKimlikNo = (tcKimlikNo: string): { valid: boolean; error?: string } => {
  // TC Kimlik No 11 haneli olmalı ve sadece rakam içermeli
  if (!/^[0-9]{11}$/.test(tcKimlikNo)) {
    return { valid: false, error: 'TC Kimlik No 11 haneli olmalıdır' };
  }
  
  // TC Kimlik No algoritma kontrolü
  const digits = tcKimlikNo.split('').map(Number);
  const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
  
  if ((sum1 * 7 - sum2) % 10 !== digits[9]) {
    return { valid: false, error: 'Geçersiz TC Kimlik No' };
  }
  
  if ((sum1 + sum2 + digits[9]) % 10 !== digits[10]) {
    return { valid: false, error: 'Geçersiz TC Kimlik No' };
  }
  
  return { valid: true };
};

export const validateAge = (birthDate: string): { valid: boolean; error?: string } => {
  if (!birthDate) {
    return { valid: false, error: 'Doğum tarihi zorunludur' };
  }
  
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) {
    return { valid: false, error: 'Geçersiz tarih formatı' };
  }
  
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) ? age - 1 : age;
  
  if (actualAge < 18) {
    return { valid: false, error: 'En az 18 yaşında olmalısınız' };
  }
  
  if (actualAge > 120) {
    return { valid: false, error: 'Geçersiz doğum tarihi' };
  }
  
  return { valid: true };
};

export const validateName = (name: string, fieldName: string = 'İsim'): { valid: boolean; error?: string } => {
  if (!name || name.trim().length < 2) {
    return { valid: false, error: `${fieldName} en az 2 karakter olmalıdır` };
  }
  
  if (name.length > 50) {
    return { valid: false, error: `${fieldName} en fazla 50 karakter olabilir` };
  }
  
  // Sadece harf, boşluk ve Türkçe karakterler
  if (!/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/.test(name)) {
    return { valid: false, error: `${fieldName} sadece harf içermelidir` };
  }
  
  return { valid: true };
};

export const validateUserPhone = (phone: string): { valid: boolean; error?: string } => {
  if (!phone) {
    return { valid: true }; // Opsiyonel alan
  }
  
  if (!validatePhoneNumber(phone)) {
    return { valid: false, error: 'Geçersiz telefon numarası formatı' };
  }
  
  return { valid: true };
};

// Register details request validasyonu
export interface RegisterDetailsValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

export const validateRegisterDetails = (data: {
  branchId?: string;
  tcKimlikNo?: string;
  phone?: string;
  education?: string;
}): RegisterDetailsValidationResult => {
  const errors: Record<string, string> = {};
  
  if (!data.branchId) {
    errors.branchId = 'Şube ID zorunludur';
  }
  
  if (data.tcKimlikNo) {
    const tcValidation = validateTCKimlikNo(data.tcKimlikNo);
    if (!tcValidation.valid) {
      errors.tcKimlikNo = tcValidation.error || 'Geçersiz TC Kimlik No';
    }
  }
  
  if (data.phone) {
    const phoneValidation = validateUserPhone(data.phone);
    if (!phoneValidation.valid) {
      errors.phone = phoneValidation.error || 'Geçersiz telefon';
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

