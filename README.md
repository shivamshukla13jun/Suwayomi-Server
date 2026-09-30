# Suwayomi Manga Reader (TypeScript Edition)

A high-performance, full-stack manga reader and library server written entirely in **TypeScript** and **Next.js**, completely replacing the legacy Kotlin/Java server.

Compatible with Mihon (Tachiyomi) sources, extensions, backup formats, OPDS feeds, and Tachidesk clients.

---

## Features

- **Full Manga Library Management**:
  - Organize manga into custom categories (Reading, Completed, Plan to Read, Favorites, On Hold, or custom created).
  - Track total chapters, unread chapters, latest chapter releases, and reading progress.
  - Comfortable grid, compact grid, and detailed list display modes.
- **Modern Web Manga Reader**:
  - **Reading Modes**: Continuous Webtoon (seamless vertical scroll), Single Page, Double Page spread, and Right-to-Left (traditional Japanese Manga layout).
  - **Customization**: Pure OLED Black, Dark Slate, Warm Sepia, or White backgrounds with Fit Width / Fit Height / Fit Screen scaling.
  - Interactive page scrubber, chapter jump drawer, keyboard navigation (`A`/`D`, Arrow keys, `F` for fullscreen).
  - Automatic progress saving and chapter completion tracking.
- **Extensions & Sources Catalog**:
  - Browse installed and available extensions from the Keiyoushi Extension Repository.
  - Browse manga by source (MangaDex, WEBTOON, Flame Comics, MangaFox, Local Source).
  - Search catalogs and filter by popular, latest, or genre.
- **Updates & Reading History**:
  - Live timeline of new chapters released for library series.
  - Chronological reading history with progress bars and instant "Resume" action.
- **Offline Chapter Downloads**:
  - Download queue with progress tracking, pause/resume, and offline local storage caching.
- **Backup & Restore**:
  - Export and import Mihon/Tachiyomi compatible JSON backups.
- **OPDS Feed**:
  - XML OPDS 1.2 catalog available at `/api/opds/v1.2` for KOReader, Panels, Moon+ Reader, and e-ink devices.
- **Full REST & GraphQL API**:
  - Endpoints at `/api/v1/manga`, `/api/v1/category`, `/api/v1/source`, `/api/v1/extension`, `/api/v1/download`, `/api/v1/settings`, and `/api/graphql`.

---

## Tech Stack

- **Runtime**: Node.js 22 (TypeScript)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Animations**: Framer Motion

---

## Running the App

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access Suwayomi.
