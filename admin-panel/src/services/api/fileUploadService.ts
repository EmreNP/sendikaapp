export interface FileUploadResponse {
  documentUrl: string;
  fileName: string;
  size: number;
  contentType: string;
}

/**
 * Dosya yükleme servisi
 */
export const fileUploadService = {
  /**
   * Döküman yükle (lesson-documents kategorisi)
   */
  async uploadDocument(file: File): Promise<FileUploadResponse> {
    const { api } = await import('@/config/api');
    const { authService } = await import('@/services/auth/authService');
    
    const token = await authService.getIdToken();
    if (!token) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    const formData = new FormData();
    formData.append('file', file);

    const url = api.url('/api/files/lesson-documents/upload');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Dosya yüklenirken bir hata oluştu');
    }

    return {
      documentUrl: data.data.documentUrl || data.data.fileUrl,
      fileName: data.data.fileName,
      size: data.data.size,
      contentType: data.data.contentType,
    };
  },

  /**
   * Video yükle (videos kategorisi)
   */
  async uploadVideo(file: File): Promise<FileUploadResponse> {
    const { api } = await import('@/config/api');
    const { authService } = await import('@/services/auth/authService');
    
    const token = await authService.getIdToken();
    if (!token) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    const formData = new FormData();
    formData.append('file', file);

    const url = api.url('/api/files/videos/upload');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Video yüklenirken bir hata oluştu');
    }

    return {
      documentUrl: data.data.documentUrl || data.data.fileUrl,
      fileName: data.data.fileName,
      size: data.data.size,
      contentType: data.data.contentType,
    };
  },

  /**
   * Video thumbnail yükle (video-thumbnails kategorisi)
   */
  async uploadThumbnail(file: File): Promise<FileUploadResponse> {
    const { api } = await import('@/config/api');
    const { authService } = await import('@/services/auth/authService');
    
    const token = await authService.getIdToken();
    if (!token) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    const formData = new FormData();
    formData.append('file', file);

    const url = api.url('/api/files/video-thumbnails/upload');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Thumbnail yüklenirken bir hata oluştu');
    }

    return {
      documentUrl: data.data.documentUrl || data.data.fileUrl,
      fileName: data.data.fileName,
      size: data.data.size,
      contentType: data.data.contentType,
    };
  },

  /**
   * Aktivite resmi yükle (activity-images kategorisi)
   */
  async uploadActivityImage(file: File): Promise<FileUploadResponse> {
    const { api } = await import('@/config/api');
    const { authService } = await import('@/services/auth/authService');
    
    const token = await authService.getIdToken();
    if (!token) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    const formData = new FormData();
    formData.append('file', file);

    const url = api.url('/api/files/activity-images/upload');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Resim yüklenirken bir hata oluştu');
    }

    return {
      documentUrl: data.data.documentUrl || data.data.fileUrl,
      fileName: data.data.fileName,
      size: data.data.size,
      contentType: data.data.contentType,
    };
  },
};

