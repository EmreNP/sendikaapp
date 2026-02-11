import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { Announcement, CreateAnnouncementRequest } from '@shared/types/announcement';
import { validateCreateAnnouncement } from '@/lib/utils/validation/announcementValidation';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { 
  successResponse, 
  serializeAnnouncementTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody, validateBodySize, parseQueryParamAsNumber } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';
import { paginateHybrid, parsePaginationParams } from '@/lib/utils/pagination';

// GET - Tüm duyuruları listele
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
    const branchIdParam = url.searchParams.get('branchId');
      
      // Query oluştur
      let query: admin.firestore.Query = db.collection('announcements') as admin.firestore.Query;
      
      // USER için sadece yayınlanan duyurular
      if (userRole === USER_ROLE.USER) {
        query = query.where('isPublished', '==', true);
      } else if (userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN || userRole === USER_ROLE.BRANCH_MANAGER) {
        // Admin/Superadmin/Branch Manager için isPublished filtresi kullanılabilir
        if (isPublishedParam !== null) {
          query = query.where('isPublished', '==', isPublishedParam === 'true');
        }
      }

      // Branch manager sadece kendi şubesinin duyurularını görür
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        if (!currentUserData?.branchId) {
          throw new AppValidationError('Şube bilgisi bulunamadı');
        }
        query = query.where('branchId', '==', currentUserData.branchId);
      }

      // Admin/Superadmin için şube filtresi
      if ((userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN) && branchIdParam) {
        query = query.where('branchId', '==', branchIdParam);
      }
      
      // Featured filtresi (admin/superadmin için)
      if ((userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN) && isFeaturedParam !== null) {
        query = query.where('isFeatured', '==', isFeaturedParam === 'true');
      }

      // ⚠️ IMPORTANT: Search filter is moved to client-side due to Firestore limitations
      // Firestore doesn't support full-text search natively
      // For production: Consider using Algolia, Elasticsearch, or Firestore text search extensions
      // For now: If search is provided, we fetch more results and filter client-side
      // This is acceptable for small result sets, but should be replaced with proper search service
      
      if (search) {
        // If search is active, we need to fetch more results to filter
        // This is a compromise - still better than fetching ALL documents
        // Consider implementing proper search service for production
        const snapshot = await query.orderBy('createdAt', 'desc').limit(500).get();
        
        const searchLower = search.toLowerCase();
        const allDocs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Announcement[];
        let announcements = allDocs.filter((a: Announcement) => {
            const title = (a.title || '').toLowerCase();
            return title.includes(searchLower);
          });
        
        // Manual pagination after filtering
        const total = announcements.length;
        const startIndex = (paginationParams.page - 1) * paginationParams.limit;
        const endIndex = startIndex + paginationParams.limit;
        const paginatedAnnouncements = announcements.slice(startIndex, endIndex);
        const hasMore = endIndex < total;
        
        const serializedAnnouncements = paginatedAnnouncements.map(a => serializeAnnouncementTimestamps(a));
        
        return successResponse(
          'Duyurular başarıyla getirildi',
          {
            announcements: serializedAnnouncements,
            total,
            page: paginationParams.page,
            limit: paginationParams.limit,
            hasMore,
          }
        );
      }
      
      // Server-side pagination with Firestore (BEST PRACTICE)
      // Only fetches documents needed for current page
      query = query.orderBy('createdAt', 'desc');
      
      const paginatedResult = await paginateHybrid(
        query,
        paginationParams,
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        }) as Announcement,
        'createdAt'
      );
      
      // Timestamp'leri serialize et
      const serializedAnnouncements = paginatedResult.items.map(a => serializeAnnouncementTimestamps(a));
      
      return successResponse(
        'Duyurular başarıyla getirildi',
        {
          announcements: serializedAnnouncements,
          total: paginatedResult.total,
          page: paginatedResult.page,
          limit: paginatedResult.limit,
          hasMore: paginatedResult.hasMore,
          nextCursor: paginatedResult.nextCursor,
        }
      );
  });
  });

// POST - Yeni duyuru oluştur (sadece admin)
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
      // Admin kontrolü
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN && currentUserData.role !== USER_ROLE.BRANCH_MANAGER)) {
      throw new AppAuthorizationError('Bu işlem için admin veya şube yöneticisi yetkisi gerekli');
      }
      
      // Request body size kontrolü (max 1MB)
    validateBodySize(req, 1024 * 1024);
      
    const body = await parseJsonBody<CreateAnnouncementRequest>(req);
      const { title, content, externalUrl, imageUrl, isPublished, isFeatured, branchId } = body;
      
      // Validation
      const validation = validateCreateAnnouncement(body);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
      throw new AppValidationError(firstError);
      }
      
      // HTML sanitization (content varsa)
      let sanitizedContent = content;
      if (content) {
        sanitizedContent = sanitizeHtml(content);
      }
      
      // Branch manager için branchId zorunlu ve kendi şubesi ile sınırlı
      let finalBranchId: string | null | undefined = branchId ?? null;
      if (currentUserData.role === USER_ROLE.BRANCH_MANAGER) {
        if (!currentUserData.branchId) {
          throw new AppValidationError('Şube bilgisi bulunamadı');
        }
        finalBranchId = currentUserData.branchId;
      }

      // Yeni duyuru oluştur
      const announcementData = {
        title: title.trim(),
        content: sanitizedContent || null,
        externalUrl: externalUrl?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        branchId: finalBranchId ?? null,
        isPublished: isPublished || false,
        isFeatured: isFeatured || false,
        publishedAt: isPublished ? admin.firestore.FieldValue.serverTimestamp() : null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: user.uid,
      };
      
      const announcementRef = await db.collection('announcements').add(announcementData);
      
      // Oluşturulan duyuruyu getir
      const announcementDoc = await announcementRef.get();
      const announcement: Announcement = {
        id: announcementDoc.id,
        ...announcementDoc.data(),
      } as Announcement;
      
      // Timestamp'leri serialize et
      const serializedAnnouncement = serializeAnnouncementTimestamps(announcement);
      
      return successResponse(
        'Duyuru başarıyla oluşturuldu',
        { announcement: serializedAnnouncement },
        201,
        'ANNOUNCEMENT_CREATE_SUCCESS'
      );
  });
  });

