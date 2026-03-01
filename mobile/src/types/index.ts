// Type Definitions - Shared types ile uyumlu

// Shared types/constants'dan re-export
export type { UserStatus } from '../../../shared/constants/status';
export type { UserRole } from '../../../shared/constants/roles';
export type { EducationLevel } from '../../../shared/constants/education';
export type { Gender } from '../../../shared/constants/gender';
export type { KonyaDistrict } from '../../../shared/constants/districts';
export type { Position } from '../../../shared/constants/positions';

// Shared tiplerini import et
import type { User as SharedUser } from '../../../shared/types/user';
import type { Timestamp } from '../../../shared/types/user';
import type { News as SharedNews } from '../../../shared/types/news';
import type { Announcement as SharedAnnouncement } from '../../../shared/types/announcement';
import type { Branch as SharedBranch } from '../../../shared/types/branch';
import type { HowToUseStep as SharedHowToUseStep, InstitutionCategory as SharedInstitutionCategory, ContractedInstitution as SharedContractedInstitution } from '../../../shared/types/contracted-institution';
import type { CreateContactMessageRequest } from '../../../shared/types/contact';

// Timestamp tipi API yanıtlarında farklı formatlarda gelebilir
type ApiDate = string | Timestamp | Date;

// Shared User tipini re-export et ve mobile-specific alanları ekle
export interface User extends SharedUser {
  // Mobile-specific alanlar (backend'den gelebilecek ek alanlar)
  displayName?: string;
}

// HowToUseStep — shared'dan re-export
export type HowToUseStep = SharedHowToUseStep;

// Branch — shared'ı temel alır, mobile-specific görüntüleme alanları eklendi
export interface Branch extends Omit<SharedBranch, 'createdAt' | 'updatedAt'> {
  city?: string;
  district?: string;
  managerId?: string;
  managerName?: string;
  memberCount?: number;
  coordinates?: { latitude: number; longitude: number };
  isMainBranch?: boolean;
  createdAt?: ApiDate;
  updatedAt?: ApiDate;
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
  videoSource?: 'youtube' | 'vimeo' | 'uploaded';
  videoPath?: string;
  duration?: string; // e.g., "5:20" or seconds
  isActive?: boolean;
  order?: number;
  createdAt?: string;
}

export interface TestOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TestQuestion {
  id: string;
  question: string;
  options: TestOption[];
  explanation?: string;
}

export interface TestContentDetail {
  id: string;
  lessonId: string;
  title: string;
  description?: string;
  questions: TestQuestion[];
  timeLimit?: number;
  isActive?: boolean;
  order?: number;
}

// ── News ─────────────────────────────────────────────────────────────────────────
export interface News extends Omit<SharedNews, 'createdAt' | 'updatedAt' | 'publishedAt' | 'isFeatured' | 'createdBy' | 'updatedBy'> {
  summary?: string;
  category?: string;
  author?: string;
  isFeatured?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: ApiDate;
  updatedAt?: ApiDate;
  publishedAt?: ApiDate;
}

// ── Announcement ─────────────────────────────────────────────────────────────────
export interface Announcement extends Omit<SharedAnnouncement, 'createdAt' | 'updatedAt' | 'publishedAt' | 'isFeatured' | 'content' | 'createdBy' | 'updatedBy'> {
  content?: string;
  summary?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: string;
  isFeatured?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: ApiDate;
  updatedAt?: ApiDate;
  publishedAt?: ApiDate;
}

// ── ContactMessage ────────────────────────────────────────────────────────────────
export type ContactMessage = CreateContactMessageRequest;

// ── Contracted Institutions ───────────────────────────────────────────────────────
export interface InstitutionCategory extends Omit<SharedInstitutionCategory, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> {
  createdBy?: string;
  updatedBy?: string;
  createdAt: ApiDate;
  updatedAt: ApiDate;
}

export interface ContractedInstitution extends Omit<SharedContractedInstitution, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> {
  createdBy?: string;
  updatedBy?: string;
  createdAt: ApiDate;
  updatedAt: ApiDate;
}

// Navigation Types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  Signup: undefined;
  Main: undefined;
  MainTabs: undefined;
  Membership: undefined;
  EditProfile: undefined;
  PendingApproval: undefined;
  Rejected: undefined;
  CourseDetail: { trainingId: string; lessonId?: string; completedContentId?: string };
  Test: { testId: string; contentId?: string; trainingId?: string; lessonId?: string };
  PDFViewer: { url: string; title?: string };
  Document: { url: string; title?: string };
  Video: { url: string; videoSource?: string; title?: string; contentId?: string };
  BranchDetail: { branchId: string };
  NewsDetail: { newsId: string };
  AllAnnouncements: undefined;
  AllNews: undefined; 
  Contact: undefined;
  About: undefined;
  Muktesep: undefined;
  PartnerInstitutions: undefined;
  PartnerDetail: { partner?: import('../data/partners').Partner; institution?: ContractedInstitution };
  Profile: undefined;
  Notifications: undefined;
  ChangePassword: undefined;
  LegalAcceptance: undefined;
  Kvkk: undefined;
  Terms: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Courses: undefined;
  Branches: undefined;
  Profile: undefined;
};
