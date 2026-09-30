import {
  Manga,
  Chapter,
  Category,
  Source,
  Extension,
  ServerSettings,
  TrackerItem,
  DownloadTask,
  HistoryRecord,
  UpdateRecord,
  BackupData,
} from './types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
} from './constants';
import { parseKeiyoushiProtobuf, KEIYOUSHI_REPO_URL, getKeiyoushiData } from './keiyoushi';
import fs from 'fs';
import path from 'path';

class DataStore {
  private mangas: Manga[] = [];
  private chapters: Map<number, Chapter[]> = new Map();
  private categories: Category[] = [...DEFAULT_CATEGORIES];
  private sources: Source[] = [];
  private extensions: Extension[] = [];
  private trackers: TrackerItem[] = [];
  private downloads: DownloadTask[] = [];
  private history: HistoryRecord[] = [];
  private updates: UpdateRecord[] = [];
  private settings: ServerSettings = { ...DEFAULT_SETTINGS };

  constructor() {
    const keiyoushi = getKeiyoushiData();
    this.sources = keiyoushi.sources || [];
    this.extensions = keiyoushi.extensions || [];
  }

  private loadLocalKeiyoushi() {
    try {
      const dataPath = path.join(process.cwd(), 'data', 'keiyoushi.json');
      if (fs.existsSync(dataPath)) {
        const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        if (raw.extensions && raw.sources) {
          this.extensions = raw.extensions;
          this.sources = raw.sources;
        }
      }
    } catch (e) {
      console.error('Failed to load local keiyoushi:', e);
    }
  }

  public async syncKeiyoushi(repoUrl = KEIYOUSHI_REPO_URL): Promise<{ extensionsCount: number; sourcesCount: number }> {
    try {
      const res = await fetch(repoUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = parseKeiyoushiProtobuf(buffer);

      this.extensions = parsed.extensions;
      this.sources = parsed.sources;

      // Save to data/keiyoushi.json
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(path.join(dataDir, 'keiyoushi.json'), JSON.stringify(parsed));

      return {
        extensionsCount: this.extensions.length,
        sourcesCount: this.sources.length,
      };
    } catch (e) {
      console.error('Sync error:', e);
      throw e;
    }
  }

  public getMangas(libraryOnly = false): Manga[] {
    if (libraryOnly) {
      return this.mangas.filter((m) => m.inLibrary);
    }
    return [...this.mangas];
  }

  public getManga(id: number): Manga | undefined {
    return this.mangas.find((m) => m.id === id);
  }

  public addManga(manga: Manga): Manga {
    const existing = this.getManga(manga.id);
    if (existing) {
      Object.assign(existing, manga);
      return existing;
    }
    this.mangas.push(manga);
    return manga;
  }

  public updateManga(id: number, partial: Partial<Manga>): Manga | undefined {
    const idx = this.mangas.findIndex((m) => m.id === id);
    if (idx === -1) return undefined;
    this.mangas[idx] = { ...this.mangas[idx], ...partial };
    return this.mangas[idx];
  }

  public toggleInLibrary(id: number): Manga | undefined {
    const manga = this.getManga(id);
    if (!manga) return undefined;
    manga.inLibrary = !manga.inLibrary;
    if (manga.inLibrary && manga.categoryIds.length === 0) {
      manga.categoryIds = [1]; // default 'Reading'
    }
    return manga;
  }

  public setCategories(mangaId: number, categoryIds: number[]): Manga | undefined {
    const manga = this.getManga(mangaId);
    if (!manga) return undefined;
    manga.categoryIds = categoryIds;
    return manga;
  }

  public getChapters(mangaId: number): Chapter[] {
    return this.chapters.get(mangaId) || [];
  }

  public setChapters(mangaId: number, chapters: Chapter[]): void {
    this.chapters.set(mangaId, chapters);
    const manga = this.getManga(mangaId);
    if (manga) {
      manga.totalChapters = chapters.length;
      manga.unreadChapters = chapters.filter((c) => !c.read).length;
    }
  }

  public getChapter(chapterId: number): Chapter | undefined {
    for (const [_, chapters] of this.chapters.entries()) {
      const found = chapters.find((c) => c.id === chapterId);
      if (found) return found;
    }
    return undefined;
  }

  public updateChapter(chapterId: number, partial: Partial<Chapter>): Chapter | undefined {
    for (const [mangaId, chapters] of this.chapters.entries()) {
      const idx = chapters.findIndex((c) => c.id === chapterId);
      if (idx !== -1) {
        chapters[idx] = { ...chapters[idx], ...partial };
        const manga = this.getManga(mangaId);
        if (manga) {
          manga.unreadChapters = chapters.filter((c) => !c.read).length;
        }
        return chapters[idx];
      }
    }
    return undefined;
  }

  public markPreviousAsRead(mangaId: number, chapterNumber: number): void {
    const chapters = this.getChapters(mangaId);
    for (const ch of chapters) {
      if (ch.chapterNumber <= chapterNumber) {
        ch.read = true;
      }
    }
    const manga = this.getManga(mangaId);
    if (manga) {
      manga.unreadChapters = chapters.filter((c) => !c.read).length;
    }
  }

  public getCategories(): Category[] {
    return [...this.categories].sort((a, b) => a.order - b.order);
  }

  public addCategory(name: string): Category {
    const maxId = this.categories.reduce((acc, c) => Math.max(acc, c.id), 0);
    const newCat: Category = {
      id: maxId + 1,
      name,
      order: this.categories.length,
    };
    this.categories.push(newCat);
    return newCat;
  }

  public deleteCategory(id: number): boolean {
    const prevLen = this.categories.length;
    this.categories = this.categories.filter((c) => c.id !== id);
    for (const m of this.mangas) {
      m.categoryIds = m.categoryIds.filter((cid) => cid !== id);
    }
    return this.categories.length < prevLen;
  }

  public getSources(): Source[] {
    return this.sources;
  }

  public getExtensions(): Extension[] {
    return this.extensions;
  }

  public toggleExtension(pkgName: string): boolean {
    const ext = this.extensions.find((e) => e.pkgName === pkgName);
    if (!ext) return false;
    ext.installed = !ext.installed;
    for (const s of ext.sources) {
      s.isInstalled = ext.installed;
      const srcInGlobal = this.sources.find((g) => g.id === s.id);
      if (srcInGlobal) srcInGlobal.isInstalled = ext.installed;
    }
    return true;
  }

  public getHistory(): HistoryRecord[] {
    return [...this.history].sort((a, b) => b.readAt - a.readAt);
  }

  public addHistory(record: Omit<HistoryRecord, 'id'>): HistoryRecord {
    const newRecord: HistoryRecord = {
      ...record,
      id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.history = this.history.filter((h) => h.mangaId !== record.mangaId);
    this.history.unshift(newRecord);
    return newRecord;
  }

  public clearHistory(): void {
    this.history = [];
  }

  public getDownloads(): DownloadTask[] {
    return [...this.downloads];
  }

  public queueDownload(chapterId: number): DownloadTask | undefined {
    const chapter = this.getChapter(chapterId);
    if (!chapter) return undefined;
    const manga = this.getManga(chapter.mangaId);
    if (!manga) return undefined;

    const existing = this.downloads.find((d) => d.chapterId === chapterId);
    if (existing) return existing;

    const newTask: DownloadTask = {
      id: `dl-${Date.now()}`,
      chapterId,
      mangaId: manga.id,
      mangaTitle: manga.title,
      chapterName: chapter.name,
      coverUrl: manga.coverUrl,
      status: 'queued',
      progress: 0,
      pagesDownloaded: 0,
      totalPages: chapter.pageCount || 1,
    };
    this.downloads.push(newTask);

    setTimeout(() => {
      newTask.status = 'downloading';
      newTask.progress = 50;
      newTask.pagesDownloaded = Math.floor(newTask.totalPages / 2);
      setTimeout(() => {
        newTask.status = 'downloaded';
        newTask.progress = 100;
        newTask.pagesDownloaded = newTask.totalPages;
        chapter.downloaded = true;
      }, 1500);
    }, 800);

    return newTask;
  }

  public clearDownloads(): void {
    this.downloads = this.downloads.filter((d) => d.status === 'downloading' || d.status === 'queued');
  }

  public cancelDownload(id: string): void {
    this.downloads = this.downloads.filter((d) => d.id !== id);
  }

  public getUpdates(): UpdateRecord[] {
    return [...this.updates].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public checkForUpdates(): UpdateRecord[] {
    return this.getUpdates();
  }

  public getSettings(): ServerSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<ServerSettings>): ServerSettings {
    this.settings = { ...this.settings, ...partial };
    return { ...this.settings };
  }

  public getTrackers(mangaId: number): TrackerItem[] {
    return this.trackers.filter((t) => t.mangaId === mangaId);
  }

  public updateTracker(tracker: TrackerItem): TrackerItem {
    const idx = this.trackers.findIndex((t) => t.mangaId === tracker.mangaId && t.trackerId === tracker.trackerId);
    if (idx !== -1) {
      this.trackers[idx] = tracker;
    } else {
      tracker.id = this.trackers.length + 1;
      this.trackers.push(tracker);
    }
    return tracker;
  }

  public exportBackup(): BackupData {
    const allChapters: Chapter[] = [];
    for (const [_, chs] of this.chapters.entries()) {
      allChapters.push(...chs);
    }
    return {
      version: 2,
      backupDate: Date.now(),
      mangas: this.mangas,
      chapters: allChapters,
      categories: this.categories,
      trackers: this.trackers,
      history: this.history,
      settings: this.settings,
    };
  }

  public importBackup(data: BackupData): boolean {
    if (!data || !data.mangas) return false;
    this.mangas = data.mangas;
    this.categories = data.categories || this.categories;
    if (data.chapters) {
      this.chapters.clear();
      for (const ch of data.chapters) {
        if (!this.chapters.has(ch.mangaId)) {
          this.chapters.set(ch.mangaId, []);
        }
        this.chapters.get(ch.mangaId)!.push(ch);
      }
    }
    if (data.settings) this.settings = data.settings;
    if (data.history) this.history = data.history;
    if (data.trackers) this.trackers = data.trackers;
    return true;
  }
}

// Global singleton instance
const globalForStore = globalThis as unknown as { store: DataStore };
export const store = globalForStore.store || new DataStore();
if (process.env.NODE_ENV !== 'production') globalForStore.store = store;
