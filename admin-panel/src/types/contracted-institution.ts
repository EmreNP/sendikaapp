// ==================== Kategori ====================

export interface InstitutionCategory {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
  updatedBy?: string;
}

export interface CreateInstitutionCategoryRequest {
  name: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateInstitutionCategoryRequest {
  name?: string;
  order?: number;
  isActive?: boolean;
}

export interface InstitutionCategoryListResponse {
  categories: InstitutionCategory[];
  total: number;
}

// ==================== Anlaşmalı Kurum ====================

export interface HowToUseStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface ContractedInstitution {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  badgeText: string;
  coverImageUrl: string;
  logoUrl?: string;
  howToUseSteps: HowToUseStep[];
  isPublished: boolean;
  order: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
  updatedBy?: string;
}

export interface CreateContractedInstitutionRequest {
  title: string;
  description: string;
  categoryId: string;
  badgeText: string;
  coverImageUrl: string;
  logoUrl?: string;
  howToUseSteps: HowToUseStep[];
  isPublished?: boolean;
  order?: number;
}

export interface UpdateContractedInstitutionRequest {
  title?: string;
  description?: string;
  categoryId?: string;
  badgeText?: string;
  coverImageUrl?: string;
  logoUrl?: string;
  howToUseSteps?: HowToUseStep[];
  isPublished?: boolean;
  order?: number;
}

export interface ContractedInstitutionListResponse {
  institutions: ContractedInstitution[];
  total?: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

export type BulkContractedInstitutionAction = 'delete' | 'publish' | 'unpublish';

export interface BulkContractedInstitutionActionResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: Array<{ institutionId: string; error: string }>;
}
