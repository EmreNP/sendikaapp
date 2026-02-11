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
 * 401 hatası alındığında token'ı refresh eder ve otomatik retry yapar
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
  
  // İlk deneme: Cache'lenmiş token ile
  let token = await authService.getIdToken(false);
  const url = api.url(endpoint);
  
  const makeRequest = async (authToken: string | null): Promise<Response> => {
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      defaultHeaders['Authorization'] = `Bearer ${authToken}`;
      if (isStatusUpdate) {
        console.log('🔑 Token available for status update request');
      }
    } else {
      if (isStatusUpdate) {
        console.warn('⚠️ No token available for status update request');
      }
    }
    
    return fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    });
  };
  
  try {
    let response = await makeRequest(token);
    
    // 401 hatası alındıysa, token'ı force refresh et ve tekrar dene
    if (response.status === 401) {
      console.log('🔄 Token expired, refreshing and retrying...');
      token = await authService.getIdToken(true); // Force refresh
      response = await makeRequest(token); // Retry request
    }
    
    if (isStatusUpdate) {
      console.log('📡 Status update response status:', response.status, response.statusText);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      const snippet = text.slice(0, 300);
      const error = new Error(
        `Unexpected non-JSON response (${response.status} ${response.statusText}) from ${url}. Content-Type=${contentType}. Body starts with: ${snippet}`
      );
      (error as any).response = response;
      throw error;
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

