import { NextResponse } from 'next/server';
import { appsList, getAppConfig } from '@/data/index';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const mergedApps = await Promise.all(
    appsList.map(async (app) => {
      const moduleApp = await getAppConfig(app.id);
      if (!moduleApp) return app;

      return {
        ...app,
        // Prefer dynamic values from the module
        logo: moduleApp.logo || app.logo,
        name: moduleApp.name || app.name,
        description: moduleApp.description || app.description,
        category: moduleApp.category || app.category,
        version: moduleApp.version || app.version,
        defaultPort: moduleApp.defaultPort ?? app.defaultPort,
      };
    })
  );

  return NextResponse.json({ apps: mergedApps });
}
