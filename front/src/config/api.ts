// API Configuration - Backend Endpoint'leri

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API Endpoints
export const API_ENDPOINTS = {
  // Health Check
  HEALTH: '/api/health',

  // Auth Endpoints
  AUTH: {
    REGISTER_BASIC: '/api/auth/register/basic',
    REGISTER_DETAILS: '/api/auth/register/details',
    PASSWORD_CHANGE: '/api/auth/password/change',
    PASSWORD_RESET: '/api/auth/password/reset',
  },

  // User Endpoints
  USERS: {
    BASE: '/api/users',
    ME: '/api/users/me',
    STATS: '/api/users/stats',
    BULK: '/api/users/bulk',
    BY_ID: (id: string) => `/api/users/${id}`,
    STATUS: (id: string) => `/api/users/${id}/status`,
    ROLE: (id: string) => `/api/users/${id}/role`,
    BRANCH: (id: string) => `/api/users/${id}/branch`,
    ACTIVATE: (id: string) => `/api/users/${id}/activate`,
    DEACTIVATE: (id: string) => `/api/users/${id}/deactivate`,
  },

  // Training Endpoints
  TRAININGS: {
    BASE: '/api/trainings',
    BULK: '/api/trainings/bulk',
    BY_ID: (id: string) => `/api/trainings/${id}`,
    LESSONS: (trainingId: string) => `/api/trainings/${trainingId}/lessons`,
  },

  // Lesson Endpoints
  LESSONS: {
    BY_ID: (id: string) => `/api/lessons/${id}`,
    CONTENTS: (id: string) => `/api/lessons/${id}/contents`,
    VIDEOS: (id: string) => `/api/lessons/${id}/videos`,
    DOCUMENTS: (id: string) => `/api/lessons/${id}/documents`,
    TESTS: (id: string) => `/api/lessons/${id}/tests`,
  },

  // Video Endpoints
  VIDEOS: {
    BY_ID: (id: string) => `/api/videos/${id}`,
  },

  // Test Endpoints
  TESTS: {
    BY_ID: (id: string) => `/api/tests/${id}`,
  },

  // Branch Endpoints
  BRANCHES: {
    BASE: '/api/branches',
    BY_ID: (id: string) => `/api/branches/${id}`,
  },

  // News Endpoints
  NEWS: {
    BASE: '/api/news',
    BULK: '/api/news/bulk',
    BY_ID: (id: string) => `/api/news/${id}`,
  },

  // Announcement Endpoints
  ANNOUNCEMENTS: {
    BASE: '/api/announcements',
    BULK: '/api/announcements/bulk',
    BY_ID: (id: string) => `/api/announcements/${id}`,
  },

  // Topic Endpoints
  TOPICS: {
    BASE: '/api/topics',
    BY_ID: (id: string) => `/api/topics/${id}`,
  },

  // Contact Message Endpoints
  CONTACT: {
    BASE: '/api/contact-messages',
    BY_ID: (id: string) => `/api/contact-messages/${id}`,
  },

  // Activity Endpoints
  ACTIVITIES: {
    BASE: '/api/activities',
    BY_ID: (id: string) => `/api/activities/${id}`,
  },

  // Activity Category Endpoints
  ACTIVITY_CATEGORIES: {
    BASE: '/api/activity-categories',
    BY_ID: (id: string) => `/api/activity-categories/${id}`,
  },

  // FAQ Endpoints
  FAQ: {
    BASE: '/api/faq',
    BY_ID: (id: string) => `/api/faq/${id}`,
  },

  // Notification Endpoints
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    BY_ID: (id: string) => `/api/notifications/${id}`,
  },

  // File Upload Endpoints
  FILES: {
    NEWS_UPLOAD: '/api/files/news/upload',
    ANNOUNCEMENTS_UPLOAD: '/api/files/announcements/upload',
    USER_DOCUMENTS_UPLOAD: '/api/files/user-documents/upload',
  },
} as const;

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
