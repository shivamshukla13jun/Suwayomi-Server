import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';

export async function GET() {
  const updates = store.getUpdates();
  return NextResponse.json(updates);
}

export async function POST() {
  const newUpdates = store.checkForUpdates();
  return NextResponse.json({ success: true, count: newUpdates.length, updates: newUpdates });
}
