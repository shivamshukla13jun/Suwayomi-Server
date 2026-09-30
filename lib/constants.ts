import { Category, ServerSettings } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Reading', order: 0, isDefault: true },
  { id: 2, name: 'Completed', order: 1 },
  { id: 3, name: 'Plan to Read', order: 2 },
  { id: 4, name: 'Favorites', order: 3 },
  { id: 5, name: 'On Hold', order: 4 },
];

export const DEFAULT_SETTINGS: ServerSettings = {
  serverPort: 3000,
  serverHost: '0.0.0.0',
  theme: 'dark',
  readerMode: 'webtoon',
  readerDirection: 'vertical',
  readerBackground: 'black',
  readerFit: 'width',
  autoDownload: false,
  downloadLocation: '/downloads/suwayomi',
  opdsEnabled: true,
  corsEnabled: true,
  gridSize: 'comfortable',
  autoUpdateInterval: 12,
  byparrEnabled: true,
  byparrUrl: 'http://localhost:8191/v1',
  byparrTimeout: 60000,
};
