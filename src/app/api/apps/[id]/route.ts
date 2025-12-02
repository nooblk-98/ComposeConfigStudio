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

    // Load apps.json as a secondary source (for optional env, metadata)
    let jsonApp: any = null;
    try {
      const appsFilePath = path.join(process.cwd(), 'src', 'data', 'apps.json');
      const fileContents = await fs.readFile(appsFilePath, 'utf8');
      const data = JSON.parse(fileContents);
      jsonApp = data.apps.find((a: any) => a.id === appId) || null;
    } catch (error) {
      // ignore fallback failures
    }

    // Prefer loading from individual app module via helper
    const moduleApp = await getAppConfig(appId);
    if (moduleApp) {
      const mergedApp = {
        ...jsonApp,
        ...moduleApp,
        optionalEnv: moduleApp.optionalEnv ?? jsonApp?.optionalEnv ?? []
      };
      return NextResponse.json({ app: mergedApp });
    }

    // Fallback to apps.json
    if (jsonApp) {
      return NextResponse.json({ app: jsonApp });
    }

    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load app' }, { status: 500 });
  }
}
