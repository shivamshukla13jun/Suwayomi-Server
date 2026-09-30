import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';
import { searchMangaDex } from '@/lib/keiyoushi';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get('sourceId');
  const lang = searchParams.get('lang');
  const search = searchParams.get('search')?.toLowerCase();
  const query = searchParams.get('query')?.toLowerCase();
  const page = parseInt(searchParams.get('page') || '1', 10);

  let sources = store.getSources();

  // If no sourceId requested, return the list of sources
  if (!sourceId) {
    if (lang && lang !== 'all') {
      sources = sources.filter((s) => s.lang === lang);
    }
    if (search) {
      sources = sources.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.lang.toLowerCase().includes(search)
      );
    }
    return NextResponse.json(sources);
  }

  // Find source
  const source = sources.find((s) => s.id === sourceId);

  // Search or fetch real manga for this source
  const searchTerm = query || 'action';
  const realManga = await searchMangaDex(searchTerm, 24);

  // Store in cache so users can add them to library
  for (const m of realManga) {
    if (source) {
      m.sourceId = source.id;
      m.sourceName = source.name;
    }
    store.addManga(m);
  }

  return NextResponse.json({
    source: source || {
      id: sourceId,
      name: 'Source',
      lang: 'en',
      iconUrl: '/icons/faviconlogo.png',
      isInstalled: true,
      version: '1.0.0',
      baseUrl: '',
    },
    mangas: realManga,
  });
}
