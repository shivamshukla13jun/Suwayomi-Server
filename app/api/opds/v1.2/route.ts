import { NextResponse } from 'next/server';
import { store } from '@/lib/storage';

export async function GET() {
  const mangas = store.getMangas(true);

  const xmlEntries = mangas
    .map(
      (m) => `
    <entry>
      <title>${escapeXml(m.title)}</title>
      <id>urn:suwayomi:manga:${m.id}</id>
      <updated>${new Date(m.lastUpdate).toISOString()}</updated>
      <author><name>${escapeXml(m.author || 'Unknown')}</name></author>
      <summary>${escapeXml(m.description || '')}</summary>
      <link rel="http://opds-spec.org/image" href="${m.coverUrl}" type="image/jpeg" />
      <link rel="http://opds-spec.org/image/thumbnail" href="${m.coverUrl}" type="image/jpeg" />
      <link rel="subsection" href="/api/v1/manga/${m.id}/chapters" type="application/atom+xml;profile=opds-catalog" />
    </entry>`
    )
    .join('');

  const opdsXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:opds="http://opds-spec.org/2010/catalog">
  <id>urn:suwayomi:root</id>
  <title>Suwayomi Server OPDS Catalog</title>
  <updated>${new Date().toISOString()}</updated>
  <author>
    <name>Suwayomi</name>
    <uri>https://github.com/Suwayomi/Suwayomi-Server</uri>
  </author>
  <link rel="self" href="/api/opds/v1.2" type="application/atom+xml;profile=opds-catalog;kind=navigation" />
  <link rel="start" href="/api/opds/v1.2" type="application/atom+xml;profile=opds-catalog;kind=navigation" />
  ${xmlEntries}
</feed>`;

  return new NextResponse(opdsXml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
    },
  });
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
