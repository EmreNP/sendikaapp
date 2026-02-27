import { NextRequest } from 'next/server';
import { logger } from './logger';

// NOT: ioredis Edge Runtime'da çalışmaz (redis-errors modülü Node.js native API'leri gerektirir).
// Next.js middleware Edge Runtime'da çalıştığı için, rate limiting in-memory store kullanır.
// Production'da çoklu instance desteği gerekiyorsa, rate limiting'i API route handler'larına taşıyın.
//
// ÖNEMLİ: Gerçek rate limit kontrolü routeRateLimit.ts tarafından yapılır.
// Bu dosya yalnızca konfigürasyon tanımlarını export eder.
// routeRateLimit.ts Redis'i tercih eder, bağlanamazsa in-memory fallback kullanır.

// Rate limit konfigürasyon interface'i
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string;
}

// Rate limit sonucu interface'i
interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// Environment variable'dan rate limit değerlerini parse et
function getEnvRateLimit(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return defaultValue;
}

// Esnek rate limit konfigürasyonları — normal kullanımda problem çıkarmayacak, sadece gerçek saldırılara karşı koruma sağlayacak şekilde ayarlandı
export const rateLimitConfigs = {
  // Auth endpoints - Environment variable'dan override edilebilir
  authRegister: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_AUTH_REGISTER', 30), // 3 → 20 (test/geliştirme için yeterli)
    windowMs: getEnvRateLimit('RATE_LIMIT_AUTH_REGISTER_WINDOW_MS', 15 * 60 * 1000), // 1 saat
  },
  
  authRegisterDetails: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_AUTH_REGISTER_DETAILS', 30), // 5 → 30
    windowMs: getEnvRateLimit('RATE_LIMIT_AUTH_REGISTER_DETAILS_WINDOW_MS', 15 * 60 * 1000), // 15 dakika
  },
  
  authPasswordReset: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_AUTH_PASSWORD_RESET', 10), // 3 → 10
    windowMs: getEnvRateLimit('RATE_LIMIT_AUTH_PASSWORD_RESET_WINDOW_MS', 60 * 60 * 1000), // 1 saat
  },
  
  authPasswordChange: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_AUTH_PASSWORD_CHANGE', 15), // 5 → 15
    windowMs: getEnvRateLimit('RATE_LIMIT_AUTH_PASSWORD_CHANGE_WINDOW_MS', 15 * 60 * 1000), // 15 dakika
  },
  
  authEmailVerification: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_AUTH_EMAIL_VERIFY', 10), // 3 → 10
    windowMs: getEnvRateLimit('RATE_LIMIT_AUTH_EMAIL_VERIFY_WINDOW_MS', 60 * 60 * 1000), // 1 saat
  },
  
  // File operations
  fileUpload: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_FILE_UPLOAD', 100), // Toplu dosya yüklemeleri için yüksek limit
    windowMs: getEnvRateLimit('RATE_LIMIT_FILE_UPLOAD_WINDOW_MS', 2 * 60 * 1000), // 2 dakika pencere
  },
  
  // CRUD - Read operations
  readGeneral: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_READ_GENERAL', 300), // 60 → 300 (sayfa yüklemeleri için)
    windowMs: getEnvRateLimit('RATE_LIMIT_READ_GENERAL_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  readMe: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_READ_ME', 500), // 120 → 500 (profil sayfası refresh'ler için)
    windowMs: getEnvRateLimit('RATE_LIMIT_READ_ME_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  // CRUD - Write operations
  writeCreate: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_WRITE_CREATE', 100), // Admin panel işlemleri için yüksek limit
    windowMs: getEnvRateLimit('RATE_LIMIT_WRITE_CREATE_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  writeUpdate: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_WRITE_UPDATE', 100), // 20 → 100
    windowMs: getEnvRateLimit('RATE_LIMIT_WRITE_UPDATE_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  writeDelete: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_WRITE_DELETE', 60), // Admin panel silme işlemleri için
    windowMs: getEnvRateLimit('RATE_LIMIT_WRITE_DELETE_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  // Heavy operations
  stats: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_STATS', 200), // Admin dashboard yenilemeleri için yüksek limit
    windowMs: getEnvRateLimit('RATE_LIMIT_STATS_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  bulk: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_BULK', 200), // Yalnızca admin erişir → yüksek limit
    windowMs: getEnvRateLimit('RATE_LIMIT_BULK_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  // Special
  openapi: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_OPENAPI', 500), // 100 → 500 (API docs için)
    windowMs: getEnvRateLimit('RATE_LIMIT_OPENAPI_WINDOW_MS', 60 * 1000), // 1 dakika
  },
} as const;

// ==================== Rate Limit Store ====================
// Tüm rate limit store mantığı routeRateLimit.ts'e taşındı.
// routeRateLimit.ts Redis'i tercih eder; Redis yoksa in-memory fallback kullanır.
// Bu dosya artık YALNIZCA konfigürasyon tanımlarını export eder.
//
// Eski API uyumluluğu için aşağıdaki fonksiyonlar korunmuştur,
// ancak gerçek rate limit kontrolü asyncHandler → autoRateLimit → routeRateLimit zincirinde yapılır.

