import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';
import { fetchChaptersForManga } from '@/lib/source-fetcher';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mangaId = parseInt(id, 10);

  let chapters = store.getChapters(mangaId);

  // If no chapters stored yet, fetch them from the source
  if (!chapters || chapters.length === 0) {
    const manga = store.getManga(mangaId);
    if (manga) {
      chapters = await fetchChaptersForManga(manga);
      if (chapters.length > 0) {
        store.setChapters(mangaId, chapters);
      }
    }
  }

  return NextResponse.json(chapters);
}
