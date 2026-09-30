import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';
import { KEIYOUSHI_REPO_URL } from '@/lib/keiyoushi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const repoUrl = body.repoUrl || KEIYOUSHI_REPO_URL;
    const result = await store.syncKeiyoushi(repoUrl);
    return NextResponse.json({
      success: true,
      message: `Successfully synchronized and installed all sources from Keiyoushi repository!`,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to sync Keiyoushi repo: ${error.message}` },
      { status: 500 }
    );
  }
}
