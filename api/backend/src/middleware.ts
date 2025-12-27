import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, corsOptionsResponse } from './lib/utils/cors';

export function middleware(request: NextRequest) {
  // OPTIONS request için CORS response
  if (request.method === 'OPTIONS') {
    return corsOptionsResponse(request);
  }

  // Diğer request'ler için response'a CORS header'ları ekle
  const response = NextResponse.next();
  return addCorsHeaders(response, request);
}

export const config = {
  matcher: '/api/:path*',
};
