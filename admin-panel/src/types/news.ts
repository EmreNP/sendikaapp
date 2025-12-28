// News types - shared/types/news.ts'den import edilebilir ama admin panel için ayrı tanım
export interface News {
  id: string;
  title: string;
  content?: string;
  externalUrl?: string;
  imageUrl?: string;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
  updatedBy?: string;
}

export interface CreateNewsRequest {
  title: string;
  content?: string;
  externalUrl?: string;
  imageUrl?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface UpdateNewsRequest {
  title?: string;
  content?: string;
  externalUrl?: string;
  imageUrl?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  publishedAt?: string;
}

export interface NewsListResponse {
  news: News[];
  total: number;
  page: number;
  limit: number;
}

export type BulkNewsAction = 'delete' | 'publish' | 'unpublish';

export interface BulkNewsActionResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: Array<{
    newsId: string;
    error: string;
  }>;
}

