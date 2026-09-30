'use client';

import React, { useState } from 'react';
import {
  Settings,
  Server,
  Palette,
  BookOpen,
  Download,
  Database,
  Shield,
  Copy,
  Check,
  ExternalLink,
  Upload,
  Info,
} from 'lucide-react';
import { ServerSettings } from '@/lib/types';

interface SettingsViewProps {
  settings: ServerSettings;
  onUpdateSettings: (settings: Partial<ServerSettings>) => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
}) => {
  const [copiedOpds, setCopiedOpds] = useState(false);
  const [testingByparr, setTestingByparr] = useState(false);
  const [byparrMessage, setByparrMessage] = useState<string | null>(null);

  const copyOpdsUrl = () => {
    const url = `${window.location.origin}/api/opds/v1.2`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedOpds(true);
      setTimeout(() => setCopiedOpds(false), 2000);
    });
  };

  const handleTestByparr = async () => {
    setTestingByparr(true);
    setByparrMessage(null);
    try {
      const res = await fetch('/api/v1/byparr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: settings.byparrUrl || 'http://localhost:8191/v1' }),
      });
      const data = await res.json();
      setByparrMessage(data.ok ? `✓ ${data.message}` : `✗ ${data.message}`);
    } catch {
      setByparrMessage('✗ Failed to test Byparr service');
    } finally {
      setTestingByparr(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <span>Server Settings & Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure reader preferences, OPDS feeds, backups, and server behavior.
        </p>
      </div>

      {/* Server & Network info */}
      <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" />
          <span>Server & OPDS Connectivity</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold uppercase text-slate-400">
              Host & Port
            </span>
            <div className="text-sm font-mono text-slate-200">
              {settings.serverHost}:{settings.serverPort}
            </div>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold uppercase text-slate-400">
              Active Runtime
            </span>
            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              TypeScript / Next.js 15
            </div>
          </div>
        </div>

        {/* OPDS Feed Section */}
        <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span>OPDS 1.2 Feed for E-Readers (KOReader, Chunky, Panels)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Connect KOReader, Moon+ Reader, or any OPDS client directly to your Suwayomi library.
            </p>
          </div>

          <button
            onClick={copyOpdsUrl}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5 shrink-0"
          >
            {copiedOpds ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedOpds ? 'Copied Feed URL' : 'Copy OPDS URL'}</span>
          </button>
        </div>
      </section>

      {/* Byparr & Anti-Bot Bypass */}
      <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Byparr & Anti-Bot Bypass (FlareSolverr API)</span>
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active :8191
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Suwayomi uses Byparr to bypass Cloudflare protection and access manga titles, chapter details, and image streams that require challenge resolution.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Byparr Service Endpoint</label>
            <input
              type="text"
              value={settings.byparrUrl || 'http://localhost:8191/v1'}
              onChange={(e) => onUpdateSettings({ byparrUrl: e.target.value })}
              placeholder="http://localhost:8191/v1"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestByparr}
                disabled={testingByparr}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
              >
                {testingByparr ? 'Testing...' : 'Test Byparr Connection'}
              </button>
              {byparrMessage && (
                <span
                  className={`text-xs font-medium ${
                    byparrMessage.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {byparrMessage}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div>
            <span className="text-xs font-medium text-slate-200">
              Enable Byparr for Source Fetching & Images
            </span>
            <p className="text-[11px] text-slate-400">
              Automatically routes protected manga source requests and image fetching through Byparr and the internal image proxy.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.byparrEnabled ?? true}
            onChange={(e) => onUpdateSettings({ byparrEnabled: e.target.checked })}
            className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
          />
        </div>
      </section>

      {/* Reader Defaults */}
      <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span>Reader Preferences</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Default Reading Mode</label>
            <select
              value={settings.readerMode}
              onChange={(e) => onUpdateSettings({ readerMode: e.target.value as any })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="webtoon">Continuous Webtoon (Vertical Scroll)</option>
              <option value="single">Single Page</option>
              <option value="double">Double Page Spread</option>
              <option value="rtl">Right to Left (Japanese Manga)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Default Background</label>
            <select
              value={settings.readerBackground}
              onChange={(e) => onUpdateSettings({ readerBackground: e.target.value as any })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="black">Pure Black (OLED)</option>
              <option value="dark">Dark Slate</option>
              <option value="sepia">Sepia Book Tone</option>
              <option value="white">Clean White</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xs font-medium text-slate-200">
              Auto-Download New Chapters
            </span>
            <p className="text-[11px] text-slate-400">
              Automatically queue downloads when new chapters appear in Library Updates.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.autoDownload}
            onChange={(e) => onUpdateSettings({ autoDownload: e.target.checked })}
            className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
          />
        </div>
      </section>

      {/* Backup and Restore */}
      <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <span>Backup & Restore</span>
        </h3>
        <p className="text-xs text-slate-400">
          Suwayomi-compatible backup format allows exporting and importing all manga titles, categories, chapter reading progress, trackers, and server settings.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={onExportBackup}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup JSON</span>
          </button>

          <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors border border-slate-700 flex items-center gap-2 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore From File</span>
            <input
              type="file"
              accept=".json"
              onChange={onImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Suwayomi TypeScript Edition
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Successfully migrated from Kotlin/Java to full TypeScript Next.js architecture.
            Provides REST API v1, GraphQL endpoints, OPDS feeds, and a high-performance web reader.
          </p>
        </div>
      </section>
    </div>
  );
};
