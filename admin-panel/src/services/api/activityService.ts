import { apiRequest } from '@/utils/api';
import type { 
  Activity, 
  CreateActivityRequest, 
  UpdateActivityRequest, 
  ActivityCategory,
  CreateActivityCategoryRequest,
  UpdateActivityCategoryRequest
} from '@/types/activity';

export const activityService = {
  // Activities
  /**
   * Aktivite listesini getir
   */
  async getActivities(params?: {
    page?: number;
    limit?: number;
    cursor?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/api/activities${queryString ? `?${queryString}` : ''}`;

    return apiRequest<{ 
      activities: Activity[];
      total?: number;
      page: number;
      limit: number;
      hasMore: boolean;
      nextCursor?: string;
    }>(endpoint);
  },

  /**
   * Aktivite detayını getir
   */
  async getActivity(id: string) {
    return apiRequest<{ activity: Activity }>(`/api/activities/${id}`);
  },

  /**
   * Yeni aktivite oluştur
   */
  async createActivity(data: CreateActivityRequest) {
    return apiRequest<{ activity: Activity }>(`/api/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Aktivite güncelle
   */
  async updateActivity(id: string, data: UpdateActivityRequest) {
    return apiRequest<{ activity: Activity }>(`/api/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Aktivite sil (soft delete)
   */
  async deleteActivity(_id: string) {
    const response = await apiRequest<{ success: true; message: string }>(`/api/activities/${_id}`, {
      method: 'DELETE',
    });
    return response;
  },

  // Activity Categories (Admin only)
  /**
   * Aktivite kategorilerini getir
   */
  async getCategories() {
    return apiRequest<{ categories: ActivityCategory[] }>('/api/activity-categories');
  },

  /**
   * Aktivite kategori detayını getir
   */
  async getCategory(id: string) {
    return apiRequest<{ category: ActivityCategory }>(`/api/activity-categories/${id}`);
  },

  /**
   * Yeni aktivite kategorisi oluştur
   */
  async createCategory(data: CreateActivityCategoryRequest) {
    return apiRequest<{ category: ActivityCategory }>(`/api/activity-categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Aktivite kategorisi güncelle
   */
  async updateCategory(id: string, data: UpdateActivityCategoryRequest) {
    return apiRequest<{ category: ActivityCategory }>(`/api/activity-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Aktivite kategorisi sil (soft delete)
   */
  async deleteCategory(_id: string) {
    const response = await apiRequest<{ success: true; message: string }>(`/api/activity-categories/${_id}`, {
      method: 'DELETE',
    });
    return response;
  },
};
