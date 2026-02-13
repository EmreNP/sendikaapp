// API Service
import { signInWithCustomToken, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import type { User, Training, Lesson, LessonContent, Branch, News, Announcement, FAQ, ContactMessage, ContractedInstitution, InstitutionCategory } from '../types';

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
      'X-Requested-With': 'XMLHttpRequest',
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
    }).catch((err: any) => {
      // Network error - provide meaningful message
      if (err.message?.includes('Network request failed') || err.message?.includes('Failed to fetch')) {
        throw new Error('İnternet bağlantınız yok veya sunucuya ulaşılamıyor. Lütfen bağlantınızı kontrol edin.');
      }
      if (err.message?.includes('timeout') || err.message?.includes('Timeout')) {
        throw new Error('İstek zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
      }
      throw new Error('Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.');
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
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.'));
    }
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

    try {
      if (customToken) {
        await signInWithCustomToken(auth, customToken);
      } else {
        // Fallback: backend user'ı oluşturduğu için email/password ile login yapılabilir
        await signInWithEmailAndPassword(auth, data.email, data.password);
      }
    } catch (error: any) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Kayıt başarılı ancak otomatik giriş yapılamadı. Lütfen giriş sayfasından tekrar deneyin.'));
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

  async requestPasswordReset(email: string): Promise<void> {
    await this.request(
      API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST,
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
      false
    );
  }

  async updateProfile(data: Record<string, any>): Promise<User> {
    const response = await this.request<{ success: boolean; data: { user: User } }>(
      API_ENDPOINTS.USERS.ME,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.data.user;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ success: boolean; data: { user: User } }>(
      API_ENDPOINTS.USERS.ME
    );
    return response.data.user;
  }

  // Trainings
  async getTrainings(params?: { page?: number; limit?: number }): Promise<{
    items: Training[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const url = `${API_ENDPOINTS.TRAININGS.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<{
      success: boolean;
      data: { trainings: Training[]; total?: number; page?: number; limit?: number; hasMore?: boolean };
    }>(url, {}, true);

    const items = response.data.trainings || [];
    const total = response.data.total || items.length;
    const hasMore = response.data.hasMore ?? false;
    return { items, total, hasMore };
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
  async getBranches(params?: { page?: number; limit?: number; search?: string }): Promise<{
    items: Branch[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.search) queryParams.append('search', params.search);

    const url = `${API_ENDPOINTS.BRANCHES.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    // Backend may return different shapes:
    // - { success: true, branches: Branch[], total, page }
    // - { success: true, data: { branches: Branch[] } }
    // - { success: true, data: Branch[] }
    const response = await this.request<any>(url, {}, true);

    let items: Branch[] = [];
    let total = 0;
    let hasMore = false;

    if (Array.isArray(response.branches)) {
      items = response.branches;
      total = response.total || items.length;
      hasMore = response.hasMore ?? (response.page ? response.page * (response.limit || 25) < total : false);
    } else if (response.data) {
      if (Array.isArray(response.data.branches)) {
        items = response.data.branches;
        total = response.data.total || items.length;
        hasMore = response.data.hasMore ?? false;
      } else if (Array.isArray(response.data.items)) {
        items = response.data.items;
        total = response.data.total || items.length;
        hasMore = response.data.hasMore ?? false;
      } else if (Array.isArray(response.data)) {
        items = response.data;
        total = items.length;
        hasMore = false;
      }
    }

    return { items, total, hasMore };
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
  async getNews(params?: { isFeatured?: boolean; isPublished?: boolean; limit?: number; page?: number }): Promise<{
    items: News[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.isFeatured !== undefined) queryParams.append('isFeatured', String(params.isFeatured));
    if (params?.isPublished !== undefined) queryParams.append('isPublished', String(params.isPublished));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.page) queryParams.append('page', String(params.page));
    
    const url = `${API_ENDPOINTS.NEWS.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<{ success: boolean; data: { news: News[]; total?: number; hasMore?: boolean; page?: number; limit?: number } }>(
      url,
      {},
      true
    );
    const items = response.data.news || [];
    const total = response.data.total || items.length;
    const hasMore = response.data.hasMore ?? false;
    return { items, total, hasMore };
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
  async getAnnouncements(params?: { page?: number; limit?: number }): Promise<{
    items: Announcement[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const url = `${API_ENDPOINTS.ANNOUNCEMENTS.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<{ success: boolean; data: { announcements: Announcement[]; total?: number; hasMore?: boolean; page?: number; limit?: number } }>(
      url,
      {},
      true
    );
    const items = response.data.announcements || [];
    const total = response.data.total || items.length;
    const hasMore = response.data.hasMore ?? false;
    return { items, total, hasMore };
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
  async getTopics(): Promise<any[]> {
    const response = await this.request<{ success: boolean; topics: any[] }>(
      API_ENDPOINTS.TOPICS.BASE,
      {},
      true
    );
    return response.topics || [];
  }

  async sendContactMessage(data: { 
    name?: string; 
    email?: string; 
    phone?: string; 
    subject?: string; 
    message: string; 
  }): Promise<void> {
    // Backend format: { topicId: string, message: string }
    // Frontend format: { name, email, phone, subject, message }
    
    // "Genel İletişim" topic'ini bulmaya çalış, bulamazsan ilk topic'i kullan
    const topics = await this.getTopics();
    let topicId = topics.find((t: any) => 
      t.name.toLowerCase().includes('genel') || 
      t.name.toLowerCase().includes('iletişim') ||
      t.name.toLowerCase().includes('destek')
    )?.id;
    
    // Eğer hiç uygun topic yoksa, ilk topic'i kullan
    if (!topicId && topics.length > 0) {
      topicId = topics[0].id;
    }
    
    if (!topicId) {
      throw new Error('Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.');
    }
    
    // Mesajı formatıyla gönder
    let formattedMessage = '';
    if (data.name) formattedMessage += `Ad Soyad: ${data.name}\n`;
    if (data.email) formattedMessage += `E-posta: ${data.email}\n`;
    if (data.phone) formattedMessage += `Telefon: ${data.phone}\n`;
    if (data.subject) formattedMessage += `Konu: ${data.subject}\n`;
    formattedMessage += `\nMesaj:\n${data.message}`;
    
    await this.request(
      API_ENDPOINTS.CONTACT.BASE,
      {
        method: 'POST',
        body: JSON.stringify({ 
          topicId, 
          message: formattedMessage 
        }),
      },
      true
    );
  }

  // Notifications - Token Management
  async registerPushToken(token: string, deviceType: 'ios' | 'android', deviceId?: string): Promise<void> {
    await this.request(
      API_ENDPOINTS.NOTIFICATIONS.TOKEN,
      {
        method: 'POST',
        body: JSON.stringify({ token, deviceType, deviceId }),
      },
      true
    );
  }

  async deactivatePushToken(token: string): Promise<void> {
    await this.request(
      API_ENDPOINTS.NOTIFICATIONS.TOKEN,
      {
        method: 'DELETE',
        body: JSON.stringify({ token }),
      },
      true
    );
  }

  // Notifications - History
  async getNotifications(params?: { page?: number; limit?: number; type?: string }): Promise<{
    notifications: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    
    const endpoint = `${API_ENDPOINTS.NOTIFICATIONS.HISTORY}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<{ 
      success: boolean; 
      data: { 
        notifications: any[]; 
        pagination: { page: number; limit: number; total: number; totalPages: number };
      } 
    }>(
      endpoint,
      {},
      true
    );
    return response.data;
  }

  // Contracted Institutions
  async getContractedInstitutions(params?: { page?: number; limit?: number; categoryId?: string }): Promise<{
    items: ContractedInstitution[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);

    const url = `${API_ENDPOINTS.CONTRACTED_INSTITUTIONS.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<{ 
      success: boolean; 
      data: { institutions: ContractedInstitution[]; total?: number; hasMore?: boolean; page?: number; limit?: number } 
    }>(url, {}, true);

    const items = response.data.institutions || [];
    const total = response.data.total || items.length;
    const hasMore = response.data.hasMore ?? false;
    return { items, total, hasMore };
  }

  async getContractedInstitution(id: string): Promise<ContractedInstitution> {
    const response = await this.request<{ success: boolean; data: { institution: ContractedInstitution } }>(
      API_ENDPOINTS.CONTRACTED_INSTITUTIONS.BY_ID(id),
      {},
      true
    );
    return response.data.institution;
  }

  async getInstitutionCategories(): Promise<InstitutionCategory[]> {
    const response = await this.request<{ success: boolean; data: { categories: InstitutionCategory[] } }>(
      `${API_ENDPOINTS.INSTITUTION_CATEGORIES.BASE}?activeOnly=true`,
      {},
      true
    );
    return response.data.categories || [];
  }
}

export default new ApiService();
