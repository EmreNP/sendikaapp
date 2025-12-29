import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { UserBranchUpdateData } from '@shared/types/user';
import { 
  successResponse, 
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage
} from '@/lib/utils/response';
import admin from 'firebase-admin';

// PATCH /api/users/[id]/branch - Kullanıcıya şube ata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const targetUserId = params.id;
      const body = await request.json();
      const { branchId } = body;
      
      // branchId undefined olabilir (null ile şube ataması kaldırılır)
      if (branchId === undefined) {
        return validationError('branchId alanı zorunludur (null gönderilebilir)');
      }
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      const userRole = currentUserData!.role;
      
      // Sadece Admin şube atayabilir
      if (userRole !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      // Hedef kullanıcıyı getir
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      
      if (!targetUserDoc.exists) {
        return notFoundError('Kullanıcı');
      }
      
      const targetUserData = targetUserDoc.data();
      const currentBranchId = targetUserData?.branchId;
      
      // Branch ID varsa kontrol et
      if (branchId) {
        const branchDoc = await db.collection('branches').doc(branchId).get();
        if (!branchDoc.exists) {
          return validationError('Geçersiz şube ID');
        }
        
        const branchData = branchDoc.data();
        if (!branchData?.isActive) {
          return validationError('Bu şube aktif değil');
        }
      }
      
      // Şube ataması güncelle
      const updateData: UserBranchUpdateData = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      if (branchId === null) {
        // Şube ataması kaldır
        updateData.branchId = admin.firestore.FieldValue.delete();
      } else {
        updateData.branchId = branchId;
      }
      
      await db.collection('users').doc(targetUserId).update(updateData as any);
      
      console.log(`✅ User ${targetUserId} branch updated: ${currentBranchId || 'none'} → ${branchId || 'none'}`);
      
      return successResponse(
        branchId ? 'Şube ataması başarıyla güncellendi' : 'Şube ataması kaldırıldı',
        {
          user: {
            uid: targetUserId,
            branchId: branchId,
            previousBranchId: currentBranchId,
          },
        },
        200,
        'USER_BRANCH_UPDATE_SUCCESS'
      );
      
    } catch (error: unknown) {
      console.error('❌ Update branch error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Şube ataması güncellenirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

