import { NextRequest } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { 
  successResponse, 
  serializeUserTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';
import { isErrorWithMessage } from '@/lib/utils/response';

// GET /api/users/[id] - Kullanıcı detayı
export const GET = asyncHandler(async (
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
        // User sadece kendi bilgilerini görebilir
        if (targetUserId !== user.uid) {
        throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
        }
      } else if (userRole === USER_ROLE.BRANCH_MANAGER) {
        // Branch Manager sadece kendi şubesindeki kullanıcıları görebilir
        const targetBranchId = targetUserData?.branchId;
        const currentBranchId = currentUserData!.branchId;
        const branchesMatch = targetBranchId === currentBranchId;
        const branchCheck = targetUserId !== user.uid && !branchesMatch;
        
        if (branchCheck) {
        throw new AppAuthorizationError('Bu kullanıcıya erişim yetkiniz yok');
        }
      }
      // Admin herhangi bir kullanıcıyı görebilir
      
      // Timestamp'leri serialize et
      const userData = {
        uid: targetUserDoc.id,
        ...targetUserData,
      };
      const serializedUser = serializeUserTimestamps(userData);
      
      return successResponse(
        'Kullanıcı bilgileri başarıyla getirildi',
        {
          user: serializedUser,
        }
      );
  });
  });

// DELETE /api/users/[id] - Kullanıcı sil (Hard Delete)
export const DELETE = asyncHandler(async (
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
      
      // Sadece Admin hard delete yapabilir
      if (userRole !== USER_ROLE.ADMIN) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      // Hedef kullanıcıyı kontrol et
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      
      if (!targetUserDoc.exists) {
      throw new AppNotFoundError('Kullanıcı');
      }
      
      // Kendini silmeye izin verme
      if (targetUserId === user.uid) {
      throw new AppValidationError('Kendi hesabınızı silemezsiniz');
      }
      
      // Firebase Auth'dan sil
      try {
        await auth.deleteUser(targetUserId);
        console.log(`✅ Firebase Auth user deleted: ${targetUserId}`);
      } catch (authError: unknown) {
        const errorMessage = isErrorWithMessage(authError) ? authError.message : 'Bilinmeyen hata';
        console.error('⚠️ Firebase Auth delete error:', errorMessage);
        // Auth'da yoksa devam et
      }
      
      // Firestore'dan sil
      await db.collection('users').doc(targetUserId).delete();
      console.log(`✅ Firestore user document deleted: ${targetUserId}`);
      
      return successResponse(
        'Kullanıcı kalıcı olarak silindi',
        undefined,
        200,
        'USER_DELETE_SUCCESS'
      );
  });
  });

