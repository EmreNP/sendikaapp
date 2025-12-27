import { NextRequest, NextResponse } from 'next/server';

/**
 * İzin verilen origin'leri döndürür
 * Development ve production modlarına göre farklı origin'ler döner
 */
function getAllowedOrigins(): string[] {
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  if (isDevelopment) {
    // Development için localhost portlarına izin ver
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:8081', // Expo web development server
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:8081', // Expo web development server
    ];
  }
  
  // Production için environment variable'dan al (zorunlu)
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  
  if (!allowedOriginsEnv || allowedOriginsEnv.trim() === '') {
    console.warn('⚠️  WARNING: ALLOWED_ORIGINS environment variable is not set in production mode!');
    console.warn('   CORS will reject all origins. Please set ALLOWED_ORIGINS in your environment variables.');
    return [];
  }
  
  // Environment variable'dan origin'leri parse et
  const origins = allowedOriginsEnv
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
  
  if (origins.length === 0) {
    console.warn('⚠️  WARNING: No valid origins found in ALLOWED_ORIGINS!');
    return [];
  }
  
  return origins;
}

/**
 * Origin'in izin verilen origin'ler listesinde olup olmadığını kontrol eder
 */
function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) {
    return false;
  }
  
  return allowedOrigins.includes(origin);
}

/**
 * CORS headers ekler
 * Production'da wildcard kullanılmaz, sadece ALLOWED_ORIGINS'deki origin'lere izin verilir
 */
export function addCorsHeaders(response: NextResponse, request?: NextRequest): NextResponse {
  const allowedOrigins = getAllowedOrigins();
  const origin = request?.headers.get('origin');
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  // Origin kontrolü
  if (origin && isOriginAllowed(origin, allowedOrigins)) {
    // İzin verilen origin varsa, o origin'i kullan
    response.headers.set('Access-Control-Allow-Origin', origin);
    // Credentials için origin gereklidir (wildcard ile kullanılamaz)
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else if (isDevelopment && !origin) {
    // Development'ta origin yoksa (ör: Postman, curl), wildcard kullan
    // NOT: Production'da asla wildcard kullanılmaz
    response.headers.set('Access-Control-Allow-Origin', '*');
  } else if (isDevelopment && origin && !isOriginAllowed(origin, allowedOrigins)) {
    // Development'ta origin var ama izin verilen listede değilse
    // Log at ve izin verme (güvenlik için)
    console.warn(`⚠️  Origin not in allowed list (development mode): ${origin}`);
    console.warn('   Add this origin to your allowed origins if needed.');
    
    // Fallback: İlk allowed origin'i kullan (browser yine de engeller)
    if (allowedOrigins.length > 0) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
  } else {
    // Production'da origin izin verilen listede değilse
    // CORS header'ı ekleme (browser tarafında request reject edilir)
    // İlk allowed origin'i kullanarak fallback yapabiliriz ama güvenli değil
    // Bu durumda response gönderilir ama browser request'i engeller
    if (allowedOrigins.length > 0) {
      // Güvenlik için sadece ilk origin'i kullan (yine de browser engeller)
      response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
    // Eğer hiç allowed origin yoksa, header eklenmez
  }

  // CORS method'ları
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  
  // CORS header'ları
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Preflight cache süresi (24 saat)
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

/**
 * OPTIONS request için CORS response
 */
export function corsOptionsResponse(request?: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response, request);
}

