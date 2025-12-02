import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getAppConfig } from '@/data/index';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const appId = params.id;

    // Prefer loading from individual app module via helper
    const moduleApp = await getAppConfig(appId);
    if (moduleApp) {
      return NextResponse.json({ app: moduleApp });
    }

    // Fallback to apps.json
    const appsFilePath = path.join(process.cwd(), 'src', 'data', 'apps.json');
    const fileContents = await fs.readFile(appsFilePath, 'utf8');
    const data = JSON.parse(fileContents);
    const app = data.apps.find((a: any) => a.id === appId);
      
    if (app) {
      return NextResponse.json({ app });
    }

    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load app' }, { status: 500 });
  }
}
