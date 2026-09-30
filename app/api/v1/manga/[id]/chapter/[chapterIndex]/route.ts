import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';
import { fetchPagesForChapter } from '@/lib/source-fetcher';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterIndex: string }> }
) {
  const { id, chapterIndex } = await params;
  const mangaId = parseInt(id, 10);
  const chNum = parseFloat(chapterIndex);

  const manga = store.getManga(mangaId);
  const chapters = store.getChapters(mangaId);
  const chapter = chapters.find(
    (c) => c.chapterNumber === chNum || c.id === parseInt(chapterIndex, 10)
  );

  if (!chapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
  }

  // If pages are not yet loaded, fetch them now
  if (!chapter.pages || chapter.pages.length === 0) {
    const pages = await fetchPagesForChapter(chapter, manga);
    if (pages.length > 0) {
      chapter.pages = pages;
      chapter.pageCount = pages.length;
      store.updateChapter(chapter.id, { pages, pageCount: pages.length });
    }
  }

  return NextResponse.json(chapter);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterIndex: string }> }
) {
  const { id, chapterIndex } = await params;
  const mangaId = parseInt(id, 10);
  const chNum = parseFloat(chapterIndex);

  const chapters = store.getChapters(mangaId);
  const chapter = chapters.find(
    (c) => c.chapterNumber === chNum || c.id === parseInt(chapterIndex, 10)
  );

  if (!chapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updated = store.updateChapter(chapter.id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Invalid chapter update payload' }, { status: 400 });
  }
}
