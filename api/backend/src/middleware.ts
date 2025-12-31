import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, corsOptionsResponse } from './lib/utils/cors';
import { rateLimitByPath } from './lib/utils/rateLimit';
import { errorResponse } from './lib/utils/response';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;
  
  // OPTIONS request için CORS response
  if (method === 'OPTIONS') {
    return corsOptionsResponse(request);
  }

  // Rate limit kontrolü
  try {
    const rateLimitResult = await rateLimitByPath(request, path, method);
    
    // Rate limit uygulanmıyorsa (health check gibi)
    if (rateLimitResult === null) {
  const response = NextResponse.next();
  return addCorsHeaders(response, request);
    }
    
    // Rate limit aşıldı
    if (!rateLimitResult.allowed) {
      const response = errorResponse(
        'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
      
      const resetTime = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.reset).toISOString());
      response.headers.set('Retry-After', resetTime.toString());
      
      return addCorsHeaders(response, request);
    }
    
    // Rate limit geçildi
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.reset).toISOString());
    
    return addCorsHeaders(response, request);
  } catch (error) {
    // Rate limit kontrolünde hata olursa, güvenli tarafta kal
    // İsteğe izin ver ama logla
    console.error('Rate limit check error:', error);
    const response = NextResponse.next();
    return addCorsHeaders(response, request);
  }
}

export const config = {
  matcher: '/api/:path*',
};
