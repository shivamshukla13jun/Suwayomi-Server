'use client';

import React from 'react';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Trash2,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { DownloadTask } from '@/lib/types';
import { getProxiedImageUrl } from '@/lib/image-helper';

interface DownloadsViewProps {
  downloads: DownloadTask[];
  onCancelDownload: (id: string) => void;
  onClearCompleted: () => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  downloads,
  onCancelDownload,
  onClearCompleted,
}) => {
  const completedCount = downloads.filter((d) => d.status === 'downloaded').length;
  const activeCount = downloads.filter((d) => d.status === 'downloading' || d.status === 'queued').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            <span>Download Queue</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeCount} active downloads • {completedCount} completed
          </p>
        </div>

        {completedCount > 0 && (
          <button
            onClick={onClearCompleted}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Completed</span>
          </button>
        )}
      </div>

      {downloads.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 max-w-md mx-auto">
          <Download className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No active downloads</h3>
          <p className="text-xs text-slate-400 mt-1">
            Download chapters from any manga details page to read offline.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {downloads.map((task) => (
            <div
              key={task.id}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={getProxiedImageUrl(task.coverUrl)}
                    alt={task.mangaTitle}
                    className="w-10 h-13 object-cover rounded-lg shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                      {task.mangaTitle}
                    </h4>
                    <p className="text-xs text-slate-300 truncate mt-0.5">
                      {task.chapterName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      task.status === 'downloaded'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                        : task.status === 'downloading'
                        ? 'bg-blue-950/80 text-blue-400 border border-blue-800/80 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {task.status}
                  </span>

                  <button
                    onClick={() => onCancelDownload(task.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      task.status === 'downloaded' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {task.pagesDownloaded} / {task.totalPages} pages
                  </span>
                  <span>{task.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offline Storage Status Card */}
      <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Local Storage Footprint</h4>
            <p className="text-[11px] text-slate-400">
              Downloaded manga pages stored in local browser cache and server storage.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-300 px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
          ~{(completedCount * 14.2).toFixed(1)} MB
        </span>
      </div>
    </div>
  );
};
