import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { News, CreateNewsRequest } from '@shared/types/news';
import { validateCreateNews } from '@/lib/utils/validation/newsValidation';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { 
  successResponse, 
  validationError,
  unauthorizedError,
  serverError,
  isErrorWithMessage,
  serializeNewsTimestamps
} from '@/lib/utils/response';

// GET - Tüm haberleri listele
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      const userRole = currentUserData!.role;
      
      // Query parametreleri
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100
      const isPublishedParam = searchParams.get('isPublished');
      const isFeaturedParam = searchParams.get('isFeatured');
      const search = searchParams.get('search');
      
      // Query oluştur
      let query = db.collection('news');
      
      // USER/BRANCH_MANAGER için sadece yayınlanan haberler
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        query = query.where('isPublished', '==', true);
      } else if (userRole === USER_ROLE.ADMIN) {
        // Admin için isPublished filtresi kullanılabilir
        if (isPublishedParam !== null) {
          query = query.where('isPublished', '==', isPublishedParam === 'true');
        }
      }
      
      // Featured filtresi (admin için)
      if (userRole === USER_ROLE.ADMIN && isFeaturedParam !== null) {
        query = query.where('isFeatured', '==', isFeaturedParam === 'true');
      }
      
      // Query'yi çalıştır
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      
      let news = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as News[];
      
      // Search filtresi (client-side - Firestore'da full-text search yok)
      if (search) {
        const searchLower = search.toLowerCase();
        news = news.filter((n: News) => {
          const title = (n.title || '').toLowerCase();
          return title.includes(searchLower);
        });
      }
      
      // Sayfalama
      const total = news.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNews = news.slice(startIndex, endIndex);
      
      // Timestamp'leri serialize et
      const serializedNews = paginatedNews.map(n => serializeNewsTimestamps(n));
      
      return successResponse(
        'Haberler başarıyla getirildi',
        {
          news: serializedNews,
          total,
          page,
          limit,
        }
      );
      
    } catch (error: unknown) {
      console.error('❌ Get news error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Haberler getirilirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

// POST - Yeni haber oluştur (sadece admin)
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // Admin kontrolü
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      // Request body size kontrolü (max 1MB)
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 1024 * 1024) {
        return validationError('İstek boyutu çok büyük. Maksimum 1MB olabilir.');
      }
      
      const body: CreateNewsRequest = await request.json();
      const { title, content, externalUrl, imageUrl, isPublished, isFeatured } = body;
      
      // Validation
      const validation = validateCreateNews(body);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
        return validationError(firstError);
      }
      
      // HTML sanitization (content varsa)
      let sanitizedContent = content;
      if (content) {
        sanitizedContent = sanitizeHtml(content);
      }
      
      // Yeni haber oluştur
      const newsData = {
        title: title.trim(),
        content: sanitizedContent || null,
        externalUrl: externalUrl?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        isPublished: isPublished || false,
        isFeatured: isFeatured || false,
        publishedAt: isPublished ? admin.firestore.FieldValue.serverTimestamp() : null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: user.uid,
      };
      
      const newsRef = await db.collection('news').add(newsData);
      
      // Oluşturulan haberi getir
      const newsDoc = await newsRef.get();
      const news: News = {
        id: newsDoc.id,
        ...newsDoc.data(),
      } as News;
      
      // Timestamp'leri serialize et
      const serializedNews = serializeNewsTimestamps(news);
      
      return successResponse(
        'Haber başarıyla oluşturuldu',
        { news: serializedNews },
        201,
        'NEWS_CREATE_SUCCESS'
      );
      
    } catch (error: unknown) {
      console.error('❌ Create news error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Haber oluşturulurken bir hata oluştu',
        errorMessage
      );
    }
  });
}

