import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { getUserRegistrationLogs } from '@/lib/services/registrationLogService';
import { 
  successResponse, 
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    
    // Yetki kontrolü
    if (userRole === USER_ROLE.USER) {
      // User sadece kendi loglarını görebilir
      if (targetUserId !== user.uid) {
        throw new AppAuthorizationError('Bu loglara erişim yetkiniz yok');
      }
    } else if (userRole === USER_ROLE.BRANCH_MANAGER) {
      // Branch Manager sadece kendi şubesindeki kullanıcıların loglarını görebilir
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      if (!targetUserDoc.exists) {
        throw new AppNotFoundError('Kullanıcı');
      }
      const targetUserData = targetUserDoc.data();
      if (targetUserData?.branchId !== currentUserData!.branchId) {
        throw new AppAuthorizationError('Bu loglara erişim yetkiniz yok');
      }
    }
    // Admin herkesin loglarını görebilir
    
    const logs = await getUserRegistrationLogs(targetUserId);
    
    return successResponse(
      'Kayıt logları başarıyla alındı',
      { logs },
      200,
      'GET_REGISTRATION_LOGS_SUCCESS'
    );
  });
});



