import { NextResponse } from 'next/server';
import { appsList } from '@/data/index';

export async function GET() {
  return NextResponse.json({ apps: appsList });
}
