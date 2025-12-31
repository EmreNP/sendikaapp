import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { UserRole, UserRoleUpdateData } from '@shared/types/user';
import { 
  successResponse, 
  notFoundError,
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';

// PATCH /api/users/[id]/role - Kullanıcı rolünü güncelle
export const PATCH = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const targetUserId = params.id;
    const body = await parseJsonBody<{ role: string; branchId?: string }>(req);
      const { role: newRole, branchId } = body;
      
      // Validasyon
      if (!newRole) {
      throw new AppValidationError('Role alanı zorunludur');
      }
      
      // Role geçerli mi kontrol et
      const validRoles = Object.values(USER_ROLE);
      if (!validRoles.includes(newRole as UserRole)) {
      throw new AppValidationError('Geçersiz rol değeri');
      }
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      const userRole = currentUserData!.role;
      
      // Sadece Admin rol güncelleyebilir
      if (userRole !== USER_ROLE.ADMIN) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      // Hedef kullanıcıyı getir
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      
      if (!targetUserDoc.exists) {
      throw new AppNotFoundError('Kullanıcı');
      }
      
      const targetUserData = targetUserDoc.data();
      const currentRole = targetUserData?.role;
      
      // Branch Manager rolü için branchId zorunlu
      if (newRole === USER_ROLE.BRANCH_MANAGER && !branchId) {
      throw new AppValidationError('Branch manager rolü için branchId zorunludur');
      }
      
      // Branch ID varsa kontrol et
      if (branchId) {
        const branchDoc = await db.collection('branches').doc(branchId).get();
        if (!branchDoc.exists) {
        throw new AppValidationError('Geçersiz şube ID');
        }
      }
      
      // Kendinin rolünü değiştirmeye izin verme
      if (targetUserId === user.uid) {
      throw new AppValidationError('Kendi rolünüzü değiştiremezsiniz');
      }
      
      // Rol'ü güncelle
      const updateData: UserRoleUpdateData = {
        role: newRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      // Branch Manager için branchId ekle/güncelle
      if (newRole === USER_ROLE.BRANCH_MANAGER) {
        updateData.branchId = branchId;
      } else if (newRole === USER_ROLE.USER && !branchId) {
        // User rolüne geçerken branchId korunur (opsiyonel)
      }
      
      await db.collection('users').doc(targetUserId).update(updateData as any);
      
      console.log(`✅ User ${targetUserId} role updated: ${currentRole} → ${newRole}`);
      
      return successResponse(
        'Kullanıcı rolü başarıyla güncellendi',
        {
          user: {
            uid: targetUserId,
            role: newRole,
            branchId: updateData.branchId,
            previousRole: currentRole,
          },
        },
        200,
        'USER_ROLE_UPDATE_SUCCESS'
      );
  });
  });

