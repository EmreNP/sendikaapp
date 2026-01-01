import { apiRequest } from '@/utils/api';
import type { User } from '@/types/user';

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  birthDate?: string; // ISO date string
  gender?: 'male' | 'female';
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  tcKimlikNo?: string;
  fatherName?: string;
  motherName?: string;
  birthPlace?: string;
  education?: 'ilkögretim' | 'lise' | 'yüksekokul';
  kurumSicil?: string;
  kadroUnvani?: string;
  kadroUnvanKodu?: string;
}

export const userService = {
  /**
   * Kendi profil bilgilerini getir
   */
  async getMyProfile(): Promise<{ user: User }> {
    return apiRequest<{ user: User }>('/api/users/me');
  },

  /**
   * Kendi profil bilgilerini güncelle
   */
  async updateMyProfile(data: UpdateProfileRequest): Promise<{ user: User }> {
    return apiRequest<{ user: User }>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

