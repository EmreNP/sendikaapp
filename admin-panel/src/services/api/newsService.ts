import { apiRequest } from '@/utils/api';
import { uploadService } from './uploadService';
import type { News, CreateNewsRequest, UpdateNewsRequest, NewsListResponse } from '@/types/news';

export const newsService = {
  /**
   * Haber listesini getir
   */
  async getNews(params?: {
    page?: number;
    limit?: number;
    isPublished?: boolean;
    isFeatured?: boolean;
    search?: string;
  }): Promise<NewsListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString());
    if (params?.isFeatured !== undefined) queryParams.append('isFeatured', params.isFeatured.toString());
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/api/news${queryString ? `?${queryString}` : ''}`;

    return apiRequest<NewsListResponse>(endpoint);
  },

  /**
   * Haber detayını getir
   */
  async getNewsById(id: string): Promise<{ news: News }> {
    return apiRequest<{ news: News }>(`/api/news/${id}`);
  },

  /**
   * Yeni haber oluştur
   */
  async createNews(data: CreateNewsRequest): Promise<{ news: News }> {
    return apiRequest<{ news: News }>('/api/news', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Haber güncelle
   */
  async updateNews(id: string, data: UpdateNewsRequest): Promise<{ news: News }> {
    return apiRequest<{ news: News }>(`/api/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Haber sil
   */
  async deleteNews(id: string): Promise<void> {
    return apiRequest<void>(`/api/news/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Görsel yükle (news kategorisi için)
   */
  async uploadImage(file: File): Promise<{ imageUrl: string; fileName: string; size: number; contentType: string }> {
    const result = await uploadService.uploadImage(file, 'news');
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
  async bulkAction(action: 'delete' | 'publish' | 'unpublish', newsIds: string[]): Promise<{
    success: boolean;
    successCount: number;
    failureCount: number;
    errors?: Array<{ newsId: string; error: string }>;
  }> {
    return apiRequest<{
      success: boolean;
      successCount: number;
      failureCount: number;
      errors?: Array<{ newsId: string; error: string }>;
    }>('/api/news/bulk', {
      method: 'POST',
      body: JSON.stringify({ action, newsIds }),
    });
  },
};

