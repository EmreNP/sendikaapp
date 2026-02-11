// API Configuration

const envApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.API_BASE_URL;

export const API_BASE_URL = (envApiBaseUrl || 'https://sendikaapp.web.app/api').replace(/\/$/, '');

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER_BASIC: '/api/auth/register/basic',
    REGISTER_DETAILS: '/api/auth/register/details',
  },
  // Users
  USERS: {
    ME: '/api/users/me',
    BASE: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
  },
  // Trainings
  TRAININGS: {
    BASE: '/api/trainings',
    BY_ID: (id: string) => `/api/trainings/${id}`,
    LESSONS: (trainingId: string) => `/api/trainings/${trainingId}/lessons`,
    LESSON_BY_ID: (trainingId: string, lessonId: string) => `/api/trainings/${trainingId}/lessons/${lessonId}`,
  },
  // Lessons (contents, videos, documents, tests)
  LESSONS: {
    BY_ID: (id: string) => `/api/lessons/${id}`,
    CONTENTS: (id: string) => `/api/lessons/${id}/contents`,
    VIDEOS: (id: string) => `/api/lessons/${id}/videos`,
    DOCUMENTS: (id: string) => `/api/lessons/${id}/documents`,
    TESTS: (id: string) => `/api/lessons/${id}/tests`,
  },
  // Tests
  TESTS: {
    BY_ID: (id: string) => `/api/tests/${id}`,
  },
  // Branches
  BRANCHES: {
    BASE: '/api/branches',
    BY_ID: (id: string) => `/api/branches/${id}`,
  },
  // News
  NEWS: {
    BASE: '/api/news',
    BY_ID: (id: string) => `/api/news/${id}`,
  },
  // Announcements
  ANNOUNCEMENTS: {
    BASE: '/api/announcements',
    BY_ID: (id: string) => `/api/announcements/${id}`,
  },
  // FAQ
  FAQ: {
    BASE: '/api/faq',
    BY_ID: (id: string) => `/api/faq/${id}`,
  },
  // Contact
  CONTACT: {
    BASE: '/api/contact-messages',
  },
};
