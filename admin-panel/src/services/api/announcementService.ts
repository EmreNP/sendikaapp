import { apiRequest } from '@/utils/api';
import { uploadService } from './uploadService';
import type { Announcement, CreateAnnouncementRequest, UpdateAnnouncementRequest, AnnouncementListResponse } from '@/types/announcement';

export const announcementService = {
  /**
   * Duyuru listesini getir
   */
  async getAnnouncements(params?: {
    page?: number;
    limit?: number;
    isPublished?: boolean;
    isFeatured?: boolean;
    search?: string;
    branchId?: string;
  }): Promise<AnnouncementListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString());
    if (params?.isFeatured !== undefined) queryParams.append('isFeatured', params.isFeatured.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.branchId) queryParams.append('branchId', params.branchId);

    const queryString = queryParams.toString();
    const endpoint = `/api/announcements${queryString ? `?${queryString}` : ''}`;

    return apiRequest<AnnouncementListResponse>(endpoint);
  },

  /**
   * Duyuru detayını getir
   */
  async getAnnouncementById(id: string): Promise<{ announcement: Announcement }> {
    return apiRequest<{ announcement: Announcement }>(`/api/announcements/${id}`);
  },

  /**
   * Yeni duyuru oluştur
   */
  async createAnnouncement(data: CreateAnnouncementRequest): Promise<{ announcement: Announcement }> {
    return apiRequest<{ announcement: Announcement }>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Duyuru güncelle
   */
  async updateAnnouncement(id: string, data: UpdateAnnouncementRequest): Promise<{ announcement: Announcement }> {
    return apiRequest<{ announcement: Announcement }>(`/api/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Duyuru sil
   */
  async deleteAnnouncement(id: string): Promise<void> {
    return apiRequest<void>(`/api/announcements/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Görsel yükle (announcements kategorisi için)
   */
  async uploadImage(file: File): Promise<{ imageUrl: string; fileName: string; size: number; contentType: string }> {
    const result = await uploadService.uploadImage(file, 'announcements');
    return {
      imageUrl: result.imageUrl,
      fileName: result.fileName,
      size: result.size,
      contentType: result.contentType,
    };
  },

  /**
   * Toplu işlem
   */
  async bulkAction(action: 'delete' | 'publish' | 'unpublish', announcementIds: string[]): Promise<{
    success: boolean;
    successCount: number;
    failureCount: number;
    errors?: Array<{ announcementId: string; error: string }>;
  }> {
    return apiRequest<{
      success: boolean;
      successCount: number;
      failureCount: number;
      errors?: Array<{ announcementId: string; error: string }>;
    }>('/api/announcements/bulk', {
      method: 'POST',
      body: JSON.stringify({ action, announcementIds }),
    });
  },
};

