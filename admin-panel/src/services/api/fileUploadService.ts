export interface FileUploadResponse {
  documentUrl: string;      // Deprecated - 7 günlük signed URL
  storagePath?: string;     // NEW - use this for storage path
  fileName: string;
  size: number;
  contentType: string;
}

/**
 * Upload progress callback type
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * Upload file with real progress tracking using XMLHttpRequest
 */
async function uploadFileWithProgress(
  url: string,
  formData: FormData,
  token: string,
  onProgress?: UploadProgressCallback
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.message || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    // Send request
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

/**
 * Dosya yükleme servisi
 */
export const fileUploadService = {
  /**
   * Döküman yükle (lesson-documents kategorisi)
   */
  async uploadDocument(file: File, onProgress?: UploadProgressCallback): Promise<FileUploadResponse> {
    const { api } = await import('@/config/api');
    const { authService } = await import('@/services/auth/authService');
    
    const token = await authService.getIdToken();
    if (!token) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    const formData = new FormData();
    formData.append('file', file);

    const url = api.url('/api/files/lesson-documents/upload');

    const data = await uploadFileWithProgress(url, formData, token, onProgress);

    if (!data.success) {
      throw new Error(data.message || 'Dosya yüklenirken bir hata oluştu');
    }

    return {
      documentUrl: data.data.documentUrl || data.data.fileUrl,
      storagePath: data.data.storagePath,  // NEW - storage path
      fileName: data.data.fileName,
      size: data.data.size,
      contentType: data.data.contentType,
    };
  },

  /**
   * Video yükle (videos kategorisi)
   */
  async uploadVideo(file: File, onProgress?: UploadProgressCallback): Promise<FileUploadResponse> {
    const { api } = await import('@/config/api');
    const { authService } = await import('@/services/auth/authService');
    
    const token = await authService.getIdToken();
    if (!token) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    const formData = new FormData();
    formData.append('file', file);

    const url = api.url('/api/files/videos/upload');

    const data = await uploadFileWithProgress(url, formData, token, onProgress);

    if (!data.success) {
      throw new Error(data.message || 'Video yüklenirken bir hata oluştu');
    }

    return {
      documentUrl: data.data.documentUrl || data.data.fileUrl,
      storagePath: data.data.storagePath,  // NEW - storage path
      fileName: data.data.fileName,
      size: data.data.size,
      contentType: data.data.contentType,
    };
  },

  /**
   * Video thumbnail yükle (video-thumbnails kategorisi)
   */
  async uploadThumbnail(file: File, onProgress?: UploadProgressCallback): Promise<FileUploadResponse> {
    const { api } = await import('@/config/api');
    const { authService } = await import('@/services/auth/authService');
    
    const token = await authService.getIdToken();
    if (!token) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    const formData = new FormData();
    formData.append('file', file);

    const url = api.url('/api/files/video-thumbnails/upload');

    const data = await uploadFileWithProgress(url, formData, token, onProgress);

    if (!data.success) {
      throw new Error(data.message || 'Thumbnail yüklenirken bir hata oluştu');
    }

    return {
      documentUrl: data.data.documentUrl || data.data.fileUrl,
      storagePath: data.data.storagePath,  // NEW - storage path
      fileName: data.data.fileName,
      size: data.data.size,
      contentType: data.data.contentType,
    };
  },

  /**
   * Aktivite resmi yükle (activity-images kategorisi)
   */
  async uploadActivityImage(file: File, onProgress?: UploadProgressCallback): Promise<FileUploadResponse> {
    const { api } = await import('@/config/api');
    const { authService } = await import('@/services/auth/authService');
    
    const token = await authService.getIdToken();
    if (!token) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    const formData = new FormData();
    formData.append('file', file);

    const url = api.url('/api/files/activity-images/upload');

    const data = await uploadFileWithProgress(url, formData, token, onProgress);

    if (!data.success) {
      throw new Error(data.message || 'Resim yüklenirken bir hata oluştu');
    }

    return {
      documentUrl: data.data.documentUrl || data.data.fileUrl,
      storagePath: data.data.storagePath,  // NEW - storage path
      fileName: data.data.fileName,
      size: data.data.size,
      contentType: data.data.contentType,
    };
  },
};
