import { NextResponse } from 'next/server';
import { getAppConfig } from '@/data/index';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const appId = params.id;

    const moduleApp = await getAppConfig(appId);
    if (moduleApp) {
      return NextResponse.json({ app: moduleApp });
    }

    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load app' }, { status: 500 });
  }
}
