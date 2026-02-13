import { apiRequest } from '@/utils/api';
import type { NotificationType, TargetAudience } from '@shared/constants/notifications';

export interface SendNotificationRequest {
  title: string;
  body: string;
  type: NotificationType;
  contentId?: string;
  imageUrl?: string;
  targetAudience?: TargetAudience;
  branchId?: string;
  branchIds?: string[];
  data?: Record<string, string>;
}

export interface SendNotificationResponse {
  sent: number;
  failed: number;
  totalUsers?: number;
  totalTokens?: number;
  message?: string;
}

export interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  type: 'announcement' | 'news';
  contentId: string | null;
  imageUrl: string | null;
  sentBy: string;
  targetAudience: 'all' | 'active' | 'branch';
  branchId: string | null;
  sentCount: number;
  failedCount: number;
  data: Record<string, string> | null;
  createdAt: any;
  branch?: { id: string; name: string } | null;
  sentByUser?: { uid: string; firstName: string; lastName: string } | null;
}

export interface NotificationHistoryListResponse {
  notifications: NotificationHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const notificationService = {
  /**
   * Bildirim gönder
   */
  async sendNotification(data: SendNotificationRequest): Promise<SendNotificationResponse> {
    const response = await apiRequest<SendNotificationResponse>('/api/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response;
  },

  /**
   * Bildirim geçmişini getir
   */
  async getNotificationHistory(params?: {
    page?: number;
    limit?: number;
    type?: 'announcement' | 'news';
    targetAudience?: 'all' | 'active' | 'branch';
    branchId?: string;
    search?: string;
  }): Promise<NotificationHistoryListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.targetAudience) queryParams.append('targetAudience', params.targetAudience);
    if (params?.branchId) queryParams.append('branchId', params.branchId);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/api/notifications/history${queryString ? `?${queryString}` : ''}`;

    return apiRequest<NotificationHistoryListResponse>(endpoint);
  },
};
