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
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage,
  serializeNewsTimestamps
} from '@/lib/utils/response';

// GET - Tek haber detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const newsId = params.id;
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      const userRole = currentUserData!.role;
      
      const newsDoc = await db.collection('news').doc(newsId).get();
      
      if (!newsDoc.exists) {
        return notFoundError('Haber');
      }
      
      const newsData = newsDoc.data();
      
      // USER/BRANCH_MANAGER için sadece yayınlanan haberler
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        if (!newsData?.isPublished) {
          return notFoundError('Haber');
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
      
    } catch (error: unknown) {
      console.error('❌ Get news error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Haber getirilirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

// PUT - Haber güncelle (sadece admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const newsId = params.id;
      
      // Admin kontrolü
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const newsDoc = await db.collection('news').doc(newsId).get();
      
      if (!newsDoc.exists) {
        return notFoundError('Haber');
      }
      
      const currentNewsData = newsDoc.data();
      
      // Request body size kontrolü (max 1MB)
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 1024 * 1024) {
        return validationError('İstek boyutu çok büyük. Maksimum 1MB olabilir.');
      }
      
      const body: UpdateNewsRequest = await request.json();
      const { title, content, externalUrl, imageUrl, isPublished, isFeatured, publishedAt } = body;
      
      // Mevcut değerlerle birleştirilmiş validation
      const validation = validateUpdateNews(body, {
        content: currentNewsData?.content,
        externalUrl: currentNewsData?.externalUrl
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
      
    } catch (error: unknown) {
      console.error('❌ Update news error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Haber güncellenirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

// DELETE - Haber sil (sadece admin, hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const newsId = params.id;
      
      // Admin kontrolü
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const newsDoc = await db.collection('news').doc(newsId).get();
      
      if (!newsDoc.exists) {
        return notFoundError('Haber');
      }
      
      // Hard delete - belgeyi tamamen sil
      await db.collection('news').doc(newsId).delete();
      
      console.log(`✅ News ${newsId} deleted`);
      
      return successResponse(
        'Haber başarıyla silindi',
        undefined,
        200,
        'NEWS_DELETE_SUCCESS'
      );
      
    } catch (error: unknown) {
      console.error('❌ Delete news error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Haber silinirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

