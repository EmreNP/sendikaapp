import { apiRequest } from '@/utils/api';
import type { 
  Lesson, 
  CreateLessonRequest, 
  UpdateLessonRequest,
  LessonListResponse
} from '@/types/training';

export const lessonService = {
  /**
   * Ders listesini getir (trainingId ile)
   */
  async getLessons(trainingId: string, params?: {
    isActive?: boolean;
  }): Promise<LessonListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/trainings/${trainingId}/lessons${queryString ? `?${queryString}` : ''}`;

    return apiRequest<LessonListResponse>(endpoint);
  },

  /**
   * Ders detayını getir
   */
  async getLesson(id: string): Promise<{ lesson: Lesson }> {
    return apiRequest<{ lesson: Lesson }>(`/api/lessons/${id}`);
  },

  /**
   * Yeni ders oluştur
   */
  async createLesson(trainingId: string, data: CreateLessonRequest): Promise<{ lesson: Lesson }> {
    return apiRequest<{ lesson: Lesson }>(`/api/trainings/${trainingId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Ders güncelle
   */
  async updateLesson(id: string, data: UpdateLessonRequest): Promise<{ lesson: Lesson }> {
    return apiRequest<{ lesson: Lesson }>(`/api/lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Ders sil
   */
  async deleteLesson(id: string): Promise<void> {
    return apiRequest<void>(`/api/lessons/${id}`, {
      method: 'DELETE',
    });
  },
};

