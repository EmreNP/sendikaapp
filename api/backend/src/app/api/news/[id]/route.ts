import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { News, UpdateNewsRequest } from '@shared/types/news';
import { validateUpdateNews } from '@/lib/utils/validation/newsValidation';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { 
  successResponse, 
  serializeNewsTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody, validateBodySize } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';

import { logger } from '../../../../lib/utils/logger';
// GET - Tek haber detayı
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const newsId = params.id;
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      const userRole = currentUserData!.role;
      
      const newsDoc = await db.collection('news').doc(newsId).get();
      
      if (!newsDoc.exists) {
      throw new AppNotFoundError('Haber');
      }
      
      const newsData = newsDoc.data();
      
      // USER/BRANCH_MANAGER için sadece yayınlanan haberler
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        if (!newsData?.isPublished) {
        throw new AppNotFoundError('Haber');
        }
      }
      
      const news: News = {
        id: newsDoc.id,
        ...newsData,
      } as News;
      
      // Timestamp'leri serialize et
      const serializedNews = serializeNewsTimestamps(news);
      
      return successResponse(
        'Haber başarıyla getirildi',
        { news: serializedNews }
      );
  });
  });

// PUT - Haber güncelle (sadece admin)
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const newsId = params.id;
      
      // Admin kontrolü
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const newsDoc = await db.collection('news').doc(newsId).get();
      
      if (!newsDoc.exists) {
      throw new AppNotFoundError('Haber');
      }
      
      const currentNewsData = newsDoc.data();
      
      // Request body size kontrolü (max 1MB)
    validateBodySize(req, 1024 * 1024);
      
    const body = await parseJsonBody<UpdateNewsRequest>(req);
      const { title, content, imageUrl, isPublished, isFeatured, publishedAt } = body;
      
      // Mevcut değerlerle birleştirilmiş validation
      const validation = validateUpdateNews(body, {
        content: currentNewsData?.content
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
        if (isPublished === true && !currentNewsData?.publishedAt && !publishedAt) {
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
      
      await db.collection('news').doc(newsId).update(updateData);
      
      // Güncellenmiş haberi getir
      const updatedNewsDoc = await db.collection('news').doc(newsId).get();
      const updatedNewsData = updatedNewsDoc.data();
      const news: News = {
        id: newsId,
        ...updatedNewsData,
      } as News;
      
      // Timestamp'leri serialize et
      const serializedNews = serializeNewsTimestamps(news);
      
      return successResponse(
        'Haber başarıyla güncellendi',
        { news: serializedNews },
        200,
        'NEWS_UPDATE_SUCCESS'
      );
  });
  });

// DELETE - Haber sil (sadece admin, hard delete)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const newsId = params.id;
      
      // Admin kontrolü
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const newsDoc = await db.collection('news').doc(newsId).get();
      
      if (!newsDoc.exists) {
      throw new AppNotFoundError('Haber');
      }
      
      // Hard delete - belgeyi tamamen sil
      await db.collection('news').doc(newsId).delete();
      
      logger.log(`✅ News ${newsId} deleted`);
      
      return successResponse(
        'Haber başarıyla silindi',
        undefined,
        200,
        'NEWS_DELETE_SUCCESS'
      );
  });
  });

