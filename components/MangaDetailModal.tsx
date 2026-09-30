'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  Download,
  Share2,
  FolderPlus,
  ArrowUpDown,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCheck,
} from 'lucide-react';
import { Manga, Chapter, Category, TrackerItem } from '@/lib/types';
import { getProxiedImageUrl } from '@/lib/image-helper';

interface MangaDetailModalProps {
  manga: Manga;
  chapters: Chapter[];
  categories: Category[];
  trackers: TrackerItem[];
  onClose: () => void;
  onOpenReader: (chapter: Chapter) => void;
  onToggleLibrary: (id: number) => void;
  onUpdateCategories: (mangaId: number, categoryIds: number[]) => void;
  onToggleChapterRead: (chapterId: number, read: boolean) => void;
  onToggleChapterBookmark: (chapterId: number, bookmark: boolean) => void;
  onDownloadChapter: (chapterId: number) => void;
  onMarkPreviousRead: (mangaId: number, chapterNumber: number) => void;
}

export const MangaDetailModal: React.FC<MangaDetailModalProps> = ({
  manga,
  chapters,
  categories,
  trackers,
  onClose,
  onOpenReader,
  onToggleLibrary,
  onUpdateCategories,
  onToggleChapterRead,
  onToggleChapterBookmark,
  onDownloadChapter,
  onMarkPreviousRead,
}) => {
  const [descExpanded, setDescExpanded] = useState(false);
  const [chapterSearch, setChapterSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterBookmarked, setFilterBookmarked] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);

  // Resume chapter determination
  const nextChapterToRead = useMemo(() => {
    // Find earliest unread chapter or last read
    const sorted = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
    const firstUnread = sorted.find((c) => !c.read);
    return firstUnread || sorted[sorted.length - 1];
  }, [chapters]);

  // Filtered & sorted chapters
  const visibleChapters = useMemo(() => {
    let list = [...chapters];

    if (chapterSearch.trim()) {
      const q = chapterSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.chapterNumber.toString().includes(q) ||
          c.scanlator?.toLowerCase().includes(q)
      );
    }

    if (filterUnread) {
      list = list.filter((c) => !c.read);
    }

    if (filterBookmarked) {
      list = list.filter((c) => c.bookmark);
    }

    list.sort((a, b) =>
      sortOrder === 'desc'
        ? b.chapterNumber - a.chapterNumber
        : a.chapterNumber - b.chapterNumber
    );

    return list;
  }, [chapters, chapterSearch, filterUnread, filterBookmarked, sortOrder]);

  const handleCategoryToggle = (catId: number) => {
    const current = manga.categoryIds || [];
    let updated: number[];
    if (current.includes(catId)) {
      updated = current.filter((id) => id !== catId);
    } else {
      updated = [...current, catId];
    }
    onUpdateCategories(manga.id, updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Header with Background Banner */}
        <div className="relative h-56 sm:h-64 overflow-hidden shrink-0">
          <img
            src={getProxiedImageUrl(manga.coverUrl)}
            alt={manga.title}
            className="w-full h-full object-cover blur-2xl opacity-30 scale-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

          {/* Manga poster and main info in hero */}
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 flex items-end gap-4 sm:gap-6">
            <img
              src={getProxiedImageUrl(manga.coverUrl)}
              alt={manga.title}
              className="w-24 sm:w-32 aspect-[3/4] object-cover rounded-xl shadow-2xl border-2 border-slate-700/80 shrink-0"
            />
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600/30 text-blue-400 font-semibold border border-blue-500/40">
                  {manga.sourceName}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {manga.status}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight truncate">
                {manga.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 truncate">
                {manga.author ? `By ${manga.author}` : 'Unknown author'}
                {manga.artist && manga.artist !== manga.author ? ` • Art: ${manga.artist}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {nextChapterToRead && (
              <button
                onClick={() => onOpenReader(nextChapterToRead)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>
                  {nextChapterToRead.read
                    ? `Re-read Ch. ${nextChapterToRead.chapterNumber}`
                    : `Read Ch. ${nextChapterToRead.chapterNumber}`}
                </span>
              </button>
            )}

            <button
              onClick={() => onToggleLibrary(manga.id)}
              className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors border ${
                manga.inLibrary
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80 hover:bg-emerald-900/60'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {manga.inLibrary ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{manga.inLibrary ? 'In Library' : 'Add to Library'}</span>
            </button>

            {manga.inLibrary && (
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="px-3 py-2 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Categories</span>
              </button>
            )}

            <button
              onClick={() => setTrackingModalOpen(true)}
              className="px-3 py-2 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Track ({trackers.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {chapters.length} chapters • {manga.unreadChapters} unread
          </div>
        </div>

        {/* Scrollable details and chapter list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Synopsis */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Synopsis
            </h4>
            <p className={`text-xs sm:text-sm text-slate-300 leading-relaxed ${!descExpanded ? 'line-clamp-3' : ''}`}>
              {manga.description || 'No description available.'}
            </p>
            {manga.description && manga.description.length > 150 && (
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-2 text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1"
              >
                {descExpanded ? (
                  <>
                    <span>Show less</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Read more</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}

            {/* Genre chips */}
            {manga.genre && manga.genre.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800/80">
                {manga.genre.map((g) => (
                  <span
                    key={g}
                    className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Chapters Section Header & Filters */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-200">
                Chapters ({visibleChapters.length})
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterUnread(!filterUnread)}
                  className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                    filterUnread
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setFilterBookmarked(!filterBookmarked)}
                  className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                    filterBookmarked
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Bookmarked
                </button>
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="p-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-1"
                  title="Toggle chapter sort order"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="text-[11px] uppercase font-mono">{sortOrder}</span>
                </button>
              </div>
            </div>

            {/* Chapter search input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search chapter name or number..."
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Chapter Items List */}
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {visibleChapters.map((ch) => (
                <div
                  key={ch.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    ch.read
                      ? 'bg-slate-900/60 border-slate-800/70 opacity-70 hover:opacity-100'
                      : 'bg-slate-800/70 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  {/* Left: Checkmark & Chapter name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleChapterRead(ch.id, !ch.read)}
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        ch.read
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-600 hover:border-slate-400 bg-slate-900/50'
                      }`}
                      title={ch.read ? 'Mark as Unread' : 'Mark as Read'}
                    >
                      {ch.read && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div
                      onClick={() => onOpenReader(ch)}
                      className="cursor-pointer min-w-0 flex-1 group"
                    >
                      <h5 className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-blue-400 truncate">
                        {ch.name}
                      </h5>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{ch.scanlator || 'Official'}</span>
                        <span>•</span>
                        <span>{new Date(ch.uploadDate).toLocaleDateString()}</span>
                        {ch.lastPageRead > 0 && !ch.read && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400 font-medium">
                              Page {ch.lastPageRead} of {ch.pageCount}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Bookmark, Download, Read button, Mark previous read */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => onToggleChapterBookmark(ch.id, !ch.bookmark)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        ch.bookmark ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Bookmark chapter"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>

                    <button
                      onClick={() => onDownloadChapter(ch.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        ch.downloaded ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={ch.downloaded ? 'Downloaded' : 'Download chapter'}
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onMarkPreviousRead(manga.id, ch.chapterNumber)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300"
                      title="Mark previous chapters as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onOpenReader(ch)}
                      className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-colors"
                    >
                      Read
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories Selection Modal */}
        {categoryModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-base font-bold text-white mb-2">Edit Categories</h3>
              <p className="text-xs text-slate-400 mb-4">
                Select which categories this manga belongs to:
              </p>
              <div className="space-y-2 mb-6">
                {categories.map((cat) => {
                  const isChecked = manga.categoryIds?.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      onClick={() => handleCategoryToggle(cat.id)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 cursor-pointer"
                    >
                      <span className="text-sm font-medium text-slate-200">{cat.name}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                      />
                    </label>
                  );
                })}
              </div>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Tracking modal */}
        {trackingModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Tracking & Sync</h3>
                <button
                  onClick={() => setTrackingModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {trackers.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No active tracking services connected for this title.
                  </p>
                ) : (
                  trackers.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 bg-slate-800/70 border border-slate-700/80 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 uppercase">
                          {t.trackerId}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          {t.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-200 font-semibold">{t.title}</div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Chapters: {t.lastChapterRead} / {t.totalChapters}</span>
                        <span>Score: {t.score} / 10</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setTrackingModalOpen(false)}
                className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
