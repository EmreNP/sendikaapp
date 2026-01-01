import { Timestamp } from './user';

// Çalışma saatleri interface'i
export interface WorkingHours {
  weekday?: string; // Hafta içi (örn: "09:00 - 18:00")
  saturday?: string; // Cumartesi (örn: "09:00 - 13:00")
  sunday?: string; // Pazar (örn: "Kapalı")
}

export interface Branch {
  id: string;
  name: string;
  desc?: string; // Açıklama
  location?: { // Koordinat (haritadan seçilen)
    latitude: number;
    longitude: number;
  };
  address?: string; // Açık adres (reverse geocoding ile alınan)
  phone?: string; // Telefon (Sabit hat)
  email?: string;
  workingHours?: WorkingHours; // Çalışma saatleri
  isActive: boolean;
  eventCount?: number; // Etkinlik sayısı
  educationCount?: number; // Eğitim sayısı
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// API Request/Response Types
export interface CreateBranchRequest {
  name: string;
  desc?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: WorkingHours;
}

export interface UpdateBranchRequest {
  name?: string;
  desc?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: WorkingHours;
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
  desc?: string | null;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  workingHours?: WorkingHours | null;
  isActive?: boolean;
}

