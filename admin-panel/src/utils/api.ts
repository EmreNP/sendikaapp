/**
 * API Response Types
 * Backend'den dönen standart response formatları
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

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * API çağrısı yapar ve response'u işler
 * @param endpoint API endpoint
 * @param options Fetch options
 * @returns Parsed data veya error throw eder
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const { api } = await import('@/config/api');
  const { authService } = await import('@/services/auth/authService');
  
  // Status update endpoint'leri için detaylı log
  const isStatusUpdate = endpoint.includes('/status') && options?.method === 'PATCH';
  
  if (isStatusUpdate) {
    console.log('🌐 API Request (Status Update):', {
      endpoint,
      method: options?.method,
      hasBody: !!options?.body,
    });
    
    if (options?.body) {
      try {
        const bodyObj = JSON.parse(options.body as string);
        console.log('📦 Request body:', {
          status: bodyObj.status,
          hasNote: !!bodyObj.note,
          hasRejectionReason: !!bodyObj.rejectionReason,
          hasDocumentUrl: !!bodyObj.documentUrl,
        });
      } catch (e) {
        console.log('📦 Request body: (parse error)', e);
      }
    }
  }
  
  const token = await authService.getIdToken();
  
  const url = api.url(endpoint);
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
    if (isStatusUpdate) {
      console.log('🔑 Token available for status update request');
    }
  } else {
    if (isStatusUpdate) {
      console.warn('⚠️ No token available for status update request');
    }
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    });
    
    if (isStatusUpdate) {
      console.log('📡 Status update response status:', response.status, response.statusText);
    }
    
    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      // Hata durumu
      if (isStatusUpdate) {
        console.error('❌ Status update API error:', {
          message: data.message,
          code: data.code,
          details: data.details,
        });
      }
      const error = new Error(data.message);
      (error as any).code = data.code;
      (error as any).details = data.details;
      (error as any).response = response;
      throw error;
    }
    
    // Başarılı durum
    if (isStatusUpdate) {
      console.log('✅ Status update API success:', {
        message: data.message,
        code: data.code,
        hasData: !!data.data,
      });
    }
    
    return data.data as T;
  } catch (error: any) {
    if (isStatusUpdate) {
      console.error('❌ Status update API request failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack,
      });
    }
    throw error;
  }
}

/**
 * API response'u manuel olarak parse etmek için
 * apiRequest kullanılamadığında bu kullanılabilir
 */
export function parseApiResponse<T = any>(response: ApiResponse<T>): T {
  if (!response.success) {
    const error = new Error(response.message);
    (error as any).code = response.code;
    (error as any).details = response.details;
    throw error;
  }
  
  return response.data as T;
}

