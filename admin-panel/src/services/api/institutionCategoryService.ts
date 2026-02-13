import { apiRequest } from '@/utils/api';
import type {
  InstitutionCategory,
  CreateInstitutionCategoryRequest,
  UpdateInstitutionCategoryRequest,
  InstitutionCategoryListResponse,
} from '@/types/contracted-institution';

export const institutionCategoryService = {
  async getCategories(params?: {
    includeInactive?: boolean;
  }): Promise<InstitutionCategoryListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.includeInactive) queryParams.append('includeInactive', 'true');
    const queryString = queryParams.toString();
    const endpoint = `/api/institution-categories${queryString ? `?${queryString}` : ''}`;
    return apiRequest<InstitutionCategoryListResponse>(endpoint);
  },

  async getCategoryById(id: string): Promise<{ category: InstitutionCategory }> {
    return apiRequest<{ category: InstitutionCategory }>(`/api/institution-categories/${id}`);
  },

  async createCategory(data: CreateInstitutionCategoryRequest): Promise<{ category: InstitutionCategory }> {
    return apiRequest<{ category: InstitutionCategory }>('/api/institution-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCategory(id: string, data: UpdateInstitutionCategoryRequest): Promise<{ category: InstitutionCategory }> {
    return apiRequest<{ category: InstitutionCategory }>(`/api/institution-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteCategory(id: string): Promise<void> {
    return apiRequest<void>(`/api/institution-categories/${id}`, { method: 'DELETE' });
  },
};
