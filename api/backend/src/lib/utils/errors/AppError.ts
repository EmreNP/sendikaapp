/**
 * Base Application Error Class
 * Tüm custom error'lar bu sınıftan türer
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean; // Client hatası mı yoksa system hatası mı?
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Error stack trace'i düzgün çalışması için
    Error.captureStackTrace(this, this.constructor);
    
    // Type'i doğru set et
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation Error - 400
 */
export class AppValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
    Object.setPrototypeOf(this, AppValidationError.prototype);
  }
}

/**
 * Authentication Error - 401
 */
export class AppAuthenticationError extends AppError {
  constructor(message: string = 'Kimlik doğrulaması gerekli', details?: unknown) {
    super(message, 401, 'AUTHENTICATION_REQUIRED', true, details);
    Object.setPrototypeOf(this, AppAuthenticationError.prototype);
  }
}

/**
 * Authorization Error - 403
 */
export class AppAuthorizationError extends AppError {
  constructor(message: string = 'Bu işlem için yetkiniz yok', details?: unknown) {
    super(message, 403, 'UNAUTHORIZED', true, details);
    Object.setPrototypeOf(this, AppAuthorizationError.prototype);
  }
}

/**
 * Not Found Error - 404
 */
export class AppNotFoundError extends AppError {
  constructor(resource: string = 'Kaynak', details?: unknown) {
    super(`${resource} bulunamadı`, 404, 'NOT_FOUND', true, details);
    Object.setPrototypeOf(this, AppNotFoundError.prototype);
  }
}

/**
 * Conflict Error - 409
 */
export class AppConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT', true, details);
    Object.setPrototypeOf(this, AppConflictError.prototype);
  }
}

/**
 * Rate Limit Error - 429
 */
export class AppRateLimitError extends AppError {
  constructor(message: string = 'Çok fazla istek gönderdiniz', details?: unknown) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true, details);
    Object.setPrototypeOf(this, AppRateLimitError.prototype);
  }
}

/**
 * Internal Server Error - 500
 */
export class AppInternalServerError extends AppError {
  constructor(message: string = 'Sunucu hatası oluştu', details?: unknown) {
    super(message, 500, 'SERVER_ERROR', false, details);
    Object.setPrototypeOf(this, AppInternalServerError.prototype);
  }
}

/**
 * Bad Gateway Error - 502
 */
export class AppBadGatewayError extends AppError {
  constructor(message: string = 'Gateway hatası oluştu', details?: unknown) {
    super(message, 502, 'BAD_GATEWAY', false, details);
    Object.setPrototypeOf(this, AppBadGatewayError.prototype);
  }
}

