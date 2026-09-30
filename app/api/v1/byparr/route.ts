import { NextRequest, NextResponse } from 'next/server';
import { testByparrConnection } from '@/lib/byparr';
import { store } from '@/lib/storage';

export async function GET() {
  const settings = store.getSettings();
  const byparrUrl = (settings as any).byparrUrl || 'http://localhost:8191/v1';
  const result = await testByparrConnection(byparrUrl);
  return NextResponse.json({
    enabled: (settings as any).byparrEnabled ?? true,
    url: byparrUrl,
    connected: result.ok,
    message: result.message,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    const result = await testByparrConnection(url || 'http://localhost:8191/v1');
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
  }
}
