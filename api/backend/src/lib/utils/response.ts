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
 * @deprecated Use `throw new AppValidationError(message)` with asyncHandler instead.
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
 * @deprecated Use `throw new AppAuthenticationError(message)` with asyncHandler instead.
 */
export function authenticationError(
  message: string = 'Kimlik doğrulaması gerekli'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 401, 'AUTHENTICATION_REQUIRED');
}

/**
 * Yetki hatası response'u (403)
 * @deprecated Use `throw new AppAuthorizationError(message)` with asyncHandler instead.
 */
export function unauthorizedError(
  message: string = 'Bu işlem için yetkiniz yok'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 403, 'UNAUTHORIZED');
}

/**
 * Email doğrulama hatası response'u (403)
 * @deprecated Use `throw new AppAuthorizationError(message)` with asyncHandler instead.
 */
export function emailVerificationError(
  message: string = 'Bu işlem için e-posta adresinizi doğrulamanız gerekiyor'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 403, 'EMAIL_VERIFICATION_REQUIRED');
}

/**
 * Bulunamadı hatası response'u
 * @deprecated Use `throw new AppNotFoundError(resource)` with asyncHandler instead.
 */
export function notFoundError(
  resource: string = 'Kaynak'
): NextResponse<ApiErrorResponse> {
  return errorResponse(`${resource} bulunamadı`, 404, 'NOT_FOUND');
}

/**
 * Sunucu hatası response'u
 * @deprecated Use `throw new AppInternalServerError(message)` with asyncHandler instead.
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
  
  // Firestore Timestamp objesi (toDate() metodu varsa - Client SDK)
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  
  // Firebase Admin SDK Timestamp (admin.firestore.Timestamp)
  // Admin SDK'da Timestamp objesi sadece seconds ve nanoseconds property'lerine sahip
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    const seconds = timestamp.seconds;
    const nanoseconds = timestamp.nanoseconds || 0;
    // ISO string formatına çevir (frontend için)
    const date = new Date(seconds * 1000 + nanoseconds / 1000000);
    return date.toISOString();
  }
  
  // Date objesi
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  // Zaten ISO string formatında
  if (typeof timestamp === 'string' && (timestamp.includes('T') || timestamp.includes('Z'))) {
    return timestamp;
  }
  
  return timestamp;
}

/**
 * Generic Timestamp Serializer
 * Verilen objenin belirtilen alanlarındaki Firestore Timestamp'lerini ISO string'e çevirir.
 *
 * @param obj - Serialize edilecek obje
 * @param fields - Timestamp alanlarının isimleri (default: ['createdAt', 'updatedAt'])
 */
export function serializeObjectTimestamps<T extends Record<string, any>>(
  obj: T | null | undefined,
  fields: string[] = ['createdAt', 'updatedAt'],
): T | null | undefined {
  if (!obj) return obj;

  const serialized = { ...obj } as any;
  for (const field of fields) {
    if (obj[field] !== undefined) {
      serialized[field] = serializeTimestamp(obj[field]);
    }
  }
  return serialized;
}

// ==================== Model-Specific Serializers ====================
// Thin wrappers over the generic function. They keep call-sites readable
// and ensure the correct fields are always listed in one place.

/** Kullanıcı objesindeki tüm Timestamp'leri serialize eder */
export function serializeUserTimestamps(user: any): any {
  return serializeObjectTimestamps(user, ['birthDate', 'createdAt', 'updatedAt']);
}

/** News objesindeki tüm Timestamp'leri serialize eder */
export function serializeNewsTimestamps(news: any): any {
  return serializeObjectTimestamps(news, ['createdAt', 'updatedAt', 'publishedAt']);
}

/** Announcement objesindeki tüm Timestamp'leri serialize eder */
export function serializeAnnouncementTimestamps(announcement: any): any {
  return serializeObjectTimestamps(announcement, ['createdAt', 'updatedAt', 'publishedAt']);
}

/** Training objesindeki tüm Timestamp'leri serialize eder */
export function serializeTrainingTimestamps(training: any): any {
  return serializeObjectTimestamps(training);
}

/** FAQ objesindeki tüm Timestamp'leri serialize eder */
export function serializeFAQTimestamps(faq: any): any {
  return serializeObjectTimestamps(faq);
}

/** Lesson objesindeki tüm Timestamp'leri serialize eder */
export function serializeLessonTimestamps(lesson: any): any {
  return serializeObjectTimestamps(lesson);
}

/** Video Content objesindeki tüm Timestamp'leri serialize eder */
export function serializeVideoContentTimestamps(video: any): any {
  return serializeObjectTimestamps(video);
}

/** Document Content objesindeki tüm Timestamp'leri serialize eder */
export function serializeDocumentContentTimestamps(document: any): any {
  return serializeObjectTimestamps(document);
}

/** Test Content objesindeki tüm Timestamp'leri serialize eder */
export function serializeTestContentTimestamps(test: any): any {
  return serializeObjectTimestamps(test);
}

/** Activity Category objesindeki tüm Timestamp'leri serialize eder */
export function serializeActivityCategoryTimestamps(category: any): any {
  return serializeObjectTimestamps(category);
}

/** Activity objesindeki tüm Timestamp'leri serialize eder */
export function serializeActivityTimestamps(activity: any): any {
  return serializeObjectTimestamps(activity, ['createdAt', 'updatedAt', 'activityDate']);
}

export function serializeContractedInstitutionTimestamps(institution: any): any {
  return serializeObjectTimestamps(institution);
}

/**
 * Generic Content serializer (type'a göre uygun serializer'ı kullanır)
 */
export function serializeContentTimestamps(content: any): any {
  if (!content) return content;
  
  if (content.type === 'video') {
    return serializeVideoContentTimestamps(content);
  } else if (content.type === 'document') {
    return serializeDocumentContentTimestamps(content);
  } else if (content.type === 'test') {
    return serializeTestContentTimestamps(content);
  }
  
  return content;
}


