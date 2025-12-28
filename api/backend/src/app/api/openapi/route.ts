import { openApiSpec } from '@/lib/openapi/spec'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(openApiSpec)
}

