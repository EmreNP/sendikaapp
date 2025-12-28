import { NextResponse } from 'next/server';

/**
 * Error type guard - error objesinin message property'sine sahip olup olmadığını kontrol eder
 */
export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Error type guard - error objesinin code property'sine sahip olup olmadığını kontrol eder
 */
export function isErrorWithCode(error: unknown): error is { code: string; message?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

/**
 * Error type guard - error objesinin hem message hem code property'lerine sahip olup olmadığını kontrol eder
 * Firebase hatalar için kullanılır
 */
export function isFirebaseError(error: unknown): error is { message: string; code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error &&
    typeof (error as Record<string, unknown>).message === 'string' &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

/**
 * Standart API Response Formatları
 * 
 * Tüm response'lar tutarlı bir formatta:
 * - success: boolean (true/false)
 * - message: string (her zaman mevcut)
 * - data?: any (sadece success'te)
 * - code?: string (hata kodları ve başarı kodları için)
 * - details?: string (detaylı hata bilgisi, sadece development'ta)
 */

export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: string;
}

/**
 * Başarılı response oluşturur
 */
export function successResponse<T = any>(
  message: string,
  data?: T,
  status: number = 200,
  code?: string
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(code && { code }),
  };

  return NextResponse.json(response, { status });
}

/**
 * Hata response oluşturur
 */
export function errorResponse(
  message: string,
  status: number = 400,
  code?: string,
  details?: string
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    message,
    ...(code && { code }),
    ...(details && { details }),
  };

  return NextResponse.json(response, { status });
}

/**
 * Validation hatası response'u
 */
export function validationError(
  message: string,
  details?: string
): NextResponse<ApiErrorResponse> {
  return errorResponse(
    message,
    400,
    'VALIDATION_ERROR',
    process.env.NODE_ENV === 'development' ? details : undefined
  );
}

/**
 * Authentication hatası response'u (401)
 */
export function authenticationError(
  message: string = 'Kimlik doğrulaması gerekli'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 401, 'AUTHENTICATION_REQUIRED');
}

/**
 * Yetki hatası response'u (403)
 */
export function unauthorizedError(
  message: string = 'Bu işlem için yetkiniz yok'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 403, 'UNAUTHORIZED');
}

/**
 * Email doğrulama hatası response'u (403)
 */
export function emailVerificationError(
  message: string = 'Bu işlem için e-posta adresinizi doğrulamanız gerekiyor'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 403, 'EMAIL_VERIFICATION_REQUIRED');
}

/**
 * Bulunamadı hatası response'u
 */
export function notFoundError(
  resource: string = 'Kaynak'
): NextResponse<ApiErrorResponse> {
  return errorResponse(`${resource} bulunamadı`, 404, 'NOT_FOUND');
}

/**
 * Sunucu hatası response'u
 */
export function serverError(
  message: string = 'Sunucu hatası oluştu',
  details?: string
): NextResponse<ApiErrorResponse> {
  return errorResponse(
    message,
    500,
    'SERVER_ERROR',
    process.env.NODE_ENV === 'development' ? details : undefined
  );
}

/**
 * Firebase Auth hatalarını yakalar ve uygun response döner
 */
export function handleFirebaseAuthError(error: unknown): NextResponse<ApiErrorResponse> {
  // Önce code varlığını güvenli şekilde kontrol et
  let errorCode = '';
  
  if (isErrorWithCode(error)) {
    errorCode = error.code;
  }
  
  const errorMap: Record<string, { message: string; status: number }> = {
    'auth/email-already-exists': {
      message: 'Bu e-posta adresi zaten kullanılıyor',
      status: 400,
    },
    'auth/invalid-email': {
      message: 'Geçersiz e-posta adresi',
      status: 400,
    },
    'auth/weak-password': {
      message: 'Şifre çok zayıf',
      status: 400,
    },
    'auth/user-not-found': {
      message: 'Kullanıcı bulunamadı',
      status: 404,
    },
    'auth/wrong-password': {
      message: 'Hatalı şifre',
      status: 400,
    },
    'auth/too-many-requests': {
      message: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.',
      status: 429,
    },
  };

  const mappedError = errorMap[errorCode];
  
  if (mappedError) {
    const errorMessage = isErrorWithMessage(error) ? error.message : undefined;
    return errorResponse(
      mappedError.message,
      mappedError.status,
      errorCode,
      process.env.NODE_ENV === 'development' ? errorMessage : undefined
    );
  }

  // Bilinmeyen Firebase hatası
  const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
  return serverError(
    'Kimlik doğrulama hatası',
    process.env.NODE_ENV === 'development' ? errorMessage : undefined
  );
}

/**
 * Firestore hatalarını yakalar ve uygun response döner
 */
export function handleFirestoreError(error: unknown): NextResponse<ApiErrorResponse> {
  // Önce code varlığını güvenli şekilde kontrol et
  let errorCode = '';
  
  if (isErrorWithCode(error)) {
    errorCode = error.code;
  }
  
  const errorMap: Record<string, { message: string; status: number }> = {
    'permission-denied': {
      message: 'Firestore izin hatası. Lütfen yöneticiye başvurun.',
      status: 500,
    },
    'not-found': {
      message: 'Kayıt bulunamadı',
      status: 404,
    },
  };

  const mappedError = errorMap[errorCode];
  
  if (mappedError) {
    const errorMessage = isErrorWithMessage(error) ? error.message : undefined;
    return errorResponse(
      mappedError.message,
      mappedError.status,
      errorCode,
      process.env.NODE_ENV === 'development' ? errorMessage : undefined
    );
  }

  // Bilinmeyen Firestore hatası
  const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
  return serverError(
    'Veritabanı hatası',
    process.env.NODE_ENV === 'development' ? errorMessage : undefined
  );
}

/**
 * Firestore Timestamp'leri JSON'a serialize eder
 * Firestore Timestamp objelerini { seconds, nanoseconds } formatına çevirir
 */
export function serializeTimestamp(timestamp: any): any {
  if (!timestamp) return null;
  
  // Firebase Admin SDK Timestamp
  if (timestamp.seconds !== undefined) {
    return {
      seconds: timestamp.seconds,
      nanoseconds: timestamp.nanoseconds || 0,
    };
  }
  
  // Date objesi
  if (timestamp instanceof Date) {
    const seconds = Math.floor(timestamp.getTime() / 1000);
    return {
      seconds,
      nanoseconds: (timestamp.getTime() % 1000) * 1000000,
    };
  }
  
  // Zaten serialize edilmiş
  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    return timestamp;
  }
  
  return timestamp;
}

/**
 * Kullanıcı objesindeki tüm Timestamp'leri serialize eder
 */
export function serializeUserTimestamps(user: any): any {
  if (!user) return user;
  
  const serialized = { ...user };
  
  if (user.birthDate) {
    serialized.birthDate = serializeTimestamp(user.birthDate);
  }
  
  if (user.createdAt) {
    serialized.createdAt = serializeTimestamp(user.createdAt);
  }
  
  if (user.updatedAt) {
    serialized.updatedAt = serializeTimestamp(user.updatedAt);
  }
  
  return serialized;
}

/**
 * News objesindeki tüm Timestamp'leri serialize eder
 */
export function serializeNewsTimestamps(news: any): any {
  if (!news) return news;
  
  const serialized = { ...news };
  
  if (news.createdAt) {
    serialized.createdAt = serializeTimestamp(news.createdAt);
  }
  
  if (news.updatedAt) {
    serialized.updatedAt = serializeTimestamp(news.updatedAt);
  }
  
  if (news.publishedAt) {
    serialized.publishedAt = serializeTimestamp(news.publishedAt);
  }
  
  return serialized;
}


