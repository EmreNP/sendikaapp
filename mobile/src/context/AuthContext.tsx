// Auth Context
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import apiService from '../services/api';
import { getStoredToken, clearStoredToken } from '../services/notificationService';
import { logger } from '../utils/logger';
import type { User, UserStatus, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  status: UserStatus | null;
  role: UserRole | null;
  isPendingDetails: boolean;
  isActive: boolean;
  isAdmin: boolean;
  isBranchManager: boolean;
  canAccessTrainings: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerBasic: (data: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string;
    phone: string;
    birthDate: string;
    district: string;
    kadroUnvani: string;
    gender: 'male' | 'female';
  }) => Promise<void>;
  registerDetails: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);

        } catch (error) {
          logger.error('Failed to get user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { user: userData } = await apiService.login(email, password);
    setUser(userData);
  };

  const logout = async () => {
    // Logout öncesi FCM token'ı deaktive et
    try {
      const storedToken = await getStoredToken();
      if (storedToken) {
        await apiService.deactivatePushToken(storedToken);
        await clearStoredToken();
        logger.log('✅ FCM token logout sırasında deaktive edildi');
      }
    } catch (error) {
      logger.warn('FCM token deaktive edilemedi:', error);
    }
    await apiService.logout();
    setUser(null);
  };

  const registerBasic = async (data: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string;
    phone: string;
    birthDate: string;
    district: string;
    kadroUnvani: string;
    gender: 'male' | 'female';
  }) => {
    const { user: userData } = await apiService.registerBasic(data);
    setUser(userData);
  };

  const registerDetails = async (data: any) => {
    const { user: userData } = await apiService.registerDetails(data);
    setUser(userData);
  };

  const refreshUser = async () => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      logger.error('Failed to refresh user:', error);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isBranchManager = user?.role === 'branch_manager';

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    status: user?.status || null,
    role: user?.role || null,
    isPendingDetails: user?.status === 'pending_details',
    isActive: user?.status === 'active',
    isAdmin,
    isBranchManager,
    // Follow backend doc: only admins bypass status check. Branch managers/users must be 'active' to access trainings.
    canAccessTrainings: user?.status === 'active' || isAdmin,
    login,
    logout,
    registerBasic,
    registerDetails,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
