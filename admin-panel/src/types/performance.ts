/**
 * Performance Report Types
 * İlçe yöneticilerinin ve şubelerin performans raporları için tip tanımları
 */

// ==================== Zaman Aralığı ====================
export type DateRange = {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
};

export type PeriodType = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

// ==================== Şube Performans Raporu ====================
export interface BranchPerformanceReport {
  branchId: string;
  branchName: string;
  isActive: boolean;

  // Aktivite metrikleri
  activities: {
    total: number;
    published: number;
    unpublished: number;
    byCategory: Array<{ categoryId: string; categoryName: string; count: number }>;
    byPeriod: Array<{ period: string; count: number }>; // Dinamik: gün, hafta veya ay
    granularity: 'daily' | 'weekly' | 'monthly';
  };

  // Üye metrikleri
  members: {
    total: number;
    active: number;
    pending: number;
    rejected: number;
    newThisPeriod: number;
  };

  // Haber & Duyuru metrikleri
  news: {
    total: number;
    published: number;
  };

  announcements: {
    total: number;
    published: number;
  };

  // İletişim mesajları
  contactMessages: {
    total: number;
    read: number;
    unread: number;
  };

  // Yöneticiler
  managers: Array<{
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;

  // Genel skor (0-100)
  performanceScore: number;
}

// ==================== İlçe Yöneticisi Bireysel Rapor ====================
export interface ManagerPerformanceReport {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  branchId?: string;
  branchName?: string;
  district?: string;
  role: string;

  // Oluşturduğu aktiviteler
  activities: {
    total: number;
    published: number;
    unpublished: number;
    byCategory: Array<{ categoryId: string; categoryName: string; count: number }>;
    byPeriod: Array<{ period: string; count: number }>; // Dinamik: gün, hafta veya ay
    granularity: 'daily' | 'weekly' | 'monthly';
    recentActivities: Array<{
      id: string;
      name: string;
      categoryName?: string;
      activityDate: string;
      isPublished: boolean;
      createdAt: string;
    }>;
  };

  // Oluşturduğu haberler
  news: {
    total: number;
    published: number;
  };

  // Oluşturduğu duyurular
  announcements: {
    total: number;
    published: number;
  };

  // Yönettiği üye sayıları (şubesindeki)
  managedMembers: {
    total: number;
    active: number;
    pending: number;
  };

  // Son giriş / aktiflik bilgisi
  lastActivityDate?: string;

  // Performans skoru (0-100)
  performanceScore: number;
}

// ==================== Genel Özet Dashboard ====================
export interface PerformanceDashboardSummary {
  overview: {
    totalBranches: number;
    activeBranches: number;
    totalManagers: number;
    totalActivities: number;
    totalMembers: number;
    activeMembersCount: number;
  };

  topBranches: Array<{
    branchId: string;
    branchName: string;
    activityCount: number;
    memberCount: number;
    performanceScore: number;
  }>;

  topManagers: Array<{
    uid: string;
    fullName: string;
    branchName?: string;
    activityCount: number;
    performanceScore: number;
  }>;

  activityTrend: Array<{
    period: string; // Dinamik format
    count: number;
    granularity: 'daily' | 'weekly' | 'monthly';
  }>;

  branchComparison: Array<{
    branchId: string;
    branchName: string;
    activityCount: number;
    memberCount: number;
    newsCount: number;
  }>;
}

// ==================== API Request/Response Types ====================
export interface PerformanceReportParams {
  period?: PeriodType;
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

export interface BranchPerformanceResponse {
  branches: BranchPerformanceReport[];
  summary: {
    totalActivities: number;
    totalMembers: number;
    averageScore: number;
  };
  timeGranularity: 'daily' | 'weekly' | 'monthly';
}

export interface ManagerPerformanceResponse {
  managers: ManagerPerformanceReport[];
  summary: {
    totalActivities: number;
    averageScore: number;
  };
  timeGranularity: 'daily' | 'weekly' | 'monthly';
}

// ==================== Rapor Oluşturma (PDF) Tipleri ====================

export interface ReportGenerateParams {
  type: 'branch' | 'manager';
  startDate?: string;
  endDate?: string;
  branchId?: string;
  managerId?: string;
}

export interface LogEntry {
  date: string;
  message: string;
  type: string; // 'user' | 'activity' | 'notification' | 'news' | 'announcement'
  actor?: string;
}

export interface ActivityItem {
  id: string;
  name: string;
  description?: string;
  categoryName: string;
  activityDate: string;
  createdAt: string;
  isPublished: boolean;
  createdByName?: string;
}

export interface BranchReportData {
  branchId: string;
  branchName: string;
  isActive: boolean;
  managers: Array<{ uid: string; fullName: string }>;
  period: { startDate: string; endDate: string };
  summary: {
    totalMembers: number;
    activeMembers: number;
    newMembers: number;
    updatedMembers: number;
    totalActivities: number;
    activitiesByCategory: Array<{ name: string; count: number }>;
    notificationsSent: number;
    newsCreated: number;
    announcementsCreated: number;
  };
  logEntries: LogEntry[];
  activities: ActivityItem[];
}

export interface ManagerReportData {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  district?: string;
  branchId: string;
  branchName: string;
  period: { startDate: string; endDate: string };
  summary: {
    managedMembers: number;
    activeMembers: number;
    newMembers: number;
    updatedMembers: number;
    approvals: number;
    rejections: number;
    totalActivities: number;
    activitiesByCategory: Array<{ name: string; count: number }>;
    notificationsSent: number;
    newsCreated: number;
    announcementsCreated: number;
  };
  logEntries: LogEntry[];
  activities: ActivityItem[];
}

export interface ReportGenerateResponse {
  reportType: 'branch' | 'manager';
  generatedAt: string;
  period: { startDate: string; endDate: string };
  reports: BranchReportData[] | ManagerReportData[];
}
