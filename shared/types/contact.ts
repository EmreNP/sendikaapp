import { Timestamp } from './user';

export interface Topic {
  id: string;
  name: string;
  isVisibleToBranchManager: boolean; // true = branch manager görsün, false = sadece admin görsün
  description?: string;
  isActive: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface ContactMessage {
  id: string;
  userId: string;
  branchId?: string;
  topicId: string;
  message: string;
  isRead: boolean;
  readBy?: string;
  readAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// API Request/Response Types
export interface CreateContactMessageRequest {
  topicId: string;
  message: string;
}

export interface UpdateContactMessageRequest {
  isRead?: boolean;
}

