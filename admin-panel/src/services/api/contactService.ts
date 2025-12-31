import { apiRequest } from '@/utils/api';
import type { 
  Topic, 
  ContactMessage, 
  TopicListResponse, 
  ContactMessageListResponse 
} from '@/types/contact';

export const contactService = {
  // TOPICS
  async getTopics(): Promise<TopicListResponse> {
    return apiRequest<TopicListResponse>('/api/topics');
  },

  async getTopicById(id: string): Promise<{ topic: Topic }> {
    return apiRequest<{ topic: Topic }>(`/api/topics/${id}`);
  },

  async createTopic(data: {
    name: string;
    isVisibleToBranchManager: boolean;
    description?: string;
    isActive?: boolean;
  }): Promise<{ topic: Topic }> {
    return apiRequest<{ topic: Topic }>('/api/topics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTopic(id: string, data: {
    name?: string;
    isVisibleToBranchManager?: boolean;
    description?: string;
    isActive?: boolean;
  }): Promise<{ topic: Topic }> {
    return apiRequest<{ topic: Topic }>(`/api/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteTopic(id: string): Promise<void> {
    return apiRequest<void>(`/api/topics/${id}`, {
      method: 'DELETE',
    });
  },

  // CONTACT MESSAGES
  async getContactMessages(params?: {
    page?: number;
    limit?: number;
    topicId?: string;
    isRead?: boolean;
  }): Promise<ContactMessageListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.topicId) queryParams.append('topicId', params.topicId);
    if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/contact-messages${queryString ? `?${queryString}` : ''}`;

    return apiRequest<ContactMessageListResponse>(endpoint);
  },

  async getContactMessageById(id: string): Promise<{ message: ContactMessage }> {
    return apiRequest<{ message: ContactMessage }>(`/api/contact-messages/${id}`);
  },

  async markMessageAsRead(id: string, isRead: boolean): Promise<{ message: ContactMessage }> {
    return apiRequest<{ message: ContactMessage }>(`/api/contact-messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isRead }),
    });
  },
};

