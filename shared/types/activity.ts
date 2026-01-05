import { Timestamp } from './user';
import { ActivityCategory } from './activity-category';

export interface Activity {
  id: string;
  name: string;              // Required, 2-200 characters
  description: string;       // Required, detailed description
  categoryId: string;        // Required, references activity_categories
  branchId: string;         // Required, which branch created this
  activityDate: Timestamp | Date;   // Activity date/time
  isPublished: boolean;      // Default: false
  images?: string[];         // Array of image URLs (max 10)
  documents?: string[];      // Array of document URLs
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;         // Branch manager UID
  updatedBy?: string;        // Branch manager UID
}

// API Request/Response Types
export interface CreateActivityRequest {
  name: string;
  description: string;
  categoryId: string;
  branchId?: string;
  activityDate: string;      // ISO date string
  isPublished?: boolean;     // Default: false
  images?: string[];         // max 10
  documents?: string[];
}

export interface UpdateActivityRequest {
  name?: string;
  description?: string;
  categoryId?: string;
  activityDate?: string;     // ISO date string
  isPublished?: boolean;
  images?: string[];         // max 10
  documents?: string[];
}

// Bulk operations
export type BulkActivityAction = 'delete' | 'publish' | 'unpublish';

export interface BulkActivityActionRequest {
  action: BulkActivityAction;
  activityIds: string[];
}

export interface BulkActivityActionResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: Array<{
    activityId: string;
    error: string;
  }>;
}

// Activity with category details
export interface ActivityWithCategory extends Activity {
  category?: ActivityCategory;
}

// Activity with branch details
export interface ActivityWithBranch extends Activity {
  branch?: {
    id: string;
    name: string;
  };
}

// Full activity details
export interface ActivityFull extends Activity {
  category?: ActivityCategory;
  branch?: {
    id: string;
    name: string;
  };
}
