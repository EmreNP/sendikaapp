import axios, { AxiosInstance, AxiosError } from 'axios';
import { signInWithEmailAndPassword, signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { ApiResponse } from '../types';
import type { RegisterBasicRequest, RegisterDetailsRequest, User } from '@shared/types/user';
import type { Branch } from '@shared/types/branch';

// API Base URL - Update this to your backend URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config: any) => {
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔑 Auth token added to request:', config.url);
        } else {
          console.warn('⚠️ No auth token available for request:', config.url);
        }
        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: any) => response,
      async (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await this.clearAuth();
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth Methods - Firebase Authentication
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      console.log('🔐 Attempting login for:', email);
      // Firebase Authentication ile giriş
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase sign in successful:', userCredential.user.uid);
      const firebaseUser = userCredential.user;

      // ID token al
      const idToken = await firebaseUser.getIdToken();

      // Firestore'dan user bilgilerini al
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        await firebaseSignOut(auth);
        throw new Error('Kullanıcı bulunamadı');
      }

      const userData = userDoc.data() as User;
      console.log('✅ User data retrieved:', { uid: userData.uid, status: userData.status });

      return {
        user: userData,
        token: idToken,
      };
    } catch (error: any) {
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
      throw new Error(error.message || 'Giriş başarısız');
    }
  }

  async logout(): Promise<void> {
    await firebaseSignOut(auth);
  }

  async registerBasic(data: RegisterBasicRequest): Promise<{ uid: string; email: string; customToken?: string }> {
    try {
      const response = await this.api.post<ApiResponse<{ uid: string; email: string; customToken?: string }>>(
        '/auth/register/basic',
        data
      );
      
      if (response.data.success && response.data.data) {
        const result = response.data.data;
        
        // Custom token varsa Firebase'e sign in yap
        if (result.customToken) {
          try {
            await signInWithCustomToken(auth, result.customToken);
            console.log('✅ Signed in with custom token');
          } catch (signInError: any) {
            console.error('⚠️ Failed to sign in with custom token:', signInError);
            // Custom token ile sign in başarısız olsa bile kayıt başarılı
          }
        }
        
        return result;
      }
      
      throw new Error(response.data.message || 'Registration failed');
    } catch (error: any) {
      // Axios error ise, response'dan mesajı al
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async registerDetails(data: RegisterDetailsRequest): Promise<{ uid: string; status: string }> {
    try {
      console.log('📝 Registering details:', JSON.stringify(data, null, 2));
      const response = await this.api.post<ApiResponse<{ user: { uid: string; status: string } }>>(
        '/auth/register/details',
        data
      );
      
      if (response.data.success && response.data.data) {
        console.log('✅ Registration details successful:', response.data.data.user);
        return response.data.data.user;
      }
      
      throw new Error(response.data.message || 'Registration details failed');
    } catch (error: any) {
      // Axios error handling
      if (error.response) {
        // Backend'den hata döndü
        const errorData = error.response.data;
        console.error('❌ Backend error response:', JSON.stringify(errorData, null, 2));
        
        const errorMessage = errorData?.message || errorData?.error || 'Kayıt işlemi başarısız oldu';
        console.error('❌ Error message:', errorMessage);
        throw new Error(errorMessage);
      } else if (error.request) {
        // İstek gönderildi ama response alınamadı
        console.error('❌ No response received:', error.request);
        throw new Error('Sunucuya bağlanılamadı');
      } else {
        // İstek oluşturulurken hata oluştu
        console.error('❌ Request setup error:', error.message);
        throw error;
      }
    }
  }

  // User Methods
  async getCurrentUser(): Promise<User> {
    // Try to get from Firebase Auth first
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        console.log('📄 Getting user from Firestore:', firebaseUser.uid);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          console.log('✅ User data from Firestore:', { uid: userData.uid, status: userData.status });
          return userData;
        } else {
          console.warn('⚠️ User document not found in Firestore');
        }
      } catch (error: any) {
        console.error('❌ Failed to get user from Firestore:', error.message);
      }
    } else {
      console.warn('⚠️ No Firebase user found');
    }

    // Fallback to API (requires auth token)
    try {
      console.log('📡 Fetching user from API...');
      const response = await this.api.get<ApiResponse<{ user: User }>>('/users/me');
      
      if (response.data.success && response.data.data) {
        console.log('✅ User data from API:', { uid: response.data.data.user.uid, status: response.data.data.user.status });
        return response.data.data.user;
      }
      
      throw new Error(response.data.message || 'Failed to fetch user');
    } catch (error: any) {
      // If 401, user is not authenticated
      if (error.response?.status === 401) {
        throw new Error('Kimlik doğrulaması gerekli. Lütfen giriş yapın.');
      }
      console.error('❌ Failed to get user from API:', error.message);
      throw error;
    }
  }

  // Branch Methods
  async getBranches(): Promise<Branch[]> {
    try {
      console.log('📡 Fetching branches...');
      const response = await this.api.get<ApiResponse<{ branches: Branch[] }>>('/branches');
      
      if (response.data.success && response.data.data) {
        console.log('✅ Branches fetched:', response.data.data.branches.length);
        return response.data.data.branches;
      }
      
      throw new Error(response.data.message || 'Failed to fetch branches');
    } catch (error: any) {
      console.error('❌ Failed to fetch branches:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        throw new Error('Kimlik doğrulaması gerekli. Lütfen giriş yapın.');
      }
      throw error;
    }
  }

  // Auth Token Management
  async getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
      console.warn('⚠️ No Firebase user found for token');
      return null;
    }
    try {
      const token = await user.getIdToken();
      return token;
    } catch (error: any) {
      console.error('❌ Failed to get ID token:', error.message);
      return null;
    }
  }

  async clearAuth(): Promise<void> {
    await firebaseSignOut(auth);
  }

  // Error Handler Helper
  getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse>;
      // Backend'den gelen hata mesajını öncelikle kullan
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }
      if (axiosError.response?.data?.error) {
        return axiosError.response.data.error;
      }
      // HTTP status code'a göre genel mesajlar
      if (axiosError.response?.status === 400) {
        return 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.';
      }
      if (axiosError.response?.status === 401) {
        return 'Yetkilendirme hatası';
      }
      if (axiosError.response?.status === 500) {
        return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      }
      return axiosError.message || 'Bir hata oluştu';
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'Bilinmeyen bir hata oluştu';
  }
}

export default new ApiService();
