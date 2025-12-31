import { NextRequest } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { 
  successResponse, 
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';
import { isErrorWithMessage } from '@/lib/utils/response';

// PATCH /api/users/[id]/activate - Kullanıcıyı aktif et
export const PATCH = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const targetUserId = params.id;
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      const userRole = currentUserData!.role;
      
      // User aktif edemez
      if (userRole === USER_ROLE.USER) {
      throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
      }
      
      // Hedef kullanıcıyı getir
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      
      if (!targetUserDoc.exists) {
      throw new AppNotFoundError('Kullanıcı');
      }
      
      const targetUserData = targetUserDoc.data();
      
      // Branch Manager sadece kendi şubesindeki kullanıcıları aktif edebilir
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        if (targetUserData?.branchId !== currentUserData!.branchId) {
        throw new AppAuthorizationError('Bu kullanıcıya erişim yetkiniz yok');
        }
      }
      
      // Zaten aktif mi kontrol et
      if (targetUserData?.isActive) {
      throw new AppValidationError('Kullanıcı zaten aktif');
      }
      
      // Firebase Auth'da enable et
      try {
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
      
      return successResponse(
        'Kullanıcı başarıyla aktif edildi',
        {
          user: {
            uid: targetUserId,
            isActive: true,
          },
        },
        200,
        'USER_ACTIVATE_SUCCESS'
      );
  });
  });

