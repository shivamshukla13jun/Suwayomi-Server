import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const libraryOnly = searchParams.get('library') === 'true';
  const categoryId = searchParams.get('categoryId');
  const search = searchParams.get('search')?.toLowerCase();

  let mangas = store.getMangas(libraryOnly);

  if (categoryId) {
    const catIdNum = parseInt(categoryId, 10);
    mangas = mangas.filter((m) => m.categoryIds.includes(catIdNum));
  }

  if (search) {
    mangas = mangas.filter(
      (m) =>
        m.title.toLowerCase().includes(search) ||
        m.author?.toLowerCase().includes(search) ||
        m.genre.some((g) => g.toLowerCase().includes(search))
    );
  }

  return NextResponse.json(mangas);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, inLibrary, categoryIds } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing manga id' }, { status: 400 });
    }
    const updated = store.updateManga(id, {
      inLibrary: inLibrary !== undefined ? inLibrary : true,
      categoryIds: categoryIds || [1],
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
