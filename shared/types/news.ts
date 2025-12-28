import { Timestamp } from './user';

export interface News {
  id: string;
  title: string;                    // Zorunlu, 2-200 karakter
  content?: string;                  // HTML string (sanitize edilmiş), externalUrl yoksa zorunlu
  externalUrl?: string;              // URL string, content yoksa zorunlu
  imageUrl?: string;                 // Opsiyonel görsel URL
  isPublished: boolean;              // Yayın durumu
  isFeatured: boolean;                // Öne çıkan haber (default: false)
  publishedAt?: Timestamp | Date;    // Yayınlanma tarihi (isPublished: true ise set edilir)
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;                 // Admin UID
  updatedBy?: string;                 // Admin UID
}

// API Request/Response Types
export interface CreateNewsRequest {
  title: string;
  content?: string;        // HTML string - externalUrl yoksa zorunlu
  externalUrl?: string;    // URL string - content yoksa zorunlu
  imageUrl?: string;
  isPublished?: boolean;  // Default: false
  isFeatured?: boolean;   // Default: false
}

export interface UpdateNewsRequest {
  title?: string;
  content?: string;
  externalUrl?: string;
  imageUrl?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  publishedAt?: string;    // ISO date string (manuel set için)
}

// Bulk operations
export type BulkNewsAction = 'delete' | 'publish' | 'unpublish';

export interface BulkNewsActionRequest {
  action: BulkNewsAction;
  newsIds: string[];
}

export interface BulkNewsActionResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: Array<{
    newsId: string;
    error: string;
  }>;
}

