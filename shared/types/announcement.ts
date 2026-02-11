import { Timestamp } from './user';

export interface Announcement {
  id: string;
  title: string;                    // Zorunlu, 2-200 karakter
  content?: string;                  // HTML string (sanitize edilmiş), externalUrl yoksa zorunlu
  externalUrl?: string;              // URL string, content yoksa zorunlu
  imageUrl?: string;                 // Opsiyonel görsel URL
  branchId?: string | null;          // Şube bazlı duyuru (opsiyonel)
  isPublished: boolean;              // Yayın durumu
  isFeatured: boolean;                // Öne çıkan duyuru (default: false)
  publishedAt?: Timestamp | Date;    // Yayınlanma tarihi (isPublished: true ise set edilir)
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;                 // Admin UID
  updatedBy?: string;                 // Admin UID
}

// API Request/Response Types
export interface CreateAnnouncementRequest {
  title: string;
  content?: string;        // HTML string - externalUrl yoksa zorunlu
  externalUrl?: string;    // URL string - content yoksa zorunlu
  imageUrl?: string;
  branchId?: string | null; // Opsiyonel şube ID
  isPublished?: boolean;  // Default: false
  isFeatured?: boolean;   // Default: false
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  externalUrl?: string;
  imageUrl?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  publishedAt?: string;    // ISO date string (manuel set için)
}

// Bulk operations
export type BulkAnnouncementAction = 'delete' | 'publish' | 'unpublish';

export interface BulkAnnouncementActionRequest {
  action: BulkAnnouncementAction;
  announcementIds: string[];
}

export interface BulkAnnouncementActionResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: Array<{
    announcementId: string;
    error: string;
  }>;
}

