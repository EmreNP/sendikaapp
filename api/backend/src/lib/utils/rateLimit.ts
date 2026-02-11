import { NextRequest } from 'next/server';

// Rate limit konfigürasyon interface'i
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string;
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

// Esnek rate limit konfigürasyonları
export const rateLimitConfigs = {
  // Auth endpoints - Environment variable'dan override edilebilir
  authRegister: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_AUTH_REGISTER', 3),
    windowMs: getEnvRateLimit('RATE_LIMIT_AUTH_REGISTER_WINDOW_MS', 60 * 60 * 1000), // 1 saat
  },
  
  authRegisterDetails: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_AUTH_REGISTER_DETAILS', 5),
    windowMs: getEnvRateLimit('RATE_LIMIT_AUTH_REGISTER_DETAILS_WINDOW_MS', 15 * 60 * 1000), // 15 dakika
  },
  
  authPasswordReset: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_AUTH_PASSWORD_RESET', 3),
    windowMs: getEnvRateLimit('RATE_LIMIT_AUTH_PASSWORD_RESET_WINDOW_MS', 60 * 60 * 1000), // 1 saat
  },
  
  authPasswordChange: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_AUTH_PASSWORD_CHANGE', 5),
    windowMs: getEnvRateLimit('RATE_LIMIT_AUTH_PASSWORD_CHANGE_WINDOW_MS', 15 * 60 * 1000), // 15 dakika
  },
  
  authEmailVerification: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_AUTH_EMAIL_VERIFY', 3),
    windowMs: getEnvRateLimit('RATE_LIMIT_AUTH_EMAIL_VERIFY_WINDOW_MS', 60 * 60 * 1000), // 1 saat
  },
  
  // File operations
  fileUpload: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_FILE_UPLOAD', 10),
    windowMs: getEnvRateLimit('RATE_LIMIT_FILE_UPLOAD_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  // CRUD - Read operations
  readGeneral: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_READ_GENERAL', 60),
    windowMs: getEnvRateLimit('RATE_LIMIT_READ_GENERAL_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  readMe: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_READ_ME', 120),
    windowMs: getEnvRateLimit('RATE_LIMIT_READ_ME_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  // CRUD - Write operations
  writeCreate: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_WRITE_CREATE', 10),
    windowMs: getEnvRateLimit('RATE_LIMIT_WRITE_CREATE_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  writeUpdate: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_WRITE_UPDATE', 20),
    windowMs: getEnvRateLimit('RATE_LIMIT_WRITE_UPDATE_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  writeDelete: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_WRITE_DELETE', 5),
    windowMs: getEnvRateLimit('RATE_LIMIT_WRITE_DELETE_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  // Heavy operations
  stats: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_STATS', 20),
    windowMs: getEnvRateLimit('RATE_LIMIT_STATS_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  bulk: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_BULK', 10),
    windowMs: getEnvRateLimit('RATE_LIMIT_BULK_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  // Special
  openapi: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_OPENAPI', 100),
    windowMs: getEnvRateLimit('RATE_LIMIT_OPENAPI_WINDOW_MS', 60 * 1000), // 1 dakika
  },
} as const;

// In-memory store
class InMemoryRateLimitStore {
  private store = new Map<string, number[]>();
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 dakikada bir temizlik
  
  check(identifier: string, config: RateLimitConfig): {
    allowed: boolean;
    limit: number;
    remaining: number;
    reset: number;
  } {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    const requests = this.store.get(identifier) || [];
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    const isAllowed = recentRequests.length < config.maxRequests;
    
    if (isAllowed) {
      recentRequests.push(now);
      this.store.set(identifier, recentRequests);
    }
    
    if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      this.cleanup();
      this.lastCleanup = now;
    }
    
    const resetTime = recentRequests.length > 0
      ? recentRequests[0] + config.windowMs
      : now + config.windowMs;
    
    return {
      allowed: isAllowed,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - recentRequests.length),
      reset: resetTime,
    };
  }
  
  private cleanup() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 saat
    
    for (const [key, timestamps] of this.store.entries()) {
      const filtered = timestamps.filter(ts => ts > now - maxAge);
      if (filtered.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, filtered);
      }
    }
    
    // Debug için log (opsiyonel)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🧹 Rate limit cleanup: ${this.store.size} identifiers`);
    }
  }
  
  clear(identifier: string) {
    this.store.delete(identifier);
  }
  
  getStats() {
    return {
      totalIdentifiers: this.store.size,
      totalRequests: Array.from(this.store.values())
        .reduce((sum, reqs) => sum + reqs.length, 0),
    };
  }
}

const rateLimitStore = new InMemoryRateLimitStore();

// IP adresini al
function getClientId(request: NextRequest): string {
  // X-Forwarded-For header (proxy/load balancer arkasında)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // X-Real-IP header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback
  return request.ip || 'unknown';
}

// Ana rate limit kontrol fonksiyonu
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const identifier = config.identifier || getClientId(request);
  return rateLimitStore.check(identifier, config);
}

// Path bazlı otomatik config seçimi
export async function rateLimitByPath(
  request: NextRequest,
  path: string,
  method: string
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
} | null> { // null = rate limit uygulanmaz (health check gibi)
  
  // Health check için rate limit yok
  if (path === '/api/health') {
    return null;
  }
  
  let config: RateLimitConfig;
  let customIdentifier: string | undefined;
  
  // ========== AUTH ENDPOINTS ==========
  if (path === '/api/auth/register/basic') {
    config = rateLimitConfigs.authRegister;
    // Email bazlı identifier (aynı email'den çok kayıt önle)
    try {
      const body = await request.clone().json().catch(() => null);
      if (body?.email) {
        customIdentifier = `register:${body.email}`;
      }
    } catch {}
  }
  else if (path === '/api/auth/register/details') {
    config = rateLimitConfigs.authRegisterDetails;
  }
  else if (path === '/api/auth/password/reset-request') {
    config = rateLimitConfigs.authPasswordReset;
    // Email bazlı identifier
    try {
      const body = await request.clone().json().catch(() => null);
      if (body?.email) {
        customIdentifier = `password-reset:${body.email}`;
      }
    } catch {}
  }
  else if (path === '/api/auth/password/change') {
    config = rateLimitConfigs.authPasswordChange;
  }

  
  // ========== FILE UPLOAD ==========
  else if (path.includes('/files/') && path.includes('/upload')) {
    config = rateLimitConfigs.fileUpload;
  }
  
  // ========== STATS & HEAVY OPERATIONS ==========
  else if (path.includes('/stats')) {
    config = rateLimitConfigs.stats;
  }
  else if (path.includes('/bulk')) {
    config = rateLimitConfigs.bulk;
  }
  
  // ========== OPENAPI ==========
  else if (path === '/api/openapi') {
    config = rateLimitConfigs.openapi;
  }
  
  // ========== CRUD OPERATIONS ==========
  // Method'a göre farklı limitler
  else if (method === 'GET') {
    // Read operations
    if (path.includes('/me')) {
      config = rateLimitConfigs.readMe;
    } else {
      config = rateLimitConfigs.readGeneral;
    }
  }
  else if (method === 'POST') {
    // Create operations
    config = rateLimitConfigs.writeCreate;
  }
  else if (method === 'PUT' || method === 'PATCH') {
    // Update operations
    config = rateLimitConfigs.writeUpdate;
  }
  else if (method === 'DELETE') {
    // Delete operations
    config = rateLimitConfigs.writeDelete;
  }
  else {
    // Default: Genel limit
    config = rateLimitConfigs.readGeneral;
  }
  
  return checkRateLimit(request, {
    ...config,
    identifier: customIdentifier,
  });
}

export { rateLimitStore };

