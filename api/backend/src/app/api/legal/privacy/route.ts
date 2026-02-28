import { NextResponse } from 'next/server';
import { privacyText } from '@/constants/legalTexts';

export async function GET() {
  return NextResponse.json(privacyText);
}
