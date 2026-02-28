import { NextResponse } from 'next/server';
import { termsText } from '@/constants/legalTexts';

export async function GET() {
  return NextResponse.json(termsText);
}
