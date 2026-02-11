// Announcement types - shared/types/announcement.ts'den import edilebilir ama admin panel için ayrı tanım
export interface Announcement {
  id: string;
  title: string;
  content?: string;
  externalUrl?: string;
  imageUrl?: string;
  branchId?: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
  updatedBy?: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content?: string;
  externalUrl?: string;
  imageUrl?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  externalUrl?: string;
  imageUrl?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  publishedAt?: string;
}

export interface AnnouncementListResponse {
  announcements: Announcement[];
  total?: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

export type BulkAnnouncementAction = 'delete' | 'publish' | 'unpublish';

export interface BulkAnnouncementActionResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: Array<{
    announcementId: string;
    error: string;
  }>;
}

