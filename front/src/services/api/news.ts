// News Service - Haber API calls

import { API_ENDPOINTS, PaginatedResponse } from '../../config/api';
import api from './client';

// Types
export interface News {
  id: string;
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  isPublished: boolean;
  publishedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
}

// Get all news (public)
export async function getNews(page = 1, limit = 10): Promise<{ news: News[]; pagination?: any }> {
  const response = await api.get<News[]>(
    `${API_ENDPOINTS.NEWS.BASE}?page=${page}&limit=${limit}`,
    false
  ) as PaginatedResponse<News>;
  
  if (!response.success || !response.data) {
    throw new Error('Haberler yüklenemedi');
  }
  
  return {
    news: response.data,
    pagination: response.pagination,
  };
}

// Get single news
export async function getNewsById(id: string): Promise<News> {
  const response = await api.get<News>(API_ENDPOINTS.NEWS.BY_ID(id), false);
  
  if (!response.success || !response.data) {
    throw new Error('Haber bulunamadı');
  }
  
  return response.data;
}

export default {
  getNews,
  getNewsById,
};
