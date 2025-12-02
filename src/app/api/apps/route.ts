import { NextResponse } from 'next/server';
import appsData from '@/data/apps.json';

export async function GET() {
  return NextResponse.json(appsData);
}
