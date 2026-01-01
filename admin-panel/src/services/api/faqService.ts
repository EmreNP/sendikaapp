import { apiRequest } from '@/utils/api';
import type { FAQ, CreateFAQRequest, UpdateFAQRequest, FAQListResponse } from '@/types/faq';

export const faqService = {
  /**
   * FAQ listesini getir
   */
  async getFAQ(params?: {
    page?: number;
    limit?: number;
    isPublished?: boolean;
    search?: string;
  }): Promise<FAQListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString());
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/api/faq${queryString ? `?${queryString}` : ''}`;

    return apiRequest<FAQListResponse>(endpoint);
  },

  /**
   * FAQ detayını getir
   */
  async getFAQById(id: string): Promise<{ faq: FAQ }> {
    return apiRequest<{ faq: FAQ }>(`/api/faq/${id}`);
  },

  /**
   * Yeni FAQ oluştur
   */
  async createFAQ(data: CreateFAQRequest): Promise<{ faq: FAQ }> {
    return apiRequest<{ faq: FAQ }>('/api/faq', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * FAQ güncelle
   */
  async updateFAQ(id: string, data: UpdateFAQRequest): Promise<{ faq: FAQ }> {
    return apiRequest<{ faq: FAQ }>(`/api/faq/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * FAQ sil
   */
  async deleteFAQ(id: string): Promise<void> {
    return apiRequest<void>(`/api/faq/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toplu işlem
   */
  async bulkAction(action: 'delete' | 'publish' | 'unpublish', faqIds: string[]): Promise<{
    success: boolean;
    successCount: number;
    failureCount: number;
    errors?: Array<{ faqId: string; error: string }>;
  }> {
    return apiRequest<{
      success: boolean;
      successCount: number;
      failureCount: number;
      errors?: Array<{ faqId: string; error: string }>;
    }>('/api/faq/bulk', {
      method: 'POST',
      body: JSON.stringify({ action, faqIds }),
    });
  },
};

