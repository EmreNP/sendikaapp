import { Timestamp } from './user';

// ==================== Kategori ====================

/**
 * Anlaşmalı Kurum Kategorisi (Firestore'dan dinamik)
 */
export interface InstitutionCategory {
  id: string;
  name: string;                     // Kategori adı (ör: "Sağlık")
  order: number;                    // Sıralama
  isActive: boolean;                // Aktiflik durumu
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
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

// ==================== Nasıl Yararlanırım ====================

/**
 * Nasıl Yararlanırım adımı
 */
export interface HowToUseStep {
  stepNumber: number;       // 1, 2, 3...
  title: string;            // Adım başlığı (ör: "Üyelik Kartınızı Gösterin")
  description: string;      // Adım açıklaması
}

// ==================== Anlaşmalı Kurum ====================

/**
 * Anlaşmalı Kurum
 */
export interface ContractedInstitution {
  id: string;
  title: string;                                    // Kurum adı
  description: string;                              // Anlaşma detayları
  categoryId: string;                                // Kategori ID (Firestore ref)
  categoryName?: string;                             // Kategori adı (join/denormalize)
  badgeText: string;                                 // Badge metni (ör: "%20 İndirim", "%15 Burs")
  coverImageUrl: string;                             // Kapak fotoğrafı
  logoUrl?: string;                                  // Kurum logosu
  howToUseSteps: HowToUseStep[];                     // Nasıl yararlanırım adımları
  isPublished: boolean;                              // Yayın durumu
  order: number;                                     // Sıralama
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;                                 // Admin UID
  updatedBy?: string;                                // Admin UID
}

// API Request/Response Types
export interface CreateContractedInstitutionRequest {
  title: string;
  description: string;
  categoryId: string;
  badgeText: string;
  coverImageUrl: string;
  logoUrl?: string;
  howToUseSteps: HowToUseStep[];
  isPublished?: boolean;                             // Default: false
  order?: number;                                    // Default: auto-increment
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

// Bulk operations
export type BulkContractedInstitutionAction = 'delete' | 'publish' | 'unpublish';

export interface BulkContractedInstitutionActionRequest {
  action: BulkContractedInstitutionAction;
  institutionIds: string[];
}

export interface BulkContractedInstitutionActionResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: Array<{
    institutionId: string;
    error: string;
  }>;
}
