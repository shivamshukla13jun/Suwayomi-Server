import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';

export async function GET() {
  const backup = store.exportBackup();
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="suwayomi_backup_${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const success = store.importBackup(body);
    if (!success) {
      return NextResponse.json({ error: 'Failed to restore backup format' }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: 'Backup restored successfully' });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON backup' }, { status: 400 });
  }
}
