import { Manga, Chapter, Category } from './types';

export function generateRootOpdsFeed(
  mangaList: Manga[],
  categories: Category[],
  baseUrl: string
): string {
  const updatedDate = new Date().toISOString();
  
  const entries = categories.map((cat) => {
    const count = mangaList.filter((m) => m.inLibrary && m.categoryIds.includes(cat.id)).length;
    return `
    <entry>
      <title>${escapeXml(cat.name)}</title>
      <id>urn:suwayomi:category:${cat.id}</id>
      <updated>${updatedDate}</updated>
      <content type="text">${count} manga series in ${escapeXml(cat.name)}</content>
      <link rel="subsection" href="${baseUrl}/api/v1/opds?category=${cat.id}" type="application/atom+xml;profile=opds-catalog;kind=navigation" />
    </entry>`;
  }).join('\n');

  const allMangaEntries = mangaList
    .filter((m) => m.inLibrary)
    .map((m) => `
    <entry>
      <title>${escapeXml(m.title)}</title>
      <id>urn:suwayomi:manga:${m.id}</id>
      <updated>${new Date(m.lastUpdate).toISOString()}</updated>
      <author><name>${escapeXml(m.author || '')}</name></author>
      <summary>${escapeXml(m.description || '')}</summary>
      <link rel="http://opds-spec.org/image" href="${m.coverUrl}" type="image/jpeg" />
      <link rel="http://opds-spec.org/image/thumbnail" href="${m.coverUrl}" type="image/jpeg" />
      <link rel="subsection" href="${baseUrl}/api/v1/opds?manga=${m.id}" type="application/atom+xml;profile=opds-catalog;kind=acquisition" />
    </entry>`).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:opds="http://opds-spec.org/2010/catalog">
  <id>urn:suwayomi:root</id>
  <title>Suwayomi Manga Server Catalog</title>
  <updated>${updatedDate}</updated>
  <author>
    <name>Suwayomi Server</name>
    <uri>${baseUrl}</uri>
  </author>
  <link rel="self" href="${baseUrl}/api/v1/opds" type="application/atom+xml;profile=opds-catalog;kind=navigation" />
  <link rel="start" href="${baseUrl}/api/v1/opds" type="application/atom+xml;profile=opds-catalog;kind=navigation" />
  ${entries}
  ${allMangaEntries}
</feed>`;
}

export function generateMangaChaptersOpdsFeed(
  manga: Manga,
  chapters: Chapter[],
  baseUrl: string
): string {
  const updatedDate = new Date(manga.lastUpdate).toISOString();

  const chapterEntries = chapters.map((ch) => `
    <entry>
      <title>${escapeXml(ch.name)}</title>
      <id>urn:suwayomi:chapter:${ch.id}</id>
      <updated>${new Date(ch.uploadDate).toISOString()}</updated>
      <author><name>${escapeXml(manga.author || '')}</name></author>
      <summary>${escapeXml(ch.scanlator || manga.sourceName)} - ${ch.pageCount} pages</summary>
      <link rel="http://opds-spec.org/image" href="${manga.coverUrl}" type="image/jpeg" />
      <link rel="http://opds-spec.org/acquisition" href="${baseUrl}/api/v1/chapter?id=${ch.id}&amp;download=cbz" type="application/x-cbz" />
    </entry>`).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:opds="http://opds-spec.org/2010/catalog">
  <id>urn:suwayomi:manga:${manga.id}</id>
  <title>${escapeXml(manga.title)} - Chapters</title>
  <updated>${updatedDate}</updated>
  <author>
    <name>${escapeXml(manga.author || '')}</name>
  </author>
  <link rel="self" href="${baseUrl}/api/v1/opds?manga=${manga.id}" type="application/atom+xml;profile=opds-catalog;kind=acquisition" />
  <link rel="up" href="${baseUrl}/api/v1/opds" type="application/atom+xml;profile=opds-catalog;kind=navigation" />
  ${chapterEntries}
</feed>`;
}

function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
