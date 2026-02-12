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

// ==================== Dosya boyutu limitleri ====================
const FILE_SIZE_LIMITS: Record<string, { maxBytes: number; label: string }> = {
  'lesson-documents': { maxBytes: 20 * 1024 * 1024, label: '20MB' },
  'videos': { maxBytes: 100 * 1024 * 1024, label: '100MB' },
  'video-thumbnails': { maxBytes: 2 * 1024 * 1024, label: '2MB' },
  'news': { maxBytes: 10 * 1024 * 1024, label: '10MB' },
  'announcements': { maxBytes: 10 * 1024 * 1024, label: '10MB' },
  'activity-images': { maxBytes: 10 * 1024 * 1024, label: '10MB' },
  'user-documents': { maxBytes: 20 * 1024 * 1024, label: '20MB' },
};

const UPLOAD_TIMEOUT_MS = 120_000; // 2 dakika upload timeout

/** Client-side dosya boyutu kontrolü — yüklenmeden önce hata ver */
function validateFileSize(file: File, category: string): void {
  const limit = FILE_SIZE_LIMITS[category];
  if (limit && file.size > limit.maxBytes) {
    throw new Error(
      `Dosya boyutu çok büyük (${(file.size / 1024 / 1024).toFixed(1)}MB). ` +
      `Maksimum boyut: ${limit.label}`
    );
  }
}

/**
 * Upload file with real progress tracking using XMLHttpRequest
 * Includes timeout protection
 */
async function uploadFileWithProgress(
  url: string,
  formData: FormData,
  token: string,
  onProgress?: UploadProgressCallback
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Upload timeout
    xhr.timeout = UPLOAD_TIMEOUT_MS;

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

    xhr.addEventListener('timeout', () => {
      reject(new Error(`Upload zaman aşımına uğradı (${UPLOAD_TIMEOUT_MS / 1000}s). Dosya çok büyük olabilir veya internet bağlantınız yavaş.`));
    });

    // Send request
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
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
    validateFileSize(file, 'lesson-documents');
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
    validateFileSize(file, 'videos');
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
    validateFileSize(file, 'video-thumbnails');
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
    validateFileSize(file, 'activity-images');
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
