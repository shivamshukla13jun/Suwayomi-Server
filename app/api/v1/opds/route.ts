import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';
import { generateRootOpdsFeed, generateMangaChaptersOpdsFeed } from '@/lib/opds';

export async function GET(req: NextRequest) {
  const { searchParams, protocol, host } = new URL(req.url);
  const baseUrl = `${protocol}//${host}`;
  const mangaId = searchParams.get('manga');

  if (mangaId) {
    const id = parseInt(mangaId, 10);
    const manga = store.getManga(id);
    if (!manga) {
      return new NextResponse('Manga not found', { status: 404 });
    }
    const chapters = store.getChapters(id);
    const xml = generateMangaChaptersOpdsFeed(manga, chapters, baseUrl);
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/atom+xml;profile=opds-catalog;kind=acquisition;charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  }

  const mangas = store.getMangas(true);
  const categories = store.getCategories();
  const xml = generateRootOpdsFeed(mangas, categories, baseUrl);
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/atom+xml;profile=opds-catalog;kind=navigation;charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
