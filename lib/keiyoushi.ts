import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { Extension, Source, Manga, Chapter } from './types';

export const KEIYOUSHI_REPO_URL = 'https://github.com/keiyoushi/extensions/raw/repo/index.pb';

// Protobuf decoder helpers
function parseVarint(buf: Buffer, pos: number): [number, number] {
  let res = 0;
  let shift = 0;
  while (true) {
    const b = buf[pos];
    pos += 1;
    res |= (b & 0x7f) << shift;
    if (!(b & 0x80)) break;
    shift += 7;
  }
  return [res, pos];
}

interface ProtoFields {
  [key: number]: any[];
}

function parseProto(buf: Buffer): ProtoFields {
  let pos = 0;
  const fields: ProtoFields = {};
  while (pos < buf.length) {
    try {
      const [tag, nextPos] = parseVarint(buf, pos);
      pos = nextPos;
      const fieldNum = tag >> 3;
      const wireType = tag & 7;

      let val: any;
      if (wireType === 0) {
        const [v, p] = parseVarint(buf, pos);
        val = v;
        pos = p;
      } else if (wireType === 2) {
        const [length, p] = parseVarint(buf, pos);
        val = buf.subarray(p, p + length);
        pos = p + length;
      } else if (wireType === 1) {
        val = buf.subarray(pos, pos + 8);
        pos += 8;
      } else if (wireType === 5) {
        val = buf.subarray(pos, pos + 4);
        pos += 4;
      } else {
        break;
      }

      if (!fields[fieldNum]) fields[fieldNum] = [];
      fields[fieldNum].push(val);
    } catch {
      break;
    }
  }
  return fields;
}

export function parseKeiyoushiProtobuf(compressedBuffer: Buffer): {
  extensions: Extension[];
  sources: Source[];
} {
  const decompressed = zlib.gunzipSync(compressedBuffer);
  const root = parseProto(decompressed);

  if (!root[101] || !root[101][0]) {
    throw new Error('Invalid Keiyoushi index.pb format');
  }

  const repoExtsWrapper = parseProto(root[101][0]);
  const repoExtensions = repoExtsWrapper[1] || [];

  const extensions: Extension[] = [];
  const sources: Source[] = [];

  for (const extBuf of repoExtensions) {
    if (!Buffer.isBuffer(extBuf)) continue;
    const e = parseProto(extBuf);

    const name = e[1]?.[0]?.toString('utf-8') || '';
    const pkgName = e[2]?.[0]?.toString('utf-8') || '';
    const versionName = e[6]?.[0]?.toString('utf-8') || '';
    const versionCode = typeof e[5]?.[0] === 'number' ? e[5][0] : 1;

    let iconUrl = '';
    if (e[3]?.[0] && Buffer.isBuffer(e[3][0])) {
      const assets = parseProto(e[3][0]);
      iconUrl = assets[2]?.[0]?.toString('utf-8') || '';
    }

    const extSources: Source[] = [];
    const sourceList = e[8] || [];

    for (const sBuf of sourceList) {
      if (!Buffer.isBuffer(sBuf)) continue;
      const s = parseProto(sBuf);
      const sId = String(s[1]?.[0] || '');
      const sName = s[2]?.[0]?.toString('utf-8') || name;
      const sLang = s[3]?.[0]?.toString('utf-8') || 'all';
      const sBaseUrl = s[4]?.[0]?.toString('utf-8') || '';

      const srcObj: Source = {
        id: sId,
        name: sName,
        lang: sLang,
        baseUrl: sBaseUrl,
        iconUrl: iconUrl || '/icons/faviconlogo.png',
        isInstalled: true,
        version: versionName,
        isPinned: sLang === 'en' || sLang === 'all',
      };

      extSources.push(srcObj);
      sources.push(srcObj);
    }

    const lang = extSources[0]?.lang || 'all';
    extensions.push({
      pkgName,
      name,
      versionName,
      versionCode,
      lang,
      iconUrl: iconUrl || '/icons/faviconlogo.png',
      installed: true,
      repo: 'Keiyoushi Extensions',
      sources: extSources,
    });
  }

  return { extensions, sources };
}

// Load cached data or fetch live
export function getKeiyoushiData(): { extensions: Extension[]; sources: Source[] } {
  const dataPath = path.join(process.cwd(), 'data', 'keiyoushi.json');
  if (fs.existsSync(dataPath)) {
    try {
      const raw = fs.readFileSync(dataPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.extensions) && parsed.extensions.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed reading data/keiyoushi.json:', e);
    }
  }

  return { extensions: [], sources: [] };
}

// Search real manga from MangaDex API
export async function searchMangaDex(query: string, limit = 24): Promise<Manga[]> {
  try {
    const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(
      query
    )}&limit=${limit}&includes[]=cover_art&includes[]=author&contentRating[]=safe&contentRating[]=suggestive`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Suwayomi-TypeScript/1.0' } });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !Array.isArray(data.data)) return [];

    return data.data.map((item: any) => {
      const titleObj = item.attributes?.title || {};
      const title =
        titleObj.en ||
        titleObj['ja-ro'] ||
        Object.values(titleObj)[0] ||
        'Untitled Manga';

      const descObj = item.attributes?.description || {};
      const description = descObj.en || Object.values(descObj)[0] || '';

      const coverRel = item.relationships?.find((r: any) => r.type === 'cover_art');
      const fileName = coverRel?.attributes?.fileName;
      const coverUrl = fileName
        ? `https://uploads.mangadex.org/covers/${item.id}/${fileName}.512.jpg`
        : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';

      const authorRel = item.relationships?.find((r: any) => r.type === 'author');
      const author = authorRel?.attributes?.name || 'Unknown';

      const genres = (item.attributes?.tags || [])
        .map((t: any) => t.attributes?.name?.en)
        .filter(Boolean)
        .slice(0, 5);

      // Generate numeric ID from UUID hash
      let numericId = 0;
      for (let i = 0; i < item.id.length; i++) {
        numericId = (numericId * 31 + item.id.charCodeAt(i)) % 10000000;
      }

      return {
        id: Math.abs(numericId) || Math.floor(Math.random() * 9000000) + 1000000,
        title,
        sourceId: '2499283573021220255', // MangaDex source ID from Keiyoushi
        sourceName: 'MangaDex',
        url: `https://mangadex.org/title/${item.id}`,
        author,
        artist: author,
        description,
        genre: genres,
        status: (item.attributes?.status || 'ongoing').toUpperCase(),
        coverUrl,
        inLibrary: false,
        categoryIds: [],
        totalChapters: 0,
        unreadChapters: 0,
        lastUpdate: Date.now(),
        initialized: true,
      };
    });
  } catch (e) {
    console.error('Error querying MangaDex:', e);
    return [];
  }
}
