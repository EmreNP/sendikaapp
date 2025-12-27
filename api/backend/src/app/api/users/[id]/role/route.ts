import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { UserRole, UserRoleUpdateData } from '@shared/types/user';
import { 
  successResponse, 
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage
} from '@/lib/utils/response';

// PATCH /api/users/[id]/role - Kullanıcı rolünü güncelle
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const targetUserId = params.id;
      const body = await request.json();
      const { role: newRole, branchId } = body;
      
      // Validasyon
      if (!newRole) {
        return validationError('Role alanı zorunludur');
      }
      
      // Role geçerli mi kontrol et
      const validRoles = Object.values(USER_ROLE);
      if (!validRoles.includes(newRole as UserRole)) {
        return validationError('Geçersiz rol değeri');
      }
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      const userRole = currentUserData!.role;
      
      // Sadece Admin rol güncelleyebilir
      if (userRole !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      // Hedef kullanıcıyı getir
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      
      if (!targetUserDoc.exists) {
        return notFoundError('Kullanıcı');
      }
      
      const targetUserData = targetUserDoc.data();
      const currentRole = targetUserData?.role;
      
      // Branch Manager rolü için branchId zorunlu
      if (newRole === USER_ROLE.BRANCH_MANAGER && !branchId) {
        return validationError('Branch manager rolü için branchId zorunludur');
      }
      
      // Branch ID varsa kontrol et
      if (branchId) {
        const branchDoc = await db.collection('branches').doc(branchId).get();
        if (!branchDoc.exists) {
          return validationError('Geçersiz şube ID');
        }
      }
      
      // Kendinin rolünü değiştirmeye izin verme
      if (targetUserId === user.uid) {
        return validationError('Kendi rolünüzü değiştiremezsiniz');
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
      
      await db.collection('users').doc(targetUserId).update(updateData);
      
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
      
    } catch (error: unknown) {
      console.error('❌ Update role error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Kullanıcı rolü güncellenirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

