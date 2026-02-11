import { api } from '@/config/api';
import { authService } from '@/services/auth/authService';
import { logger } from '@/utils/logger';

export type UploadCategory = 'news' | 'announcements';

// Client-side dosya boyutu limitleri
const IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const IMAGE_MAX_SIZE_LABEL = '10MB';

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
    // Client-side dosya boyutu kontrolü
    if (file.size > IMAGE_MAX_SIZE) {
      throw new Error(
        `Dosya boyutu çok büyük (${(file.size / 1024 / 1024).toFixed(1)}MB). ` +
        `Maksimum boyut: ${IMAGE_MAX_SIZE_LABEL}`
      );
    }
    
    const token = await authService.getIdToken();
    const url = api.url(`/api/files/${category}/upload`);

    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // CSRF koruması
    headers['X-Requested-With'] = 'XMLHttpRequest';

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
      logger.error('Upload error response:', {
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

