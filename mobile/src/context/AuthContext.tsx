import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import apiService from '../services/api';
import type { User } from '@shared/types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser ? firebaseUser.uid : 'no user');
      if (firebaseUser) {
        try {
          const userData = await apiService.getCurrentUser();
          console.log('✅ User state updated:', { uid: userData.uid, status: userData.status });
          setUser(userData);
        } catch (error: any) {
          console.error('❌ Failed to get user data:', error.message);
          // Hata durumunda user'ı null yapma, Firebase user varsa bekleyelim
          // Çünkü Firestore'da henüz user oluşmamış olabilir (register basic sonrası)
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiService.login(email, password);
    console.log('✅ Login successful, setting user:', { uid: response.user.uid, status: response.user.status });
    // onAuthStateChanged otomatik olarak tetiklenecek ama hemen setUser yapalım
    // ki navigation çalışsın
    setUser(response.user);
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

