import { NextResponse } from 'next/server';
import { AppError } from './AppError';
import type { ApiErrorResponse } from '../response';
import { 
  isErrorWithMessage, 
  isErrorWithCode, 
  isFirebaseError,
  handleFirebaseAuthError as existingHandleFirebaseAuthError,
  handleFirestoreError as existingHandleFirestoreError,
} from '../response';

/**
 * Structured Logging Utility
 * Şu an console'a yazıyor, ileride Firebase Logging/Winston entegre edilebilir
 */
function logError(error: unknown, context?: Record<string, unknown>): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Structured log format
  const logData = {
    timestamp: new Date().toISOString(),
    level: error instanceof AppError && error.isOperational ? 'warn' : 'error',
    error: {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof AppError ? error.code : undefined,
      statusCode: error instanceof AppError ? error.statusCode : 500,
      stack: isDevelopment && error instanceof Error ? error.stack : undefined,
    },
    context: context || {},
  };
  
  // JSON format'ta log (structured logging)
  if (logData.level === 'error') {
    console.error(JSON.stringify(logData, null, isDevelopment ? 2 : 0));
  } else {
    console.warn(JSON.stringify(logData, null, isDevelopment ? 2 : 0));
  }
  
  // TODO: İleride Firebase Logging veya Winston entegre edilebilir
  // Örnek: firebaseLogging.error(logData);
}

/**
 * Ana Error Handler - MEVCUT RESPONSE SİSTEMİ İLE TAM UYUMLU
 */
export function handleError(
  error: unknown,
  context?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  // Error logging
  logError(error, context);

  // AppError ise direkt format'la ve döndür
  if (error instanceof AppError) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        message: error.message,
        code: error.code,
        // details string formatında (mevcut sistem ile uyumlu)
        details: isDevelopment && error.details 
          ? (typeof error.details === 'string' 
              ? error.details 
              : JSON.stringify(error.details))
          : undefined,
      },
      { status: error.statusCode }
    );
  }

  // Firebase Auth hatası - MEVCUT FONKSİYONU KULLAN
  if (isFirebaseError(error) && error.code.startsWith('auth/')) {
    return existingHandleFirebaseAuthError(error);
  }

  // Firestore hatası - MEVCUT FONKSİYONU KULLAN
  if (isErrorWithCode(error) && (
    error.code === 'permission-denied' || 
    error.code === 'not-found' ||
    error.code.startsWith('firestore/')
  )) {
    return existingHandleFirestoreError(error);
  }

  // SyntaxError (JSON parse hatası)
  if (error instanceof SyntaxError) {
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        message: 'Geçersiz JSON formatı. Lütfen request body\'nizi kontrol edin.',
        code: 'INVALID_JSON',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 400 }
    );
  }

  // TypeError
  if (error instanceof TypeError) {
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        message: 'Geçersiz veri tipi',
        code: 'INVALID_TYPE',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 400 }
    );
  }

  // Bilinmeyen hatalar - MEVCUT serverError FONKSİYONU FORMATINDA
  const errorMessage = isErrorWithMessage(error) 
    ? error.message 
    : 'Beklenmeyen bir hata oluştu';
  
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      message: errorMessage,
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.stack : String(error))
        : undefined,
    },
    { status: 500 }
  );
}

/**
 * Async handler wrapper - Tüm async route handler'ları için
 * withAuth ile uyumlu çalışır
 * 
 * Usage:
 * export const GET = asyncHandler(async (request, { params }) => {
 *   // Your code here
 * });
 */
export function asyncHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      // Request context'i çıkar
      const request = args[0];
      const context = {
        path: request?.nextUrl?.pathname,
        method: request?.method,
      };
      return handleError(error, context);
    }
  };
}

