import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { BulkFAQActionRequest, BulkFAQActionResult } from '@shared/types/faq';
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

      const body = await parseJsonBody<BulkFAQActionRequest>(req);
      const { action, faqIds } = body;

      // Validation
      if (!action || !['delete', 'publish', 'unpublish'].includes(action)) {
        throw new AppValidationError('Geçersiz işlem tipi. İzin verilen: delete, publish, unpublish');
      }

      if (!faqIds || !Array.isArray(faqIds) || faqIds.length === 0) {
        throw new AppValidationError('FAQ ID listesi boş veya geçersiz');
      }

      if (faqIds.length > 100) {
        throw new AppValidationError('Maksimum 100 FAQ için toplu işlem yapılabilir');
      }

      // Her FAQ için işlemi yap
      const promises = faqIds.map(async (faqId: string) => {
        try {
          const faqDoc = await db.collection('faqs').doc(faqId).get();

          if (!faqDoc.exists) {
            return {
              success: false,
              faqId,
              error: 'FAQ bulunamadı',
            };
          }

          switch (action) {
            case 'delete':
              // Hard delete
              await db.collection('faqs').doc(faqId).delete();
              return { success: true, faqId };

            case 'publish':
              // Yayınla
              await db.collection('faqs').doc(faqId).update({
                isPublished: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
              });
              return { success: true, faqId };

            case 'unpublish':
              // Yayından kaldır
              await db.collection('faqs').doc(faqId).update({
                isPublished: false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
              });
              return { success: true, faqId };

            default:
              return {
                success: false,
                faqId,
                error: 'Geçersiz işlem tipi',
              };
          }
        } catch (error: unknown) {
          const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
          return {
            success: false,
            faqId,
            error: errorMessage,
          };
        }
      });

      // Tüm işlemleri bekle ve sonuçları topla
      const operationResults = await Promise.all(promises);

      // Sonuçları reduce ile say (race condition yok)
      const results: BulkFAQActionResult = operationResults.reduce(
        (acc, result) => {
          if (result.success) {
            acc.successCount++;
          } else {
            acc.failureCount++;
            acc.errors?.push({
              faqId: result.faqId,
              error: result.error || 'Bilinmeyen hata',
            });
          }
          return acc;
        },
        {
          success: true,
          successCount: 0,
          failureCount: 0,
          errors: [] as Array<{ faqId: string; error: string }>,
        } as BulkFAQActionResult
      );

      // Sonuçları belirle
      results.success = results.failureCount === 0;

      if (results.success) {
        return successResponse(
          `${results.successCount} FAQ için toplu işlem başarıyla tamamlandı`,
          results,
          200,
          'BULK_FAQ_ACTION_SUCCESS'
        );
      } else {
        return successResponse(
          `Toplu işlem kısmen tamamlandı. Başarılı: ${results.successCount}, Başarısız: ${results.failureCount}`,
          results,
          207, // Multi-Status
          'BULK_FAQ_ACTION_PARTIAL'
        );
      }
  });
});

