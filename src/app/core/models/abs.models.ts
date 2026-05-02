export interface LoginResponse {
  user: ABSUser;
  userDefaultLibraryId: string;
  serverSettings: Record<string, unknown>;
}

export interface ABSUser {
  id: string;
  username: string;
  type: string;
  token: string;
  mediaProgress: MediaProgress[];
  seriesHideFromContinueListening: string[];
  isActive: boolean;
  createdAt: number;
}

export interface MediaProgress {
  id: string;
  libraryItemId: string;
  episodeId: string | null;
  duration: number;
  progress: number;
  currentTime: number;
  isFinished: boolean;
  hideFromContinueListening: boolean;
  lastUpdate: number;
  startedAt: number;
  finishedAt: number | null;
}

export interface Library {
  id: string;
  name: string;
  folders: { id: string; fullPath: string }[];
  displayOrder: number;
  icon: string;
  mediaType: 'book' | 'podcast';
  provider: string;
  settings: Record<string, unknown>;
  createdAt: number;
  lastUpdate: number;
}

export interface LibraryItem {
  id: string;
  ino: string;
  libraryId: string;
  folderId: string;
  path: string;
  relPath: string;
  isFile: boolean;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  addedAt: number;
  updatedAt: number;
  isMissing: boolean;
  isInvalid: boolean;
  mediaType: 'book' | 'podcast';
  media: BookMedia;
  numFiles: number;
  size: number;
  userMediaProgress?: MediaProgress;
}

export interface BookMedia {
  libraryItemId: string;
  metadata: BookMetadata;
  coverPath: string | null;
  tags: string[];
  audioFiles: unknown[];
  chapters: unknown[];
  duration: number;
  size: number;
  tracks: unknown[];
}

export interface BookMetadata {
  title: string;
  titleIgnorePrefix: string;
  subtitle: string | null;
  authors: { id: string; name: string }[];
  narrators: string[];
  series: SeriesSequence[];
  genres: string[];
  publishedYear: string | null;
  publishedDate: string | null;
  publisher: string | null;
  description: string | null;
  isbn: string | null;
  asin: string | null;
  language: string | null;
  explicit: boolean;
}

export interface SeriesSequence {
  id: string;
  name: string;
  sequence: string;
}

export interface Series {
  id: string;
  name: string;
  nameIgnorePrefix: string;
  libraryId: string;
  addedAt: number;
  updatedAt: number;
  numBooks: number;
  books: LibraryItem[];
  inProgress?: boolean;
  hasActiveBook?: boolean;
}

export interface PersonalizedShelf {
  id: string;
  label: string;
  labelStringKey: string;
  type: 'book' | 'podcast' | 'episode' | 'series';
  entities: LibraryItem[] | Series[];
  category: string;
}

export interface LibraryItemsResponse {
  results: LibraryItem[];
  total: number;
  limit: number;
  page: number;
  sortBy: string;
  sortDesc: boolean;
  filterBy: string;
  mediaType: string;
  minified: boolean;
  collapseseries: boolean;
  include: string;
}

export interface SeriesResponse {
  results: Series[];
  total: number;
  limit: number;
  page: number;
}

export interface ListeningSession {
  id: string;
  userId: string;
  libraryId: string;
  libraryItemId: string;
  mediaType: string;
  mediaMetadata: BookMetadata;
  displayTitle: string;
  displayAuthor: string;
  coverPath: string;
  duration: number;
  playMethod: number;
  startTime: number;
  currentTime: number;
  timeListening: number;
  startedAt: number;
  updatedAt: number;
}

export interface UserStats {
  totalBooksFinished: number;
  totalBooksStarted: number;
  totalListeningTime: number;
  sessions: ListeningSession[];
}
