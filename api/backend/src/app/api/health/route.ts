import { successResponse } from '@/lib/utils/response';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
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
}

