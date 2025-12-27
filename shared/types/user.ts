import { UserStatus } from '../constants/status';
import { UserRole } from '../constants/roles';
import { EducationLevel } from '../constants/education';
import { Gender } from '../constants/gender';

// Re-export types for convenience
export type { UserStatus, UserRole, EducationLevel, Gender };

// Timestamp type - backend'de firebase-admin/firestore Timestamp, frontend'de firebase/firestore Timestamp
export type Timestamp = any;

export interface User {
  uid: string;
  
  // Step 1 - Temel Bilgiler
  firstName: string;
  lastName: string;
  birthDate: Timestamp | Date;
  gender: Gender;
  
  // Step 2 - Detaylı Bilgiler
  tcKimlikNo?: string;
  fatherName?: string;
  motherName?: string;
  birthPlace?: string;
  education?: EducationLevel;
  kurumSicil?: string;
  kadroUnvani?: string;
  kadroUnvanKodu?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  
  // Sistem Bilgileri
  branchId?: string;
  role: UserRole;
  status: UserStatus;
  email: string;
  emailVerified?: boolean; // Email doğrulandı mı?
  isActive: boolean; // Kullanıcı aktif mi? (delete durumunda false olur)
  
  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// API Request/Response Types
export interface RegisterBasicRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthDate: string; // ISO date string
  gender: Gender;
}

export interface RegisterDetailsRequest {
  branchId: string; // Zorunlu
  tcKimlikNo?: string;
  fatherName?: string;
  motherName?: string;
  birthPlace?: string;
  education?: EducationLevel;
  kurumSicil?: string;
  kadroUnvani?: string;
  kadroUnvanKodu?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
}

// Firestore Update Data Types
// Firebase FieldValue types için any kullanılmalı (Firebase Admin SDK'nın kendi tipi)
export type FirestoreTimestamp = any; // admin.firestore.FieldValue.serverTimestamp()
export type FirestoreDeleteField = any; // admin.firestore.FieldValue.delete()

// User Status Update
export interface UserStatusUpdateData {
  status: UserStatus;
  updatedAt: FirestoreTimestamp;
  rejectionReason?: string;
  documentUrl?: string; // PDF belgesi URL'i (Branch Manager admin'e gönderirken zorunlu)
}

// User Role Update
export interface UserRoleUpdateData {
  role: UserRole;
  updatedAt: FirestoreTimestamp;
  branchId?: string;
}

// User Branch Update
export interface UserBranchUpdateData {
  updatedAt: FirestoreTimestamp;
  branchId?: string | FirestoreDeleteField;
}

// User Profile Update (for users/me endpoint)
export interface UserProfileUpdateData {
  updatedAt: FirestoreTimestamp;
  firstName?: string;
  lastName?: string;
  birthDate?: FirestoreTimestamp;
  gender?: Gender;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  tcKimlikNo?: string;
  fatherName?: string;
  motherName?: string;
  birthPlace?: string;
  education?: EducationLevel;
  kurumSicil?: string;
  kadroUnvani?: string;
  kadroUnvanKodu?: string;
}

// User Register Details Update
export interface UserRegisterDetailsUpdateData {
  status: UserStatus;
  branchId: string;
  updatedAt: FirestoreTimestamp;
  tcKimlikNo?: string;
  fatherName?: string;
  motherName?: string;
  birthPlace?: string;
  education?: EducationLevel;
  kurumSicil?: string;
  kadroUnvani?: string;
  kadroUnvanKodu?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
}

// Create User Data (for Firestore)
export interface CreateUserData {
  uid: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  branchId?: string;
  birthDate?: FirestoreTimestamp;
  gender?: Gender;
  phone?: string;
}

// User Registration Log
export interface UserRegistrationLog {
  id?: string; // Firestore document ID
  userId: string; // İşlem yapılan kullanıcının UID'i
  action: 'register_basic' | 'register_details' | 'branch_manager_approval' | 'admin_approval' | 'admin_rejection' | 'admin_return' | 'branch_manager_return';
  performedBy: string; // İşlemi yapan kullanıcının UID'i
  performedByRole: 'admin' | 'branch_manager' | 'user';
  previousStatus?: UserStatus; // Önceki durum (status değişikliklerinde)
  newStatus?: UserStatus; // Yeni durum (status değişikliklerinde)
  note?: string; // Opsiyonel not
  documentUrl?: string; // PDF belgesi URL'i (branch manager approval için - ESKİ BELGELERİ TUTMAK İÇİN)
  metadata?: {
    branchId?: string; // Register details'te seçilen şube
    email?: string; // Register basic'te email
  };
  timestamp: Timestamp;
}

