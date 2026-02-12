// FAQ types
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  isPublished: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
  updatedBy?: string;
}

export interface CreateFAQRequest {
  question: string;
  answer: string;
  isPublished?: boolean;
  order?: number;
}

export interface UpdateFAQRequest {
  question?: string;
  answer?: string;
  isPublished?: boolean;
  order?: number;
}

export interface FAQListResponse {
  faqs: FAQ[];
  total?: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

export type BulkFAQAction = 'delete' | 'publish' | 'unpublish';

export interface BulkFAQActionResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: Array<{
    faqId: string;
    error: string;
  }>;
}

