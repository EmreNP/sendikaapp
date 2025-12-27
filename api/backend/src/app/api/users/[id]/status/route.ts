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
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage
} from '@/lib/utils/response';

// PATCH /api/users/[id]/status - Kullanıcı durumunu güncelle
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const targetUserId = params.id;
      const body = await request.json();
      const { status: newStatus, rejectionReason, documentUrl, note } = body;
      
      // Validasyon
      if (!newStatus) {
        return validationError('Status alanı zorunludur');
      }
      
      // Status geçerli mi kontrol et
      const validStatuses = Object.values(USER_STATUS);
      if (!validStatuses.includes(newStatus as UserStatus)) {
        return validationError('Geçersiz status değeri');
      }
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      const userRole = currentUserData!.role;
      
      // User status güncelleyemez
      if (userRole === USER_ROLE.USER) {
        return unauthorizedError('Bu işlem için yetkiniz yok');
      }
      
      // Hedef kullanıcıyı getir
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      
      if (!targetUserDoc.exists) {
        return notFoundError('Kullanıcı');
      }
      
      const targetUserData = targetUserDoc.data();
      const currentStatus = targetUserData?.status;
      
      // Branch Manager yetki kontrolü
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        // Sadece kendi şubesindeki kullanıcılar
        if (targetUserData?.branchId !== currentUserData!.branchId) {
          return unauthorizedError('Bu kullanıcıya erişim yetkiniz yok');
        }
        
        // Branch Manager sadece belirli status geçişlerini yapabilir
        const allowedTransitions: Record<string, string[]> = {
          [USER_STATUS.PENDING_BRANCH_REVIEW]: [
            USER_STATUS.PENDING_ADMIN_APPROVAL,  // Onaylama (ileri)
            USER_STATUS.PENDING_DETAILS,         // Geri gönderme (geri)
          ]
        };
        
        const allowed = allowedTransitions[currentStatus as string] || [];
        
        if (!allowed.includes(newStatus)) {
          return unauthorizedError('Bu status değişikliğine yetkiniz yok. Sadece pending_branch_review durumundaki kullanıcıları pending_admin_approval veya pending_details yapabilirsiniz.');
        }
        
        // Branch Manager active ve rejected yapamaz
        if (newStatus === USER_STATUS.ACTIVE || newStatus === USER_STATUS.REJECTED) {
          return unauthorizedError('Branch Manager kullanıcıyı active veya rejected yapamaz');
        }
        
        // Admin'e gönderme durumunda PDF zorunlu
        if (newStatus === USER_STATUS.PENDING_ADMIN_APPROVAL && !documentUrl) {
          return validationError('Admin onayına göndermek için PDF belgesi zorunludur');
        }
      }
      
      // Admin her şeyi yapabilir
      // Rejected durumu için rejection reason kontrolü
      if (newStatus === USER_STATUS.REJECTED && !rejectionReason) {
        return validationError('Reddetme nedeni belirtilmelidir');
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
      
      await db.collection('users').doc(targetUserId).update(updateData);
      
      console.log(`📊 Status update - User: ${targetUserId}, Role: ${userRole}, Current: ${currentStatus}, New: ${newStatus}`);
      console.log(`📊 USER_ROLE.ADMIN: ${USER_ROLE.ADMIN}, userRole: ${userRole}, Match: ${userRole === USER_ROLE.ADMIN}`);
      
      // Log oluşturma durumu takibi
      let logCreated = false;
      let logError: string | null = null;
      
      // Log oluştur - Branch Manager için
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        if (newStatus === USER_STATUS.PENDING_ADMIN_APPROVAL) {
          try {
            const branchManagerLogDataRaw: any = {
              userId: targetUserId,
              action: 'branch_manager_approval',
              performedBy: user.uid,
              performedByRole: 'branch_manager',
              previousStatus: currentStatus,
              newStatus: USER_STATUS.PENDING_ADMIN_APPROVAL,
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
      if (userRole === USER_ROLE.ADMIN) {
        console.log(`✅ Admin role confirmed, creating log for status change: ${currentStatus} → ${newStatus}`);
        
        // Admin'in yaptığı TÜM status değişikliklerini logla
        let action: 'admin_approval' | 'admin_rejection' | 'admin_return' = 'admin_return';
        
        if (newStatus === USER_STATUS.ACTIVE) {
          action = 'admin_approval';
        } else if (newStatus === USER_STATUS.REJECTED) {
          action = 'admin_rejection';
        } else {
          // Diğer tüm durumlar için admin_return (pending_details, pending_branch_review, pending_admin_approval)
          action = 'admin_return';
        }
        
        // Log verilerini hazırla (undefined field'ları kaldırmak için önce objeyi oluştur, sonra temizle)
        const logDataRaw: any = {
          userId: targetUserId,
          action: action,
          performedBy: user.uid,
          performedByRole: 'admin',
          previousStatus: currentStatus,
          newStatus: newStatus,
        };
        
        // Opsiyonel field'ları sadece varsa ekle (undefined olmamalı)
        const noteValue = note || (newStatus === USER_STATUS.REJECTED ? rejectionReason : undefined);
        if (noteValue) {
          logDataRaw.note = noteValue;
        }
        
        if (documentUrl) {
          logDataRaw.documentUrl = documentUrl;
        }
        
        const logData: Omit<UserRegistrationLog, 'id' | 'timestamp'> = logDataRaw;
        
        console.log(`📝 Creating ${action} log for admin status change:`, JSON.stringify(logData, null, 2));
        console.log(`📝 Log data structure:`, {
          userId: logData.userId,
          action: logData.action,
          performedBy: logData.performedBy,
          performedByRole: logData.performedByRole,
          previousStatus: logData.previousStatus,
          newStatus: logData.newStatus,
          note: logData.note || 'none',
          documentUrl: logData.documentUrl || 'none',
        });
        
        try {
          console.log(`🔄 Calling createRegistrationLog...`);
          await createRegistrationLog(logData);
          console.log(`✅ Admin ${action} log created successfully for user ${targetUserId}`);
          logCreated = true;
        } catch (logErr: unknown) {
          const logErrorMessage = isErrorWithMessage(logErr) ? logErr.message : 'Bilinmeyen hata';
          logError = logErrorMessage;
          console.error(`❌ CRITICAL: Failed to create admin log: ${logErrorMessage}`);
          console.error(`❌ Log error details:`, logErr);
          if (logErr instanceof Error) {
            console.error(`❌ Error stack:`, logErr.stack);
            console.error(`❌ Error name:`, logErr.name);
          }
          // Log hatası ana işlemi durdurmamalı ama mutlaka loglanmalı
          // Burada throw yapmıyoruz çünkü status update başarılı olmuş olabilir
          // Ancak bu hatayı mutlaka log'layalım ki sorun tespit edilebilsin
        }
      } else {
        console.log(`ℹ️ Not admin role (${userRole}), admin log creation skipped`);
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
      
    } catch (error: unknown) {
      console.error('❌ Update status error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Kullanıcı durumu güncellenirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

