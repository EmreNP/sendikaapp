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
  serializeNewsTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody, validateBodySize, parseQueryParamAsNumber } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';
import { paginateHybrid, parsePaginationParams } from '@/lib/utils/pagination';

// GET - Tüm haberleri listele
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      const userRole = currentUserData!.role;
      
      // Query parametreleri
    const url = new URL(request.url);
    const paginationParams = parsePaginationParams(url);
    const isPublishedParam = url.searchParams.get('isPublished');
    const isFeaturedParam = url.searchParams.get('isFeatured');
    const search = url.searchParams.get('search');
      
      // Query oluştur
      let query = db.collection('news') as admin.firestore.Query;
      
      // USER için sadece yayınlanan haberler
      if (userRole === USER_ROLE.USER) {
        query = query.where('isPublished', '==', true);
      } else if (userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN || userRole === USER_ROLE.BRANCH_MANAGER) {
        // Admin/Superadmin/Branch Manager için isPublished filtresi kullanılabilir
        if (isPublishedParam !== null) {
          query = query.where('isPublished', '==', isPublishedParam === 'true');
        }
      }
      
      // Featured filtresi (admin/superadmin için)
      if ((userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN) && isFeaturedParam !== null) {
        query = query.where('isFeatured', '==', isFeaturedParam === 'true');
      }

      // ⚠️ IMPORTANT: Search filter handled client-side (see announcements endpoint for details)
      if (search) {
        const snapshot = await query.orderBy('createdAt', 'desc').limit(500).get();
        const searchLower = search.toLowerCase();
        const allDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as News[];
        let news = allDocs.filter((n: News) => (n.title || '').toLowerCase().includes(searchLower));
        
        const total = news.length;
        const startIndex = (paginationParams.page - 1) * paginationParams.limit;
        const endIndex = startIndex + paginationParams.limit;
        const paginatedNews = news.slice(startIndex, endIndex);
        const hasMore = endIndex < total;
        
        const serializedNews = paginatedNews.map(n => serializeNewsTimestamps(n));
        
        return successResponse('Haberler başarıyla getirildi', {
          news: serializedNews,
          total,
          page: paginationParams.page,
          limit: paginationParams.limit,
          hasMore,
        });
      }
      
      // Server-side pagination with Firestore
      query = query.orderBy('createdAt', 'desc');
      
      const paginatedResult = await paginateHybrid(
        query,
        paginationParams,
        (doc) => ({ id: doc.id, ...doc.data() }) as News,
        'createdAt'
      );
      
      const serializedNews = paginatedResult.items.map(n => serializeNewsTimestamps(n));
      
      return successResponse(
        'Haberler başarıyla getirildi',
        {
          news: serializedNews,
          total: paginatedResult.total,
          page: paginatedResult.page,
          limit: paginatedResult.limit,
          hasMore: paginatedResult.hasMore,
          nextCursor: paginatedResult.nextCursor,
        }
      );
  });
  });

// POST - Yeni haber oluştur (sadece admin)
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
      // Admin kontrolü
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      // Request body size kontrolü (max 1MB)
    validateBodySize(req, 1024 * 1024);
      
    const body = await parseJsonBody<CreateNewsRequest>(req);
      const { title, content, imageUrl, isPublished, isFeatured } = body;
      
      // Validation
      const validation = validateCreateNews(body);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
      throw new AppValidationError(firstError);
      }
      
      // HTML sanitization
      const sanitizedContent = sanitizeHtml(content);
      
      // Yeni haber oluştur
      const newsData = {
        title: title.trim(),
        content: sanitizedContent,
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
  });
  });

