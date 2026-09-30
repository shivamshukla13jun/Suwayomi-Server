'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Filter,
  CheckCircle2,
  Bookmark,
  MoreVertical,
  Layers,
  ArrowUpDown,
  BookOpen,
  FolderPlus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Manga, Category } from '@/lib/types';
import { getProxiedImageUrl } from '@/lib/image-helper';

interface LibraryViewProps {
  mangas: Manga[];
  categories: Category[];
  selectedCategoryId: number | null;
  setSelectedCategoryId: (id: number | null) => void;
  onSelectManga: (manga: Manga) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: number) => void;
  onToggleLibrary: (id: number) => void;
  onOpenBrowse: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  mangas,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  onSelectManga,
  onAddCategory,
  onDeleteCategory,
  onToggleLibrary,
  onOpenBrowse,
}) => {
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'unread' | 'updated'>('updated');
  const [displayMode, setDisplayMode] = useState<'comfortable' | 'compact' | 'list'>('comfortable');
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [activeMenuMangaId, setActiveMenuMangaId] = useState<number | null>(null);

  // Filter manga by selected category and filters
  const filteredMangas = useMemo(() => {
    let list = mangas.filter((m) => m.inLibrary);

    if (selectedCategoryId !== null) {
      list = list.filter((m) => m.categoryIds.includes(selectedCategoryId));
    }

    if (filterUnreadOnly) {
      list = list.filter((m) => m.unreadChapters > 0);
    }

    list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'unread') return b.unreadChapters - a.unreadChapters;
      return b.lastUpdate - a.lastUpdate;
    });

    return list;
  }, [mangas, selectedCategoryId, filterUnreadOnly, sortBy]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim());
    setNewCatName('');
    setNewCategoryModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 overflow-x-auto gap-2 scrollbar-none">
        <div className="flex items-center gap-1.5 flex-nowrap">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedCategoryId === null
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>All</span>
            <span className="opacity-75 text-[11px]">
              ({mangas.filter((m) => m.inLibrary).length})
            </span>
          </button>

          {categories.map((cat) => {
            const count = mangas.filter((m) => m.inLibrary && m.categoryIds.includes(cat.id)).length;
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 group ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{cat.name}</span>
                <span className="opacity-75 text-[11px]">({count})</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setNewCategoryModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 shrink-0"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>New Category</span>
        </button>
      </div>

      {/* Filter and View toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border ${
              filterUnreadOnly
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Unread Only</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="updated">Latest Updated</option>
              <option value="unread">Most Unread</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>

          {/* Display Mode toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setDisplayMode('comfortable')}
              className={`px-2 py-1 text-xs rounded font-medium ${
                displayMode === 'comfortable' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Comfortable
            </button>
            <button
              onClick={() => setDisplayMode('compact')}
              className={`px-2 py-1 text-xs rounded font-medium ${
                displayMode === 'compact' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Compact
            </button>
            <button
              onClick={() => setDisplayMode('list')}
              className={`px-2 py-1 text-xs rounded font-medium ${
                displayMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Manga Grid / List */}
      {filteredMangas.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">
            {filterUnreadOnly ? 'No unread manga' : 'Your Library is Empty'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {filterUnreadOnly
              ? 'You are all caught up! No unread chapters found in this category.'
              : 'Directly search and add titles from over 2,300+ installed Keiyoushi extension sources.'}
          </p>
          <button
            onClick={onOpenBrowse}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Browse Manga Sources</span>
          </button>
        </div>
      ) : displayMode === 'list' ? (
        /* List Mode */
        <div className="space-y-2">
          {filteredMangas.map((manga) => (
            <div
              key={manga.id}
              onClick={() => onSelectManga(manga)}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <img
                  src={getProxiedImageUrl(manga.coverUrl)}
                  alt={manga.title}
                  className="w-12 h-16 object-cover rounded-lg shadow-sm"
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {manga.title}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {manga.author || 'Unknown'} • <span className="text-blue-400">{manga.sourceName}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {manga.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {manga.totalChapters} chapters
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {manga.unreadChapters > 0 ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    {manga.unreadChapters} unread
                  </span>
                ) : (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Read
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Grid Modes (Comfortable / Compact) */
        <div
          className={`grid gap-4 sm:gap-5 ${
            displayMode === 'compact'
              ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
          }`}
        >
          {filteredMangas.map((manga) => (
            <div
              key={manga.id}
              onClick={() => onSelectManga(manga)}
              className="group relative cursor-pointer flex flex-col"
            >
              {/* Cover Card */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-800 shadow-md group-hover:shadow-xl group-hover:border-blue-500/50 transition-all duration-300">
                <img
                  src={getProxiedImageUrl(manga.coverUrl)}
                  alt={manga.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Bottom dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                {/* Top Badges */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700/60 shadow">
                    {manga.sourceName}
                  </span>

                  {manga.unreadChapters > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-md">
                      {manga.unreadChapters}
                    </span>
                  ) : (
                    <span className="p-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 backdrop-blur-md">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Status on bottom */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-slate-300">
                  <span className="font-semibold text-white truncate drop-shadow-sm">
                    {manga.totalChapters} ch
                  </span>
                  <span className="text-[10px] text-slate-300 capitalize drop-shadow-sm">
                    {manga.status.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Title & info below cover */}
              <div className="mt-2 flex flex-col">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                  {manga.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {manga.author || 'Unknown'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Category Modal */}
      {newCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Add New Category</h3>
            <p className="text-xs text-slate-400 mt-1">
              Create a custom category to organize your manga library.
            </p>
            <form onSubmit={handleCreateCategory} className="mt-4 space-y-4">
              <input
                type="text"
                placeholder="Category name (e.g. Must Read)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewCategoryModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
