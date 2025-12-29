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
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage,
  serializeAnnouncementTimestamps
} from '@/lib/utils/response';

// GET - Tek duyuru detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const announcementId = params.id;
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      const userRole = currentUserData!.role;
      
      const announcementDoc = await db.collection('announcements').doc(announcementId).get();
      
      if (!announcementDoc.exists) {
        return notFoundError('Duyuru');
      }
      
      const announcementData = announcementDoc.data();
      
      // USER/BRANCH_MANAGER için sadece yayınlanan duyurular
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        if (!announcementData?.isPublished) {
          return notFoundError('Duyuru');
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
      
    } catch (error: unknown) {
      console.error('❌ Get announcement error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Duyuru getirilirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

// PUT - Duyuru güncelle (sadece admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const announcementId = params.id;
      
      // Admin kontrolü
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const announcementDoc = await db.collection('announcements').doc(announcementId).get();
      
      if (!announcementDoc.exists) {
        return notFoundError('Duyuru');
      }
      
      const currentAnnouncementData = announcementDoc.data();
      
      // Request body size kontrolü (max 1MB)
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 1024 * 1024) {
        return validationError('İstek boyutu çok büyük. Maksimum 1MB olabilir.');
      }
      
      const body: UpdateAnnouncementRequest = await request.json();
      const { title, content, externalUrl, imageUrl, isPublished, isFeatured, publishedAt } = body;
      
      // Mevcut değerlerle birleştirilmiş validation
      const validation = validateUpdateAnnouncement(body, {
        content: currentAnnouncementData?.content,
        externalUrl: currentAnnouncementData?.externalUrl
      });
      
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
        return validationError(firstError);
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
      
    } catch (error: unknown) {
      console.error('❌ Update announcement error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Duyuru güncellenirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

// DELETE - Duyuru sil (sadece admin, hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const announcementId = params.id;
      
      // Admin kontrolü
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const announcementDoc = await db.collection('announcements').doc(announcementId).get();
      
      if (!announcementDoc.exists) {
        return notFoundError('Duyuru');
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
      
    } catch (error: unknown) {
      console.error('❌ Delete announcement error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Duyuru silinirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

