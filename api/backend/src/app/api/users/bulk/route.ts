import { NextRequest } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { BulkUserActionRequest, BulkUserActionResult } from '@shared/types/user';
import {
  successResponse,
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';
import { isErrorWithMessage } from '@/lib/utils/response';

// POST - Toplu işlem
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);

      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }

      const userRole = currentUserData!.role;

      // User rolü bulk işlem yapamaz
      if (userRole === USER_ROLE.USER) {
      throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
      }

    const body = await parseJsonBody<BulkUserActionRequest>(req);
      const { action, userIds } = body;

      // Validation
      if (!action || !['delete', 'activate', 'deactivate'].includes(action)) {
      throw new AppValidationError('Geçersiz işlem tipi. İzin verilen: delete, activate, deactivate');
      }

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new AppValidationError('Kullanıcı ID listesi boş veya geçersiz');
      }

      if (userIds.length > 100) {
      throw new AppValidationError('Maksimum 100 kullanıcı için toplu işlem yapılabilir');
      }

      // Delete sadece admin veya superadmin yapabilir
      if (action === 'delete' && userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.SUPERADMIN) {
      throw new AppAuthorizationError('Toplu silme işlemi için admin yetkisi gerekli');
      }

      // Her kullanıcı için işlemi yap
      const promises = userIds.map(async (targetUserId: string) => {
        try {
          // Kendini silmeye/deaktif etmeye izin verme
          if (targetUserId === user.uid && (action === 'delete' || action === 'deactivate')) {
            return {
              userId: targetUserId,
              success: false,
              error: 'Kendi hesabınızı bu işlem için seçemezsiniz',
            };
          }

          const targetUserDoc = await db.collection('users').doc(targetUserId).get();

          if (!targetUserDoc.exists) {
            return {
              userId: targetUserId,
              success: false,
              error: 'Kullanıcı bulunamadı',
            };
          }

          const targetUserData = targetUserDoc.data();

          // Branch Manager kısıtlamaları
          if (userRole === USER_ROLE.BRANCH_MANAGER) {
            // Branch Manager sadece kendi şubesindeki kullanıcıları işleyebilir
            if (targetUserData?.branchId !== currentUserData!.branchId) {
              return {
                userId: targetUserId,
                success: false,
                error: 'Bu kullanıcıya erişim yetkiniz yok',
              };
            }
          }

          switch (action) {
            case 'delete':
              // Hard delete - sadece admin
              try {
                // Firebase Auth'dan sil
                await auth.deleteUser(targetUserId);
                console.log(`✅ Firebase Auth user deleted: ${targetUserId}`);
              } catch (authError: unknown) {
                const errorMessage = isErrorWithMessage(authError) ? authError.message : 'Bilinmeyen hata';
                console.error('⚠️ Firebase Auth delete error:', errorMessage);
                // Auth'da yoksa devam et
              }

              // Firestore'dan sil
              await db.collection('users').doc(targetUserId).delete();
              console.log(`✅ Firestore user document deleted: ${targetUserId}`);
              return {
                userId: targetUserId,
                success: true,
              };

            case 'activate':
              // Aktif et
              if (targetUserData?.isActive) {
                return {
                  userId: targetUserId,
                  success: false,
                  error: 'Kullanıcı zaten aktif',
                };
              }

              try {
                // Firebase Auth'da enable et
                await auth.updateUser(targetUserId, {
                  disabled: false,
                });
                console.log(`✅ Firebase Auth user enabled: ${targetUserId}`);
              } catch (authError: unknown) {
                const errorMessage = isErrorWithMessage(authError) ? authError.message : 'Bilinmeyen hata';
                console.error('⚠️ Firebase Auth enable error:', errorMessage);
                // Auth'da yoksa devam et
              }

              // Firestore'da aktif et
              await db.collection('users').doc(targetUserId).update({
                isActive: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              console.log(`✅ User ${targetUserId} activated`);
              return {
                userId: targetUserId,
                success: true,
              };

            case 'deactivate':
              // Deaktif et
              if (!targetUserData?.isActive) {
                return {
                  userId: targetUserId,
                  success: false,
                  error: 'Kullanıcı zaten deaktif',
                };
              }

              try {
                // Firebase Auth'da disable et
                await auth.updateUser(targetUserId, {
                  disabled: true,
                });
                console.log(`✅ Firebase Auth user disabled: ${targetUserId}`);
              } catch (authError: unknown) {
                const errorMessage = isErrorWithMessage(authError) ? authError.message : 'Bilinmeyen hata';
                console.error('⚠️ Firebase Auth disable error:', errorMessage);
                // Auth'da yoksa devam et
              }

              // Firestore'da deaktif et
              await db.collection('users').doc(targetUserId).update({
                isActive: false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              console.log(`✅ User ${targetUserId} deactivated`);
              return {
                userId: targetUserId,
                success: true,
              };

            default:
              return {
                userId: targetUserId,
                success: false,
                error: 'Geçersiz işlem tipi',
              };
          }
        } catch (error: unknown) {
          const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
          return {
            userId: targetUserId,
            success: false,
            error: errorMessage,
          };
        }
      });

      // Tüm işlemleri bekle
      const operationResults = await Promise.all(promises);

      // Sonuçları topla
      const results: BulkUserActionResult = {
        success: true,
        successCount: 0,
        failureCount: 0,
        errors: [],
      };

      operationResults.forEach((result) => {
        if (result.success) {
          results.successCount++;
        } else {
          results.failureCount++;
          results.errors?.push({
            userId: result.userId,
            error: result.error || 'Bilinmeyen hata',
          });
        }
      });

      // Sonuçları belirle
      results.success = results.failureCount === 0;

      if (results.success) {
        return successResponse(
          `${results.successCount} kullanıcı için toplu işlem başarıyla tamamlandı`,
          results,
          200,
          'BULK_USER_ACTION_SUCCESS'
        );
      } else {
        return successResponse(
          `Toplu işlem kısmen tamamlandı. Başarılı: ${results.successCount}, Başarısız: ${results.failureCount}`,
          results,
          207, // Multi-Status
          'BULK_USER_ACTION_PARTIAL'
        );
      }
  });
});

