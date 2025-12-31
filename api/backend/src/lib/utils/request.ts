import { NextRequest } from 'next/server';
import { AppValidationError } from './errors/AppError';

/**
 * JSON body parse helper
 * Tüm JSON parsing hatalarını yakalar ve user-friendly hata döner
 * 
 * Usage:
 * const body = await parseJsonBody<MyType>(request);
 */
export async function parseJsonBody<T = any>(request: NextRequest): Promise<T> {
  try {
    // Content-Type kontrolü
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new AppValidationError(
        'Content-Type must be application/json',
        { contentType: contentType || 'missing' }
      );
    }

    // Body parse et
    const body = await request.json();
    return body as T;
  } catch (error: unknown) {
    // AppError ise direkt throw et (handleError yakalayacak)
    if (error instanceof AppValidationError) {
      throw error;
    }

    // JSON parse hatası
    if (error instanceof SyntaxError) {
      throw new AppValidationError(
        'Geçersiz JSON formatı. Lütfen request body\'nizi kontrol edin.',
        { originalError: error.message }
      );
    }

    // Body okunamıyor veya boş
    if (error instanceof TypeError) {
      throw new AppValidationError(
        'Request body okunamadı. Lütfen geçerli bir JSON gönderin.',
        { originalError: error.message }
      );
    }

    // Diğer hatalar
    throw new AppValidationError(
      'Request body parse edilemedi',
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Request body size kontrolü
 * 
 * Usage:
 * validateBodySize(request, 1024 * 1024); // 1MB max
 */
export function validateBodySize(
  request: NextRequest, 
  maxSizeBytes: number = 10 * 1024 * 1024
): void {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSizeBytes) {
      throw new AppValidationError(
        `Request body çok büyük. Maksimum ${Math.round(maxSizeBytes / 1024 / 1024)}MB olabilir.`,
        { size, maxSize: maxSizeBytes }
      );
    }
  }
}

/**
 * Query parameter parse helper
 * 
 * Usage:
 * const page = parseQueryParam(url, 'page', '1');
 */
export function parseQueryParam(
  url: URL,
  param: string,
  defaultValue?: string
): string | undefined {
  return url.searchParams.get(param) || defaultValue;
}

/**
 * Query parameter parse as number
 * Validation ile birlikte
 * 
 * Usage:
 * const page = parseQueryParamAsNumber(url, 'page', 1, 1, 100);
 */
export function parseQueryParamAsNumber(
  url: URL,
  param: string,
  defaultValue?: number,
  min?: number,
  max?: number
): number {
  const value = url.searchParams.get(param);
  
  if (!value && defaultValue !== undefined) {
    return defaultValue;
  }
  
  if (!value) {
    throw new AppValidationError(`Query parameter '${param}' gerekli`);
  }
  
  const num = parseInt(value, 10);
  
  if (isNaN(num)) {
    throw new AppValidationError(`Query parameter '${param}' geçerli bir sayı olmalıdır`);
  }
  
  if (min !== undefined && num < min) {
    throw new AppValidationError(`Query parameter '${param}' en az ${min} olmalıdır`);
  }
  
  if (max !== undefined && num > max) {
    throw new AppValidationError(`Query parameter '${param}' en fazla ${max} olabilir`);
  }
  
  return num;
}

