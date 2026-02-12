import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, corsOptionsResponse } from './lib/utils/cors';
import { errorResponse } from './lib/utils/response';

import { logger } from './lib/utils/logger';
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;
  
  // OPTIONS request için CORS response
  if (method === 'OPTIONS') {
    return corsOptionsResponse(request);
  }

  // CSRF koruması: State-changing isteklerde X-Requested-With header'ı kontrol et
  // Tarayıcılar custom header'ları sadece CORS preflight onaylı isteklerden gönderir,
  // bu sayede cross-origin POST/PUT/DELETE saldırıları engellenmiş olur.
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const xRequestedWith = request.headers.get('x-requested-with');
    if (!xRequestedWith) {
      // Development modda sadece uyarı logla, production'da reject et
      const isDev = process.env.NODE_ENV === 'development';
      if (!isDev) {
        const response = errorResponse(
          'Geçersiz istek: X-Requested-With header eksik.',
          403,
          'CSRF_VALIDATION_FAILED'
        );
        return addCorsHeaders(response, request);
      }
    }
  }

  // Rate limiting artık route handler seviyesinde uygulanıyor (routeRateLimit.ts).
  // Bu sayede Node.js runtime kullanılarak Redis desteklenebilir.
  // Middleware (Edge Runtime) sadece CORS ve CSRF kontrolü yapar.
  const response = NextResponse.next();
  return addCorsHeaders(response, request);
}

export const config = {
  matcher: '/api/:path*',
};
