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
    const page = parseQueryParamAsNumber(url, 'page', 1, 1);
    const limit = Math.min(parseQueryParamAsNumber(url, 'limit', 20, 1), 100);
    const isPublishedParam = url.searchParams.get('isPublished');
    const isFeaturedParam = url.searchParams.get('isFeatured');
    const search = url.searchParams.get('search');
      
      // Query oluştur
      let query: admin.firestore.Query = db.collection('announcements') as admin.firestore.Query;
      
      // USER/BRANCH_MANAGER için sadece yayınlanan duyurular
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        query = query.where('isPublished', '==', true);
      } else if (userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN) {
        // Admin/Superadmin için isPublished filtresi kullanılabilir
        if (isPublishedParam !== null) {
          query = query.where('isPublished', '==', isPublishedParam === 'true');
        }
      }
      
      // Featured filtresi (admin/superadmin için)
      if ((userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN) && isFeaturedParam !== null) {
        query = query.where('isFeatured', '==', isFeaturedParam === 'true');
      }
      
      // Query'yi çalıştır
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      
      let announcements = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Announcement[];
      
      // Search filtresi (client-side - Firestore'da full-text search yok)
      if (search) {
        const searchLower = search.toLowerCase();
        announcements = announcements.filter((a: Announcement) => {
          const title = (a.title || '').toLowerCase();
          return title.includes(searchLower);
        });
      }
      
      // Sayfalama
      const total = announcements.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAnnouncements = announcements.slice(startIndex, endIndex);
      
      // Timestamp'leri serialize et
      const serializedAnnouncements = paginatedAnnouncements.map(a => serializeAnnouncementTimestamps(a));
      
      return successResponse(
        'Duyurular başarıyla getirildi',
        {
          announcements: serializedAnnouncements,
          total,
          page,
          limit,
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
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      // Request body size kontrolü (max 1MB)
    validateBodySize(req, 1024 * 1024);
      
    const body = await parseJsonBody<CreateAnnouncementRequest>(req);
      const { title, content, externalUrl, imageUrl, isPublished, isFeatured } = body;
      
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
      
      // Yeni duyuru oluştur
      const announcementData = {
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

