import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { successResponse } from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';

/**
 * POST /api/users/batch-names
 * Birden fazla kullanıcının ad-soyad bilgilerini toplu olarak getirir.
 * N+1 API çağrısı sorununu çözmek için kullanılır.
 * 
 * Body: { userIds: string[] }
 * Response: { users: Record<string, { firstName: string; lastName: string }> }
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    // Kullanıcının rolünü kontrol et
    const { error, user: currentUserData } = await getCurrentUser(user.uid);

    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    const userRole = currentUserData!.role;

    // User rolü bu endpoint'i kullanamaz
    if (userRole === USER_ROLE.USER) {
      throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
    }

    const body = await parseJsonBody<{ userIds: string[] }>(req);
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new AppValidationError('userIds alanı boş veya geçersiz');
    }

    if (userIds.length > 50) {
      throw new AppValidationError('Tek seferde en fazla 50 kullanıcı sorgulanabilir');
    }

    // Benzersiz ID'leri al
    const uniqueIds = [...new Set(userIds)];

    // Firestore'dan toplu olarak kullanıcı bilgilerini getir
    // Firestore getAll ile tek seferde birden fazla document okunabilir
    const userRefs = uniqueIds.map(uid => db.collection('users').doc(uid));
    const userDocs = await db.getAll(...userRefs);

    const users: Record<string, { firstName: string; lastName: string }> = {};

    userDocs.forEach((doc) => {
      if (doc.exists) {
        const data = doc.data();
        users[doc.id] = {
          firstName: data?.firstName || '',
          lastName: data?.lastName || '',
        };
      }
    });

    return successResponse('Kullanıcı isimleri başarıyla getirildi', { users });
  });
});
