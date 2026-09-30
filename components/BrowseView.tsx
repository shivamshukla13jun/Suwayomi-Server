'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Download,
  Check,
  Search,
  Globe,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FolderOpen,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Source, Extension, Manga } from '@/lib/types';
import { getProxiedImageUrl } from '@/lib/image-helper';

interface BrowseViewProps {
  sources: Source[];
  extensions: Extension[];
  allMangas: Manga[];
  onSelectManga: (manga: Manga) => void;
  onToggleExtension: (pkgName: string) => void;
  onToggleLibrary: (mangaId: number) => void;
}

export const BrowseView: React.FC<BrowseViewProps> = ({
  sources,
  extensions,
  allMangas,
  onSelectManga,
  onToggleExtension,
  onToggleLibrary,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sources' | 'extensions'>('sources');
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [sourceSearch, setSourceSearch] = useState('');
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [extensionFilter, setExtensionFilter] = useState<'all' | 'installed' | 'available'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Live catalog manga state when inside a source
  const [catalogMangas, setCatalogMangas] = useState<Manga[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');

  const selectedSource = sources.find((s) => s.id === selectedSourceId);

  // Available unique languages in sources
  const languages = React.useMemo(() => {
    const set = new Set<string>();
    sources.forEach((s) => set.add(s.lang));
    return ['all', ...Array.from(set).sort()];
  }, [sources]);

  // Filter sources by search and language
  const filteredSources = React.useMemo(() => {
    return sources.filter((s) => {
      const matchLang = selectedLang === 'all' || s.lang === selectedLang;
      const matchSearch =
        !sourceSearch.trim() ||
        s.name.toLowerCase().includes(sourceSearch.toLowerCase()) ||
        s.lang.toLowerCase().includes(sourceSearch.toLowerCase());
      return matchLang && matchSearch;
    });
  }, [sources, selectedLang, sourceSearch]);

  // Trigger real search when opening a source or changing query
  useEffect(() => {
    if (!selectedSourceId) return;
    setCatalogLoading(true);
    const q = encodeURIComponent(catalogQuery.trim() || 'popular');
    fetch(`/api/v1/source?sourceId=${selectedSourceId}&query=${q}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.mangas)) {
          setCatalogMangas(data.mangas);
        } else {
          setCatalogMangas([]);
        }
      })
      .catch(() => setCatalogMangas([]))
      .finally(() => setCatalogLoading(false));
  }, [selectedSourceId, catalogQuery]);

  const handleSyncKeiyoushi = async () => {
    setIsSyncing(true);
    setSyncStatus('Fetching index.pb from Keiyoushi...');
    try {
      const res = await fetch('/api/v1/extension/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: 'https://github.com/keiyoushi/extensions/raw/repo/index.pb' }),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncStatus(`Installed ${data.sourcesCount} sources from Keiyoushi!`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSyncStatus(`Sync failed: ${data.error}`);
      }
    } catch {
      setSyncStatus('Network error syncing repo.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs & Keiyoushi Sync */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveSubTab('sources');
              setSelectedSourceId(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'sources'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Sources ({sources.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('extensions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'extensions'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Extensions ({extensions.length})</span>
          </button>
        </div>

        {/* Keiyoushi Index Sync Button */}
        <div className="flex items-center gap-2">
          {syncStatus && (
            <span className="text-xs text-blue-400 font-medium animate-pulse">
              {syncStatus}
            </span>
          )}
          <button
            onClick={handleSyncKeiyoushi}
            disabled={isSyncing}
            className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 flex items-center gap-1.5 disabled:opacity-50"
            title="Directly pull and update all sources from Keiyoushi index.pb"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Keiyoushi Repo</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'sources' ? (
        selectedSourceId ? (
          /* Live Catalog View for a specific Source */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedSourceId(null)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                >
                  ← Back to Sources
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{selectedSource?.name}</span>
                  <span className="text-xs text-slate-400 uppercase">({selectedSource?.lang})</span>
                  {selectedSource?.baseUrl && (
                    <a
                      href={selectedSource.baseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-0.5 ml-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Real search inside source */}
              <div className="flex items-center gap-2 max-w-sm w-full">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Search titles in ${selectedSource?.name}...`}
                    value={catalogQuery}
                    onChange={(e) => setCatalogQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Catalog Grid */}
            {catalogLoading ? (
              <div className="text-center py-20">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Fetching live titles from source...</p>
              </div>
            ) : catalogMangas.length === 0 ? (
              <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-slate-800 max-w-md mx-auto">
                <Globe className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-200">No manga found</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Try typing a different search query above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {catalogMangas.map((manga) => {
                  const inLibrary = allMangas.some((m) => m.id === manga.id && m.inLibrary);
                  return (
                    <div
                      key={manga.id}
                      onClick={() => onSelectManga(manga)}
                      className="group relative cursor-pointer flex flex-col"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-800 shadow-md group-hover:shadow-xl group-hover:border-blue-500/50 transition-all duration-300">
                        <img
                          src={getProxiedImageUrl(manga.coverUrl)}
                          alt={manga.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                        {/* Add to Library Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLibrary(manga.id);
                          }}
                          className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                            inLibrary
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900/80 hover:bg-blue-600 text-white border border-slate-700'
                          }`}
                          title={inLibrary ? 'In Library' : 'Add to Library'}
                        >
                          {inLibrary ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="mt-2 flex flex-col">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                          {manga.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {manga.author || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* List of Real Installed Sources */
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter 2,300+ sources by name..."
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Language:</span>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 uppercase"
                >
                  {languages.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sources grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto pr-1">
              {filteredSources.slice(0, 150).map((src) => (
                <div
                  key={`${src.id}-${src.name}`}
                  onClick={() => setSelectedSourceId(src.id)}
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center p-1.5 border border-slate-700 shrink-0">
                      {src.iconUrl && src.iconUrl !== '/icons/faviconlogo.png' ? (
                        <img
                          src={src.iconUrl}
                          alt={src.name}
                          className="w-5 h-5 object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Globe className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                        {src.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        Lang: <span className="uppercase text-slate-300 font-semibold">{src.lang}</span>
                        {src.version ? ` • v${src.version}` : ''}
                      </p>
                    </div>
                  </div>

                  <button className="px-2.5 py-1 text-xs font-semibold bg-slate-800 group-hover:bg-blue-600 text-slate-300 group-hover:text-white rounded-lg transition-colors border border-slate-700 shrink-0">
                    Browse
                  </button>
                </div>
              ))}
            </div>

            {filteredSources.length > 150 && (
              <p className="text-xs text-center text-slate-500">
                Showing top 150 of {filteredSources.length} sources. Refine your search query or language filter to view more.
              </p>
            )}
          </div>
        )
      ) : (
        /* Extensions Management Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">
              Installed extensions from <span className="text-blue-400 font-semibold">Keiyoushi Repository</span>: {extensions.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1">
            {extensions.slice(0, 100).map((ext) => (
              <div
                key={ext.pkgName}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center p-1.5 border border-slate-700 shrink-0">
                    {ext.iconUrl ? (
                      <img
                        src={ext.iconUrl}
                        alt={ext.name}
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Compass className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {ext.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      v{ext.versionName} • <span className="uppercase">{ext.lang}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                    Installed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
