// Type Definitions

export type UserStatus = 
  | 'pending_details'
  | 'pending_branch_review'
  | 'pending_admin_approval' // Legacy (artık kullanılmuyor)
  | 'active'
  | 'rejected';

export type UserRole = 'admin' | 'branch_manager' | 'user';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tcKimlik?: string;
  branchId?: string;
  role: UserRole;
  status: UserStatus;
  membershipDetails?: {
    workplace?: string;
    position?: string;
    city?: string;
    district?: string;
    address?: string;
  };
  createdAt?: string;
  updatedAt?: string;
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
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isPublished: boolean;
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

// Navigation Types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Membership: undefined;
  PendingApproval: undefined;
  Rejected: undefined;
  CourseDetail: { trainingId: string; lessonId?: string };
  BranchDetail: { branchId: string };
  NewsDetail: { newsId: string };
  AllAnnouncements: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Courses: undefined;
  Branches: undefined;
  Profile: undefined;
};
