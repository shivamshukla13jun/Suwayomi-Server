import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';

export async function GET() {
  const downloads = store.getDownloads();
  return NextResponse.json(downloads);
}

export async function POST(request: NextRequest) {
  try {
    const { chapterId } = await request.json();
    if (!chapterId) {
      return NextResponse.json({ error: 'chapterId required' }, { status: 400 });
    }
    const task = store.queueDownload(chapterId);
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    store.cancelDownload(id);
  } else {
    store.clearDownloads();
  }
  return NextResponse.json({ success: true });
}
