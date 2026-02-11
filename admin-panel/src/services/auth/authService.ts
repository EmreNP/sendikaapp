import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { User, UserRole } from '@/types/user';

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
      console.log('🔐 Sign in attempt:', { email });
      // Firebase Authentication ile giriş
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase Auth success:', firebaseUser.uid);

      // ID token al
      const idToken = await firebaseUser.getIdToken();

      // Firestore'dan user bilgilerini al
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      console.log('📄 Firestore check:', { exists: userDoc.exists(), uid: firebaseUser.uid });

      if (!userDoc.exists()) {
        console.error('❌ Firestore user not found');
        throw new Error('Kullanıcı bulunamadı');
      }

      const userData = userDoc.data() as User;
      console.log('👤 User data:', { role: userData.role, status: userData.status });

      // Sadece admin, superadmin ve branch_manager giriş yapabilir
      if (userData.role !== 'admin' && userData.role !== 'branch_manager' && userData.role !== 'superadmin') {
        console.error('❌ Invalid role:', userData.role);
        await firebaseSignOut(auth);
        throw new Error('Bu panele erişim yetkiniz yok');
      }

      // Admin, superadmin ve branch_manager için status kontrolü yok - direkt giriş yapabilirler

      return {
        user: userData,
        idToken,
      };
    } catch (error: any) {
      console.error('❌ Sign in error:', { 
        code: error.code, 
        message: error.message,
        error: error 
      });
      // Firebase hatalarını Türkçe'ye çevir
      if (error.code === 'auth/user-not-found' || 
          error.code === 'auth/wrong-password' || 
          error.code === 'auth/invalid-credential') {
        throw new Error('E-posta veya şifre hatalı');
      }
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin');
      }
      if (error.code === 'auth/user-disabled') {
        throw new Error('Bu hesap devre dışı bırakılmış');
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('Geçersiz e-posta adresi');
      }
      // Bilinmeyen hatalar için orijinal mesajı göster
      throw new Error(error.message || 'Giriş başarısız');
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
   */
  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  },

  /**
   * Kullanıcı bilgilerini Firestore'dan al
   */
  async getUserData(uid: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;
    return userDoc.data() as User;
  },
};

