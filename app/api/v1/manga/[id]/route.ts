import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mangaId = parseInt(id, 10);
  const manga = store.getManga(mangaId);

  if (!manga) {
    return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
  }

  return NextResponse.json(manga);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mangaId = parseInt(id, 10);

  try {
    const body = await request.json();
    const updated = store.updateManga(mangaId, body);
    if (!updated) {
      return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update manga' }, { status: 400 });
  }
}
