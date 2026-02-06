// Training Service - Eğitim API calls

import { API_ENDPOINTS } from '../../config/api';
import api from './client';

// Types
export interface Training {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
}

export interface Lesson {
  id: string;
  trainingId: string;
  title: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
}

export interface VideoContent {
  id: string;
  lessonId: string;
  type: 'video';
  title: string;
  description?: string;
  videoUrl: string;
  platform: 'youtube' | 'vimeo' | 'other';
  duration?: number;
  order: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DocumentContent {
  id: string;
  lessonId: string;
  type: 'document';
  title: string;
  description?: string;
  documentUrl: string;
  fileType: 'pdf' | 'doc' | 'docx' | 'other';
  fileSize?: number;
  order: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TestContent {
  id: string;
  lessonId: string;
  type: 'test';
  title: string;
  description?: string;
  questions: TestQuestion[];
  passingScore: number;
  timeLimit?: number;
  order: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export type Content = VideoContent | DocumentContent | TestContent;

// Simplified LessonContent for CourseDetailPage
export interface LessonContent {
  id: string;
  type: 'video' | 'document' | 'test';
  title: string;
  description?: string;
  duration?: string;
  url?: string;
}

// Get all trainings
export async function getTrainings(): Promise<Training[]> {
  const response = await api.get<Training[]>(API_ENDPOINTS.TRAININGS.BASE);
  
  if (!response.success || !response.data) {
    throw new Error('Eğitimler yüklenemedi');
  }
  
  return response.data;
}

// Get single training
export async function getTraining(id: string): Promise<Training> {
  const response = await api.get<Training>(API_ENDPOINTS.TRAININGS.BY_ID(id));
  
  if (!response.success || !response.data) {
    throw new Error('Eğitim bulunamadı');
  }
  
  return response.data;
}

// Get lessons for a training
export async function getTrainingLessons(trainingId: string): Promise<Lesson[]> {
  const response = await api.get<Lesson[]>(API_ENDPOINTS.TRAININGS.LESSONS(trainingId));
  
  if (!response.success || !response.data) {
    throw new Error('Dersler yüklenemedi');
  }
  
  return response.data;
}

// Get single lesson
export async function getLesson(id: string): Promise<Lesson> {
  const response = await api.get<Lesson>(API_ENDPOINTS.LESSONS.BY_ID(id));
  
  if (!response.success || !response.data) {
    throw new Error('Ders bulunamadı');
  }
  
  return response.data;
}

// Get lesson contents
export async function getLessonContents(lessonId: string): Promise<Content[]> {
  const response = await api.get<Content[]>(API_ENDPOINTS.LESSONS.CONTENTS(lessonId));
  
  if (!response.success || !response.data) {
    throw new Error('Ders içerikleri yüklenemedi');
  }
  
  return response.data;
}

// Get lesson videos
export async function getLessonVideos(lessonId: string): Promise<VideoContent[]> {
  const response = await api.get<VideoContent[]>(API_ENDPOINTS.LESSONS.VIDEOS(lessonId));
  
  if (!response.success || !response.data) {
    throw new Error('Videolar yüklenemedi');
  }
  
  return response.data;
}

// Get lesson documents
export async function getLessonDocuments(lessonId: string): Promise<DocumentContent[]> {
  const response = await api.get<DocumentContent[]>(API_ENDPOINTS.LESSONS.DOCUMENTS(lessonId));
  
  if (!response.success || !response.data) {
    throw new Error('Dökümanlar yüklenemedi');
  }
  
  return response.data;
}

// Get lesson tests
export async function getLessonTests(lessonId: string): Promise<TestContent[]> {
  const response = await api.get<TestContent[]>(API_ENDPOINTS.LESSONS.TESTS(lessonId));
  
  if (!response.success || !response.data) {
    throw new Error('Testler yüklenemedi');
  }
  
  return response.data;
}

export default {
  getTrainings,
  getTraining,
  getTrainingLessons,
  getLesson,
  getLessonContents,
  getLessonVideos,
  getLessonDocuments,
  getLessonTests,
};
