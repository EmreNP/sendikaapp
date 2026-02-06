// Branch Service - Şube API calls

import { API_ENDPOINTS } from '../../config/api';
import api from './client';

// Types
export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Get all branches (public)
export async function getBranches(): Promise<Branch[]> {
  const response = await api.get<Branch[]>(API_ENDPOINTS.BRANCHES.BASE, false);
  
  if (!response.success || !response.data) {
    throw new Error('Şubeler yüklenemedi');
  }
  
  return response.data;
}

// Get single branch
export async function getBranch(id: string): Promise<Branch> {
  const response = await api.get<Branch>(API_ENDPOINTS.BRANCHES.BY_ID(id), false);
  
  if (!response.success || !response.data) {
    throw new Error('Şube bulunamadı');
  }
  
  return response.data;
}

// Get active branches only
export async function getActiveBranches(): Promise<Branch[]> {
  const branches = await getBranches();
  return branches.filter(branch => branch.isActive);
}

export default {
  getBranches,
  getBranch,
  getActiveBranches,
};
