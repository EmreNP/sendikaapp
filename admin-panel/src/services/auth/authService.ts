import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { User, UserRole } from '@/types/user';
import { logger } from '@/utils/logger';

// Kalıcı in-memory cache: Silinmiş/bulunamayan kullanıcıları tekrar sorgulamayı engeller
// Sayfa yenilenene kadar geçerli (modül seviyesinde)
const _notFoundUserCache = new Map<string, User>();

export interface SignInResult {
  user: User;
  idToken: string;
}

export const authService = {
  /**
   * Admin veya Branch Manager olarak giriş yap
   */
  async signIn(email: string, password: string): Promise<SignInResult> {
    try {
      logger.log('🔐 Sign in attempt:', { email });
      // Firebase Authentication ile giriş
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      logger.log('✅ Firebase Auth success:', firebaseUser.uid);

      // ID token al
      const idToken = await firebaseUser.getIdToken();

      // Firestore'dan user bilgilerini al
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      logger.log('📄 Firestore check:', { exists: userDoc.exists(), uid: firebaseUser.uid });

      if (!userDoc.exists()) {
        logger.error('❌ Firestore user not found');
        throw new Error('Kullanıcı bulunamadı');
      }

      const userData = userDoc.data() as User;
      logger.log('👤 User data:', { role: userData.role, status: userData.status });

      // Sadece admin, superadmin ve branch_manager giriş yapabilir
      if (userData.role !== 'admin' && userData.role !== 'branch_manager' && userData.role !== 'superadmin') {
        logger.error('❌ Invalid role:', userData.role);
        await firebaseSignOut(auth);
        throw new Error('Bu panele erişim yetkiniz yok');
      }

      // Admin, superadmin ve branch_manager için status kontrolü yok - direkt giriş yapabilirler

      return {
        user: userData,
        idToken,
      };
    } catch (error: unknown) {
      const errCode = (error as { code?: string })?.code;
      const errMessage = error instanceof Error ? error.message : String(error);
      logger.error('❌ Sign in error:', { 
        code: errCode, 
        message: errMessage,
        error: error 
      });
      // Firebase hatalarını Türkçe'ye çevir
      if (errCode === 'auth/user-not-found' || 
          errCode === 'auth/wrong-password' || 
          errCode === 'auth/invalid-credential') {
        throw new Error('E-posta veya şifre hatalı');
      }
      if (errCode === 'auth/too-many-requests') {
        throw new Error('Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin');
      }
      if (errCode === 'auth/user-disabled') {
        throw new Error('Bu hesap devre dışı bırakılmış');
      }
      if (errCode === 'auth/invalid-email') {
        throw new Error('Geçersiz e-posta adresi');
      }
      // Bilinmeyen hatalar için orijinal mesajı göster
      throw new Error(errMessage || 'Giriş başarısız');
    }
  },

  /**
   * Çıkış yap
   */
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },

  /**
   * Mevcut kullanıcının ID token'ını al
   * Token cache'lenir, sadece gerektiğinde refresh edilir
   */
  async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    // forceRefresh = false: Cache'den al, sadece expired ise refresh et
    // forceRefresh = true: Her zaman fresh token al (401 hatası sonrası retry için)
    return await user.getIdToken(forceRefresh);
  },

  /**
   * Kullanıcı bilgilerini al
   * - Kendi kullanıcısı için: Firestore (rules izin verir)
   * - Diğer kullanıcılar için: Backend API (Firestore rules'a takılmasın)
   * - Bulunamayan kullanıcılar kalıcı cache'e eklenir ve tekrar sorgulanmaz
   */
  async getUserData(uid: string): Promise<User | null> {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    // Daha önce bulunamayan kullanıcıyı tekrar sorgulama
    if (_notFoundUserCache.has(uid)) {
      return _notFoundUserCache.get(uid)!;
    }

    // Own profile can be read via Firestore rules.
    if (currentUser.uid === uid) {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) return null;
      return userDoc.data() as User;
    }

    // Other users: fetch from backend (admin SDK) to avoid Firestore permission issues.
    try {
      const { apiRequest } = await import('@/utils/api');
      const data = await apiRequest<{ user: User }>(`/api/users/${uid}`);
      return data?.user || null;
    } catch (error: unknown) {
      // 404 = kullanıcı silinmiş/bulunamıyor — placeholder döndür ve cache'le
      const errObj = error as { response?: { status?: number }; code?: string };
      const errMsg = error instanceof Error ? error.message : '';
      if (errObj?.response?.status === 404 || errObj?.code === 'NOT_FOUND' || errMsg.includes('bulunamadı')) {
        const placeholder = {
          firstName: 'Silinmiş',
          lastName: 'Kullanıcı',
          email: '',
          role: '' as UserRole,
          status: 'deleted',
          isActive: false,
        } as unknown as User;
        _notFoundUserCache.set(uid, placeholder);
        return placeholder;
      }
      // Diğer hatalar (network vb.) yukarı fırlat
      throw error;
    }
  },
};

