/**
 * API Configuration
 * Backend API base URL'i environment variable'dan alır
 *
 * SECURITY NOTE:
 * Runtime window overrides (e.g. window.__API_BASE__) are intentionally NOT
 * supported. Allowing a mutable runtime source for the API base URL creates an
 * XSS-to-credential-exfiltration vector: an attacker who can run JS before this
 * module loads can redirect every Bearer-token request to an arbitrary domain.
 * The URL is therefore derived exclusively from:
 *   1. The build-time VITE_API_BASE_URL env variable (baked in at compile time).
 *   2. A localhost heuristic for local development (hostname === localhost/127.0.0.1).
 * Neither value can be influenced by runtime JS.
 */

// Build-time constant — baked into the bundle, cannot be mutated at runtime.
const BUILD_API_BASE: string = import.meta.env.VITE_API_BASE_URL || '/api';

export const API_BASE_URL: string = (() => {
  // Local-dev convenience: if the page is opened on localhost, point to the
  // local backend (port 3001). This branch only activates on localhost so it
  // cannot be abused in production.
  try {
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      return 'http://localhost:3001';
    }
  } catch {
    // ignore – e.g. SSR / non-browser environments
  }

  return BUILD_API_BASE.replace(/\/$/, '');
})();

/**
 * Allowed origins that may receive a Bearer token.
 *
 * Only origins that are known at module-load time (same origin + localhost for
 * dev) are permitted.  If a constructed request URL resolves to any other
 * origin the Authorization header is withheld and an error is thrown, so that
 * a DOM-level XSS cannot silently exfiltrate credentials to a third-party host.
 */
const ALLOWED_TOKEN_ORIGINS: ReadonlySet<string> = (() => {
  const set = new Set<string>();
  // localhost / 127.0.0.1 dev backends
  set.add('http://localhost:3001');
  set.add('http://127.0.0.1:3001');
  // Same origin (production — resolved at runtime, cannot be spoofed by JS)
  if (typeof window !== 'undefined') {
    set.add(window.location.origin);
  }
  return set as ReadonlySet<string>;
})();

/**
 * Returns true when `url` is safe to attach a Bearer token to.
 * Relative URLs are always considered same-origin and therefore safe.
 */
function isTrustedOrigin(url: string): boolean {
  // Relative URLs resolve to the same origin — always trusted.
  if (!url.startsWith('http://') && !url.startsWith('https://')) return true;
  try {
    const { origin } = new URL(url);
    return ALLOWED_TOKEN_ORIGINS.has(origin);
  } catch {
    return false;
  }
}

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
    
    // Default headers - FormData ise Content-Type set etme
    const defaultHeaders: HeadersInit = {};
    
    if (!(options?.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }
    
    // CSRF koruması: Custom header ekle
    defaultHeaders['X-Requested-With'] = 'XMLHttpRequest';
    
    // Token eklemeden önce hedef origin'in güvenilir olduğunu doğrula.
    // Güvenilir değilse token eklenmez ve hata fırlatılır; böylece DOM-XSS
    // yoluyla credential exfiltration engellenir.
    if (!isTrustedOrigin(url)) {
      throw new Error(
        `[api] Güvenlik ihlali: '${url}' izin verilmeyen bir origin'e işaret ediyor. ` +
          'Bearer token gönderilmedi.',
      );
    }

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

