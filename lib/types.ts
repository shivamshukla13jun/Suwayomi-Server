export interface Manga {
  id: number;
  title: string;
  sourceId: string;
  sourceName: string;
  url: string;
  artist?: string;
  author?: string;
  description: string;
  genre: string[];
  status: 'ONGOING' | 'COMPLETED' | 'LICENSED' | 'PUBLISHING_FINISHED' | 'CANCELLED' | 'ON_HIATUS' | 'UNKNOWN';
  coverUrl: string;
  thumbnailUrl?: string;
  inLibrary: boolean;
  categoryIds: number[];
  totalChapters: number;
  unreadChapters: number;
  lastUpdate: number;
  initialized: boolean;
}

export interface Chapter {
  id: number;
  mangaId: number;
  url: string;
  name: string;
  uploadDate: number;
  chapterNumber: number;
  scanlator?: string;
  read: boolean;
  bookmark: boolean;
  lastPageRead: number;
  pageCount: number;
  downloaded: boolean;
  pages?: string[];
}

export interface Category {
  id: number;
  name: string;
  order: number;
  isDefault?: boolean;
}

export interface Source {
  id: string;
  name: string;
  lang: string;
  iconUrl: string;
  isInstalled: boolean;
  version: string;
  baseUrl: string;
  isPinned?: boolean;
}

export interface Extension {
  pkgName: string;
  name: string;
  versionName: string;
  versionCode: number;
  lang: string;
  iconUrl: string;
  installed: boolean;
  repo: string;
  sources: Source[];
}

export interface TrackerItem {
  id: number;
  mangaId: number;
  trackerId: string; // 'anilist' | 'myanimelist' | 'mangaupdates' | 'kitsu' | 'bangumi' | 'shikimori'
  remoteId: string;
  title: string;
  status: 'READING' | 'COMPLETED' | 'PLAN_TO_READ' | 'DROPPED' | 'ON_HOLD';
  score: number;
  lastChapterRead: number;
  totalChapters: number;
}

export interface DownloadTask {
  id: string;
  chapterId: number;
  mangaId: number;
  mangaTitle: string;
  chapterName: string;
  coverUrl: string;
  status: 'queued' | 'downloading' | 'downloaded' | 'error' | 'paused';
  progress: number;
  pagesDownloaded: number;
  totalPages: number;
}

export interface HistoryRecord {
  id: string;
  mangaId: number;
  mangaTitle: string;
  chapterId: number;
  chapterName: string;
  coverUrl: string;
  readAt: number;
  lastPageRead: number;
  pageCount: number;
}

export interface UpdateRecord {
  id: string;
  mangaId: number;
  mangaTitle: string;
  chapterId: number;
  chapterName: string;
  coverUrl: string;
  updatedAt: number;
}

export interface ServerSettings {
  serverPort: number;
  serverHost: string;
  theme: 'dark' | 'oled' | 'slate' | 'light';
  readerMode: 'webtoon' | 'single' | 'double' | 'rtl';
  readerDirection: 'rtl' | 'ltr' | 'vertical';
  readerBackground: 'black' | 'dark' | 'sepia' | 'white';
  readerFit: 'width' | 'height' | 'contain' | 'original';
  autoDownload: boolean;
  downloadLocation: string;
  opdsEnabled: boolean;
  corsEnabled: boolean;
  gridSize: 'compact' | 'comfortable' | 'spacious' | 'list';
  autoUpdateInterval: number; // in hours
  byparrEnabled?: boolean;
  byparrUrl?: string;
  byparrTimeout?: number;
}

export interface BackupData {
  version: number;
  backupDate: number;
  mangas: Manga[];
  chapters: Chapter[];
  categories: Category[];
  trackers: TrackerItem[];
  history: HistoryRecord[];
  settings: ServerSettings;
}
