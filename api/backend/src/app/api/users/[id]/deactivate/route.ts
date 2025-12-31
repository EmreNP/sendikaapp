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

// PATCH /api/users/[id]/deactivate - Kullanıcıyı deaktif et
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
      
      // Hedef kullanıcıyı getir
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      
      if (!targetUserDoc.exists) {
      throw new AppNotFoundError('Kullanıcı');
      }
      
      const targetUserData = targetUserDoc.data();
      
      // Yetki kontrolü
      if (userRole === USER_ROLE.USER) {
        // User sadece kendi hesabını deaktif edebilir
        if (targetUserId !== user.uid) {
        throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
        }
      } else if (userRole === USER_ROLE.BRANCH_MANAGER) {
        // Branch Manager kendi hesabını veya kendi şubesindeki kullanıcıları deaktif edebilir
        if (targetUserId !== user.uid && targetUserData?.branchId !== currentUserData!.branchId) {
        throw new AppAuthorizationError('Bu kullanıcıya erişim yetkiniz yok');
        }
      }
      // Admin herhangi bir kullanıcıyı deaktif edebilir
      
      // Zaten deaktif mi kontrol et
      if (!targetUserData?.isActive) {
      throw new AppValidationError('Kullanıcı zaten deaktif');
      }
      
      // Firebase Auth'da disable et
      try {
        await auth.updateUser(targetUserId, {
          disabled: true,
        });
        console.log(`✅ Firebase Auth user disabled: ${targetUserId}`);
      } catch (authError: unknown) {
        const errorMessage = isErrorWithMessage(authError) ? authError.message : 'Bilinmeyen hata';
        console.error('⚠️ Firebase Auth disable error:', errorMessage);
        // Auth'da yoksa devam et
      }
      
      // Firestore'da deaktif et
      await db.collection('users').doc(targetUserId).update({
        isActive: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`✅ User ${targetUserId} deactivated`);
      
      return successResponse(
        'Kullanıcı başarıyla deaktif edildi',
        {
          user: {
            uid: targetUserId,
            isActive: false,
          },
        },
        200,
        'USER_DEACTIVATE_SUCCESS'
      );
  });
  });

