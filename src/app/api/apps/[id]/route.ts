import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const appId = params.id;
    const appFilePath = path.join(process.cwd(), 'src', 'data', appId, 'app.js');
    
    // Try to read the individual app file
    try {
      const appContent = await fs.readFile(appFilePath, 'utf8');
      
      // Parse the JS module (simple eval for now, can be improved)
      const module = { exports: {} };
      const func = new Function('exports', 'module', appContent);
      func(module.exports, module);
      
      return NextResponse.json({ app: module.exports.default || module.exports });
    } catch (error) {
      // Fallback to apps.json
      const appsFilePath = path.join(process.cwd(), 'src', 'data', 'apps.json');
      const fileContents = await fs.readFile(appsFilePath, 'utf8');
      const data = JSON.parse(fileContents);
      const app = data.apps.find((a: any) => a.id === appId);
      
      if (app) {
        return NextResponse.json({ app });
      }
    }
    
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load app' }, { status: 500 });
  }
}
