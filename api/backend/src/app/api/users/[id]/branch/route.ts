import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { UserBranchUpdateData } from '@shared/types/user';
import { 
  successResponse, 
  notFoundError,
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';
import admin from 'firebase-admin';

// PATCH /api/users/[id]/branch - Kullanıcıya şube ata
export const PATCH = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const targetUserId = params.id;
    const body = await parseJsonBody<{ branchId: string | null }>(req);
      const { branchId } = body;
      
      // branchId undefined olabilir (null ile şube ataması kaldırılır)
      if (branchId === undefined) {
      throw new AppValidationError('branchId alanı zorunludur (null gönderilebilir)');
      }
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      const userRole = currentUserData!.role;
      
      // Sadece Admin şube atayabilir
      if (userRole !== USER_ROLE.ADMIN) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      // Hedef kullanıcıyı getir
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      
      if (!targetUserDoc.exists) {
      throw new AppNotFoundError('Kullanıcı');
      }
      
      const targetUserData = targetUserDoc.data();
      const currentBranchId = targetUserData?.branchId;
      
      // Branch ID varsa kontrol et
      if (branchId) {
        const branchDoc = await db.collection('branches').doc(branchId).get();
        if (!branchDoc.exists) {
        throw new AppValidationError('Geçersiz şube ID');
        }
        
        const branchData = branchDoc.data();
        if (!branchData?.isActive) {
        throw new AppValidationError('Bu şube aktif değil');
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
  });
  });

