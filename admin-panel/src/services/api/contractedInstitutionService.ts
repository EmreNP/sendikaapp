import { apiRequest } from '@/utils/api';
import { uploadService } from './uploadService';
import type { 
  ContractedInstitution, 
  CreateContractedInstitutionRequest, 
  UpdateContractedInstitutionRequest, 
  ContractedInstitutionListResponse 
} from '@/types/contracted-institution';

export const contractedInstitutionService = {
  async getInstitutions(params?: {
    page?: number;
    limit?: number;
    isPublished?: boolean;
    categoryId?: string;
    search?: string;
  }): Promise<ContractedInstitutionListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString());
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();
    const endpoint = `/api/contracted-institutions${queryString ? `?${queryString}` : ''}`;
    return apiRequest<ContractedInstitutionListResponse>(endpoint);
  },

  async getInstitutionById(id: string): Promise<{ institution: ContractedInstitution }> {
    return apiRequest<{ institution: ContractedInstitution }>(`/api/contracted-institutions/${id}`);
  },

  async createInstitution(data: CreateContractedInstitutionRequest): Promise<{ institution: ContractedInstitution }> {
    return apiRequest<{ institution: ContractedInstitution }>('/api/contracted-institutions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateInstitution(id: string, data: UpdateContractedInstitutionRequest): Promise<{ institution: ContractedInstitution }> {
    return apiRequest<{ institution: ContractedInstitution }>(`/api/contracted-institutions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteInstitution(id: string): Promise<void> {
    return apiRequest<void>(`/api/contracted-institutions/${id}`, { method: 'DELETE' });
  },

  async uploadImage(file: File): Promise<{ imageUrl: string; fileName: string; size: number; contentType: string }> {
    const result = await uploadService.uploadImage(file, 'institution-images' as any);
    return { imageUrl: result.imageUrl, fileName: result.fileName, size: result.size, contentType: result.contentType };
  },

  async bulkAction(action: 'delete' | 'publish' | 'unpublish', institutionIds: string[]): Promise<{
    success: boolean;
    successCount: number;
    failureCount: number;
    errors?: Array<{ institutionId: string; error: string }>;
  }> {
    return apiRequest('/api/contracted-institutions/bulk', {
      method: 'POST',
      body: JSON.stringify({ action, institutionIds }),
    });
  },
};
