import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { authService } from '@/services/auth/authService';
import { clearUserNameCache } from '@/services/api/userNameService';
import type { User } from '@/types/user';
import { logger } from '@/utils/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await authService.getUserData(firebaseUser.uid);
          // Superadmin, admin ve branch_manager için status kontrolü yok
          if (userData && (userData.role === 'superadmin' || userData.role === 'admin' || userData.role === 'branch_manager')) {
            setUser(userData);
          } else {
            setUser(null);
            await authService.signOut();
          }
        } catch (error) {
          logger.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    clearUserNameCache();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, signOut: handleSignOut }}>
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

