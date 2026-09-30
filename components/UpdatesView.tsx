'use client';

import React, { useState } from 'react';
import {
  Bell,
  RefreshCw,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { UpdateRecord, Manga, Chapter } from '@/lib/types';
import { getProxiedImageUrl } from '@/lib/image-helper';

interface UpdatesViewProps {
  updates: UpdateRecord[];
  allMangas: Manga[];
  onCheckUpdates: () => Promise<void>;
  onSelectManga: (manga: Manga) => void;
  onOpenReaderByChapterId: (mangaId: number, chapterId: number) => void;
}

export const UpdatesView: React.FC<UpdatesViewProps> = ({
  updates,
  allMangas,
  onCheckUpdates,
  onSelectManga,
  onOpenReaderByChapterId,
}) => {
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    await onCheckUpdates();
    setTimeout(() => setChecking(false), 800);
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <span>Library Updates</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            New chapters released for manga in your library
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={checking}
          className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          <span>{checking ? 'Checking sources...' : 'Check for Updates'}</span>
        </button>
      </div>

      {updates.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 max-w-md mx-auto">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No recent updates</h3>
          <p className="text-xs text-slate-400 mt-1">
            Check back later or click 'Check for Updates' to fetch from installed extensions.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {updates.map((item) => {
            const manga = allMangas.find((m) => m.id === item.mangaId);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={getProxiedImageUrl(item.coverUrl)}
                    alt={item.mangaTitle}
                    onClick={() => manga && onSelectManga(manga)}
                    className="w-11 h-14 object-cover rounded-lg shadow-sm cursor-pointer hover:opacity-90 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4
                      onClick={() => manga && onSelectManga(manga)}
                      className="text-xs sm:text-sm font-semibold text-slate-100 hover:text-blue-400 cursor-pointer truncate"
                    >
                      {item.mangaTitle}
                    </h4>
                    <p className="text-xs text-slate-300 font-medium mt-0.5 truncate">
                      {item.chapterName}
                    </p>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {getRelativeTime(item.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  <button
                    onClick={() => onOpenReaderByChapterId(item.mangaId, item.chapterId)}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read</span>
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
