// FAQ Service - SSS API calls

import { API_ENDPOINTS } from '../../config/api';
import api from './client';

// Types
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Get all FAQs (public)
export async function getFAQs(): Promise<FAQ[]> {
  const response = await api.get<FAQ[]>(API_ENDPOINTS.FAQ.BASE, false);
  
  if (!response.success || !response.data) {
    throw new Error('SSS yüklenemedi');
  }
  
  return response.data;
}

// Get FAQs by category
export async function getFAQsByCategory(category: string): Promise<FAQ[]> {
  const faqs = await getFAQs();
  return faqs.filter(faq => faq.category === category && faq.isActive);
}

// Get FAQ categories
export async function getFAQCategories(): Promise<string[]> {
  const faqs = await getFAQs();
  const categories = [...new Set(faqs.map(faq => faq.category).filter(Boolean))] as string[];
  return categories;
}

export default {
  getFAQs,
  getFAQsByCategory,
  getFAQCategories,
};
