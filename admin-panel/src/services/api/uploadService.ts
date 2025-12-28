import { api } from '@/config/api';
import { authService } from '@/services/auth/authService';

export type UploadCategory = 'news';

export interface UploadImageResponse {
  imageUrl: string;
  fileName: string;
  size: number;
  contentType: string;
  category: UploadCategory;
}

export const uploadService = {
  /**
   * Görsel yükle
   * @param file Yüklenecek dosya
   * @param category Kategori (şu an sadece 'news')
   */
  async uploadImage(
    file: File,
    category: UploadCategory = 'news'
  ): Promise<UploadImageResponse> {
    const token = await authService.getIdToken();
    const url = api.url(`/api/files/${category}/upload`);

    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      const error = new Error(data.message || 'Görsel yüklenirken bir hata oluştu');
      (error as any).code = data.code;
      (error as any).details = data.details;
      console.error('Upload error response:', {
        status: response.status,
        message: data.message,
        code: data.code,
        details: data.details,
      });
      throw error;
    }

    return data.data;
  },
};

