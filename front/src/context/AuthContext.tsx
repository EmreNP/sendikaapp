
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { authService } from '../services/api';

// Shared Types - Inline definitions (shared klasöründen import sorunlarını önlemek için)
export type UserStatus = 
  | 'pending_details' 
  | 'pending_branch_review' 
  | 'active' 
  | 'rejected';

export type UserRole = 'admin' | 'branch_manager' | 'user';

export type Gender = 'male' | 'female';

export type EducationLevel = 
  | 'ilkokul'
  | 'ortaokul'
  | 'lise'
  | 'on_lisans'
  | 'lisans'
  | 'yuksek_lisans'
  | 'doktora';

export interface User {
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

export interface RegisterBasicRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthDate: string;
  gender: Gender;
}

export interface RegisterDetailsRequest {
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

// Auth State Interface
interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  status: UserStatus | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth Context Interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerBasic: (data: RegisterBasicRequest) => Promise<void>;
  registerDetails: (data: RegisterDetailsRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  
  // Convenience getters
  isActive: boolean;
  isPendingDetails: boolean;
  isPendingBranchReview: boolean;
  isPendingApproval: boolean;
  isRejected: boolean;
  isAdmin: boolean;
  isBranchManager: boolean;
  canAccessTrainings: boolean;
}

// Initial State
const initialState: AuthState = {
  firebaseUser: null,
  user: null,
  status: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState((prev: AuthState) => ({ ...prev, ...updates }));
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUser();
      updateState({
        user: userData as User,
        status: userData.status as UserStatus,
        role: userData.role as UserRole,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
      updateState({
        user: null,
        status: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Kullanıcı bilgileri alınamadı',
      });
    }
  }, [updateState]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        updateState({ firebaseUser, isLoading: true });
        await fetchUserData();
      } else {
        updateState({
          ...initialState,
          isLoading: false,
        });
      }
    });

    return () => unsubscribe();
  }, [fetchUserData, updateState]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      updateState({ isLoading: true, error: null });
      await authService.login(email, password);
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      updateState({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  }, [updateState]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      updateState({
        ...initialState,
        isLoading: false,
      });
    } catch (error) {
      console.error('Çıkış yapılamadı:', error);
      throw error;
    }
  }, [updateState]);

  const registerBasic = useCallback(async (data: RegisterBasicRequest) => {
    try {
      updateState({ isLoading: true, error: null });
      await authService.registerBasic(data);
    } catch (error: any) {
      updateState({ isLoading: false, error: error.message });
      throw error;
    }
  }, [updateState]);

  const registerDetails = useCallback(async (data: RegisterDetailsRequest) => {
    try {
      updateState({ isLoading: true, error: null });
      const updatedUser = await authService.registerDetails(data);
      updateState({
        user: updatedUser as User,
        status: updatedUser.status as UserStatus,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      updateState({ isLoading: false, error: error.message });
      throw error;
    }
  }, [updateState]);

  const refreshUser = useCallback(async () => {
    if (state.firebaseUser) {
      await fetchUserData();
    }
  }, [state.firebaseUser, fetchUserData]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Computed values
  const isActive = state.status === 'active';
  const isPendingDetails = state.status === 'pending_details';
  const isPendingBranchReview = state.status === 'pending_branch_review';
  const isPendingApproval = isPendingBranchReview;
  const isRejected = state.status === 'rejected';
  const isAdmin = state.role === 'admin';
  const isBranchManager = state.role === 'branch_manager';
  const canAccessTrainings = state.isAuthenticated && isActive;

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    registerBasic,
    registerDetails,
    refreshUser,
    clearError,
    isActive,
    isPendingDetails,
    isPendingBranchReview,
    isPendingApproval,
    isRejected,
    isAdmin,
    isBranchManager,
    canAccessTrainings,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanımda.',
    'auth/invalid-email': 'Geçersiz e-posta adresi.',
    'auth/operation-not-allowed': 'Bu işlem şu anda yapılamıyor.',
    'auth/weak-password': 'Şifre çok zayıf. En az 6 karakter kullanın.',
    'auth/user-disabled': 'Bu hesap devre dışı bırakılmış.',
    'auth/user-not-found': 'E-posta veya şifre hatalı.',
    'auth/wrong-password': 'E-posta veya şifre hatalı.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/too-many-requests': 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.',
    'auth/network-request-failed': 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.',
  };
  
  return messages[code] || 'Bir hata oluştu. Lütfen tekrar deneyin.';
}
