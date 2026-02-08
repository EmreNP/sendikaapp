import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { USER_STATUS } from '@shared/constants/status';
import type { UserStatus, UserStatusUpdateData, UserRegistrationLog } from '@shared/types/user';
import { createRegistrationLog } from '@/lib/services/registrationLogService';
import { 
  successResponse, 
  notFoundError,
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';
import { isErrorWithMessage } from '@/lib/utils/response';

// PATCH /api/users/[id]/status - Kullanıcı durumunu güncelle
export const PATCH = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const targetUserId = params.id;
    const body = await parseJsonBody<{ 
      status: string; 
      rejectionReason?: string; 
      documentUrl?: string; 
      note?: string;
    }>(req);
      const { status: newStatus, rejectionReason, documentUrl, note } = body;
      
      // Validasyon
      if (!newStatus) {
      throw new AppValidationError('Status alanı zorunludur');
      }
      
      // Status geçerli mi kontrol et
      const validStatuses = Object.values(USER_STATUS);
      if (!validStatuses.includes(newStatus as UserStatus)) {
      throw new AppValidationError('Geçersiz status değeri');
      }
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      const userRole = currentUserData!.role;
      
      // User status güncelleyemez
      if (userRole === USER_ROLE.USER) {
      throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
      }
      
      // Hedef kullanıcıyı getir
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      
      if (!targetUserDoc.exists) {
      throw new AppNotFoundError('Kullanıcı');
      }
      
      const targetUserData = targetUserDoc.data();
      const currentStatus = targetUserData?.status;
      
      // Branch Manager yetki kontrolü
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        // Sadece kendi şubesindeki kullanıcılar
        if (targetUserData?.branchId !== currentUserData!.branchId) {
        throw new AppAuthorizationError('Bu kullanıcıya erişim yetkiniz yok');
        }
        
        // Branch Manager sadece belirli status geçişlerini yapabilir
        const allowedTransitions: Record<string, string[]> = {
          [USER_STATUS.PENDING_BRANCH_REVIEW]: [
            USER_STATUS.ACTIVE,           // Onaylama (PDF ile direkt aktif)
            USER_STATUS.REJECTED,         // Reddetme
            USER_STATUS.PENDING_DETAILS,  // Geri gönderme (düzeltme gerekli)
          ]
        };
        
        const allowed = allowedTransitions[currentStatus as string] || [];
        
        if (!allowed.includes(newStatus)) {
        throw new AppAuthorizationError('Bu status değişikliğine yetkiniz yok. Sadece pending_branch_review durumundaki kullanıcıları active, rejected veya pending_details yapabilirsiniz.');
        }
        
        // Aktif yapma durumunda PDF zorunlu
        if (newStatus === USER_STATUS.ACTIVE && !documentUrl) {
        throw new AppValidationError('Kullanıcıyı onaylamak için PDF belgesi zorunludur');
        }
      }
      
      // Admin her şeyi yapabilir
      // Rejected durumu için rejection reason kontrolü
      if (newStatus === USER_STATUS.REJECTED && !rejectionReason) {
      throw new AppValidationError('Reddetme nedeni belirtilmelidir');
      }
      
      // Status'u güncelle
      const updateData: any = {
        status: newStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      
      // PDF belgesi URL'i varsa ekle
      if (documentUrl) {
        updateData.documentUrl = documentUrl;
      }
      
      await db.collection('users').doc(targetUserId).update(updateData as any);
      
      console.log(`📊 Status update - User: ${targetUserId}, Role: ${userRole}, Current: ${currentStatus}, New: ${newStatus}`);
      console.log(`📊 USER_ROLE.ADMIN: ${USER_ROLE.ADMIN}, userRole: ${userRole}, Match: ${userRole === USER_ROLE.ADMIN}`);
      
      // Log oluşturma durumu takibi
      let logCreated = false;
      let logError: string | null = null;
      
      // Log oluştur - Branch Manager için
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        if (newStatus === USER_STATUS.ACTIVE) {
          try {
            const branchManagerLogDataRaw: any = {
              userId: targetUserId,
              action: 'branch_manager_approval',
              performedBy: user.uid,
              performedByRole: 'branch_manager',
              previousStatus: currentStatus,
              newStatus: USER_STATUS.ACTIVE,
            };
            
            // Opsiyonel field'ları sadece varsa ekle
            if (note) {
              branchManagerLogDataRaw.note = note;
            }
            if (documentUrl) {
              branchManagerLogDataRaw.documentUrl = documentUrl;
            }
            
            await createRegistrationLog(branchManagerLogDataRaw);
            logCreated = true;
          } catch (err: unknown) {
            logError = isErrorWithMessage(err) ? err.message : 'Bilinmeyen hata';
            console.error(`❌ CRITICAL: Failed to create branch manager approval log: ${logError}`);
          }
        } else if (newStatus === USER_STATUS.REJECTED) {
          try {
            const branchManagerRejectLogDataRaw: any = {
              userId: targetUserId,
              action: 'branch_manager_rejection',
              performedBy: user.uid,
              performedByRole: 'branch_manager',
              previousStatus: currentStatus,
              newStatus: USER_STATUS.REJECTED,
            };
            
            if (note) {
              branchManagerRejectLogDataRaw.note = note;
            }
            if (rejectionReason) {
              branchManagerRejectLogDataRaw.note = rejectionReason;
            }
            
            await createRegistrationLog(branchManagerRejectLogDataRaw);
            logCreated = true;
          } catch (err: unknown) {
            logError = isErrorWithMessage(err) ? err.message : 'Bilinmeyen hata';
            console.error(`❌ CRITICAL: Failed to create branch manager rejection log: ${logError}`);
          }
        } else if (newStatus === USER_STATUS.PENDING_DETAILS) {
          try {
            const branchManagerReturnLogDataRaw: any = {
              userId: targetUserId,
              action: 'branch_manager_return',
              performedBy: user.uid,
              performedByRole: 'branch_manager',
              previousStatus: currentStatus,
              newStatus: USER_STATUS.PENDING_DETAILS,
            };
            
            // Opsiyonel field'ları sadece varsa ekle
            if (note) {
              branchManagerReturnLogDataRaw.note = note;
            }
            
            await createRegistrationLog(branchManagerReturnLogDataRaw);
            logCreated = true;
          } catch (err: unknown) {
            logError = isErrorWithMessage(err) ? err.message : 'Bilinmeyen hata';
            console.error(`❌ CRITICAL: Failed to create branch manager return log: ${logError}`);
          }
        }
      }
      
      // Log oluştur - Admin için (TÜM status değişiklikleri loglanmalı)
      // ÖNEMLİ: Admin'in yaptığı TÜM status değişiklikleri loglanmalı
      // Branch Manager log'ları yukarıda oluşturuldu, şimdi Admin log'larını oluştur
      if (userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN) {
        console.log(`✅ Admin/Superadmin role confirmed, creating log for status change: ${currentStatus} → ${newStatus}`);
        
        // Durum güncellemesini logla
        try {
          await createRegistrationLog({
            userId: targetUserId,
            action: 'status_update',
            performedBy: user.uid,
            performedByRole: userRole as any,
            previousStatus: currentStatus,
            newStatus: newStatus,
            note: note || (newStatus === USER_STATUS.REJECTED ? rejectionReason : undefined),
            documentUrl: documentUrl || undefined,
          });
          logCreated = true;
        } catch (err: unknown) {
          logError = isErrorWithMessage(err) ? err.message : 'Bilinmeyen hata';
          console.error('❌ CRITICAL: Failed to create status_update log:', logError);
        }
      } else {
        console.log(`ℹ️ Not admin/superadmin role (${userRole}), status_update log creation skipped`);
      }
      
      console.log(`✅ User ${targetUserId} status updated: ${currentStatus} → ${newStatus}`);
      
      return successResponse(
        'Kullanıcı durumu başarıyla güncellendi',
        {
          user: {
            uid: targetUserId,
            status: newStatus,
            previousStatus: currentStatus,
          },
          logInfo: {
            created: logCreated,
            error: logError,
            role: userRole,
          },
        },
        200,
        'USER_STATUS_UPDATE_SUCCESS'
      );
  });
  });

