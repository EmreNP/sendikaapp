/**
 * Upload types - Generic file upload için type tanımları
 * Şu an sadece 'news' kategorisi destekleniyor
 */

export type UploadCategory = 'news';

export interface UploadImageRequest {
  file: File;
  category: UploadCategory;
}

export interface UploadImageResponse {
  imageUrl: string;
  fileName: string;
  size: number;
  contentType: string;
  category: UploadCategory;
}

