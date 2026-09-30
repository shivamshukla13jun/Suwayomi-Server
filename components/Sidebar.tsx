'use client';

import React from 'react';
import {
  BookOpen,
  Bell,
  Clock,
  Compass,
  Download,
  Settings,
  Layers,
  Activity,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  libraryCount: number;
  unreadUpdatesCount: number;
  activeDownloadsCount: number;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  libraryCount,
  unreadUpdatesCount,
  activeDownloadsCount,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const navItems = [
    { id: 'library', label: 'Library', icon: BookOpen, count: libraryCount },
    { id: 'updates', label: 'Updates', icon: Bell, count: unreadUpdatesCount },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'browse', label: 'Browse', icon: Compass },
    { id: 'downloads', label: 'Downloads', icon: Download, count: activeDownloadsCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Navigation sidebar */}
      <aside
        className={`fixed md:sticky top-0 md:top-[57px] bottom-0 left-0 z-50 md:z-20 w-64 md:w-56 lg:w-60 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-3 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } h-screen md:h-[calc(100vh-57px)]`}
      >
        <div className="space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-blue-400 border border-slate-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Server status pill */}
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              TypeScript Engine
            </span>
            <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-1.5 py-0.5 rounded font-mono">
              Port 3000
            </span>
          </div>
          <div className="text-[11px] text-slate-400 leading-tight">
            Kotlin & Java removed. Running full-stack TypeScript Next.js server.
          </div>
        </div>
      </aside>
    </>
  );
};
