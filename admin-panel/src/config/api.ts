/**
 * API Configuration
 * Backend API base URL'i environment variable'dan alır
 */
// Default comes from build-time Vite env. At runtime prefer an explicit override or auto-detect localhost.
const BUILD_API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const API_BASE_URL = ((): string => {
  // 1) If a runtime override is provided (set window.__API_BASE__), use it. Useful for local preview of prod build.
  // 2) If opened on localhost, prefer local backend on port 3001 (developer-friendly).
  // 3) Otherwise fall back to build-time value (usually '/api').
  try {
    // @ts-ignore - window variable used intentionally
    const runtimeOverride = (typeof window !== 'undefined' && window.__API_BASE__) as string | undefined;
    if (runtimeOverride && runtimeOverride.length > 0) return runtimeOverride.replace(/\/$/, '');

    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:3001';
    }
  } catch (e) {
    // ignore
  }

  return BUILD_API_BASE.replace(/\/$/, '');
})();

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
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // If baseUrl already ends with '/api' (e.g. Firebase Hosting rewrite proxy) and
    // endpoint also starts with 'api/...', avoid generating '/api/api/...'.
    if (baseUrl.endsWith('/api') && (cleanEndpoint === 'api' || cleanEndpoint.startsWith('api/'))) {
      cleanEndpoint = cleanEndpoint === 'api' ? '' : cleanEndpoint.slice('api/'.length);
    }

    return cleanEndpoint.length > 0 ? `${baseUrl}/${cleanEndpoint}` : baseUrl;
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

