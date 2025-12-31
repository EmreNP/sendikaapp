import { apiRequest } from '@/utils/api';
import type { 
  Content,
  VideoContent,
  DocumentContent,
  TestContent,
  CreateVideoContentRequest,
  UpdateVideoContentRequest,
  CreateDocumentContentRequest,
  UpdateDocumentContentRequest,
  CreateTestContentRequest,
  UpdateTestContentRequest,
  ContentListResponse,
  VideoListResponse,
  DocumentListResponse,
  TestListResponse,
  ContentType
} from '@/types/training';

export const contentService = {
  /**
   * Tüm içerikleri listele (lessonId ile)
   */
  async getContents(lessonId: string, params?: {
    type?: ContentType;
    isActive?: boolean;
  }): Promise<ContentListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/lessons/${lessonId}/contents${queryString ? `?${queryString}` : ''}`;

    return apiRequest<ContentListResponse>(endpoint);
  },

  /**
   * Videoları listele
   */
  async getVideos(lessonId: string, params?: {
    isActive?: boolean;
  }): Promise<VideoListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/lessons/${lessonId}/videos${queryString ? `?${queryString}` : ''}`;

    return apiRequest<VideoListResponse>(endpoint);
  },

  /**
   * Dökümanları listele
   */
  async getDocuments(lessonId: string, params?: {
    isActive?: boolean;
  }): Promise<DocumentListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/lessons/${lessonId}/documents${queryString ? `?${queryString}` : ''}`;

    return apiRequest<DocumentListResponse>(endpoint);
  },

  /**
   * Testleri listele
   */
  async getTests(lessonId: string, params?: {
    isActive?: boolean;
  }): Promise<TestListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/lessons/${lessonId}/tests${queryString ? `?${queryString}` : ''}`;

    return apiRequest<TestListResponse>(endpoint);
  },

  /**
   * Video oluştur
   */
  async createVideo(lessonId: string, data: CreateVideoContentRequest): Promise<{ video: VideoContent }> {
    return apiRequest<{ video: VideoContent }>(`/api/lessons/${lessonId}/videos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Döküman oluştur
   */
  async createDocument(lessonId: string, data: CreateDocumentContentRequest): Promise<{ document: DocumentContent }> {
    return apiRequest<{ document: DocumentContent }>(`/api/lessons/${lessonId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Test oluştur
   */
  async createTest(lessonId: string, data: CreateTestContentRequest): Promise<{ test: TestContent }> {
    return apiRequest<{ test: TestContent }>(`/api/lessons/${lessonId}/tests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Video güncelle
   */
  async updateVideo(id: string, data: UpdateVideoContentRequest): Promise<{ video: VideoContent }> {
    return apiRequest<{ video: VideoContent }>(`/api/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Döküman güncelle
   */
  async updateDocument(id: string, data: UpdateDocumentContentRequest): Promise<{ document: DocumentContent }> {
    return apiRequest<{ document: DocumentContent }>(`/api/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Test güncelle
   */
  async updateTest(id: string, data: UpdateTestContentRequest): Promise<{ test: TestContent }> {
    return apiRequest<{ test: TestContent }>(`/api/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Video sil
   */
  async deleteVideo(id: string): Promise<void> {
    return apiRequest<void>(`/api/videos/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Döküman sil
   */
  async deleteDocument(id: string): Promise<void> {
    return apiRequest<void>(`/api/documents/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Test sil
   */
  async deleteTest(id: string): Promise<void> {
    return apiRequest<void>(`/api/tests/${id}`, {
      method: 'DELETE',
    });
  },
};

