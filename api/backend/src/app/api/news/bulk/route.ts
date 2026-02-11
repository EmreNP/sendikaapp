import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { BulkNewsActionRequest, BulkNewsActionResult } from '@shared/types/news';
import {
  successResponse,
  isErrorWithMessage,
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';

// POST - Toplu işlem (sadece admin)
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

    const body = await parseJsonBody<BulkNewsActionRequest>(req);
      const { action, newsIds } = body;

      // Validation
      if (!action || !['delete', 'publish', 'unpublish'].includes(action)) {
      throw new AppValidationError('Geçersiz işlem tipi. İzin verilen: delete, publish, unpublish');
      }

      if (!newsIds || !Array.isArray(newsIds) || newsIds.length === 0) {
      throw new AppValidationError('Haber ID listesi boş veya geçersiz');
      }

      if (newsIds.length > 100) {
      throw new AppValidationError('Maksimum 100 haber için toplu işlem yapılabilir');
      }

      // Her haber için işlemi yap
      const promises = newsIds.map(async (newsId: string) => {
        try {
          const newsDoc = await db.collection('news').doc(newsId).get();

          if (!newsDoc.exists) {
            return {
              success: false,
              newsId,
              error: 'Haber bulunamadı',
            };
          }

          const newsData = newsDoc.data();

          switch (action) {
            case 'delete':
              // Hard delete
              await db.collection('news').doc(newsId).delete();
              return { success: true, newsId };

            case 'publish':
              // Yayınla
              await db.collection('news').doc(newsId).update({
                isPublished: true,
                publishedAt: newsData?.publishedAt || admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
              });
              return { success: true, newsId };

            case 'unpublish':
              // Yayından kaldır
              await db.collection('news').doc(newsId).update({
                isPublished: false,
                publishedAt: admin.firestore.FieldValue.delete(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
              });
              return { success: true, newsId };

            default:
              return {
                success: false,
                newsId,
                error: 'Geçersiz işlem tipi',
              };
          }
        } catch (error: unknown) {
          const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
          return {
            success: false,
            newsId,
            error: errorMessage,
          };
        }
      });

      // Tüm işlemleri bekle ve sonuçları topla
      const operationResults = await Promise.all(promises);

      // Sonuçları reduce ile say (race condition yok)
      const results: BulkNewsActionResult = operationResults.reduce(
        (acc, result) => {
          if (result.success) {
            acc.successCount++;
          } else {
            acc.failureCount++;
            acc.errors?.push({
              newsId: result.newsId,
              error: result.error || 'Bilinmeyen hata',
            });
          }
          return acc;
        },
        {
          success: true,
          successCount: 0,
          failureCount: 0,
          errors: [] as Array<{ newsId: string; error: string }>,
        } as BulkNewsActionResult
      );

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
  });
});

