import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';

export async function GET() {
  const extensions = store.getExtensions();
  return NextResponse.json(extensions);
}

export async function POST(request: NextRequest) {
  try {
    const { pkgName, action } = await request.json();
    if (!pkgName) {
      return NextResponse.json({ error: 'pkgName is required' }, { status: 400 });
    }
    const success = store.toggleExtension(pkgName);
    return NextResponse.json({ success, action });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
