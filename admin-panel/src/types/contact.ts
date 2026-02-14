export interface Topic {
  id: string;
  name: string;
  isVisibleToBranchManager: boolean;
  description?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ContactMessage {
  id: string;
  userId: string;
  branchId?: string;
  topicId: string;
  message: string;
  isRead: boolean;
  readBy?: string;
  readAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  // Populated fields (optional, frontend'de doldurulacak)
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  topic?: {
    name: string;
  };
  branch?: {
    name: string;
  };
}

export interface TopicListResponse {
  topics: Topic[];
}

export interface ContactMessageListResponse {
  messages: ContactMessage[];
  total: number;
  page: number;
  limit: number;
}

