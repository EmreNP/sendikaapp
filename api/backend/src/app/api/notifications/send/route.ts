import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { USER_STATUS } from '@shared/constants/status';
import { 
  NOTIFICATION_TYPE,
  NOTIFICATION_ERROR_MESSAGE,
  NOTIFICATION_LIMITS,
  NOTIFICATION_RESPONSE_CODE,
  NOTIFICATION_RESPONSE_MESSAGE,
  type NotificationType,
  type TargetAudience
} from '@shared/constants/notifications';
import { successResponse } from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';
import { sendMulticastNotification, saveNotificationHistory } from '@/lib/services/notificationService';
import { createAuditLog } from '@/lib/services/auditLogService';

interface SendNotificationRequest {
  title: string;
  body: string;
  type: NotificationType;
  contentId?: string;
  imageUrl?: string;
  targetAudience?: TargetAudience;
  branchId?: string;
  branchIds?: string[];
  data?: Record<string, string>;
}

/**
 * POST /api/notifications/send
 * Bildirim gönder
 * 
 * Yetki: Admin veya Branch Manager
 * 
 * Hedef Kitleler:
 * - 'all': Tüm kullanıcılara (sadece admin)
 * - 'active': Aktif kullanıcılara
 * - 'branch': Belirli şubedeki kullanıcılara
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    // 1. Yetki kontrolü
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error) {
      throw new AppAuthorizationError(NOTIFICATION_ERROR_MESSAGE.UNAUTHORIZED_NOTIFICATION);
    }
    
    const userRole = currentUserData!.role;
    
    // Sadece admin, superadmin ve branch manager bildirim gönderebilir
    if (userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.SUPERADMIN && userRole !== USER_ROLE.BRANCH_MANAGER) {
      throw new AppAuthorizationError(NOTIFICATION_ERROR_MESSAGE.UNAUTHORIZED_NOTIFICATION);
    }
    
    // 2. Request body
    const body = await parseJsonBody<SendNotificationRequest>(req);
    const { 
      title, 
      body: messageBody, 
      type, 
      contentId, 
      imageUrl, 
      targetAudience = 'all',
      branchId,
      branchIds,
      data 
    } = body;
    
    // 3. Validasyon
    if (!title || title.trim().length === 0) {
      throw new AppValidationError(NOTIFICATION_ERROR_MESSAGE.TITLE_REQUIRED);
    }
    
    if (!messageBody || messageBody.trim().length === 0) {
      throw new AppValidationError(NOTIFICATION_ERROR_MESSAGE.BODY_REQUIRED);
    }
    
    if (title.length > NOTIFICATION_LIMITS.TITLE_MAX_LENGTH) {
      throw new AppValidationError(NOTIFICATION_ERROR_MESSAGE.TITLE_TOO_LONG);
    }
    
    if (messageBody.length > NOTIFICATION_LIMITS.BODY_MAX_LENGTH) {
      throw new AppValidationError(NOTIFICATION_ERROR_MESSAGE.BODY_TOO_LONG);
    }
    
    // 4. Branch Manager kontrolü
    if (userRole === USER_ROLE.BRANCH_MANAGER) {
      if (targetAudience === 'all') {
        throw new AppValidationError(NOTIFICATION_ERROR_MESSAGE.BRANCH_MANAGER_ALL_FORBIDDEN);
      }
      
      if (targetAudience === 'branch') {
        if (!currentUserData!.branchId) {
          throw new AppValidationError(NOTIFICATION_ERROR_MESSAGE.BRANCH_REQUIRED);
        }

        if (branchId && branchId !== currentUserData!.branchId) {
          throw new AppValidationError(NOTIFICATION_ERROR_MESSAGE.BRANCH_MANAGER_OTHER_BRANCH);
        }

        if (branchIds && branchIds.some(id => id !== currentUserData!.branchId)) {
          throw new AppValidationError(NOTIFICATION_ERROR_MESSAGE.BRANCH_MANAGER_OTHER_BRANCH);
        }
      }
    }
    
    const resolveBranchIds = (): string[] => {
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        return currentUserData!.branchId ? [currentUserData!.branchId] : [];
      }
      if (Array.isArray(branchIds) && branchIds.length > 0) {
        return branchIds;
      }
      if (branchId) {
        return [branchId];
      }
      return [];
    };

    // 5. Token'ları al - hedef kitleye göre
    let tokens: string[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    if (targetAudience === 'branch') {
      const branchIdsToSend = resolveBranchIds();

      if (branchIdsToSend.length === 0) {
        throw new AppValidationError(NOTIFICATION_ERROR_MESSAGE.BRANCH_REQUIRED);
      }

      for (const branchIdItem of branchIdsToSend) {
        tokens = [];

        const branchUsersSnapshot = await db.collection('users')
          .where('branchId', '==', branchIdItem)
          .where('isActive', '==', true)
          .select()
          .get();

        const branchUserIds = branchUsersSnapshot.docs.map(doc => doc.id);

        if (branchUserIds.length > 0) {
          const chunkSize = 10;
          const tokenPromises: Promise<admin.firestore.QuerySnapshot>[] = [];

          for (let i = 0; i < branchUserIds.length; i += chunkSize) {
            const chunk = branchUserIds.slice(i, i + chunkSize);
            tokenPromises.push(
              db.collection('fcmTokens')
                .where('userId', 'in', chunk)
                .where('isActive', '==', true)
                .get()
            );
          }

          const tokenSnapshots = await Promise.all(tokenPromises);

          tokenSnapshots.forEach(snapshot => {
            snapshot.docs.forEach(doc => {
              const tokenData = doc.data();
              if (tokenData.token) {
                tokens.push(tokenData.token);
              }
            });
          });
        }

        const result = await sendMulticastNotification(
          tokens,
          title,
          messageBody,
          type,
          contentId,
          imageUrl,
          data,
          branchIdItem
        );

        totalSent += result.successCount;
        totalFailed += result.failureCount;

        await saveNotificationHistory({
          title,
          body: messageBody,
          type,
          contentId,
          sentBy: user.uid,
          targetAudience,
          branchId: branchIdItem,
          sentCount: result.successCount,
          failedCount: result.failureCount,
          imageUrl,
          data,
        });
      }
    } else if (targetAudience === 'active') {
      // Aktif kullanıcıların token'larını al
      const activeUsersSnapshot = await db.collection('users')
        .where('status', '==', USER_STATUS.ACTIVE)
        .where('isActive', '==', true)
        .select()
        .get();

      const activeUserIds = activeUsersSnapshot.docs.map(doc => doc.id);

      if (activeUserIds.length === 0) {
        return successResponse(
          NOTIFICATION_RESPONSE_MESSAGE.NOTIFICATION_SENT,
          { sent: 0, failed: 0, message: NOTIFICATION_ERROR_MESSAGE.NO_ACTIVE_USERS },
          200,
          NOTIFICATION_RESPONSE_CODE.NOTIFICATION_SENT
        );
      }

      // Firestore 'in' operatörü max 10 item destekler, chunking yap
      const chunkSize = 10;
      const tokenPromises: Promise<admin.firestore.QuerySnapshot>[] = [];

      for (let i = 0; i < activeUserIds.length; i += chunkSize) {
        const chunk = activeUserIds.slice(i, i + chunkSize);
        tokenPromises.push(
          db.collection('fcmTokens')
            .where('userId', 'in', chunk)
            .where('isActive', '==', true)
            .get()
        );
      }

      const tokenSnapshots = await Promise.all(tokenPromises);

      tokenSnapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          const tokenData = doc.data();
          if (tokenData.token) {
            tokens.push(tokenData.token);
          }
        });
      });
    } else {
      // 'all' - Tüm aktif token'lar
      const tokensSnapshot = await db.collection('fcmTokens')
        .where('isActive', '==', true)
        .get();

      tokensSnapshot.docs.forEach(doc => {
        const tokenData = doc.data();
        if (tokenData.token) {
          tokens.push(tokenData.token);
        }
      });
    }

    if (targetAudience !== 'branch') {
      if (tokens.length === 0) {
        return successResponse(
          NOTIFICATION_RESPONSE_MESSAGE.NOTIFICATION_SENT,
          { sent: 0, failed: 0, message: NOTIFICATION_ERROR_MESSAGE.NO_ACTIVE_TOKENS },
          200,
          NOTIFICATION_RESPONSE_CODE.NOTIFICATION_SENT
        );
      }

      // 6. Bildirim gönder
      const result = await sendMulticastNotification(
        tokens,
        title,
        messageBody,
        type,
        contentId,
        imageUrl,
        data,
        branchId
      );

      totalSent += result.successCount;
      totalFailed += result.failureCount;

      // 7. Geçmişe kaydet
      await saveNotificationHistory({
        title,
        body: messageBody,
        type,
        contentId,
        sentBy: user.uid,
        targetAudience,
        branchId,
        sentCount: result.successCount,
        failedCount: result.failureCount,
        imageUrl,
        data,
      });
    }

    // Audit log
    createAuditLog({
      action: 'notification_sent',
      category: 'notification',
      performedBy: user.uid,
      performedByName: `${currentUserData!.firstName || ''} ${currentUserData!.lastName || ''}`.trim(),
      performedByRole: userRole,
      branchId: branchId || currentUserData!.branchId,
      targetName: title.trim(),
      details: { type, targetAudience, sent: totalSent, failed: totalFailed },
      message: `"${title.trim()}" bildirimi gönderildi (${totalSent} başarılı)`,
    });

    return successResponse(
      NOTIFICATION_RESPONSE_MESSAGE.NOTIFICATION_SENT,
      {
        sent: totalSent,
        failed: totalFailed,
      },
      200,
      NOTIFICATION_RESPONSE_CODE.NOTIFICATION_SENT
    );
  });
});

