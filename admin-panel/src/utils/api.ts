import { logger } from '@/utils/logger';

/**
 * Custom API Error with code and details
 */
export class ApiError extends Error {
  code?: string;
  details?: string;
  response?: Response;

  constructor(message: string, opts?: { code?: string; details?: string; response?: Response }) {
    super(message);
    this.name = 'ApiError';
    this.code = opts?.code;
    this.details = opts?.details;
    this.response = opts?.response;
  }
}

/**
 * API Response Types
 * Backend'den dönen standart response formatları
 */
export interface ApiSuccessResponse<T = unknown> {
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

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ==================== Request Configuration ====================
const REQUEST_TIMEOUT_MS = 30_000; // 30 saniye timeout
const MAX_RETRIES = 2; // Network hatası veya 5xx için max retry
const RETRY_DELAY_MS = 1_000; // İlk retry bekleme süresi (exponential backoff)

/** Retry yapılabilir hata mı kontrol et */
function isRetryableError(error: unknown): boolean {
  // Network hataları (fetch reject)
  if (error instanceof TypeError && error.message.includes('fetch')) return true;
  if (error instanceof DOMException && error.name === 'AbortError') return false; // Timeout — retry etme
  return false;
}

/** Retry yapılabilir HTTP status mı kontrol et */
function isRetryableStatus(status: number): boolean {
  // 500, 502, 503, 504 — sunucu hataları
  return status >= 500 && status <= 504;
}

/** Exponential backoff ile bekleme */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * API çağrısı yapar ve response'u işler
 * - 30 saniye timeout (AbortController)
 * - Network hatası ve 5xx için otomatik retry (max 2 kez, exponential backoff)
 * - 401 hatası alındığında token'ı refresh eder ve otomatik retry yapar
 * @param endpoint API endpoint
 * @param options Fetch options
 * @returns Parsed data veya error throw eder
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const { api } = await import('@/config/api');
  const { authService } = await import('@/services/auth/authService');

  // Status update endpoint'leri için detaylı log
  const isStatusUpdate = endpoint.includes('/status') && options?.method === 'PATCH';
  // DELETE işlemleri için detaylı log
  const isDeleteRequest = options?.method === 'DELETE';
  
  if (isStatusUpdate) {
    logger.log('🌐 API Request (Status Update):', {
      endpoint,
      method: options?.method,
      hasBody: !!options?.body,
    });
    
    if (options?.body) {
      try {
        const bodyObj = JSON.parse(options.body as string);
        logger.log('📦 Request body:', {
          status: bodyObj.status,
          hasNote: !!bodyObj.note,
          hasRejectionReason: !!bodyObj.rejectionReason,
          hasDocumentUrl: !!bodyObj.documentUrl,
        });
      } catch (e) {
        logger.log('📦 Request body: (parse error)', e);
      }
    }
  }
  
  if (isDeleteRequest) {
    logger.log('🗑️ DELETE Request:', {
      endpoint,
      url: api.url(endpoint),
    });
  }
  
  // İlk deneme: Cache'lenmiş token ile
  let token = await authService.getIdToken(false);
  const url = api.url(endpoint);
  
  const makeRequest = async (authToken: string | null): Promise<Response> => {
    const defaultHeaders: HeadersInit = {};
    
    // FormData ise Content-Type set etme - tarayıcı otomatik boundary ekler
    if (!(options?.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }
    
    // CSRF koruması: Custom header ekle — tarayıcılar custom header'ları
    // sadece CORS preflight onaylı same-origin isteklerden gönderir
    defaultHeaders['X-Requested-With'] = 'XMLHttpRequest';
    
    if (authToken) {
      defaultHeaders['Authorization'] = `Bearer ${authToken}`;
      if (isStatusUpdate) {
        logger.log('🔑 Token available for status update request');
      }
    } else {
      if (isStatusUpdate) {
        logger.warn('⚠️ No token available for status update request');
      }
    }
    
    // AbortController ile timeout uygula
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options?.headers,
        },
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };
  
  /** Retry mekanizması ile request yap */
  const makeRequestWithRetry = async (authToken: string | null): Promise<Response> => {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await makeRequest(authToken);
        
        // 5xx hata ve retry hakkı varsa tekrar dene
        if (isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
          logger.warn(`⚠️ Server error (${response.status}), retrying... (${attempt + 1}/${MAX_RETRIES})`);
          await sleep(RETRY_DELAY_MS * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }
        
        return response;
      } catch (error) {
        lastError = error;
        
        // Timeout hataları retry edilmez
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error(`İstek zaman aşımına uğradı (${REQUEST_TIMEOUT_MS / 1000}s). Lütfen internet bağlantınızı kontrol edin.`);
        }
        
        // Network hatası ve retry hakkı varsa tekrar dene
        if (isRetryableError(error) && attempt < MAX_RETRIES) {
          logger.warn(`⚠️ Network error, retrying... (${attempt + 1}/${MAX_RETRIES})`);
          await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError;
  };
  
  try {
    let response = await makeRequestWithRetry(token);
    
    // 401 hatası alındıysa, token'ı force refresh et ve tekrar dene
    if (response.status === 401) {
      logger.log('🔄 Token expired, refreshing and retrying...');
      try {
        token = await authService.getIdToken(true); // Force refresh
        if (!token) {
          // Token alınamadı - oturum sonlandı
          logger.error('❌ Token refresh failed: no token returned. Redirecting to login.');
          await authService.signOut();
          window.location.href = '/login';
          throw new Error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
        }
        response = await makeRequestWithRetry(token); // Retry request
        
        // Retry sonrası hâlâ 401 ise, hesap devre dışı veya geçersiz
        if (response.status === 401) {
          logger.error('❌ Still 401 after token refresh. Account may be disabled. Redirecting to login.');
          await authService.signOut();
          window.location.href = '/login';
          throw new Error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
        }
      } catch (refreshError: unknown) {
        // Token refresh sırasında hata (hesap disable, silinen hesap vs.)
        if (refreshError instanceof Error && refreshError.message?.includes('Oturumunuz sona erdi')) {
          throw refreshError;
        }
        logger.error('❌ Token refresh error:', refreshError);
        await authService.signOut();
        window.location.href = '/login';
        throw new Error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
      }
    }
    
    if (isStatusUpdate) {
      logger.log('📡 Status update response status:', response.status, response.statusText);
    }
    
    if (isDeleteRequest) {
      logger.log('📡 DELETE response status:', response.status, response.statusText);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      const snippet = text.slice(0, 300);
      throw new ApiError(
        `Unexpected non-JSON response (${response.status} ${response.statusText}) from ${url}. Content-Type=${contentType}. Body starts with: ${snippet}`,
        { response }
      );
    }

    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      // Hata durumu
      if (isStatusUpdate) {
        logger.error('❌ Status update API error:', {
          message: data.message,
          code: data.code,
          details: data.details,
        });
      }
      if (isDeleteRequest) {
        logger.error('❌ DELETE API error:', {
          endpoint,
          message: data.message,
          code: data.code,
          details: data.details,
        });
      }
      const error = new ApiError(data.message, {
        code: data.code,
        details: data.details,
        response,
      });
      throw error;
    }
    
    // Başarılı durum
    if (isStatusUpdate) {
      logger.log('✅ Status update API success:', {
        message: data.message,
        code: data.code,
        hasData: !!data.data,
      });
    }
    
    if (isDeleteRequest) {
      logger.log('✅ DELETE API success:', {
        endpoint,
        message: data.message,
        code: data.code,
      });
    }
    
    return data.data as T;
  } catch (error: unknown) {
    if (isStatusUpdate) {
      const apiErr = error instanceof ApiError ? error : (error instanceof Error ? error : null);
      logger.error('❌ Status update API request failed:', {
        message: apiErr?.message,
        code: error instanceof ApiError ? error.code : undefined,
        details: error instanceof ApiError ? error.details : undefined,
        stack: apiErr?.stack,
      });
    }
    throw error;
  }
}

/**
 * API response'u manuel olarak parse etmek için
 * apiRequest kullanılamadığında bu kullanılabilir
 */
export function parseApiResponse<T = unknown>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new ApiError(response.message, {
      code: response.code,
      details: response.details,
    });
  }
  
  return response.data as T;
}

