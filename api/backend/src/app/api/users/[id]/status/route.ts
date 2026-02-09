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
      documentUrl?: string; 
      note?: string;
    }>(req);
      const { status: newStatus, documentUrl, note } = body;
      
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
        
        // Branch Manager aktif kullanıcıların durumunu değiştiremez
        if (currentStatus === USER_STATUS.ACTIVE) {
        throw new AppAuthorizationError('Aktif kullanıcıların durumunu değiştiremezsiniz');
        }
        
        // Branch Manager aktif olmayan tüm kullanıcıların durumunu değiştirebilir
        const allowedTransitions: Record<string, string[]> = {
          [USER_STATUS.PENDING_BRANCH_REVIEW]: [
            USER_STATUS.ACTIVE,           // Onaylama (PDF ile direkt aktif)
            USER_STATUS.REJECTED,         // Reddetme
            USER_STATUS.PENDING_DETAILS,  // Geri gönderme (düzeltme gerekli)
          ],
          [USER_STATUS.PENDING_DETAILS]: [
            USER_STATUS.PENDING_BRANCH_REVIEW, // Gönder: detaylar tamamlandı, şube kontrolü
            USER_STATUS.ACTIVE,                // Direkt onayla (şube yöneticisi onayı ile)
            USER_STATUS.REJECTED,              // Reddet
          ],
          [USER_STATUS.REJECTED]: [
            USER_STATUS.PENDING_DETAILS,       // Yeniden değerlendirme için geri al
            USER_STATUS.PENDING_BRANCH_REVIEW, // Şube incelemesine gönder
            USER_STATUS.ACTIVE,                // Direkt aktif yap
          ]
        };
        
        const allowed = allowedTransitions[currentStatus as string] || [];
        
        if (!allowed.includes(newStatus)) {
        throw new AppAuthorizationError('Bu status değişikliğine yetkiniz yok');
        }
        
        // PDF opsiyonel ancak önerilir
        // Artık zorunlu değil, sadece uyarı
      }
      
      // Status'u güncelle
      const updateData: any = {
        status: newStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      // PDF belgesi URL'i varsa ekle
      if (documentUrl) {
        updateData.documentUrl = documentUrl;
      }
      
      await db.collection('users').doc(targetUserId).update(updateData as any);
      
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
      if (userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN) {
        // Duruma göre uygun action belirle
        let adminAction: string = 'status_update';
        if (newStatus === USER_STATUS.ACTIVE) {
          adminAction = 'admin_approval';
        } else if (newStatus === USER_STATUS.REJECTED) {
          adminAction = 'admin_rejection';
        } else if (newStatus === USER_STATUS.PENDING_DETAILS || newStatus === USER_STATUS.PENDING_BRANCH_REVIEW) {
          adminAction = 'admin_return';
        }
        
        try {
          const adminLogData: any = {
            userId: targetUserId,
            action: adminAction,
            performedBy: user.uid,
            performedByRole: userRole as any,
            previousStatus: currentStatus,
            newStatus: newStatus,
          };
          
          if (note) adminLogData.note = note;
          if (documentUrl) {
            adminLogData.documentUrl = documentUrl;
            // Eski document URL'i de kaydet
            const oldDocumentUrl = targetUserData?.documentUrl;
            if (oldDocumentUrl && oldDocumentUrl !== documentUrl) {
              adminLogData.previousDocumentUrl = oldDocumentUrl;
            }
          }
          
          await createRegistrationLog(adminLogData);
          logCreated = true;
        } catch (err: unknown) {
          logError = isErrorWithMessage(err) ? err.message : 'Bilinmeyen hata';
          console.error('Failed to create admin log:', logError);
        }
      } else {
        // Branch Manager log'ları yukarıda oluşturuldu
      }
      
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

