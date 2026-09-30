import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';

export async function GET() {
  const categories = store.getCategories();
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const newCat = store.addCategory(name.trim());
    return NextResponse.json(newCat, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idStr = searchParams.get('id');
  if (!idStr) {
    return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
  }
  const id = parseInt(idStr, 10);
  const deleted = store.deleteCategory(id);
  return NextResponse.json({ success: deleted });
}
