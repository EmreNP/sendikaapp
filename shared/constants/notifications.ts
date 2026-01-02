/**
 * Notification System Constants
 * Bildirim sistemi için constant'lar
 */

// Device Type - Cihaz tipi
export type DeviceType = 'ios' | 'android';

export const DEVICE_TYPE = {
  IOS: 'ios' as DeviceType,
  ANDROID: 'android' as DeviceType,
} as const;

// Notification Type - Bildirim içerik tipi
export type NotificationType = 'announcement' | 'news';

export const NOTIFICATION_TYPE = {
  ANNOUNCEMENT: 'announcement' as NotificationType,
  NEWS: 'news' as NotificationType,
} as const;

// Target Audience - Hedef kitle
export type TargetAudience = 'all' | 'active' | 'branch';

export const TARGET_AUDIENCE = {
  ALL: 'all' as TargetAudience,
  ACTIVE: 'active' as TargetAudience,
  BRANCH: 'branch' as TargetAudience,
} as const;

// Response Codes - API response kodları
export const NOTIFICATION_RESPONSE_CODE = {
  TOKEN_REGISTERED: 'TOKEN_REGISTERED',
  TOKEN_DELETED: 'TOKEN_DELETED',
  TOKEN_UPDATED: 'TOKEN_UPDATED',
  NOTIFICATION_SENT: 'NOTIFICATION_SENT',
  NOTIFICATION_FAILED: 'NOTIFICATION_FAILED',
} as const;

export type NotificationResponseCode = typeof NOTIFICATION_RESPONSE_CODE[keyof typeof NOTIFICATION_RESPONSE_CODE];

// Response Messages - API response mesajları
export const NOTIFICATION_RESPONSE_MESSAGE = {
  TOKEN_REGISTERED: 'Token başarıyla kaydedildi',
  TOKEN_DELETED: 'Token başarıyla silindi',
  TOKEN_UPDATED: 'Token başarıyla güncellendi',
  NOTIFICATION_SENT: 'Bildirim gönderildi',
  NOTIFICATION_FAILED: 'Bildirim gönderilemedi',
} as const;

// Error Messages - Hata mesajları
export const NOTIFICATION_ERROR_MESSAGE = {
  TOKEN_REQUIRED: 'Token zorunludur',
  INVALID_DEVICE_TYPE: 'Geçersiz cihaz tipi. ios veya android olmalıdır',
  TITLE_REQUIRED: 'Başlık zorunludur',
  BODY_REQUIRED: 'Mesaj zorunludur',
  TITLE_TOO_LONG: 'Başlık en fazla 100 karakter olabilir',
  BODY_TOO_LONG: 'Mesaj en fazla 500 karakter olabilir',
  NO_ACTIVE_TOKENS: 'Aktif token bulunamadı',
  NO_ACTIVE_USERS: 'Aktif kullanıcı bulunamadı',
  NO_BRANCH_USERS: 'Şubede aktif kullanıcı bulunamadı',
  UNAUTHORIZED_NOTIFICATION: 'Bu işlem için yetkiniz yok',
  BRANCH_MANAGER_ALL_FORBIDDEN: 'Branch manager tüm kullanıcılara bildirim gönderemez',
  BRANCH_MANAGER_OTHER_BRANCH: 'Sadece kendi şubenize bildirim gönderebilirsiniz',
  BRANCH_REQUIRED: 'Şube seçimi zorunludur',
  NOTIFICATION_SEND_ERROR: 'Bildirim gönderilirken hata oluştu',
} as const;

// Validation Limits - Validasyon limitleri
export const NOTIFICATION_LIMITS = {
  TITLE_MAX_LENGTH: 100,
  BODY_MAX_LENGTH: 500,
  FCM_MULTICAST_MAX_TOKENS: 500,
} as const;

