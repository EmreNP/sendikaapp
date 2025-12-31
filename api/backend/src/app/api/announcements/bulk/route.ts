import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { BulkAnnouncementActionRequest, BulkAnnouncementActionResult } from '@shared/types/announcement';
import {
  successResponse,
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

      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }

    const body = await parseJsonBody<BulkAnnouncementActionRequest>(req);
      const { action, announcementIds } = body;

      // Validation
      if (!action || !['delete', 'publish', 'unpublish'].includes(action)) {
      throw new AppValidationError('Geçersiz işlem tipi. İzin verilen: delete, publish, unpublish');
      }

      if (!announcementIds || !Array.isArray(announcementIds) || announcementIds.length === 0) {
      throw new AppValidationError('Duyuru ID listesi boş veya geçersiz');
      }

      if (announcementIds.length > 100) {
      throw new AppValidationError('Maksimum 100 duyuru için toplu işlem yapılabilir');
      }

      const results: BulkAnnouncementActionResult = {
        success: true,
        successCount: 0,
        failureCount: 0,
        errors: [],
      };

      // Her duyuru için işlemi yap
      const promises = announcementIds.map(async (announcementId: string) => {
        try {
          const announcementDoc = await db.collection('announcements').doc(announcementId).get();

          if (!announcementDoc.exists) {
            results.failureCount++;
            results.errors?.push({
              announcementId,
              error: 'Duyuru bulunamadı',
            });
            return;
          }

          const announcementData = announcementDoc.data();

          switch (action) {
            case 'delete':
              // Hard delete
              await db.collection('announcements').doc(announcementId).delete();
              results.successCount++;
              break;

            case 'publish':
              // Yayınla
              await db.collection('announcements').doc(announcementId).update({
                isPublished: true,
                publishedAt: announcementData?.publishedAt || admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
              });
              results.successCount++;
              break;

            case 'unpublish':
              // Yayından kaldır
              await db.collection('announcements').doc(announcementId).update({
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
                announcementId,
                error: 'Geçersiz işlem tipi',
              });
          }
        } catch (error: unknown) {
          results.failureCount++;
          const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
          results.errors?.push({
            announcementId,
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
          `${results.successCount} duyuru için toplu işlem başarıyla tamamlandı`,
          results,
          200,
          'BULK_ANNOUNCEMENT_ACTION_SUCCESS'
        );
      } else {
        return successResponse(
          `Toplu işlem kısmen tamamlandı. Başarılı: ${results.successCount}, Başarısız: ${results.failureCount}`,
          results,
          207, // Multi-Status
          'BULK_ANNOUNCEMENT_ACTION_PARTIAL'
        );
  });
  });

