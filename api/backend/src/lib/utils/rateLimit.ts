import { NextRequest } from 'next/server';
import Redis from 'ioredis';

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

// Rate limit store interface'i — hem in-memory hem Redis aynı arayüzü kullanır
interface RateLimitStore {
  check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult>;
  clear(identifier: string): Promise<void>;
  getStats(): Promise<{ totalIdentifiers: number; totalRequests: number }>;
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
    maxRequests: getEnvRateLimit('RATE_LIMIT_FILE_UPLOAD', 50), // 10 → 50 (çoklu dosya yüklemesi için)
    windowMs: getEnvRateLimit('RATE_LIMIT_FILE_UPLOAD_WINDOW_MS', 60 * 1000), // 1 dakika
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
    maxRequests: getEnvRateLimit('RATE_LIMIT_WRITE_CREATE', 50), // 10 → 50
    windowMs: getEnvRateLimit('RATE_LIMIT_WRITE_CREATE_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  writeUpdate: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_WRITE_UPDATE', 100), // 20 → 100
    windowMs: getEnvRateLimit('RATE_LIMIT_WRITE_UPDATE_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  writeDelete: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_WRITE_DELETE', 30), // 5 → 30
    windowMs: getEnvRateLimit('RATE_LIMIT_WRITE_DELETE_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  // Heavy operations
  stats: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_STATS', 100), // 20 → 100
    windowMs: getEnvRateLimit('RATE_LIMIT_STATS_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  bulk: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_BULK', 50), // 10 → 50
    windowMs: getEnvRateLimit('RATE_LIMIT_BULK_WINDOW_MS', 60 * 1000), // 1 dakika
  },
  
  // Special
  openapi: {
    maxRequests: getEnvRateLimit('RATE_LIMIT_OPENAPI', 500), // 100 → 500 (API docs için)
    windowMs: getEnvRateLimit('RATE_LIMIT_OPENAPI_WINDOW_MS', 60 * 1000), // 1 dakika
  },
} as const;

// ==================== Redis Rate Limit Store ====================
// Çoklu instance'da (Cloud Run vb.) paylaşımlı sayaç — sliding window log algoritması
class RedisRateLimitStore implements RateLimitStore {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      enableReadyCheck: false,
    });

    this.redis.on('error', (err) => {
      console.error('Redis rate limit store error:', err.message);
    });

    this.redis.connect().catch((err) => {
      console.error('Redis connection failed, will fallback on each request:', err.message);
    });
  }

  async check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const key = `rl:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const windowSec = Math.ceil(config.windowMs / 1000);

    // Atomik sliding window: eski kayıtları sil, yeniyi ekle, say
    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);      // Pencere dışındakileri sil
    pipeline.zcard(key);                                   // Mevcut istek sayısı
    pipeline.zadd(key, now.toString(), `${now}:${Math.random()}`); // Yeni istek ekle
    pipeline.expire(key, windowSec + 1);                   // TTL ayarla

    const results = await pipeline.exec();
    // results[1] = [null, count] — zcard sonucu
    const currentCount = (results?.[1]?.[1] as number) || 0;
    const isAllowed = currentCount < config.maxRequests;

    if (!isAllowed) {
      // İzin verilmediyse eklenen son kaydı geri al
      const lastMembers = await this.redis.zrange(key, -1, -1);
      if (lastMembers.length > 0) {
        await this.redis.zrem(key, lastMembers[0]);
      }
    }

    // İlk isteğin zamanını al — reset time hesabı için
    const firstMembers = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
    const resetTime = firstMembers.length >= 2
      ? parseInt(firstMembers[1], 10) + config.windowMs
      : now + config.windowMs;

    return {
      allowed: isAllowed,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - (isAllowed ? currentCount + 1 : currentCount)),
      reset: resetTime,
    };
  }

  async clear(identifier: string): Promise<void> {
    await this.redis.del(`rl:${identifier}`);
  }

  async getStats(): Promise<{ totalIdentifiers: number; totalRequests: number }> {
    const keys = await this.redis.keys('rl:*');
    let totalRequests = 0;
    for (const key of keys) {
      totalRequests += await this.redis.zcard(key);
    }
    return { totalIdentifiers: keys.length, totalRequests };
  }
}

// ==================== In-Memory Rate Limit Store ====================
// Tek instance'da çalışır — geliştirme ortamı veya Redis yoksa fallback
class InMemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, number[]>();
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 dakikada bir temizlik
  
  async check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🧹 Rate limit cleanup: ${this.store.size} identifiers`);
    }
  }
  
  async clear(identifier: string): Promise<void> {
    this.store.delete(identifier);
  }
  
  async getStats(): Promise<{ totalIdentifiers: number; totalRequests: number }> {
    return {
      totalIdentifiers: this.store.size,
      totalRequests: Array.from(this.store.values())
        .reduce((sum, reqs) => sum + reqs.length, 0),
    };
  }
}

// ==================== Store seçimi ====================
// REDIS_URL ayarlandığında Redis kullan, yoksa in-memory (tek instance) fallback
async function createRateLimitStore(): Promise<RateLimitStore> {
  // Google Cloud Secret Manager'dan REDIS_URL okumayı dene
  let redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl && process.env.NODE_ENV === 'production') {
    try {
      const { getSecret } = await import('@/lib/gcloud/secrets');
      redisUrl = await getSecret('REDIS_URL');
    } catch (error) {
      console.warn('⚠️ Secret Manager erişilemedi, environment variable kullanılıyor');
    }
  }

  if (redisUrl) {
    console.log('✅ Rate limiter: Redis store aktif (çoklu instance desteği)');
    return new RedisRateLimitStore(redisUrl);
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '⚠️ Rate limiter: In-memory store kullanılıyor. ' +
      'Çoklu instance ortamında (Cloud Run vb.) her instance kendi sayacını tutar. ' +
      'Paylaşımlı rate limiting için Google Cloud Memorystore (Redis) kurulumu yapın:\n' +
      '1. gcloud redis instances create sendika-redis --size=1 --region=us-central1\n' +
      '2. VPC Connector oluşturun\n' +
      '3. Secret Manager\'a REDIS_URL ekleyin'
    );
  }
  return new InMemoryRateLimitStore();
}

// Store'u lazy initialize et (async olduğu için)
let rateLimitStoreInstance: RateLimitStore | null = null;
async function getRateLimitStore(): Promise<RateLimitStore> {
  if (!rateLimitStoreInstance) {
    rateLimitStoreInstance = await createRateLimitStore();
  }
  return rateLimitStoreInstance;
}

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
  const store = await getRateLimitStore();
  return store.check(identifier, config);
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

// Export getRateLimitStore for manual access if needed
export { getRateLimitStore };

