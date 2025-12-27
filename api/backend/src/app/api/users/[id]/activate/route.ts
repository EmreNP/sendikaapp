import { NextRequest } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { 
  successResponse, 
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage
} from '@/lib/utils/response';

// PATCH /api/users/[id]/activate - Kullanıcıyı aktif et
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const targetUserId = params.id;
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      const userRole = currentUserData!.role;
      
      // User aktif edemez
      if (userRole === USER_ROLE.USER) {
        return unauthorizedError('Bu işlem için yetkiniz yok');
      }
      
      // Hedef kullanıcıyı getir
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      
      if (!targetUserDoc.exists) {
        return notFoundError('Kullanıcı');
      }
      
      const targetUserData = targetUserDoc.data();
      
      // Branch Manager sadece kendi şubesindeki kullanıcıları aktif edebilir
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        if (targetUserData?.branchId !== currentUserData!.branchId) {
          return unauthorizedError('Bu kullanıcıya erişim yetkiniz yok');
        }
      }
      
      // Zaten aktif mi kontrol et
      if (targetUserData?.isActive) {
        return validationError('Kullanıcı zaten aktif');
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
      
    } catch (error: unknown) {
      console.error('❌ Activate user error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Kullanıcı aktif edilirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

