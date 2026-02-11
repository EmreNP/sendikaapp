export interface Activity {
  id: string;
  name: string;              // Required, 2-200 characters
  description: string;       // Required, detailed description
  categoryId: string;        // Required, references activity_categories
  branchId: string;         // Required, which branch created this
  activityDate: Date;   // Activity date/time
  isPublished: boolean;      // Default: false
  images?: string[];         // Array of image URLs (max 10)
  documents?: string[];      // Array of document URLs
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;         // Branch manager UID
  updatedBy?: string;        // Branch manager UID
  category?: ActivityCategory;
  branch?: {
    id: string;
    name: string;
  };
}

export interface ActivityCategory {
  id: string;
  name: string;              // Required, unique
  description?: string;      // Optional
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;        // Admin UID
  updatedBy?: string;      // Admin UID
}

// API Request/Response Types
export interface CreateActivityRequest {
  name: string;
  description: string;
  categoryId: string;
  branchId?: string;        // Optional for admin, auto-filled for branch manager
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

export interface CreateActivityCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateActivityCategoryRequest {
  name?: string;
  description?: string;
}

// Response Types
export interface ActivityListResponse {
  success: true;
  message: string;
  data: {
    activities: Activity[];
    total?: number;
    page: number;
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

export interface ActivityResponse {
  success: true;
  message: string;
  data: {
    activity: Activity;
  };
}

export interface ActivityCategoryListResponse {
  success: true;
  message: string;
  data: {
    categories: ActivityCategory[];
  };
}

export interface ActivityCategoryResponse {
  success: true;
  message: string;
  data: {
    category: ActivityCategory;
  };
}
