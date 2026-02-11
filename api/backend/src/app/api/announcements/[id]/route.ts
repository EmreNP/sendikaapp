import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { Announcement, UpdateAnnouncementRequest } from '@shared/types/announcement';
import { validateUpdateAnnouncement } from '@/lib/utils/validation/announcementValidation';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { 
  successResponse, 
  serializeAnnouncementTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody, validateBodySize } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';

// GET - Tek duyuru detayı
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const announcementId = params.id;
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      const userRole = currentUserData!.role;
      
      const announcementDoc = await db.collection('announcements').doc(announcementId).get();
      
      if (!announcementDoc.exists) {
      throw new AppNotFoundError('Duyuru');
      }
      
      const announcementData = announcementDoc.data();
      
      // USER/BRANCH_MANAGER için sadece yayınlanan duyurular
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        if (!announcementData?.isPublished) {
        throw new AppNotFoundError('Duyuru');
        }
      }

      // Branch manager sadece kendi şubesinin duyurusunu görebilir
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        if (!currentUserData?.branchId) {
          throw new AppAuthorizationError('Şube bilgisi bulunamadı');
        }
        if (announcementData?.branchId !== currentUserData.branchId) {
          throw new AppNotFoundError('Duyuru');
        }
      }
      
      const announcement: Announcement = {
        id: announcementDoc.id,
        ...announcementData,
      } as Announcement;
      
      // Timestamp'leri serialize et
      const serializedAnnouncement = serializeAnnouncementTimestamps(announcement);
      
      return successResponse(
        'Duyuru başarıyla getirildi',
        { announcement: serializedAnnouncement }
      );
  });
  });

// PUT - Duyuru güncelle (sadece admin)
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const announcementId = params.id;
      
      // Admin kontrolü
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const announcementDoc = await db.collection('announcements').doc(announcementId).get();
      
      if (!announcementDoc.exists) {
      throw new AppNotFoundError('Duyuru');
      }
      
      const currentAnnouncementData = announcementDoc.data();
      
      // Request body size kontrolü (max 1MB)
    validateBodySize(req, 1024 * 1024);
      
    const body = await parseJsonBody<UpdateAnnouncementRequest>(req);
      const { title, content, externalUrl, imageUrl, isPublished, isFeatured, publishedAt } = body;
      
      // Mevcut değerlerle birleştirilmiş validation
      const validation = validateUpdateAnnouncement(body, {
        content: currentAnnouncementData?.content,
        externalUrl: currentAnnouncementData?.externalUrl
      });
      
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
      throw new AppValidationError(firstError);
      }
      
      const updateData: Record<string, any> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: user.uid,
      };
      
      // Sadece gönderilen alanları güncelle
      if (title !== undefined) updateData.title = title.trim();
      
      if (content !== undefined) {
        // HTML sanitization
        updateData.content = content ? sanitizeHtml(content) : null;
      }
      
      if (externalUrl !== undefined) {
        updateData.externalUrl = externalUrl?.trim() || null;
      }
      
      if (imageUrl !== undefined) {
        updateData.imageUrl = imageUrl?.trim() || null;
      }
      
      if (isFeatured !== undefined) {
        updateData.isFeatured = isFeatured;
      }
      
      // isPublished ve publishedAt işlemleri
      if (isPublished !== undefined) {
        updateData.isPublished = isPublished;
        
        // isPublished: true yapılıyorsa ve publishedAt yoksa otomatik set et
        if (isPublished === true && !currentAnnouncementData?.publishedAt && !publishedAt) {
          updateData.publishedAt = admin.firestore.FieldValue.serverTimestamp();
        }
        
        // isPublished: false yapılıyorsa publishedAt'i sil
        if (isPublished === false) {
          updateData.publishedAt = admin.firestore.FieldValue.delete();
        }
      }
      
      // publishedAt manuel set (eğer gönderilmişse)
      if (publishedAt !== undefined && publishedAt) {
        updateData.publishedAt = admin.firestore.Timestamp.fromDate(new Date(publishedAt));
      }
      
      await db.collection('announcements').doc(announcementId).update(updateData);
      
      // Güncellenmiş duyuruyu getir
      const updatedAnnouncementDoc = await db.collection('announcements').doc(announcementId).get();
      const updatedAnnouncementData = updatedAnnouncementDoc.data();
      const announcement: Announcement = {
        id: announcementId,
        ...updatedAnnouncementData,
      } as Announcement;
      
      // Timestamp'leri serialize et
      const serializedAnnouncement = serializeAnnouncementTimestamps(announcement);
      
      return successResponse(
        'Duyuru başarıyla güncellendi',
        { announcement: serializedAnnouncement },
        200,
        'ANNOUNCEMENT_UPDATE_SUCCESS'
      );
  });
  });

// DELETE - Duyuru sil (sadece admin, hard delete)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const announcementId = params.id;
      
      // Admin kontrolü
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const announcementDoc = await db.collection('announcements').doc(announcementId).get();
      
      if (!announcementDoc.exists) {
      throw new AppNotFoundError('Duyuru');
      }
      
      // Hard delete - belgeyi tamamen sil
      await db.collection('announcements').doc(announcementId).delete();
      
      console.log(`✅ Announcement ${announcementId} deleted`);
      
      return successResponse(
        'Duyuru başarıyla silindi',
        undefined,
        200,
        'ANNOUNCEMENT_DELETE_SUCCESS'
      );
  });
  });

