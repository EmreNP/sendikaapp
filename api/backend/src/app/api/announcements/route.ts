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

