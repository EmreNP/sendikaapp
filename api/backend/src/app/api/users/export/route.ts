import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import type { Query } from 'firebase-admin/firestore';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { User } from '@shared/types/user';
import { successResponse } from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppAuthorizationError } from '@/lib/utils/errors/AppError';

import { logger } from '../../../../lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/users/export - Tüm kullanıcıları pagination olmadan döndür (sadece admin/superadmin)
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const { error, user: currentUserData } = await getCurrentUser(user.uid);

    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    const userRole = currentUserData!.role;

    // Sadece admin ve superadmin kullanabilir
    if (userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.SUPERADMIN) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gereklidir');
    }

    const url = new URL(request.url);
    const branchId = url.searchParams.get('branchId');
    const status = url.searchParams.get('status');

    let query: Query = db.collection('users');

    // Şube filtresi (opsiyonel)
    if (branchId && branchId !== 'all') {
      query = query.where('branchId', '==', branchId);
    }

    // Status filtresi (opsiyonel)
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    const users: User[] = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    })) as User[];

    logger.log(`[Export] ${users.length} kullanıcı dışa aktarılıyor (role: ${userRole})`);

    return successResponse(
      'Kullanıcılar başarıyla dışa aktarıldı',
      { users, total: users.length }
    );
  });
});
