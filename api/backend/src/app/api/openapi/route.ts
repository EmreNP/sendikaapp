import { openApiSpec } from '@/lib/openapi/spec'
import { NextResponse } from 'next/server'
import { asyncHandler } from '@/lib/utils/errors/errorHandler'
import { NextRequest } from 'next/server'
import { withAuth, getCurrentUser } from '@/lib/middleware/auth'
import { AppAuthorizationError } from '@/lib/utils/errors/AppError'
import { USER_ROLE } from '@shared/constants/roles'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;


// OpenAPI spec artık sadece admin/superadmin erişimine açık
// API yüzey keşfini (reconnaissance) önlemek için kimlik doğrulaması gerekli
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const { error, user: currentUserData } = await getCurrentUser(user.uid);

    if (error || !currentUserData) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    if (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN) {
      throw new AppAuthorizationError('OpenAPI dökümanına erişim yetkiniz yok');
    }

    return NextResponse.json(openApiSpec);
  });
})

