import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import type { Query } from 'firebase-admin/firestore';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { USER_STATUS } from '@shared/constants/status';
import { 
  successResponse, 
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppAuthorizationError } from '@/lib/utils/errors/AppError';

// GET /api/users/stats - Kullanıcı istatistikleri
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    // Kullanıcının rolünü kontrol et
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
    
    const userRole = currentUserData!.role;
    
    // User istatistikleri göremez
    if (userRole === USER_ROLE.USER) {
      throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
    }
      
      // Query oluştur
      let query: Query = db.collection('users');
      
      // Branch Manager sadece kendi şubesinin istatistiklerini görebilir
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        query = query.where('branchId', '==', currentUserData!.branchId);
      }
      
      // Tüm kullanıcıları getir
      const snapshot = await query.get();
      
      // İstatistikleri tek pass'de hesapla (performans optimizasyonu)
      // Önceki kod: 10+ filter operasyonu = 10+ loop
      // Yeni kod: 1 reduce operasyonu = 1 loop
      const stats = snapshot.docs.reduce((acc, doc) => {
        const user = doc.data();
        
        // Total count
        acc.total++;
        
        // Active/Inactive
        if (user.isActive) {
          acc.active++;
        } else {
          acc.inactive++;
        }
        
        // Status-based counts
        const status = user.status;
        if (status === USER_STATUS.PENDING_DETAILS) {
          acc.pending++;
          acc.byStatus.pending_details++;
        } else if (status === USER_STATUS.PENDING_BRANCH_REVIEW) {
          acc.pending++;
          acc.byStatus.pending_branch_review++;
        } else if (status === USER_STATUS.ACTIVE) {
          acc.byStatus.active++;
        } else if (status === USER_STATUS.REJECTED) {
          acc.rejected++;
          acc.byStatus.rejected++;
        }
        
        // Role-based counts
        const role = user.role;
        if (role === USER_ROLE.ADMIN) {
          acc.byRole.admin++;
        } else if (role === USER_ROLE.BRANCH_MANAGER) {
          acc.byRole.branch_manager++;
        } else if (role === USER_ROLE.USER) {
          acc.byRole.user++;
        }
        
        return acc;
      }, {
        total: 0,
        active: 0,
        inactive: 0,
        pending: 0,
        rejected: 0,
        byRole: {
          admin: 0,
          branch_manager: 0,
          user: 0,
        },
        byStatus: {
          pending_details: 0,
          pending_branch_review: 0,
          active: 0,
          rejected: 0,
        },
      });
      
      return successResponse(
        'Kullanıcı istatistikleri başarıyla getirildi',
        {
          stats,
        }
      );
  });
});

