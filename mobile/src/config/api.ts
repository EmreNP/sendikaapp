// API Configuration

import { Platform } from 'react-native';

const envApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.API_BASE_URL;

const DEFAULT_PROD_API_ORIGIN = 'https://sendikaapp.web.app';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, '');
}

function getDefaultApiBaseUrl(): string {
  // If we are on web and hosted on a real domain, prefer same-origin.
  // If we are on localhost (expo start --web), default to production backend.
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return DEFAULT_PROD_API_ORIGIN;
    }
    return window.location.origin;
  }

  // Native builds: default to production backend unless overridden by env.
  return DEFAULT_PROD_API_ORIGIN;
}

export const API_BASE_URL = normalizeBaseUrl(envApiBaseUrl || getDefaultApiBaseUrl());

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
