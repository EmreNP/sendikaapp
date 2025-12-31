import { openApiSpec } from '@/lib/openapi/spec'
import { NextResponse } from 'next/server'
import { asyncHandler } from '@/lib/utils/errors/errorHandler'
import { NextRequest } from 'next/server'

export const GET = asyncHandler(async (request: NextRequest) => {
  return NextResponse.json(openApiSpec)
})

