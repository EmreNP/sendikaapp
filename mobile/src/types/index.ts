// Type Definitions - Shared types ile uyumlu

// Shared types/constants'dan re-export
export type { UserStatus } from '../../../shared/constants/status';
export type { UserRole } from '../../../shared/constants/roles';
export type { EducationLevel } from '../../../shared/constants/education';
export type { Gender } from '../../../shared/constants/gender';
export type { KonyaDistrict } from '../../../shared/constants/districts';
export type { Position } from '../../../shared/constants/positions';

// Shared User tipini re-export et ve mobile-specific alanları ekle
import type { User as SharedUser } from '../../../shared/types/user';

export interface User extends SharedUser {
  // Mobile-specific alanlar (backend'den gelebilecek ek alanlar)
  displayName?: string;
}

export interface Training {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  duration?: string;
  lessonsCount?: number;
  isPublished: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: string;
  trainingId: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration?: string;
  order: number;
  isPublished: boolean;
}

export interface LessonContent {
  id: string;
  lessonId: string;
  title: string;
  description?: string;
  type: 'video' | 'document' | 'test' | 'text';
  url?: string;
  duration?: string; // e.g., "5:20" or seconds
  isActive?: boolean;
  order?: number;
  createdAt?: string;
} 

export interface Branch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  managerName?: string;
  memberCount?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isActive: boolean;
  createdAt?: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  category?: string;
  author?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isPublished: boolean;
  isFeatured?: boolean;
  publishedAt?: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
  isPublished: boolean;
}

export interface ContactMessage {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// Contracted Institutions
export interface HowToUseStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface InstitutionCategory {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
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
}

// Navigation Types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  MainTabs: undefined;
  Membership: undefined;
  PendingApproval: undefined;
  Rejected: undefined;
  CourseDetail: { trainingId: string; lessonId?: string };
  Test: { testId: string };
  PDFViewer: { url: string; title?: string };
  Document: { url: string; title?: string };
  BranchDetail: { branchId: string };
  NewsDetail: { newsId: string };
  AllAnnouncements: undefined;
  AllNews: undefined; 
  Contact: undefined;
  About: undefined;
  Muktesep: undefined;
  DistrictRepresentative: undefined;
  PartnerInstitutions: undefined;
  PartnerDetail: { partner?: import('../data/partners').Partner; institution?: ContractedInstitution };
  Notifications: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Courses: undefined;
  Branches: undefined;
  Profile: undefined;
};
