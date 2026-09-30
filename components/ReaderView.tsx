'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Settings,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Sliders,
  X,
  BookOpen,
  ArrowDown,
  RotateCcw,
} from 'lucide-react';
import { Chapter, Manga, ServerSettings } from '@/lib/types';
import { getProxiedImageUrl } from '@/lib/image-helper';

interface ReaderViewProps {
  manga: Manga;
  chapter: Chapter;
  allChapters: Chapter[];
  settings: ServerSettings;
  onClose: () => void;
  onChapterChange: (chapter: Chapter) => void;
  onPageProgress: (chapterId: number, page: number, total: number) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  manga,
  chapter,
  allChapters,
  settings,
  onClose,
  onChapterChange,
  onPageProgress,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(
    chapter.lastPageRead > 0 ? chapter.lastPageRead : 1
  );
  const [readingMode, setReadingMode] = useState<'webtoon' | 'single' | 'double' | 'rtl'>(
    settings.readerMode || 'webtoon'
  );
  const [bgColor, setBgColor] = useState<'black' | 'dark' | 'sepia' | 'white'>(
    settings.readerBackground || 'black'
  );
  const [fitMode, setFitMode] = useState<'width' | 'height' | 'contain' | 'original'>(
    settings.readerFit || 'width'
  );
  const [controlsVisible, setControlsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pages = chapter.pages || [];
  const totalPages = pages.length > 0 ? pages.length : 1;

  // Next / Previous Chapter navigation
  const sortedChapters = [...allChapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
  const currentChapterIdx = sortedChapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentChapterIdx > 0 ? sortedChapters[currentChapterIdx - 1] : null;
  const nextChapter = currentChapterIdx < sortedChapters.length - 1 ? sortedChapters[currentChapterIdx + 1] : null;

  // Report progress on change
  useEffect(() => {
    onPageProgress(chapter.id, currentPage, totalPages);
  }, [currentPage, chapter.id, totalPages, onPageProgress]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (readingMode === 'rtl') {
          // in RTL right arrow goes previous
          if (currentPage > 1) setCurrentPage((p) => p - 1);
        } else {
          if (currentPage < totalPages) setCurrentPage((p) => p + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (readingMode === 'rtl') {
          if (currentPage < totalPages) setCurrentPage((p) => p + 1);
        } else {
          if (currentPage > 1) setCurrentPage((p) => p - 1);
        }
      } else if (e.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false);
        } else {
          onClose();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    },
    [currentPage, totalPages, readingMode, settingsOpen, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Background style helper
  const getBgClass = () => {
    switch (bgColor) {
      case 'black':
        return 'bg-black text-slate-100';
      case 'dark':
        return 'bg-slate-950 text-slate-100';
      case 'sepia':
        return 'bg-[#f4ecd8] text-[#5b4636]';
      case 'white':
        return 'bg-white text-slate-900';
      default:
        return 'bg-black text-slate-100';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 overflow-hidden flex flex-col select-none transition-colors duration-200 ${getBgClass()}`}
    >
      {/* Top Controls Overlay Header */}
      <header
        className={`absolute top-0 left-0 right-0 z-30 transition-transform duration-300 ease-in-out bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-xl ${
          controlsVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to library"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
              {manga.title}
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {chapter.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chapter selector dropdown */}
          <select
            value={chapter.id}
            onChange={(e) => {
              const selected = allChapters.find((c) => c.id === parseInt(e.target.value, 10));
              if (selected) onChapterChange(selected);
            }}
            className="hidden sm:inline-block bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 max-w-[160px] truncate"
          >
            {sortedChapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`p-2 rounded-lg transition-colors ${
              settingsOpen ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Reader Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Reader Settings Floating Drawer */}
      {settingsOpen && (
        <div className="absolute top-16 right-4 z-40 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl w-80 text-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Reader Settings</span>
            </h4>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Reading Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Reading Mode
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'webtoon', label: 'Webtoon (Continuous)' },
                { id: 'single', label: 'Single Page' },
                { id: 'double', label: 'Double Page' },
                { id: 'rtl', label: 'Manga (RTL)' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setReadingMode(m.id as any)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    readingMode === m.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fit Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Page Fit
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'width', label: 'Width' },
                { id: 'height', label: 'Height' },
                { id: 'contain', label: 'Fit' },
                { id: 'original', label: 'Original' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFitMode(f.id as any)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-colors ${
                    fitMode === f.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Reader Background
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'black', label: 'Black', bg: 'bg-black text-white' },
                { id: 'dark', label: 'Dark', bg: 'bg-slate-900 text-white' },
                { id: 'sepia', label: 'Sepia', bg: 'bg-[#f4ecd8] text-amber-900' },
                { id: 'white', label: 'White', bg: 'bg-white text-slate-900' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBgColor(b.id as any)}
                  className={`py-1.5 text-xs rounded-lg font-medium border text-center transition-all ${
                    bgColor === b.id ? 'ring-2 ring-blue-500 scale-105' : 'border-slate-700'
                  } ${b.bg}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Reader Canvas Area */}
      <main
        onClick={() => setControlsVisible(!controlsVisible)}
        className="flex-1 overflow-y-auto relative flex flex-col items-center justify-start cursor-pointer webtoon-scroll-container"
      >
        {readingMode === 'webtoon' ? (
          /* Continuous Webtoon mode */
          <div className="w-full flex flex-col items-center min-h-screen py-16">
            {pages.map((pageUrl, idx) => (
              <div
                key={idx}
                className={`flex justify-center w-full transition-all ${
                  fitMode === 'width' ? 'max-w-3xl sm:max-w-4xl' : 'max-w-2xl'
                }`}
              >
                <img
                  src={getProxiedImageUrl(pageUrl)}
                  alt={`Page ${idx + 1}`}
                  className="w-full h-auto object-contain block shadow-2xl manga-page-img"
                  loading="lazy"
                  onLoad={() => {
                    if (idx + 1 === totalPages) {
                      setCurrentPage(totalPages);
                    }
                  }}
                />
              </div>
            ))}

            {/* End of chapter controls in Webtoon mode */}
            <div className="py-12 flex flex-col items-center gap-4 text-center px-4">
              <span className="text-xs text-slate-400">
                End of {chapter.name}
              </span>
              <div className="flex items-center gap-3">
                {prevChapter && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChapterChange(prevChapter);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                  >
                    ← Previous Chapter
                  </button>
                )}
                {nextChapter && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChapterChange(nextChapter);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors"
                  >
                    Next Chapter →
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : readingMode === 'double' ? (
          /* Double Page Spread */
          <div className="h-full w-full flex items-center justify-center p-4">
            <div className="flex items-center justify-center gap-1 max-h-[85vh] max-w-6xl">
              {pages[currentPage - 1] && (
                <img
                  src={getProxiedImageUrl(pages[currentPage - 1])}
                  alt={`Page ${currentPage}`}
                  className="max-h-[85vh] max-w-[48%] object-contain shadow-2xl rounded-sm manga-page-img"
                />
              )}
              {pages[currentPage] && (
                <img
                  src={getProxiedImageUrl(pages[currentPage])}
                  alt={`Page ${currentPage + 1}`}
                  className="max-h-[85vh] max-w-[48%] object-contain shadow-2xl rounded-sm manga-page-img"
                />
              )}
            </div>
          </div>
        ) : (
          /* Single Page or RTL Page */
          <div className="h-full w-full flex items-center justify-center p-4">
            {pages[currentPage - 1] && (
              <img
                src={getProxiedImageUrl(pages[currentPage - 1])}
                alt={`Page ${currentPage}`}
                className={`object-contain shadow-2xl rounded-sm manga-page-img ${
                  fitMode === 'height'
                    ? 'max-h-[88vh] w-auto'
                    : fitMode === 'width'
                    ? 'w-full max-w-4xl h-auto'
                    : 'max-h-[85vh] max-w-[90vw]'
                }`}
              />
            )}
          </div>
        )}
      </main>

      {/* Bottom Scrubber & Navigation Bar */}
      <footer
        className={`absolute bottom-0 left-0 right-0 z-30 transition-transform duration-300 ease-in-out bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 px-4 py-3 flex flex-col gap-2 shadow-2xl ${
          controlsVisible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto w-full">
          {/* Previous Page or Chapter button */}
          <button
            onClick={() => {
              if (currentPage > 1) {
                setCurrentPage((p) => p - 1);
              } else if (prevChapter) {
                onChapterChange(prevChapter);
              }
            }}
            disabled={currentPage <= 1 && !prevChapter}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Slider scrubber */}
          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs font-mono font-medium text-slate-400 w-8 text-right">
              {currentPage}
            </span>
            <input
              type="range"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-xs font-mono font-medium text-slate-400 w-8">
              {totalPages}
            </span>
          </div>

          {/* Next Page or Chapter button */}
          <button
            onClick={() => {
              if (currentPage < totalPages) {
                setCurrentPage((p) => p + 1);
              } else if (nextChapter) {
                onChapterChange(nextChapter);
              }
            }}
            disabled={currentPage >= totalPages && !nextChapter}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
