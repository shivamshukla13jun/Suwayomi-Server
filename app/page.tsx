'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { LibraryView } from '@/components/LibraryView';
import { MangaDetailModal } from '@/components/MangaDetailModal';
import { ReaderView } from '@/components/ReaderView';
import { BrowseView } from '@/components/BrowseView';
import { UpdatesView } from '@/components/UpdatesView';
import { HistoryView } from '@/components/HistoryView';
import { DownloadsView } from '@/components/DownloadsView';
import { SettingsView } from '@/components/SettingsView';
import {
  Manga,
  Chapter,
  Category,
  Source,
  Extension,
  ServerSettings,
  HistoryRecord,
  DownloadTask,
  UpdateRecord,
  TrackerItem,
} from '@/lib/types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
} from '@/lib/constants';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('library');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Core Data States
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [sources, setSources] = useState<Source[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [settings, setSettings] = useState<ServerSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const [updates, setUpdates] = useState<UpdateRecord[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Active Modals & Reader
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [currentMangaChapters, setCurrentMangaChapters] = useState<Chapter[]>([]);
  const [activeReadingChapter, setActiveReadingChapter] = useState<Chapter | null>(null);
  const [trackers, setTrackers] = useState<TrackerItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch initial data from API
  useEffect(() => {
    fetch('/api/v1/manga')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMangas(data);
      })
      .catch(() => {});

    fetch('/api/v1/category')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});

    fetch('/api/v1/source')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSources(data);
      })
      .catch(() => {});

    fetch('/api/v1/extension')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setExtensions(data);
      })
      .catch(() => {});

    fetch('/api/v1/update')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUpdates(data);
      })
      .catch(() => {});

    fetch('/api/v1/download')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDownloads(data);
      })
      .catch(() => {});

    fetch('/api/v1/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.serverPort) setSettings(data);
      })
      .catch(() => {});
  }, []);

  // When a manga is selected, fetch its chapters
  const handleSelectManga = useCallback((manga: Manga) => {
    setSelectedManga(manga);
    fetch(`/api/v1/manga/${manga.id}/chapters`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCurrentMangaChapters(data);
        } else {
          setCurrentMangaChapters([]);
        }
      })
      .catch(() => {
        setCurrentMangaChapters([]);
      });
  }, []);

  // Toggle in library
  const handleToggleLibrary = useCallback(
    async (mangaId: number) => {
      const manga = mangas.find((m) => m.id === mangaId);
      if (!manga) return;

      const newInLibrary = !manga.inLibrary;
      const updatedCategoryIds = newInLibrary && manga.categoryIds.length === 0 ? [1] : manga.categoryIds;

      // Optimistic update
      setMangas((prev) =>
        prev.map((m) =>
          m.id === mangaId
            ? { ...m, inLibrary: newInLibrary, categoryIds: updatedCategoryIds }
            : m
        )
      );

      if (selectedManga && selectedManga.id === mangaId) {
        setSelectedManga((prev) =>
          prev ? { ...prev, inLibrary: newInLibrary, categoryIds: updatedCategoryIds } : null
        );
      }

      await fetch(`/api/v1/manga/${mangaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inLibrary: newInLibrary, categoryIds: updatedCategoryIds }),
      }).catch(() => {});
    },
    [mangas, selectedManga]
  );

  // Update categories for a manga
  const handleUpdateCategories = useCallback(
    async (mangaId: number, categoryIds: number[]) => {
      setMangas((prev) =>
        prev.map((m) => (m.id === mangaId ? { ...m, categoryIds } : m))
      );
      if (selectedManga && selectedManga.id === mangaId) {
        setSelectedManga((prev) => (prev ? { ...prev, categoryIds } : null));
      }

      await fetch(`/api/v1/manga/${mangaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds }),
      }).catch(() => {});
    },
    [selectedManga]
  );

  // Add new category
  const handleAddCategory = useCallback(async (name: string) => {
    const res = await fetch('/api/v1/category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const newCat = await res.json();
      setCategories((prev) => [...prev, newCat]);
    }
  }, []);

  // Delete category
  const handleDeleteCategory = useCallback(async (id: number) => {
    await fetch(`/api/v1/category?id=${id}`, { method: 'DELETE' });
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setMangas((prev) =>
      prev.map((m) => ({
        ...m,
        categoryIds: m.categoryIds.filter((cid) => cid !== id),
      }))
    );
  }, []);

  // Open reader
  const handleOpenReader = useCallback(
    (chapter: Chapter) => {
      setActiveReadingChapter(chapter);

      // Add to reading history
      if (selectedManga) {
        const historyItem: HistoryRecord = {
          id: `h-${Date.now()}`,
          mangaId: selectedManga.id,
          mangaTitle: selectedManga.title,
          chapterId: chapter.id,
          chapterName: chapter.name,
          coverUrl: selectedManga.coverUrl,
          readAt: Date.now(),
          lastPageRead: chapter.lastPageRead > 0 ? chapter.lastPageRead : 1,
          pageCount: chapter.pageCount || 7,
        };
        setHistory((prev) => [
          historyItem,
          ...prev.filter((h) => h.mangaId !== selectedManga.id),
        ]);
      }
    },
    [selectedManga]
  );

  // Open reader by mangaId and chapterId
  const handleOpenReaderByChapterId = useCallback(
    (mangaId: number, chapterId: number) => {
      const manga = mangas.find((m) => m.id === mangaId);
      if (!manga) return;
      setSelectedManga(manga);

      fetch(`/api/v1/manga/${mangaId}/chapters`)
        .then((res) => res.json())
        .then((chs: Chapter[]) => {
          setCurrentMangaChapters(chs);
          const found = chs.find((c) => c.id === chapterId);
          if (found) {
            handleOpenReader(found);
          }
        })
        .catch(() => {});
    },
    [mangas, handleOpenReader]
  );

  // Toggle chapter read
  const handleToggleChapterRead = useCallback(
    async (chapterId: number, read: boolean) => {
      setCurrentMangaChapters((prev) =>
        prev.map((c) => (c.id === chapterId ? { ...c, read } : c))
      );

      if (selectedManga) {
        setMangas((prev) =>
          prev.map((m) => {
            if (m.id === selectedManga.id) {
              const unread = Math.max(0, m.unreadChapters + (read ? -1 : 1));
              return { ...m, unreadChapters: unread };
            }
            return m;
          })
        );
      }

      await fetch(`/api/v1/manga/${selectedManga?.id}/chapter/${chapterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read }),
      }).catch(() => {});
    },
    [selectedManga]
  );

  // Toggle bookmark
  const handleToggleChapterBookmark = useCallback(
    async (chapterId: number, bookmark: boolean) => {
      setCurrentMangaChapters((prev) =>
        prev.map((c) => (c.id === chapterId ? { ...c, bookmark } : c))
      );
      await fetch(`/api/v1/manga/${selectedManga?.id}/chapter/${chapterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmark }),
      }).catch(() => {});
    },
    [selectedManga]
  );

  // Download chapter
  const handleDownloadChapter = useCallback(async (chapterId: number) => {
    const res = await fetch('/api/v1/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId }),
    });
    if (res.ok) {
      const task = await res.json();
      setDownloads((prev) => [...prev.filter((d) => d.chapterId !== chapterId), task]);
      setCurrentMangaChapters((prev) =>
        prev.map((c) => (c.id === chapterId ? { ...c, downloaded: true } : c))
      );
    }
  }, []);

  // Mark previous chapters as read
  const handleMarkPreviousRead = useCallback(
    async (mangaId: number, chapterNumber: number) => {
      setCurrentMangaChapters((prev) =>
        prev.map((c) => (c.chapterNumber <= chapterNumber ? { ...c, read: true } : c))
      );
      setMangas((prev) =>
        prev.map((m) => {
          if (m.id === mangaId) {
            const unread = currentMangaChapters.filter(
              (c) => c.chapterNumber > chapterNumber && !c.read
            ).length;
            return { ...m, unreadChapters: unread };
          }
          return m;
        })
      );
    },
    [currentMangaChapters]
  );

  // Reader progress update
  const handleReaderPageProgress = useCallback(
    (chapterId: number, page: number, total: number) => {
      const isFinished = page >= total;
      setCurrentMangaChapters((prev) =>
        prev.map((c) =>
          c.id === chapterId
            ? { ...c, lastPageRead: page, read: isFinished ? true : c.read }
            : c
        )
      );
      if (selectedManga) {
        setHistory((prev) =>
          prev.map((h) =>
            h.chapterId === chapterId
              ? { ...h, lastPageRead: page, readAt: Date.now() }
              : h
          )
        );
      }
    },
    [selectedManga]
  );

  // Toggle extension
  const handleToggleExtension = useCallback(async (pkgName: string) => {
    const res = await fetch('/api/v1/extension', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pkgName }),
    });
    if (res.ok) {
      setExtensions((prev) =>
        prev.map((e) => (e.pkgName === pkgName ? { ...e, installed: !e.installed } : e))
      );
    }
  }, []);

  // Check for updates
  const handleCheckUpdates = useCallback(async () => {
    const res = await fetch('/api/v1/update', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data.updates) setUpdates(data.updates);
    }
  }, []);

  // Update settings
  const handleUpdateSettings = useCallback(async (partial: Partial<ServerSettings>) => {
    const res = await fetch('/api/v1/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (res.ok) {
      const updated = await res.json();
      setSettings(updated);
    }
  }, []);

  // Backup Export
  const handleExportBackup = useCallback(() => {
    window.location.href = '/api/v1/backup';
  }, []);

  // Backup Import
  const handleImportBackup = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const res = await fetch('/api/v1/backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(json),
          });
          if (res.ok) {
            setToastMessage('Backup restored successfully!');
            setTimeout(() => window.location.reload(), 1200);
          } else {
            setToastMessage('Failed to restore backup format.');
          }
        } catch {
          setToastMessage('Invalid backup JSON file.');
        }
      };
      reader.readAsText(file);
    },
    []
  );

  // Global search filtering
  const displayMangas = mangas.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.author?.toLowerCase().includes(q) ||
      m.sourceName.toLowerCase().includes(q) ||
      m.genre.some((g) => g.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        unreadUpdatesCount={updates.length}
        activeDownloadsCount={downloads.filter((d) => d.status === 'downloading' || d.status === 'queued').length}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex-1 flex w-full">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          libraryCount={mangas.filter((m) => m.inLibrary).length}
          unreadUpdatesCount={updates.length}
          activeDownloadsCount={downloads.filter((d) => d.status === 'downloading' || d.status === 'queued').length}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          {activeTab === 'library' && (
            <LibraryView
              mangas={displayMangas}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              onSelectManga={handleSelectManga}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onToggleLibrary={handleToggleLibrary}
              onOpenBrowse={() => setActiveTab('browse')}
            />
          )}

          {activeTab === 'browse' && (
            <BrowseView
              sources={sources}
              extensions={extensions}
              allMangas={mangas}
              onSelectManga={handleSelectManga}
              onToggleExtension={handleToggleExtension}
              onToggleLibrary={handleToggleLibrary}
            />
          )}

          {activeTab === 'updates' && (
            <UpdatesView
              updates={updates}
              allMangas={mangas}
              onCheckUpdates={handleCheckUpdates}
              onSelectManga={handleSelectManga}
              onOpenReaderByChapterId={handleOpenReaderByChapterId}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              history={history}
              allMangas={mangas}
              onClearHistory={() => setHistory([])}
              onSelectManga={handleSelectManga}
              onOpenReaderByChapterId={handleOpenReaderByChapterId}
            />
          )}

          {activeTab === 'downloads' && (
            <DownloadsView
              downloads={downloads}
              onCancelDownload={(id) => setDownloads((prev) => prev.filter((d) => d.id !== id))}
              onClearCompleted={() => setDownloads((prev) => prev.filter((d) => d.status !== 'downloaded'))}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
            />
          )}
        </main>
      </div>

      {/* Manga Details Modal */}
      {selectedManga && !activeReadingChapter && (
        <MangaDetailModal
          manga={selectedManga}
          chapters={currentMangaChapters}
          categories={categories}
          trackers={trackers.filter((t) => t.mangaId === selectedManga.id)}
          onClose={() => setSelectedManga(null)}
          onOpenReader={handleOpenReader}
          onToggleLibrary={handleToggleLibrary}
          onUpdateCategories={handleUpdateCategories}
          onToggleChapterRead={handleToggleChapterRead}
          onToggleChapterBookmark={handleToggleChapterBookmark}
          onDownloadChapter={handleDownloadChapter}
          onMarkPreviousRead={handleMarkPreviousRead}
        />
      )}

      {/* Fullscreen Reader Modal */}
      {activeReadingChapter && selectedManga && (
        <ReaderView
          manga={selectedManga}
          chapter={activeReadingChapter}
          allChapters={currentMangaChapters}
          settings={settings}
          onClose={() => setActiveReadingChapter(null)}
          onChapterChange={(ch) => setActiveReadingChapter(ch)}
          onPageProgress={handleReaderPageProgress}
        />
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
