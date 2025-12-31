import { apiRequest } from '@/utils/api';
import type { 
  Training, 
  CreateTrainingRequest, 
  UpdateTrainingRequest,
  TrainingListResponse,
  BulkTrainingAction,
  BulkTrainingActionResult
} from '@/types/training';

export const trainingService = {
  /**
   * Eğitim listesini getir
   */
  async getTrainings(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }): Promise<TrainingListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/api/trainings${queryString ? `?${queryString}` : ''}`;

    return apiRequest<TrainingListResponse>(endpoint);
  },

  /**
   * Eğitim detayını getir
   */
  async getTraining(id: string): Promise<{ training: Training }> {
    return apiRequest<{ training: Training }>(`/api/trainings/${id}`);
  },

  /**
   * Yeni eğitim oluştur
   */
  async createTraining(data: CreateTrainingRequest): Promise<{ training: Training }> {
    return apiRequest<{ training: Training }>('/api/trainings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eğitim güncelle
   */
  async updateTraining(id: string, data: UpdateTrainingRequest): Promise<{ training: Training }> {
    return apiRequest<{ training: Training }>(`/api/trainings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eğitim sil
   */
  async deleteTraining(id: string): Promise<void> {
    return apiRequest<void>(`/api/trainings/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toplu işlem
   */
  async bulkAction(action: BulkTrainingAction, trainingIds: string[]): Promise<BulkTrainingActionResult> {
    return apiRequest<BulkTrainingActionResult>('/api/trainings/bulk', {
      method: 'POST',
      body: JSON.stringify({ action, trainingIds }),
    });
  },
};

