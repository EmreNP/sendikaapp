import { Timestamp } from './user';

export interface FAQ {
  id: string;
  question: string;                    // Zorunlu, 2-200 karakter
  answer: string;                      // HTML string (sanitize edilmiş), zorunlu
  order: number;                       // Sıralama (default: 0)
  isPublished: boolean;                // Yayın durumu
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;                   // Admin UID
  updatedBy?: string;                  // Admin UID
}

// API Request/Response Types
export interface CreateFAQRequest {
  question: string;
  answer: string;        // HTML string - zorunlu
  isPublished?: boolean;  // Default: false
  order?: number;         // Default: auto-increment
}

export interface UpdateFAQRequest {
  question?: string;
  answer?: string;
  isPublished?: boolean;
  order?: number;
}

// Bulk operations
export type BulkFAQAction = 'delete' | 'publish' | 'unpublish';

export interface BulkFAQActionRequest {
  action: BulkFAQAction;
  faqIds: string[];
}

export interface BulkFAQActionResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: Array<{
    faqId: string;
    error: string;
  }>;
}

