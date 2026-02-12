// API Service
import { signInWithCustomToken, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type { User, Training, Lesson, LessonContent, Branch, News, Announcement, FAQ, ContactMessage } from '../types';

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
    const response = await this.request<{ success: boolean; data: { user: User } }>(
      API_ENDPOINTS.USERS.ME
    );
    return response.data.user;
  }

  // Trainings
  async getTrainings(): Promise<Training[]> {
    const response = await this.request<{
      success: boolean;
      data: { trainings: Training[]; total: number; page: number; limit: number };
    }>(API_ENDPOINTS.TRAININGS.BASE, {}, true);

    return response.data.trainings;
  }

  async getTraining(id: string): Promise<Training> {
    const response = await this.request<{ success: boolean; data: { training: Training } }>(
      API_ENDPOINTS.TRAININGS.BY_ID(id)
    );
    return response.data.training;
  }

  async getLessons(trainingId: string): Promise<Lesson[]> {
    const response = await this.request<{ success: boolean; data: { lessons: Lesson[] } }>(
      API_ENDPOINTS.TRAININGS.LESSONS(trainingId)
    );
    return response.data.lessons;
  }

  async getLesson(trainingId: string, lessonId: string): Promise<Lesson> {
    const response = await this.request<{ success: boolean; data: { lesson: Lesson } }>(
      API_ENDPOINTS.TRAININGS.LESSON_BY_ID(trainingId, lessonId)
    );
    return response.data.lesson;
  }

  async getLessonContents(lessonId: string, type?: 'video' | 'document' | 'test') : Promise<LessonContent[]> {
    // Backend exposes separate endpoints for videos/documents/tests. Use them and normalize to LessonContent[]
    const mapVideo = (v: any) => ({ id: v.id, lessonId: v.lessonId, title: v.title, description: v.description, type: 'video' as const, url: v.videoUrl, duration: v.duration ? String(v.duration) : undefined, order: v.order });
    const mapDocument = (d: any) => ({ id: d.id, lessonId: d.lessonId, title: d.title, description: d.description, type: 'document' as const, url: d.documentUrl, order: d.order });
    const mapTest = (t: any) => ({ id: t.id, lessonId: t.lessonId, title: t.title, description: t.description, type: 'test' as const, order: t.order });

    if (type === 'video') {
      const response = await this.request<{ success: boolean; data: { videos: any[] } }>(API_ENDPOINTS.LESSONS.VIDEOS(lessonId));
      return (response.data.videos || []).map(mapVideo);
    }

    if (type === 'document') {
      const response = await this.request<{ success: boolean; data: { documents: any[] } }>(API_ENDPOINTS.LESSONS.DOCUMENTS(lessonId));
      return (response.data.documents || []).map(mapDocument);
    }

    if (type === 'test') {
      const response = await this.request<{ success: boolean; data: { tests: any[] } }>(API_ENDPOINTS.LESSONS.TESTS(lessonId));
      return (response.data.tests || []).map(mapTest);
    }

    // no type: fetch all three in parallel
    const [videosRes, docsRes, testsRes] = await Promise.all([
      this.request<{ success: boolean; data: { videos: any[] } }>(API_ENDPOINTS.LESSONS.VIDEOS(lessonId)).catch(() => ({ data: { videos: [] } } as any)),
      this.request<{ success: boolean; data: { documents: any[] } }>(API_ENDPOINTS.LESSONS.DOCUMENTS(lessonId)).catch(() => ({ data: { documents: [] } } as any)),
      this.request<{ success: boolean; data: { tests: any[] } }>(API_ENDPOINTS.LESSONS.TESTS(lessonId)).catch(() => ({ data: { tests: [] } } as any)),
    ]);

    const combined = [
      ...(videosRes.data.videos || []).map(mapVideo),
      ...(docsRes.data.documents || []).map(mapDocument),
      ...(testsRes.data.tests || []).map(mapTest),
    ];

    // sort by order when available
    combined.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    return combined;
  }

  async getTest(testId: string): Promise<any> {
    const response = await this.request<{ success: boolean; data: { test: any } }>(API_ENDPOINTS.TESTS.BY_ID(testId));
    return response.data.test;
  }

  // Branches
  async getBranches(): Promise<Branch[]> {
    // Backend may return different shapes:
    // - { success: true, branches: Branch[], total, page }
    // - { success: true, data: { branches: Branch[] } }
    // - { success: true, data: Branch[] }
    const response = await this.request<any>(
      API_ENDPOINTS.BRANCHES.BASE,
      {},
      true
    );

    if (Array.isArray(response.branches)) return response.branches;
    if (response.data) {
      if (Array.isArray(response.data.branches)) return response.data.branches;
      if (Array.isArray(response.data)) return response.data;
    }

    // Fallback empty list
    return [];
  }

  async getBranch(id: string): Promise<Branch> {
    const response = await this.request<any>(
      API_ENDPOINTS.BRANCHES.BY_ID(id),
      {},
      true
    );

    if (response.branch) return response.branch;
    if (response.data) {
      if (response.data.branch) return response.data.branch;
      // if data itself is the branch object
      if (typeof response.data === 'object' && !Array.isArray(response.data)) return response.data;
    }

    throw new Error('Branch not found');
  }

  // News
  async getNews(): Promise<News[]> {
    const response = await this.request<{ success: boolean; data: { news: News[]; total?: number } }>(
      API_ENDPOINTS.NEWS.BASE,
      {},
      true
    );
    return response.data.news || [];
  }

  async getNewsItem(id: string): Promise<News> {
    const response = await this.request<{ success: boolean; data: { news: News } }>(
      API_ENDPOINTS.NEWS.BY_ID(id),
      {},
      true
    );
    return response.data.news;
  }

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    const response = await this.request<{ success: boolean; data: { announcements: Announcement[]; total?: number } }>(
      API_ENDPOINTS.ANNOUNCEMENTS.BASE,
      {},
      true
    );
    return response.data.announcements || [];
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
      true
    );
  }
}

export default new ApiService();
