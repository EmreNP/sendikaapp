/**
 * Firebase Auth ve API hata mesajlarını kullanıcı dostu Türkçe mesajlara çevirir.
 */

// Firebase Auth hata kodları -> Türkçe mesajlar
const FIREBASE_AUTH_ERROR_MAP: Record<string, string> = {
  // Giriş hataları
  'auth/invalid-email': 'Geçersiz e-posta adresi. Lütfen doğru bir e-posta adresi girin.',
  'auth/user-disabled': 'Bu hesap devre dışı bırakılmıştır. Lütfen yönetici ile iletişime geçin.',
  'auth/user-not-found': 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.',
  'auth/wrong-password': 'Şifre yanlış. Lütfen tekrar deneyin.',
  'auth/invalid-credential': 'E-posta adresi veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.',
  'auth/invalid-login-credentials': 'E-posta adresi veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.',

  // Kayıt hataları
  'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanılmaktadır. Lütfen giriş yapın veya farklı bir e-posta kullanın.',
  'auth/operation-not-allowed': 'Bu işlem şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
  'auth/weak-password': 'Şifre çok zayıf. Lütfen en az 6 karakterli, daha güçlü bir şifre belirleyin.',

  // Token / oturum hataları
  'auth/expired-action-code': 'İşlem süresi dolmuş. Lütfen tekrar deneyin.',
  'auth/invalid-action-code': 'Geçersiz işlem kodu. Lütfen tekrar deneyin.',
  'auth/requires-recent-login': 'Bu işlem için tekrar giriş yapmanız gerekmektedir.',
  'auth/id-token-expired': 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.',
  'auth/id-token-revoked': 'Oturumunuz geçersiz kılınmış. Lütfen tekrar giriş yapın.',

  // Rate limiting
  'auth/too-many-requests': 'Çok fazla başarısız deneme yapıldı. Lütfen bir süre bekleyip tekrar deneyin.',

  // Ağ hataları
  'auth/network-request-failed': 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',

  // Diğer
  'auth/popup-closed-by-user': 'Giriş işlemi iptal edildi.',
  'auth/cancelled-popup-request': 'Giriş işlemi iptal edildi.',
  'auth/account-exists-with-different-credential': 'Bu e-posta adresi farklı bir giriş yöntemiyle kayıtlıdır.',
  'auth/credential-already-in-use': 'Bu kimlik bilgisi zaten başka bir hesapla ilişkili.',
  'auth/custom-token-mismatch': 'Kimlik doğrulama hatası oluştu. Lütfen tekrar deneyin.',
  'auth/invalid-custom-token': 'Kimlik doğrulama hatası oluştu. Lütfen tekrar deneyin.',
};

// Ağ / genel hata mesajları
const NETWORK_ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /network/i, message: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.' },
  { pattern: /timeout/i, message: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.' },
  { pattern: /fetch/i, message: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' },
  { pattern: /abort/i, message: 'İstek iptal edildi. Lütfen tekrar deneyin.' },
  { pattern: /JSON Parse error/i, message: 'Sunucudan beklenmeyen bir yanıt alındı. Lütfen daha sonra tekrar deneyin.' },
  { pattern: /Unexpected response type/i, message: 'Sunucudan beklenmeyen bir yanıt alındı. Lütfen daha sonra tekrar deneyin.' },
];

/**
 * Firebase Auth hata kodunu Türkçe mesaja çevirir.
 * Firebase hataları genellikle şu formatlarda gelir:
 * - error.code = "auth/wrong-password"
 * - error.message = "Firebase: Error (auth/wrong-password)."
 * - error.message = "Firebase: Password should be at least 6 characters (auth/weak-password)."
 */
function extractFirebaseErrorCode(error: any): string | null {
  // Doğrudan error.code varsa
  if (error?.code && typeof error.code === 'string' && error.code.startsWith('auth/')) {
    return error.code;
  }

  // error.message içinden auth/ kodunu çıkar
  const message = error?.message || String(error);
  const match = message.match(/\(auth\/([^)]+)\)/);
  if (match) {
    return `auth/${match[1]}`;
  }

  return null;
}

/**
 * Herhangi bir hatayı kullanıcı dostu Türkçe mesaja çevirir.
 * Firebase Auth, ağ hataları ve genel API hatalarını destekler.
 */
export function getUserFriendlyErrorMessage(error: any, fallbackMessage?: string): string {
  // 1. Firebase Auth hata kodu kontrolü
  const firebaseCode = extractFirebaseErrorCode(error);
  if (firebaseCode && FIREBASE_AUTH_ERROR_MAP[firebaseCode]) {
    return FIREBASE_AUTH_ERROR_MAP[firebaseCode];
  }

  // 2. Error mesajını al
  const rawMessage = error?.message || String(error);

  // 3. Ağ hatası pattern kontrolü
  for (const { pattern, message } of NETWORK_ERROR_PATTERNS) {
    if (pattern.test(rawMessage)) {
      return message;
    }
  }

  // 4. Backend'den gelen Türkçe mesaj varsa (zaten anlamlıysa) olduğu gibi döndür
  // Eğer mesaj "Firebase:" ile başlıyorsa veya İngilizce ise, genel mesaj döndür
  if (rawMessage.startsWith('Firebase:') || rawMessage.includes('auth/')) {
    return fallbackMessage || 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }

  // 5. Backend'den gelen mesaj zaten anlamlıysa onu kullan
  if (rawMessage && rawMessage !== '[object Object]') {
    return rawMessage;
  }

  return fallbackMessage || 'Bir hata oluştu. Lütfen tekrar deneyin.';
}
