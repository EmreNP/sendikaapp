// Contact Service - İletişim Mesajları API calls

import { API_ENDPOINTS } from '../../config/api';
import api from './client';

// Types
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateContactMessageRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// Create contact message (public)
export async function createContactMessage(data: CreateContactMessageRequest): Promise<ContactMessage> {
  const response = await api.post<ContactMessage>(API_ENDPOINTS.CONTACT.BASE, data, false);
  
  if (!response.success || !response.data) {
    throw new Error('Mesaj gönderilemedi');
  }
  
  return response.data;
}

export default {
  createContactMessage,
};
