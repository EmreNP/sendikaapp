// Services API Index - Tüm servisleri tek yerden export et

export { default as api, apiClient, ApiError } from './client';
export { default as authService } from './auth';
export { default as trainingService } from './trainings';
export { default as branchService } from './branches';
export { default as newsService } from './news';
export { default as announcementService } from './announcements';
export { default as faqService } from './faq';
export { default as contactService } from './contact';

// Re-export types
export type { ApiResponse, PaginatedResponse } from '../../config/api';
export type { Training, Lesson, Content, VideoContent, DocumentContent, TestContent, LessonContent } from './trainings';
export type { Branch } from './branches';
export type { News } from './news';
export type { Announcement } from './announcements';
export type { FAQ } from './faq';
export type { ContactMessage, CreateContactMessageRequest } from './contact';
