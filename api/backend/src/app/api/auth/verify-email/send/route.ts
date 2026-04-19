import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { 
  successResponse, 
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export const POST = asyncHandler(async (request: NextRequest) => {
  // E-posta doğrulama özelliği devre dışı bırakıldı
  return withAuth(request, async (_req, _user) => {
    return successResponse(
      'E-posta doğrulama özelliği devre dışı bırakıldı',
      undefined,
      410,
      'VERIFY_EMAIL_DISABLED'
    );
  }, { skipEmailVerification: true });
});

