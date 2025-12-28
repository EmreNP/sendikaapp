import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { BulkNewsActionRequest, BulkNewsActionResult } from '@shared/types/news';
import {
  successResponse,
  validationError,
  unauthorizedError,
  serverError,
  isErrorWithMessage,
} from '@/lib/utils/response';

// POST - Toplu işlem (sadece admin)
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

      const body: BulkNewsActionRequest = await request.json();
      const { action, newsIds } = body;

      // Validation
      if (!action || !['delete', 'publish', 'unpublish'].includes(action)) {
        return validationError('Geçersiz işlem tipi. İzin verilen: delete, publish, unpublish');
      }

      if (!newsIds || !Array.isArray(newsIds) || newsIds.length === 0) {
        return validationError('Haber ID listesi boş veya geçersiz');
      }

      if (newsIds.length > 100) {
        return validationError('Maksimum 100 haber için toplu işlem yapılabilir');
      }

      const results: BulkNewsActionResult = {
        success: true,
        successCount: 0,
        failureCount: 0,
        errors: [],
      };

      // Her haber için işlemi yap
      const promises = newsIds.map(async (newsId: string) => {
        try {
          const newsDoc = await db.collection('news').doc(newsId).get();

          if (!newsDoc.exists) {
            results.failureCount++;
            results.errors?.push({
              newsId,
              error: 'Haber bulunamadı',
            });
            return;
          }

          const newsData = newsDoc.data();

          switch (action) {
            case 'delete':
              // Hard delete
              await db.collection('news').doc(newsId).delete();
              results.successCount++;
              break;

            case 'publish':
              // Yayınla
              await db.collection('news').doc(newsId).update({
                isPublished: true,
                publishedAt: newsData?.publishedAt || admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
              });
              results.successCount++;
              break;

            case 'unpublish':
              // Yayından kaldır
              await db.collection('news').doc(newsId).update({
                isPublished: false,
                publishedAt: admin.firestore.FieldValue.delete(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
              });
              results.successCount++;
              break;

            default:
              results.failureCount++;
              results.errors?.push({
                newsId,
                error: 'Geçersiz işlem tipi',
              });
          }
        } catch (error: unknown) {
          results.failureCount++;
          const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
          results.errors?.push({
            newsId,
            error: errorMessage,
          });
        }
      });

      // Tüm işlemleri bekle
      await Promise.all(promises);

      // Sonuçları belirle
      results.success = results.failureCount === 0;

      if (results.success) {
        return successResponse(
          `${results.successCount} haber için toplu işlem başarıyla tamamlandı`,
          results,
          200,
          'BULK_NEWS_ACTION_SUCCESS'
        );
      } else {
        return successResponse(
          `Toplu işlem kısmen tamamlandı. Başarılı: ${results.successCount}, Başarısız: ${results.failureCount}`,
          results,
          207, // Multi-Status
          'BULK_NEWS_ACTION_PARTIAL'
        );
      }
    } catch (error: unknown) {
      console.error('❌ Bulk news action error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Toplu işlem sırasında bir hata oluştu', errorMessage);
    }
  });
}

