// API Service
import { signInWithCustomToken, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type { User, Training, Lesson, Branch, News, Announcement, FAQ, ContactMessage } from '../types';

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  private isNgrokUrl(url: string): boolean {
    return /ngrok/i.test(url);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true
  ): Promise<T> {
    const headers: HeadersInit = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Ngrok bazen browser warning HTML'i döndürebiliyor; bu header onu bypass eder.
    if (this.isNgrokUrl(API_BASE_URL)) {
      (headers as Record<string, string>)['ngrok-skip-browser-warning'] = 'true';
    }

    if (requireAuth) {
      const token = await this.getAuthToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    let data: any;
    if (contentType.includes('application/json')) {
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        // JSON bekleniyordu ama parse edilemedi
        throw new Error(`JSON Parse error: Unexpected response. Status ${response.status}. Body: ${rawText.slice(0, 200)}`);
      }
    } else {
      // HTML/text döndüyse (ngrok warning veya error page), anlamlı hata dön
      throw new Error(
        `Unexpected response type (${contentType || 'unknown'}). Status ${response.status}. Body: ${rawText.slice(0, 200)}`
      );
    }

    if (!response.ok) {
      throw new Error(data?.message || 'Bir hata oluştu');
    }

    return data as T;
  }

  // Auth Methods
  async login(email: string, password: string): Promise<{ user: User }> {
    await signInWithEmailAndPassword(auth, email, password);
    const user = await this.getCurrentUser();
    return { user };
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async registerBasic(data: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string;
    birthDate: string;
    gender: 'male' | 'female';
  }): Promise<{ user: User }> {
    // IMPORTANT:
    // Firestore rules'lar client'tan /users yazmayı engelleyebilir.
    // Bu yüzden basic register backend üzerinden yapılır (Admin SDK Firestore'a yazar).
    const response = await this.request<{
      success: boolean;
      data: { uid: string; email: string; customToken?: string; nextStep?: string };
    }>(
      API_ENDPOINTS.AUTH.REGISTER_BASIC,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      false
    );

    const customToken = response.data?.customToken;

    if (customToken) {
      await signInWithCustomToken(auth, customToken);
    } else {
      // Fallback: backend user'ı oluşturduğu için email/password ile login yapılabilir
      await signInWithEmailAndPassword(auth, data.email, data.password);
    }

    const user = await this.getCurrentUser();
    return { user };
  }

  async registerDetails(data: {
    phone: string;
    tcKimlik: string;
    branchId: string;
    workplace?: string;
    position?: string;
    city?: string;
    district?: string;
    address?: string;
  }): Promise<{ user: User }> {
    const response = await this.request<{ success: boolean; data: User }>(
      API_ENDPOINTS.AUTH.REGISTER_DETAILS,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    return { user: response.data };
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ success: boolean; data: User }>(
      API_ENDPOINTS.USERS.ME
    );
    return response.data;
  }

  // Trainings
  async getTrainings(): Promise<Training[]> {
    const response = await this.request<{ success: boolean; data: Training[] }>(
      API_ENDPOINTS.TRAININGS.BASE,
      {},
      true
    );
    return response.data;
  }

  async getTraining(id: string): Promise<Training> {
    const response = await this.request<{ success: boolean; data: Training }>(
      API_ENDPOINTS.TRAININGS.BY_ID(id)
    );
    return response.data;
  }

  async getLessons(trainingId: string): Promise<Lesson[]> {
    const response = await this.request<{ success: boolean; data: Lesson[] }>(
      API_ENDPOINTS.TRAININGS.LESSONS(trainingId)
    );
    return response.data;
  }

  async getLesson(trainingId: string, lessonId: string): Promise<Lesson> {
    const response = await this.request<{ success: boolean; data: Lesson }>(
      API_ENDPOINTS.TRAININGS.LESSON_BY_ID(trainingId, lessonId)
    );
    return response.data;
  }

  // Branches
  async getBranches(): Promise<Branch[]> {
    const response = await this.request<{ success: boolean; data: Branch[] }>(
      API_ENDPOINTS.BRANCHES.BASE,
      {},
      false
    );
    return response.data;
  }

  async getBranch(id: string): Promise<Branch> {
    const response = await this.request<{ success: boolean; data: Branch }>(
      API_ENDPOINTS.BRANCHES.BY_ID(id),
      {},
      false
    );
    return response.data;
  }

  // News
  async getNews(): Promise<News[]> {
    const response = await this.request<{ success: boolean; data: News[] }>(
      API_ENDPOINTS.NEWS.BASE,
      {},
      false
    );
    return response.data;
  }

  async getNewsItem(id: string): Promise<News> {
    const response = await this.request<{ success: boolean; data: News }>(
      API_ENDPOINTS.NEWS.BY_ID(id),
      {},
      false
    );
    return response.data;
  }

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    const response = await this.request<{ success: boolean; data: Announcement[] }>(
      API_ENDPOINTS.ANNOUNCEMENTS.BASE,
      {},
      false
    );
    return response.data;
  }

  // FAQ
  async getFAQs(): Promise<FAQ[]> {
    const response = await this.request<{ success: boolean; data: FAQ[] }>(
      API_ENDPOINTS.FAQ.BASE,
      {},
      false
    );
    return response.data;
  }

  // Contact
  async sendContactMessage(data: ContactMessage): Promise<void> {
    await this.request(
      API_ENDPOINTS.CONTACT.BASE,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      false
    );
  }
}

export default new ApiService();
