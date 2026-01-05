import { Timestamp } from './user';

export interface ActivityCategory {
  id: string;
  name: string;              // Required, unique
  description?: string;      // Optional
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;        // Admin UID
  updatedBy?: string;      // Admin UID
}

// API Request/Response Types
export interface CreateActivityCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateActivityCategoryRequest {
  name?: string;
  description?: string;
}

// Bulk operations
export type BulkActivityCategoryAction = 'delete';

export interface BulkActivityCategoryActionRequest {
  action: BulkActivityCategoryAction;
  categoryIds: string[];
}

export interface BulkActivityCategoryActionResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: Array<{
    categoryId: string;
    error: string;
  }>;
}
