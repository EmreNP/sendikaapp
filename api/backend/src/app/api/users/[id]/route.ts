import { NextRequest } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { 
  successResponse, 
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage,
  serializeUserTimestamps
} from '@/lib/utils/response';

// GET /api/users/[id] - Kullanıcı detayı
export async function GET(
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
      
      // Hedef kullanıcıyı getir
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      
      if (!targetUserDoc.exists) {
        return notFoundError('Kullanıcı');
      }
      
      const targetUserData = targetUserDoc.data();
      
      // #region agent log - Detaylı veri kontrolü
      const targetBranchId = targetUserData?.branchId;
      const targetBranchIdType = typeof targetBranchId;
      const targetBranchIdValue = targetBranchId === null ? 'null' : targetBranchId === undefined ? 'undefined' : targetBranchId === '' ? 'empty_string' : String(targetBranchId);
      const hasBranchIdProp = targetUserData ? Object.prototype.hasOwnProperty.call(targetUserData, 'branchId') : false;
      const targetUserRole = targetUserData?.role;
      fetch('http://127.0.0.1:7242/ingest/7bfa6cc7-a793-4b51-ac28-4dd595ebead2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:40',message:'GET user authorization check - detailed',data:{targetUserId,userRole,currentUserBranchId:currentUserData!.branchId,currentUserBranchIdType:typeof currentUserData!.branchId,targetUserBranchId:targetBranchId,targetUserBranchIdType:targetBranchIdType,targetUserBranchIdValue:targetBranchIdValue,targetUserRole,hasBranchIdProp,isSelf:targetUserId===user.uid},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Yetki kontrolü
      if (userRole === USER_ROLE.USER) {
        // User sadece kendi bilgilerini görebilir
        if (targetUserId !== user.uid) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/7bfa6cc7-a793-4b51-ac28-4dd595ebead2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:46',message:'USER role unauthorized',data:{targetUserId,userUid:user.uid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          return unauthorizedError('Bu işlem için yetkiniz yok');
        }
      } else if (userRole === USER_ROLE.BRANCH_MANAGER) {
        // Branch Manager sadece kendi şubesindeki kullanıcıları görebilir
        const targetBranchId = targetUserData?.branchId;
        const currentBranchId = currentUserData!.branchId;
        const branchesMatch = targetBranchId === currentBranchId;
        const branchCheck = targetUserId !== user.uid && !branchesMatch;
        
        // #region agent log - Detaylı branch kontrolü
        fetch('http://127.0.0.1:7242/ingest/7bfa6cc7-a793-4b51-ac28-4dd595ebead2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:57',message:'BRANCH_MANAGER detailed branch check',data:{targetUserId,isSelf:targetUserId===user.uid,currentBranchId,currentBranchIdType:typeof currentBranchId,targetBranchId,targetBranchIdType:typeof targetBranchId,branchesMatch,strictEqualityCheck:targetBranchId === currentBranchId,branchCheck,willDeny:branchCheck},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        if (branchCheck) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/7bfa6cc7-a793-4b51-ac28-4dd595ebead2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:68',message:'BRANCH_MANAGER unauthorized',data:{targetUserId,currentBranchId,targetBranchId,targetBranchIdType:typeof targetBranchId,currentBranchIdType:typeof currentBranchId},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          return unauthorizedError('Bu kullanıcıya erişim yetkiniz yok');
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
      
    } catch (error: unknown) {
      console.error('❌ Get user error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Kullanıcı bilgileri alınırken bir hata oluştu',
        errorMessage
      );
    }
  });
}

// DELETE /api/users/[id] - Kullanıcı sil (Hard Delete)
export async function DELETE(
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
      
      // Sadece Admin hard delete yapabilir
      if (userRole !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      // Hedef kullanıcıyı kontrol et
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      
      if (!targetUserDoc.exists) {
        return notFoundError('Kullanıcı');
      }
      
      // Kendini silmeye izin verme
      if (targetUserId === user.uid) {
        return validationError('Kendi hesabınızı silemezsiniz');
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
      
    } catch (error: unknown) {
      console.error('❌ Delete user error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Kullanıcı silinirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

