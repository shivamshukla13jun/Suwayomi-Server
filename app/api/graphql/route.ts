import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    const queryStr = (query || '').toLowerCase();

    // Check what the query is asking for
    const data: Record<string, any> = {};

    if (queryStr.includes('manga') || queryStr.includes('library')) {
      data.mangas = {
        nodes: store.getMangas(),
        totalCount: store.getMangas().length,
      };
    }

    if (queryStr.includes('category') || queryStr.includes('categories')) {
      data.categories = {
        nodes: store.getCategories(),
        totalCount: store.getCategories().length,
      };
    }

    if (queryStr.includes('source') || queryStr.includes('sources')) {
      data.sources = {
        nodes: store.getSources(),
        totalCount: store.getSources().length,
      };
    }

    if (queryStr.includes('download') || queryStr.includes('downloads')) {
      data.downloads = {
        nodes: store.getDownloads(),
        totalCount: store.getDownloads().length,
      };
    }

    if (queryStr.includes('settings')) {
      data.settings = store.getSettings();
    }

    if (queryStr.includes('update') || queryStr.includes('updates')) {
      data.updates = {
        nodes: store.getUpdates(),
        totalCount: store.getUpdates().length,
      };
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ errors: [{ message: 'GraphQL query execution error' }] }, { status: 400 });
  }
}
