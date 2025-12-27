/**
 * API Configuration
 * Backend API base URL'i environment variable'dan alır
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * API endpoint'lerini oluşturur
 */
export const api = {
  /**
   * Full API URL oluşturur
   */
  url: (endpoint: string): string => {
    // Eğer endpoint zaten full URL ise, olduğu gibi döndür
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    
    // Base URL'den trailing slash'i kaldır
    const baseUrl = API_BASE_URL.replace(/\/$/, '');
    
    // Endpoint'ten leading slash'i kaldır
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    return `${baseUrl}/${cleanEndpoint}`;
  },
  
  /**
   * API çağrısı yapar
   */
  fetch: async (endpoint: string, options?: RequestInit): Promise<Response> => {
    const url = api.url(endpoint);
    
    // Default headers
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Token varsa ekle
    const { authService } = await import('@/services/auth/authService');
    const token = await authService.getIdToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    // Options'ı merge et
    const mergedOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    };
    
    return fetch(url, mergedOptions);
  },
};

