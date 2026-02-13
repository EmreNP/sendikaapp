/**
 * Upload types - Generic file upload için type tanımları
 */

export type UploadCategory = 'news' | 'institution-images';

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

