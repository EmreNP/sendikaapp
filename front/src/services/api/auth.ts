// Auth Service - Authentication API calls

import { API_ENDPOINTS } from '../../config/api';
import api from './client';
import { auth } from '../../config/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  signInWithCustomToken,
  User as FirebaseUser 
} from 'firebase/auth';

// Types - Inline definitions
type Gender = 'male' | 'female';
type EducationLevel = 'ilkokul' | 'ortaokul' | 'lise' | 'on_lisans' | 'lisans' | 'yuksek_lisans' | 'doktora';
type UserStatus = 'pending_details' | 'pending_branch_review' | 'pending_admin_approval' | 'active' | 'rejected';
type UserRole = 'admin' | 'branch_manager' | 'user';

interface User {
  uid: string;
  firstName: string;
  lastName: string;
  birthDate: Date | string;
  gender: Gender;
  tcKimlikNo?: string;
  fatherName?: string;
  motherName?: string;
  birthPlace?: string;
  education?: EducationLevel;
  kurumSicil?: string;
  kadroUnvani?: string;
  kadroUnvanKodu?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  branchId?: string;
  role: UserRole;
  status: UserStatus;
  email: string;
  emailVerified?: boolean;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface RegisterBasicRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthDate: string;
  gender: Gender;
}

interface RegisterDetailsRequest {
  branchId: string;
  tcKimlikNo?: string;
  fatherName?: string;
  motherName?: string;
  birthPlace?: string;
  education?: EducationLevel;
  kurumSicil?: string;
  kadroUnvani?: string;
  kadroUnvanKodu?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
}

// Response Types
interface RegisterBasicResponse {
  customToken: string;
  uid: string;
  nextStep: string;
}

interface RegisterDetailsResponse {
  user: User;
}

// Register Step 1 - Basic Info
export async function registerBasic(data: RegisterBasicRequest): Promise<RegisterBasicResponse> {
  const response = await api.post<RegisterBasicResponse>(
    API_ENDPOINTS.AUTH.REGISTER_BASIC,
    data,
    false // No auth required
  );
  
  if (!response.success || !response.data) {
    throw new Error('Kayıt işlemi başarısız');
  }

  // Sign in with custom token after registration
  await signInWithCustomToken(auth, response.data.customToken);
  
  return response.data;
}

// Register Step 2 - Detailed Info (requires auth)
export async function registerDetails(data: RegisterDetailsRequest): Promise<User> {
  const response = await api.post<RegisterDetailsResponse>(
    API_ENDPOINTS.AUTH.REGISTER_DETAILS,
    data,
    true // Auth required
  );
  
  if (!response.success || !response.data) {
    throw new Error('Kayıt tamamlama işlemi başarısız');
  }
  
  return response.data.user;
}

// Login
export async function login(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Logout
export async function logout(): Promise<void> {
  await signOut(auth);
}

// Get Current User from API
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>(API_ENDPOINTS.USERS.ME);
  
  if (!response.success || !response.data) {
    throw new Error('Kullanıcı bilgileri alınamadı');
  }
  
  return response.data;
}

// Update Current User
export async function updateCurrentUser(data: Partial<User>): Promise<User> {
  const response = await api.put<User>(API_ENDPOINTS.USERS.ME, data);
  
  if (!response.success || !response.data) {
    throw new Error('Kullanıcı bilgileri güncellenemedi');
  }
  
  return response.data;
}

// Change Password
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const response = await api.post(
    API_ENDPOINTS.AUTH.PASSWORD_CHANGE,
    { oldPassword, newPassword }
  );
  
  if (!response.success) {
    throw new Error('Şifre değiştirilemedi');
  }
}

// Send Email Verification
export async function sendEmailVerification(): Promise<void> {
  const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL_SEND, {});
  
  if (!response.success) {
    throw new Error('Doğrulama e-postası gönderilemedi');
  }
}

export default {
  registerBasic,
  registerDetails,
  login,
  logout,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  sendEmailVerification,
};
