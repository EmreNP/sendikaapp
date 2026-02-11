// HTTP Client Service - API çağrıları için merkezi client

import { API_BASE_URL, ApiResponse } from '../../config/api';
import { auth } from '../../config/firebase';

// Request options interface
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

// API Error class
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Get current user's ID token
async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Token alınamadı:', error);
    return null;
  }
}

// Main API client function
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    requireAuth = true,
  } = options;

  // Build headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add authorization header if required
  if (requireAuth) {
    const token = await getIdToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Build request config
  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  // Add body for non-GET requests
  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Parse response
    const data = await response.json();

    // Handle error responses
    if (!response.ok) {
      throw new ApiError(
        data.error?.code || 'UNKNOWN_ERROR',
        data.error?.message || 'Bir hata oluştu',
        response.status
      );
    }

    return data as ApiResponse<T>;
  } catch (error) {
    // Re-throw ApiError
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or parsing errors
    if (error instanceof TypeError) {
      throw new ApiError('NETWORK_ERROR', 'Sunucuya bağlanılamadı');
    }

    throw new ApiError('UNKNOWN_ERROR', 'Beklenmeyen bir hata oluştu');
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, requireAuth = true) =>
    apiClient<T>(endpoint, { method: 'GET', requireAuth }),

  post: <T>(endpoint: string, body?: unknown, requireAuth = true) =>
    apiClient<T>(endpoint, { method: 'POST', body, requireAuth }),

  put: <T>(endpoint: string, body?: unknown, requireAuth = true) =>
    apiClient<T>(endpoint, { method: 'PUT', body, requireAuth }),

  patch: <T>(endpoint: string, body?: unknown, requireAuth = true) =>
    apiClient<T>(endpoint, { method: 'PATCH', body, requireAuth }),

  delete: <T>(endpoint: string, requireAuth = true) =>
    apiClient<T>(endpoint, { method: 'DELETE', requireAuth }),
};

export default api;
