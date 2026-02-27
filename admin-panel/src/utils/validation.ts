/**
 * Admin Panel — Input Validation Utilities
 *
 * TC Kimlik No, telefon, e-posta ve diğer kullanıcı alanları için
 * istemci tarafı doğrulama fonksiyonları.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ─── TC Kimlik No Doğrulama ─────────────────────────────────────────────────
// Türkiye Cumhuriyeti Kimlik Numarası 11 haneli, matematiksel checksum kontrolü olan bir numaradır.
// Algoritma:
//   1) Tam olarak 11 haneli rakamlardan oluşmalı
//   2) İlk hane 0 olamaz
//   3) İlk 10 hanenin toplamı mod 10 = 11. hane (C2)
//   4) (1,3,5,7,9. haneler toplamı × 7 − 2,4,6,8. haneler toplamı) mod 10 = 10. hane (C1)

export function validateTCKimlikNo(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'TC Kimlik No zorunludur' };
  }

  const tc = value.trim();

  // Sadece rakam kontrolü
  if (!/^\d{11}$/.test(tc)) {
    return { valid: false, error: 'TC Kimlik No 11 haneli rakamlardan oluşmalıdır' };
  }

  // İlk hane 0 olamaz
  if (tc[0] === '0') {
    return { valid: false, error: 'TC Kimlik No 0 ile başlayamaz' };
  }

  const digits = tc.split('').map(Number);

  // C1 kontrolü (10. hane)
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const c1 = (oddSum * 7 - evenSum) % 10;
  if (c1 < 0 ? c1 + 10 : c1 !== digits[9]) {
    return { valid: false, error: 'Geçersiz TC Kimlik No' };
  }

  // C2 kontrolü (11. hane)
  const sumFirst10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sumFirst10 % 10 !== digits[10]) {
    return { valid: false, error: 'Geçersiz TC Kimlik No' };
  }

  return { valid: true };
}

// ─── Telefon Numarası Doğrulama ─────────────────────────────────────────────
// Türkiye telefon numarası: 05XX XXX XX XX (10 veya 11 hane, başında 0 ile veya 5 ile)

export function validatePhoneNumber(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Telefon numarası zorunludur' };
  }

  const phone = value.trim().replace(/\s+/g, '');

  // Sadece rakam kontrolü
  if (!/^\d+$/.test(phone)) {
    return { valid: false, error: 'Telefon numarası sadece rakamlardan oluşmalıdır' };
  }

  // 10 hane (5XX ile başlayan) veya 11 hane (05XX ile başlayan)
  if (phone.length === 10) {
    if (!phone.startsWith('5')) {
      return { valid: false, error: 'Telefon numarası 5 ile başlamalıdır (5XXXXXXXXX)' };
    }
  } else if (phone.length === 11) {
    if (!phone.startsWith('05')) {
      return { valid: false, error: 'Telefon numarası 05 ile başlamalıdır (05XXXXXXXXX)' };
    }
  } else {
    return { valid: false, error: 'Telefon numarası 10 veya 11 haneli olmalıdır' };
  }

  return { valid: true };
}

// ─── E-posta Doğrulama ──────────────────────────────────────────────────────

export function validateEmail(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'E-posta adresi zorunludur' };
  }

  const email = value.trim().toLowerCase();

  // RFC 5322 basitleştirilmiş regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Geçersiz e-posta formatı' };
  }

  // Uzunluk kontrolü
  if (email.length > 254) {
    return { valid: false, error: 'E-posta adresi çok uzun' };
  }

  return { valid: true };
}

// ─── Parola Gücü Doğrulama ──────────────────────────────────────────────────

export function validatePassword(value: string): ValidationResult {
  // Boş bırakılabilir (admin tarafından oluşturulanlarda varsayılan kullanılır)
  if (!value || value.trim() === '') {
    return { valid: true };
  }

  if (value.length < 6) {
    return { valid: false, error: 'Parola en az 6 karakter olmalıdır' };
  }

  if (value.length > 128) {
    return { valid: false, error: 'Parola en fazla 128 karakter olabilir' };
  }

  return { valid: true };
}

// ─── İsim Doğrulama (HTML injection koruması) ──────────────────────────────

export function validateName(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { valid: false, error: `${fieldName} zorunludur` };
  }

  const trimmed = value.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} en az 2 karakter olmalıdır` };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: `${fieldName} en fazla 50 karakter olabilir` };
  }

  // HTML/script injection kontrolü
  if (/<[^>]*>/.test(trimmed) || /[<>"'`;]/.test(trimmed)) {
    return { valid: false, error: `${fieldName} özel karakterler içeremez` };
  }

  return { valid: true };
}

// ─── Toplu Doğrulama Helper ─────────────────────────────────────────────────

export interface BulkValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Temel kayıt formu alanlarını toplu doğrular.
 */
export function validateBasicRegistrationForm(data: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
}): BulkValidationResult {
  const errors: Record<string, string> = {};

  const firstNameResult = validateName(data.firstName, 'Ad');
  if (!firstNameResult.valid) errors.firstName = firstNameResult.error!;

  const lastNameResult = validateName(data.lastName, 'Soyad');
  if (!lastNameResult.valid) errors.lastName = lastNameResult.error!;

  const phoneResult = validatePhoneNumber(data.phone);
  if (!phoneResult.valid) errors.phone = phoneResult.error!;

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) errors.email = emailResult.error!;

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.valid) errors.password = passwordResult.error!;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Detaylı kayıt formu alanlarını toplu doğrular.
 */
export function validateDetailRegistrationForm(data: {
  tcKimlikNo: string;
  fatherName: string;
  motherName: string;
  birthPlace: string;
}): BulkValidationResult {
  const errors: Record<string, string> = {};

  const tcResult = validateTCKimlikNo(data.tcKimlikNo);
  if (!tcResult.valid) errors.tcKimlikNo = tcResult.error!;

  const fatherResult = validateName(data.fatherName, 'Baba Adı');
  if (!fatherResult.valid) errors.fatherName = fatherResult.error!;

  const motherResult = validateName(data.motherName, 'Anne Adı');
  if (!motherResult.valid) errors.motherName = motherResult.error!;

  const birthPlaceResult = validateName(data.birthPlace, 'Doğum Yeri');
  if (!birthPlaceResult.valid) errors.birthPlace = birthPlaceResult.error!;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
