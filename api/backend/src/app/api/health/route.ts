import { successResponse } from '@/lib/utils/response';
import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';

export const GET = asyncHandler(async (request: NextRequest) => {
  return successResponse(
    'API çalışıyor',
    {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'SendikaApp Backend'
    },
    200,
    'HEALTH_CHECK_SUCCESS'
  );
});

