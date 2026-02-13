/**
 * TC Kimlik No Doğrulama
 * 
 * TC Kimlik numarası 11 haneli bir sayıdır ve belirli bir algoritmaya
 * göre doğrulanır. Bu dosya, backend'deki aynı algoritmayı mobil tarafta
 * da uygular.
 */

export const validateTCKimlikNo = (tcKimlikNo: string): { valid: boolean; error?: string } => {
  // TC Kimlik No 11 haneli olmalı ve sadece rakam içermeli
  if (!/^[0-9]{11}$/.test(tcKimlikNo)) {
    return { valid: false, error: 'TC Kimlik No 11 haneli olmalıdır' };
  }

  // İlk hane 0 olamaz
  if (tcKimlikNo[0] === '0') {
    return { valid: false, error: 'Geçersiz TC Kimlik No' };
  }

  // TC Kimlik No algoritma kontrolü
  const digits = tcKimlikNo.split('').map(Number);

  // 1, 3, 5, 7, 9. hanelerin toplamı
  const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  // 2, 4, 6, 8. hanelerin toplamı
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];

  // 10. hane kontrolü: (sum1 * 7 - sum2) % 10 === 10. hane
  if ((sum1 * 7 - sum2) % 10 !== digits[9]) {
    return { valid: false, error: 'Geçersiz TC Kimlik No' };
  }

  // 11. hane kontrolü: (sum1 + sum2 + 10. hane) % 10 === 11. hane
  if ((sum1 + sum2 + digits[9]) % 10 !== digits[10]) {
    return { valid: false, error: 'Geçersiz TC Kimlik No' };
  }

  return { valid: true };
};
