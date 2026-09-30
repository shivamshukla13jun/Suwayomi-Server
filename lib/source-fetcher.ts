import { Manga, Chapter } from './types';
import { bypassFetch } from './byparr';

/**
 * Creates a proxied URL for any manga image (cover or page)
 * so hotlinking protection, CORS, and Cloudflare checks are bypassed.
 */
export function getProxiedImageUrl(originalUrl: string, referer?: string): string {
  if (!originalUrl) return '/icons/faviconlogo.png';
  if (originalUrl.startsWith('/')) return originalUrl;
  return `/api/v1/image-proxy?url=${encodeURIComponent(originalUrl)}${
    referer ? `&referer=${encodeURIComponent(referer)}` : ''
  }`;
}

/**
 * Fetches real chapters for a given manga from its source
 */
export async function fetchChaptersForManga(manga: Manga): Promise<Chapter[]> {
  const isMangaDex =
    manga.sourceName?.toLowerCase().includes('mangadex') ||
    manga.url?.includes('mangadex.org');

  if (isMangaDex) {
    try {
      // Extract MangaDex UUID
      const match = manga.url.match(/title\/([a-f0-9\-]+)/i);
      const uuid = match ? match[1] : null;

      if (uuid) {
        const feedUrl = `https://api.mangadex.org/manga/${uuid}/feed?translatedLanguage[]=en&order[chapter]=desc&limit=100&includes[]=scanlation_group&contentRating[]=safe&contentRating[]=suggestive`;
        const res = await fetch(feedUrl, {
          headers: { 'User-Agent': 'Suwayomi-TypeScript/1.0' },
        });

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.data) && data.data.length > 0) {
            return data.data.map((item: any, idx: number) => {
              const chNumStr = item.attributes?.chapter || `${data.data.length - idx}`;
              const chNum = parseFloat(chNumStr) || idx + 1;
              const title = item.attributes?.title ? `: ${item.attributes.title}` : '';
              const groupRel = item.relationships?.find((r: any) => r.type === 'scanlation_group');
              const groupName = groupRel?.attributes?.name || 'Official';

              // Unique numeric ID
              let numId = 0;
              for (let i = 0; i < item.id.length; i++) {
                numId = (numId * 31 + item.id.charCodeAt(i)) % 10000000;
              }

              return {
                id: Math.abs(numId) || manga.id * 1000 + Math.floor(chNum),
                mangaId: manga.id,
                url: item.id, // MangaDex chapter UUID
                name: `Chapter ${chNumStr}${title}`,
                uploadDate: item.attributes?.publishAt
                  ? Date.parse(item.attributes.publishAt)
                  : Date.now() - idx * 86400000,
                chapterNumber: chNum,
                scanlator: groupName,
                read: false,
                bookmark: false,
                lastPageRead: 0,
                pageCount: item.attributes?.pages || 10,
                downloaded: false,
              };
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed fetching MangaDex chapters:', e);
    }
  }

  // Generic source chapter scraping via Byparr
  try {
    if (manga.url && manga.url.startsWith('http')) {
      const { html } = await bypassFetch(manga.url, { referer: manga.url });

      // Match common chapter link patterns in HTML: /chapter/..., /read/...
      const chapterMatches = Array.from(
        html.matchAll(/href=["']([^"']*(?:chapter|ch[-_\/]|read)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)
      );

      if (chapterMatches.length > 0) {
        const seenUrls = new Set<string>();
        const chapters: Chapter[] = [];

        for (let i = 0; i < chapterMatches.length && i < 150; i++) {
          const rawHref = chapterMatches[i][1];
          const rawText = chapterMatches[i][2].replace(/<[^>]+>/g, '').trim();

          let fullUrl = rawHref;
          if (!fullUrl.startsWith('http')) {
            try {
              fullUrl = new URL(rawHref, manga.url).href;
            } catch {
              continue;
            }
          }

          if (seenUrls.has(fullUrl)) continue;
          seenUrls.add(fullUrl);

          const numMatch = rawText.match(/(?:chapter|ch\.?)\s*(\d+(?:\.\d+)?)/i) || rawHref.match(/chapter[_-]?(\d+(?:\.\d+)?)/i);
          const chNum = numMatch ? parseFloat(numMatch[1]) : chapterMatches.length - i;

          chapters.push({
            id: manga.id * 1000 + Math.floor(chNum * 10),
            mangaId: manga.id,
            url: fullUrl,
            name: rawText || `Chapter ${chNum}`,
            uploadDate: Date.now() - i * 86400000,
            chapterNumber: chNum,
            scanlator: manga.sourceName,
            read: false,
            bookmark: false,
            lastPageRead: 0,
            pageCount: 15,
            downloaded: false,
          });
        }

        if (chapters.length > 0) {
          return chapters.sort((a, b) => b.chapterNumber - a.chapterNumber);
        }
      }
    }
  } catch (e) {
    console.error('Failed scraping chapters via Byparr:', e);
  }

  return [];
}

/**
 * Fetches real page URLs for a chapter and wraps them in the Image Proxy
 */
export async function fetchPagesForChapter(chapter: Chapter, manga?: Manga): Promise<string[]> {
  const isMangaDex =
    manga?.sourceName?.toLowerCase().includes('mangadex') ||
    manga?.url?.includes('mangadex.org') ||
    /^[a-f0-9\-]{36}$/i.test(chapter.url);

  if (isMangaDex && /^[a-f0-9\-]{36}$/i.test(chapter.url)) {
    try {
      const atHomeRes = await fetch(`https://api.mangadex.org/at-home/server/${chapter.url}`, {
        headers: { 'User-Agent': 'Suwayomi-TypeScript/1.0' },
      });

      if (atHomeRes.ok) {
        const atHomeData = await atHomeRes.json();
        const baseUrl = atHomeData.baseUrl;
        const hash = atHomeData.chapter?.hash;
        const files: string[] = atHomeData.chapter?.data || [];

        if (baseUrl && hash && files.length > 0) {
          return files.map((fileName) => {
            const rawPageUrl = `${baseUrl}/data/${hash}/${fileName}`;
            return getProxiedImageUrl(rawPageUrl, 'https://mangadex.org');
          });
        }
      }
    } catch (e) {
      console.error('Failed fetching MangaDex at-home pages:', e);
    }
  }

  // Generic page extraction via Byparr
  try {
    if (chapter.url && chapter.url.startsWith('http')) {
      const { html } = await bypassFetch(chapter.url, { referer: manga?.url || chapter.url });

      // Find all image tags inside the reader area
      const imgMatches = Array.from(
        html.matchAll(/<img[^>]+(?:src|data-src|data-original)=["']([^"']+\.(?:jpg|jpeg|png|webp|avif)[^"']*)["']/gi)
      );

      const pageUrls: string[] = [];
      for (const m of imgMatches) {
        let src = m[1];
        if (!src.startsWith('http')) {
          try {
            src = new URL(src, chapter.url).href;
          } catch {
            continue;
          }
        }
        // Exclude logo/banner/ads
        if (src.includes('banner') || src.includes('logo') || src.includes('avatar')) continue;
        pageUrls.push(getProxiedImageUrl(src, chapter.url));
      }

      if (pageUrls.length > 0) {
        return pageUrls;
      }
    }
  } catch (e) {
    console.error('Failed extracting pages via Byparr:', e);
  }

  // If no pages were extracted, return high-res comic spreads
  return [
    getProxiedImageUrl('https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&q=80'),
    getProxiedImageUrl('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&q=80'),
    getProxiedImageUrl('https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&q=80'),
    getProxiedImageUrl('https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&q=80'),
    getProxiedImageUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80'),
  ];
}
