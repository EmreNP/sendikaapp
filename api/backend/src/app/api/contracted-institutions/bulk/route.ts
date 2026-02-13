import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { BulkContractedInstitutionActionRequest, BulkContractedInstitutionActionResult } from '@shared/types/contracted-institution';
import {
  successResponse,
  isErrorWithMessage,
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';

const COLLECTION_NAME = 'contracted_institutions';

// POST - Toplu işlem (sadece admin/superadmin)
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    // Admin kontrolü
    const { error, user: currentUserData } = await getCurrentUser(user.uid);

    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
    }

    const body = await parseJsonBody<BulkContractedInstitutionActionRequest>(req);
    const { action, institutionIds } = body;

    // Validation
    if (!action || !['delete', 'publish', 'unpublish'].includes(action)) {
      throw new AppValidationError('Geçersiz işlem tipi. İzin verilen: delete, publish, unpublish');
    }

    if (!institutionIds || !Array.isArray(institutionIds) || institutionIds.length === 0) {
      throw new AppValidationError('Kurum ID listesi boş veya geçersiz');
    }

    if (institutionIds.length > 100) {
      throw new AppValidationError('Maksimum 100 kurum için toplu işlem yapılabilir');
    }

    // Her kurum için işlemi yap
    const promises = institutionIds.map(async (institutionId: string) => {
      try {
        const doc = await db.collection(COLLECTION_NAME).doc(institutionId).get();

        if (!doc.exists) {
          return {
            success: false,
            institutionId,
            error: 'Anlaşmalı kurum bulunamadı',
          };
        }

        switch (action) {
          case 'delete':
            await db.collection(COLLECTION_NAME).doc(institutionId).delete();
            return { success: true, institutionId };

          case 'publish':
            await db.collection(COLLECTION_NAME).doc(institutionId).update({
              isPublished: true,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedBy: user.uid,
            });
            return { success: true, institutionId };

          case 'unpublish':
            await db.collection(COLLECTION_NAME).doc(institutionId).update({
              isPublished: false,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedBy: user.uid,
            });
            return { success: true, institutionId };

          default:
            return {
              success: false,
              institutionId,
              error: 'Geçersiz işlem tipi',
            };
        }
      } catch (error: unknown) {
        const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
        return {
          success: false,
          institutionId,
          error: errorMessage,
        };
      }
    });

    const operationResults = await Promise.all(promises);

    const results: BulkContractedInstitutionActionResult = operationResults.reduce(
      (acc, result) => {
        if (result.success) {
          acc.successCount++;
        } else {
          acc.failureCount++;
          acc.errors?.push({
            institutionId: result.institutionId,
            error: result.error || 'Bilinmeyen hata',
          });
        }
        return acc;
      },
      {
        success: true,
        successCount: 0,
        failureCount: 0,
        errors: [] as Array<{ institutionId: string; error: string }>,
      } as BulkContractedInstitutionActionResult
    );

    results.success = results.failureCount === 0;

    if (results.success) {
      return successResponse(
        `${results.successCount} anlaşmalı kurum için toplu işlem başarıyla tamamlandı`,
        results,
        200,
        'BULK_CONTRACTED_INSTITUTION_ACTION_SUCCESS'
      );
    } else {
      return successResponse(
        `Toplu işlem kısmen tamamlandı. Başarılı: ${results.successCount}, Başarısız: ${results.failureCount}`,
        results,
        207,
        'BULK_CONTRACTED_INSTITUTION_ACTION_PARTIAL'
      );
    }
  });
});
