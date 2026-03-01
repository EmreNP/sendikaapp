// API Service
import { signInWithCustomToken, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import { logger } from '../utils/logger';
import { Sentry } from './sentry';
import {
  GetCurrentUserResponseSchema,
  RegisterBasicResponseSchema,
  RegisterDetailsResponseSchema,
} from '../types/schemas';
import type { User, Training, Lesson, LessonContent, Branch, News, Announcement, ContractedInstitution, InstitutionCategory } from '../types';
import type { RegisterDetailsRequest } from '../../../shared/types/user';

// Varsayılan istek zaman aşımı (ms)
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

class ApiService {
  private async getAuthToken(forceRefresh = false): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken(forceRefresh);
    }
    return null;
  }

  private isNgrokUrl(url: string): boolean {
    if (!__DEV__) return false;
    return /ngrok/i.test(url);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true,
    _isRetry: boolean = false
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
      } else {
        // Auth token yoksa isteği göndermeden hata fırlat
        // Aksi halde 401 döner ve sessizce yutulur
        throw new Error('Oturum bilgisi bulunamadı (auth token null). Lütfen tekrar giriş yapın.');
      }
    }

    // AbortController ile timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      // Sentry breadcrumb: API çağrısı başlangıcı
      Sentry.addBreadcrumb({
        category: 'api',
        message: `${options.method || 'GET'} ${endpoint}`,
        level: 'info',
      });

      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
    } catch (err: any) {
      // AbortController timeout tetiklendi
      if (err.name === 'AbortError') {
        throw new Error('İstek zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
      }
      // Network error - provide meaningful message
      if (err.message?.includes('Network request failed') || err.message?.includes('Failed to fetch')) {
        throw new Error('İnternet bağlantınız yok veya sunucuya ulaşılamıyor. Lütfen bağlantınızı kontrol edin.');
      }
      if (err.message?.includes('timeout') || err.message?.includes('Timeout')) {
        throw new Error('İstek zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
      }
      Sentry.captureException(err, { tags: { endpoint } });
      throw new Error('Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.');
    } finally {
      clearTimeout(timeoutId);
    }

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    let data: any;
    if (contentType.includes('application/json')) {
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch (parseErr) {
        // JSON bekleniyordu ama parse edilemedi — detayları Sentry'ye gönder, kullanıcıya gösterme
        Sentry.captureException(new Error('JSON Parse Error'), {
          extra: { status: response.status, body: rawText.slice(0, 500), endpoint },
        });
        throw new Error('Sunucudan beklenmeyen bir yanıt alındı. Lütfen tekrar deneyin.');
      }
    } else {
      // HTML/text döndüyse (ngrok warning veya error page) — detayları Sentry'ye gönder
      Sentry.captureException(new Error('Unexpected Response Type'), {
        extra: { contentType, status: response.status, body: rawText.slice(0, 500), endpoint },
      });
      throw new Error('Sunucudan beklenmeyen bir yanıt alındı. Lütfen tekrar deneyin.');
    }

    if (!response.ok) {
      // 401: Token süresi dolmuş olabilir — force refresh ile bir kez daha dene
      if (response.status === 401 && requireAuth && !_isRetry && auth.currentUser) {
        try {
          const freshToken = await this.getAuthToken(true);
          if (freshToken) {
            return await this.request<T>(endpoint, options, requireAuth, true);
          }
        } catch {
          // Force refresh de başarısız → normal 401 hatasına düş
        }
      }

      // HTTP status koduna göre anlamlı hata mesajları
      const serverMessage = data?.message;
      switch (response.status) {
        case 400:
          throw new Error(serverMessage || 'Gönderilen bilgilerde bir hata var. Lütfen kontrol edip tekrar deneyin.');
        case 401:
          throw new Error(serverMessage || 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.');
        case 403:
          throw new Error(serverMessage || 'Bu işlem için yetkiniz bulunmamaktadır.');
        case 404:
          throw new Error(serverMessage || 'Aradığınız içerik bulunamadı.');
        case 408:
          throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
        case 429:
          throw new Error('Çok fazla istek gönderildi. Lütfen bir süre bekleyip tekrar deneyin.');
        case 500:
          throw new Error(serverMessage || 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.');
        case 502:
        case 503:
        case 504:
          throw new Error('Sunucu şu anda kullanılamıyor. Lütfen birkaç dakika sonra tekrar deneyin.');
        default:
          throw new Error(serverMessage || `Beklenmeyen bir hata oluştu (Kod: ${response.status}).`);
      }
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
    phone: string;
    birthDate: string;
    district: string;
    kadroUnvani: string;
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

    try {
      RegisterBasicResponseSchema.parse(response);
    } catch (zodError) {
      Sentry.captureException(zodError, { tags: { endpoint: 'registerBasic', type: 'zod_validation' } });
    }

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

  async registerDetails(data: RegisterDetailsRequest): Promise<{ user: User }> {
    const payload: Record<string, any> = {
      tcKimlikNo: data.tcKimlikNo,
      fatherName: data.fatherName,
      motherName: data.motherName,
      birthPlace: data.birthPlace,
      education: data.education,
      kurumSicil: data.kurumSicil,
      isMemberOfOtherUnion: data.isMemberOfOtherUnion,
      branchId: data.branchId,
    };

    // remove undefined keys
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const response = await this.request<{ success: boolean; data: User }>(
      API_ENDPOINTS.AUTH.REGISTER_DETAILS,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    try {
      RegisterDetailsResponseSchema.parse(response);
    } catch (zodError) {
      Sentry.captureException(zodError, { tags: { endpoint: 'registerDetails', type: 'zod_validation' } });
    }

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
    try {
      const validated = GetCurrentUserResponseSchema.parse(response);
      return validated.data.user as unknown as User;
    } catch (zodError) {
      Sentry.captureException(zodError, { tags: { endpoint: 'updateProfile', type: 'zod_validation' } });
      return response.data.user;
    }
  }

  async acceptLegalTerms(): Promise<User> {
    const response = await this.request<{ success: boolean; data: { user: User } }>(
      API_ENDPOINTS.USERS.ME,
      {
        method: 'PUT',
        body: JSON.stringify({ hasAcceptedKvkk: true, hasAcceptedTerms: true }),
      }
    );
    try {
      const validated = GetCurrentUserResponseSchema.parse(response);
      return validated.data.user as unknown as User;
    } catch (zodError) {
      Sentry.captureException(zodError, { tags: { endpoint: 'acceptLegalTerms', type: 'zod_validation' } });
      return response.data.user;
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ success: boolean; data: { user: User } }>(
      API_ENDPOINTS.USERS.ME
    );
    try {
      const validated = GetCurrentUserResponseSchema.parse(response);
      return validated.data.user as unknown as User;
    } catch (zodError) {
      Sentry.captureException(zodError, { tags: { endpoint: 'getCurrentUser', type: 'zod_validation' } });
      // Validation başarısız olsa da veriyi döndür (graceful degradation)
      return response.data.user;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.request(
      API_ENDPOINTS.AUTH.PASSWORD_CHANGE,
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );
  }

  async deleteAccount(): Promise<void> {
    await this.request(
      API_ENDPOINTS.USERS.ME,
      { method: 'DELETE' }
    );
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
    logger.info(`[getLessons] Fetching lessons for trainingId: ${trainingId}`);
    const endpoint = API_ENDPOINTS.TRAININGS.LESSONS(trainingId);
    logger.info(`[getLessons] Endpoint: ${endpoint}`);
    const response = await this.request<{ success: boolean; data: { lessons: Lesson[] } }>(endpoint);
    logger.info(`[getLessons] Response:`, JSON.stringify(response));
    return response.data.lessons || [];
  }

  async getLesson(trainingId: string, lessonId: string): Promise<Lesson> {
    const response = await this.request<{ success: boolean; data: { lesson: Lesson } }>(
      API_ENDPOINTS.TRAININGS.LESSON_BY_ID(trainingId, lessonId)
    );
    return response.data.lesson;
  }

  async getLessonContents(lessonId: string, type?: 'video' | 'document' | 'test') : Promise<LessonContent[]> {
    // Guard: invalid lessonId -> return empty immediately
    if (!lessonId) {
      logger.warn('[getLessonContents] Invalid lessonId (empty/null) received');
      return [];
    }

    // Normalize a raw content item to LessonContent regardless of its type
    const mapContent = (c: any): LessonContent => {
      if (c.type === 'video') {
        return { id: c.id, lessonId: c.lessonId, title: c.title, description: c.description, type: 'video' as const, url: c.videoUrl || c.videoPath, videoSource: c.videoSource as 'youtube' | 'vimeo' | 'uploaded' | undefined, videoPath: c.videoPath, duration: c.duration ? String(c.duration) : undefined, order: c.order };
      }
      if (c.type === 'document') {
        return { id: c.id, lessonId: c.lessonId, title: c.title, description: c.description, type: 'document' as const, url: c.documentUrl, order: c.order };
      }
      return { id: c.id, lessonId: c.lessonId, title: c.title, description: c.description, type: 'test' as const, order: c.order };
    };

    // Use the single /contents endpoint to avoid 3 separate requests per lesson (N×3 → N×1)
    const queryParams = type ? `?type=${type}` : '';
    const endpoint = `${API_ENDPOINTS.LESSONS.CONTENTS(lessonId)}${queryParams}`;

    logger.info(`[getLessonContents] lessonId: ${lessonId}, type: ${type || 'all'}, endpoint: ${endpoint}`);

    try {
      const response = await this.request<{ success: boolean; data: { contents: any[] } }>(endpoint);
      const contents = response?.data?.contents || [];
      logger.info(`[getLessonContents] Got ${contents.length} contents for lessonId: ${lessonId}`);
      return contents.map(mapContent);
    } catch (err: any) {
      logger.warn(`[getLessonContents] Request failed for ${endpoint}: ${err?.message || err}`);
      return [];
    }
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

  // Contact
  async getTopics(): Promise<any[]> {
    const response = await this.request<{ success: boolean; data: { topics: any[] } }>(
      API_ENDPOINTS.TOPICS.BASE,
      {},
      true
    );
    return response.data?.topics || [];
  }

  async sendContactMessage(data: { 
    topicId: string;
    message: string; 
  }): Promise<void> {
    await this.request(
      API_ENDPOINTS.CONTACT.BASE,
      {
        method: 'POST',
        body: JSON.stringify({ 
          topicId: data.topicId,
          message: data.message 
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

  // Legal endpoints (public, no auth required)
  async getLegalTerms(): Promise<{ title?: string; lastUpdated?: string; content?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE_URL}/api/legal/terms`, { signal: controller.signal });
      if (!response.ok) throw new Error('Metin yüklenemedi');
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getLegalPrivacy(): Promise<{ title?: string; lastUpdated?: string; content?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE_URL}/api/legal/privacy`, { signal: controller.signal });
      if (!response.ok) throw new Error('Metin yüklenemedi');
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async fetchExternalJson<T = any>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal });
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export default new ApiService();
