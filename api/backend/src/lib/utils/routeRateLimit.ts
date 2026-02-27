/**
 * Route-level Rate Limiter
 * 
 * Middleware (Edge Runtime) yerine route handler'larında çalışır.
 * Node.js runtime'da çalıştığı için Redis kullanabilir.
 * 
 * Usage:
 *   import { withRateLimit, rateLimitConfigs } from '@/lib/utils/routeRateLimit';
 * 
 *   export const POST = asyncHandler(async (request) => {
 *     const rl = await withRateLimit(request, rateLimitConfigs.authRegister);
 *     if (rl) return rl; // rate limited → return 429 response
 *     // ...normal handler logic
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { errorResponse } from './response';
import { addCorsHeaders } from './cors';
import { rateLimitConfigs } from './rateLimit';

// Re-export configs from existing file so callers don't need two imports
export { rateLimitConfigs, type RateLimitConfig } from './rateLimit';

// ==================== Store Interface ====================
interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface RateLimitStore {
  check(identifier: string, maxRequests: number, windowMs: number): Promise<RateLimitResult>;
}

// ==================== In-Memory Store (fallback) ====================
class InMemoryStore implements RateLimitStore {
  private store = new Map<string, number[]>();
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000;

  async check(identifier: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const requests = (this.store.get(identifier) || []).filter(ts => ts > windowStart);
    const allowed = requests.length < maxRequests;

    if (allowed) {
      requests.push(now);
      this.store.set(identifier, requests);
    }

    // Periodic cleanup
    if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      this.cleanup();
      this.lastCleanup = now;
    }

    return {
      allowed,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - requests.length),
      reset: requests.length > 0 ? requests[0] + windowMs : now + windowMs,
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.store.entries()) {
      const filtered = timestamps.filter(ts => ts > now - 3600_000);
      if (filtered.length === 0) this.store.delete(key);
      else this.store.set(key, filtered);
    }
  }
}

// ==================== Redis Store ====================
class RedisStore implements RateLimitStore {
  private redis: import('ioredis').default;

  constructor(redis: import('ioredis').default) {
    this.redis = redis;
  }

  async check(identifier: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
    const key = `rl:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Lua script for atomic sliding window
    const luaScript = `
      redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
      local count = redis.call('ZCARD', KEYS[1])
      if count < tonumber(ARGV[2]) then
        redis.call('ZADD', KEYS[1], ARGV[3], ARGV[3])
        redis.call('PEXPIRE', KEYS[1], ARGV[4])
        return {1, count + 1}
      else
        return {0, count}
      end
    `;

    const result = await this.redis.eval(
      luaScript,
      1,
      key,
      windowStart.toString(),
      maxRequests.toString(),
      now.toString(),
      windowMs.toString(),
    ) as [number, number];

    const allowed = result[0] === 1;
    const currentCount = result[1];

    return {
      allowed,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - currentCount),
      reset: now + windowMs,
    };
  }
}

// ==================== Store Singleton ====================
let storeInstance: RateLimitStore | null = null;

async function getStore(): Promise<RateLimitStore> {
  if (storeInstance) return storeInstance;

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        lazyConnect: true,
      });
      await redis.connect();
      storeInstance = new RedisStore(redis);
      logger.info('✅ Rate limiter: Redis store connected');
      return storeInstance;
    } catch (err) {
      logger.warn('⚠️ Rate limiter: Redis bağlantısı başarısız, in-memory fallback kullanılıyor', err);
    }
  }

  // Fallback to in-memory
  if (process.env.NODE_ENV === 'production') {
    logger.error(
      '🚨 CRITICAL: Rate limiter: Redis bağlantısı yok! ' +
      'In-memory store ÇOKLU INSTANCE ortamında (Cloud Run, Kubernetes vb.) ÇALIŞMAZ — ' +
      'her instance kendi bağımsız sayacını tutar, saldırgan instance başına tam limiti kullanabilir. ' +
      'REDIS_URL environment variable\'ı ayarlayarak çözün.'
    );
  }
  storeInstance = new InMemoryStore();
  return storeInstance;
}

// ==================== Client IP ====================
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return request.ip || 'unknown';
}

// ==================== Public API ====================

/**
 * Path + method bazlı otomatik rate limit uygular.
 * asyncHandler tarafından çağrılır — route dosyalarına dokunmak gerekmez.
 *
 * Kurallar:
 *  - /api/health          → sınır yok
 *  - auth endpoints       → özel, düşük limitler (brute-force koruması)
 *  - file upload          → fileUpload config
 *  - bulk / batch         → bulk config (yalnızca admin erişir → daha yüksek limit)
 *  - stats / reports      → stats config
 *  - GET /me              → readMe config
 *  - GET *                → readGeneral config
 *  - POST *               → writeCreate config
 *  - PUT / PATCH *        → writeUpdate config
 *  - DELETE *             → writeDelete config
 */
export async function autoRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const path = request.nextUrl.pathname;
  const method = request.method;

  // ── Health check – rate limiting yok ──────────────────────────────────────
  if (path === '/api/health') return null;

  // ── OpenAPI docs ───────────────────────────────────────────────────────────
  if (path === '/api/openapi') {
    return withRateLimit(request, rateLimitConfigs.openapi);
  }

  // ── Auth: kayıt ───────────────────────────────────────────────────────────
  if (path === '/api/auth/register/basic') {
    try {
      const body = await request.clone().json().catch(() => null);
      if (body?.email) {
        return withRateLimit(request, rateLimitConfigs.authRegister, `register:${body.email}`);
      }
    } catch {}
    return withRateLimit(request, rateLimitConfigs.authRegister);
  }

  if (path === '/api/auth/register/details') {
    return withRateLimit(request, rateLimitConfigs.authRegisterDetails);
  }

  // ── Auth: şifre sıfırlama / değiştirme ────────────────────────────────────
  if (path === '/api/auth/password/reset-request') {
    try {
      const body = await request.clone().json().catch(() => null);
      if (body?.email) {
        return withRateLimit(request, rateLimitConfigs.authPasswordReset, `password-reset:${body.email}`);
      }
    } catch {}
    return withRateLimit(request, rateLimitConfigs.authPasswordReset);
  }

  if (path === '/api/auth/password/change') {
    return withRateLimit(request, rateLimitConfigs.authPasswordChange);
  }

  // ── Auth: e-posta doğrulama ───────────────────────────────────────────────
  if (path === '/api/auth/verify-email/send') {
    return withRateLimit(request, rateLimitConfigs.authEmailVerification);
  }

  // ── Dosya yükleme ─────────────────────────────────────────────────────────
  if (path.includes('/upload')) {
    return withRateLimit(request, rateLimitConfigs.fileUpload);
  }

  // ── Toplu işlemler (bulk / batch) – yalnızca admin erişir ─────────────────
  if (path.includes('/bulk') || path.includes('/batch') || path.includes('batch-names')) {
    return withRateLimit(request, rateLimitConfigs.bulk);
  }

  // ── İstatistikler ve raporlar (ağır sorgular) ──────────────────────────────
  if (path.includes('/stats') || path.includes('/reports') || path.includes('/performance')) {
    return withRateLimit(request, rateLimitConfigs.stats);
  }

  // ── Bildirim gönderimi ────────────────────────────────────────────────────
  if (path.includes('/notifications/send')) {
    return withRateLimit(request, rateLimitConfigs.writeCreate);
  }

  // ── Genel CRUD: method bazlı ──────────────────────────────────────────────
  if (method === 'GET') {
    if (path.includes('/me')) {
      return withRateLimit(request, rateLimitConfigs.readMe);
    }
    return withRateLimit(request, rateLimitConfigs.readGeneral);
  }

  if (method === 'POST') {
    return withRateLimit(request, rateLimitConfigs.writeCreate);
  }

  if (method === 'PUT' || method === 'PATCH') {
    return withRateLimit(request, rateLimitConfigs.writeUpdate);
  }

  if (method === 'DELETE') {
    return withRateLimit(request, rateLimitConfigs.writeDelete);
  }

  // ── Varsayılan fallback ───────────────────────────────────────────────────
  return withRateLimit(request, rateLimitConfigs.readGeneral);
}

/**
 * Route handler içinde rate limit kontrol eder.
 * Rate limit aşılırsa 429 NextResponse döner; geçilirse null döner.
 *
 * @example
 *   const rl = await withRateLimit(request, rateLimitConfigs.writeCreate);
 *   if (rl) return rl;
 */
export async function withRateLimit(
  request: NextRequest,
  config: { maxRequests: number; windowMs: number },
  customIdentifier?: string,
): Promise<NextResponse | null> {
  try {
    const store = await getStore();
    const identifier = customIdentifier || getClientIp(request);
    const path = request.nextUrl.pathname;
    const fullId = `${path}:${identifier}`;

    const result = await store.check(fullId, config.maxRequests, config.windowMs);

    if (!result.allowed) {
      const resetSec = Math.ceil((result.reset - Date.now()) / 1000);
      const res = errorResponse(
        'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.',
        429,
        'RATE_LIMIT_EXCEEDED',
      );
      res.headers.set('X-RateLimit-Limit', result.limit.toString());
      res.headers.set('X-RateLimit-Remaining', '0');
      res.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());
      res.headers.set('Retry-After', resetSec.toString());
      return addCorsHeaders(res, request);
    }

    // Başarılı — null döndür, caller devam etsin
    return null;
  } catch (err) {
    // Rate limit kontrolünde hata olursa, güvenli tarafta kal: isteğe izin ver
    logger.error('Rate limit check error:', err);
    return null;
  }
}
