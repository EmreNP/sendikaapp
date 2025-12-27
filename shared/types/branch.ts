import { Timestamp } from './user';

export interface Branch {
  id: string;
  name: string;
  code?: string; // Şube kodu (opsiyonel)
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// API Request/Response Types
export interface CreateBranchRequest {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
}

export interface UpdateBranchRequest {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

// Branch ile birlikte manager bilgilerini döndürmek için
export interface BranchWithManagers extends Branch {
  managers?: Array<{
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

// Firestore Update Data Types
export type FirestoreTimestamp = any; // admin.firestore.FieldValue.serverTimestamp()

// Branch Update Data
export interface BranchUpdateData {
  updatedAt: FirestoreTimestamp;
  name?: string;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
}

