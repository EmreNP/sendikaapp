import { Timestamp } from './user';

// İçerik Tipi
export type ContentType = 'video' | 'document' | 'test';

// Video Kaynak Tipi
export type VideoSource = 'youtube' | 'vimeo' | 'uploaded';

// Eğitim (Training)
export interface Training {
  id: string;
  title: string;                    // Zorunlu, 2-200 karakter
  description?: string;              // Opsiyonel, HTML string
  isActive: boolean;                 // Aktif/Pasif durumu
  order: number;                     // Sıralama (default: 0)
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;                 // Admin UID
  updatedBy?: string;                // Admin UID
}

// Ders (Lesson)
export interface Lesson {
  id: string;
  trainingId: string;                // Hangi eğitime ait
  title: string;                      // Zorunlu, 2-200 karakter
  description?: string;               // Opsiyonel, HTML string
  order: number;                      // Ders sırası (eğitim içinde)
  isActive: boolean;                  // Aktif/Pasif durumu
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;                 // Admin UID
  updatedBy?: string;                // Admin UID
}

// Ortak İçerik Base Interface
export interface BaseContent {
  id: string;
  lessonId: string;                  // Hangi derse ait
  title: string;                      // Zorunlu, 2-200 karakter
  description?: string;               // Opsiyonel
  order: number;                      // Sıralama
  isActive: boolean;                  // Aktif/Pasif durumu
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;
  updatedBy?: string;
}

// Video İçeriği
export interface VideoContent extends BaseContent {
  type: 'video';
  videoUrl?: string;                  // YouTube/Vimeo URL veya yüklenen video URL (deprecated for uploaded videos)
  videoPath?: string;                 // Storage path for uploaded video
  videoSource: VideoSource;           // 'youtube' | 'vimeo' | 'uploaded'
  thumbnailUrl?: string;              // Thumbnail görseli (deprecated, generated on-demand)
  thumbnailPath?: string;             // Storage path for thumbnail
  duration?: number;                  // Video süresi (saniye)
}

// Döküman İçeriği
export interface DocumentContent extends BaseContent {
  type: 'document';
  documentUrl?: string;                // Döküman URL (deprecated, generated on-demand)
  documentPath: string;                // Storage path for document (required)
  documentType: 'pdf';                 // Sadece PDF
  fileSize?: number;                  // Dosya boyutu (bytes, otomatik hesaplanır)
}

// Test İçeriği
export interface TestContent extends BaseContent {
  type: 'test';
  questions: TestQuestion[];          // Sorular (sadece çoktan seçmeli)
  timeLimit?: number;                 // Süre sınırı (dakika, opsiyonel)
}

// Union Type - Tüm içerik tipleri
export type Content = VideoContent | DocumentContent | TestContent;

// Test Sorusu (Sadece çoktan seçmeli, 5 seçenek)
export interface TestQuestion {
  id: string;                         // Unique question ID
  question: string;                   // Soru metni
  options: TestOption[];              // 5 seçenek (zorunlu)
  explanation?: string;               // Açıklama (opsiyonel)
}

// Test Seçeneği (Çoktan Seçmeli)
export interface TestOption {
  id: string;                         // Unique option ID
  text: string;                       // Seçenek metni
  isCorrect: boolean;                 // Doğru cevap mı?
}

// Type Guards (TypeScript için)
export function isVideoContent(content: Content): content is VideoContent {
  return content.type === 'video';
}

export function isDocumentContent(content: Content): content is DocumentContent {
  return content.type === 'document';
}

export function isTestContent(content: Content): content is TestContent {
  return content.type === 'test';
}

// API Request/Response Types

// Training
export interface CreateTrainingRequest {
  title: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateTrainingRequest {
  title?: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

// Lesson
export interface CreateLessonRequest {
  trainingId: string;
  title: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateLessonRequest {
  title?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

// Video Content
export interface CreateVideoContentRequest {
  lessonId: string;
  title: string;
  description?: string;
  videoUrl?: string;                  // YouTube/Vimeo URL (required for youtube/vimeo)
  videoPath?: string;                 // Storage path (required for uploaded)
  videoSource: VideoSource;           // 'youtube' | 'vimeo' | 'uploaded'
  thumbnailUrl?: string;              // Deprecated, use thumbnailPath
  thumbnailPath?: string;             // Storage path for thumbnail
  duration?: number;
  order?: number;
  isActive?: boolean;
}

export interface UpdateVideoContentRequest {
  title?: string;
  description?: string;
  videoUrl?: string;                  // YouTube/Vimeo URL
  videoPath?: string;                 // Storage path for uploaded video
  videoSource?: VideoSource;
  thumbnailUrl?: string;              // Deprecated, use thumbnailPath
  thumbnailPath?: string;             // Storage path for thumbnail
  duration?: number;
  order?: number;
  isActive?: boolean;
}

// Document Content
export interface CreateDocumentContentRequest {
  lessonId: string;
  title: string;
  description?: string;
  documentUrl?: string;               // Deprecated, use documentPath
  documentPath?: string;              // Storage path (required for new uploads)
  documentType?: 'pdf';               // Opsiyonel, backend'de otomatik 'pdf' olarak set edilir
  fileSize?: number;                  // Opsiyonel, otomatik hesaplanır
  order?: number;
  isActive?: boolean;
}

export interface UpdateDocumentContentRequest {
  title?: string;
  description?: string;
  documentUrl?: string;               // Deprecated, use documentPath
  documentPath?: string;              // Storage path
  documentType?: 'pdf';               // Opsiyonel, backend'de otomatik 'pdf' olarak set edilir
  fileSize?: number;                  // Opsiyonel, otomatik hesaplanır
  order?: number;
  isActive?: boolean;
}

// Test Content
export interface CreateTestContentRequest {
  lessonId: string;
  title: string;
  description?: string;
  questions: Omit<TestQuestion, 'id'>[]; // ID backend'de oluşturulacak, her soru 5 seçenek içermeli
  timeLimit?: number;
  order?: number;
  isActive?: boolean;
}

export interface UpdateTestContentRequest {
  title?: string;
  description?: string;
  questions?: Omit<TestQuestion, 'id'>[];
  timeLimit?: number;
  order?: number;
  isActive?: boolean;
}

// Bulk Operations
export type BulkTrainingAction = 'delete' | 'activate' | 'deactivate';

export interface BulkTrainingActionRequest {
  action: BulkTrainingAction;
  trainingIds: string[];
}

export interface BulkTrainingActionResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: Array<{
    trainingId: string;
    error: string;
  }>;
}

