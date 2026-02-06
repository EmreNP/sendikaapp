// Announcement Service - Duyuru API calls

import { API_ENDPOINTS, PaginatedResponse } from '../../config/api';
import api from './client';

// Types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isPublished: boolean;
  publishedAt?: Date | string;
  expiresAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
}

// Get all announcements (public)
export async function getAnnouncements(page = 1, limit = 10): Promise<{ announcements: Announcement[]; pagination?: any }> {
  const response = await api.get<Announcement[]>(
    `${API_ENDPOINTS.ANNOUNCEMENTS.BASE}?page=${page}&limit=${limit}`,
    false
  ) as PaginatedResponse<Announcement>;
  
  if (!response.success || !response.data) {
    throw new Error('Duyurular yüklenemedi');
  }
  
  return {
    announcements: response.data,
    pagination: response.pagination,
  };
}

// Get single announcement
export async function getAnnouncementById(id: string): Promise<Announcement> {
  const response = await api.get<Announcement>(API_ENDPOINTS.ANNOUNCEMENTS.BY_ID(id), false);
  
  if (!response.success || !response.data) {
    throw new Error('Duyuru bulunamadı');
  }
  
  return response.data;
}

export default {
  getAnnouncements,
  getAnnouncementById,
};
