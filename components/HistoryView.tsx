'use client';

import React from 'react';
import {
  Clock,
  Trash2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { HistoryRecord, Manga } from '@/lib/types';
import { getProxiedImageUrl } from '@/lib/image-helper';

interface HistoryViewProps {
  history: HistoryRecord[];
  allMangas: Manga[];
  onClearHistory: () => void;
  onSelectManga: (manga: Manga) => void;
  onOpenReaderByChapterId: (mangaId: number, chapterId: number) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  allMangas,
  onClearHistory,
  onSelectManga,
  onOpenReaderByChapterId,
}) => {
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span>Reading History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Continue where you left off
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-3 py-1.5 text-xs text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 rounded-xl transition-colors border border-rose-900/50 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 max-w-md mx-auto">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No reading history</h3>
          <p className="text-xs text-slate-400 mt-1">
            Manga and chapters you read will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((record) => {
            const manga = allMangas.find((m) => m.id === record.mangaId);
            const progressPercent = Math.min(
              100,
              Math.round((record.lastPageRead / (record.pageCount || 1)) * 100)
            );

            return (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={getProxiedImageUrl(record.coverUrl)}
                    alt={record.mangaTitle}
                    onClick={() => manga && onSelectManga(manga)}
                    className="w-11 h-14 object-cover rounded-lg shadow-sm cursor-pointer hover:opacity-90 shrink-0"
                  />
                  <div className="min-w-0 flex-1 pr-2">
                    <h4
                      onClick={() => manga && onSelectManga(manga)}
                      className="text-xs sm:text-sm font-semibold text-slate-100 hover:text-blue-400 cursor-pointer truncate"
                    >
                      {record.mangaTitle}
                    </h4>
                    <p className="text-xs text-slate-300 font-medium mt-0.5 truncate">
                      {record.chapterName}
                    </p>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mt-1.5 max-w-xs">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {record.lastPageRead}/{record.pageCount} ({progressPercent}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    {formatTime(record.readAt)}
                  </span>
                  <button
                    onClick={() => onOpenReaderByChapterId(record.mangaId, record.chapterId)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
