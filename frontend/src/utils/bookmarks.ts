import type { Bookmark, SearchHistoryItem, Address } from "../types";

const BOOKMARKS_KEY = "babel_bookmarks_v1";
const HISTORY_KEY = "babel_history_v1";

export function loadBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load bookmarks", e);
    return [];
  }
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch (e) {
    console.error("Failed to save bookmarks", e);
  }
}

export function isPageBookmarked(address: Address): boolean {
  const bookmarks = loadBookmarks();
  return bookmarks.some(
    (b) =>
      b.address.hexagon === address.hexagon &&
      b.address.wall === address.wall &&
      b.address.shelf === address.shelf &&
      b.address.volume === address.volume &&
      b.address.page === address.page
  );
}

export function addBookmark(
  address: Address,
  title: string,
  excerpt: string,
  note?: string
): Bookmark {
  const bookmarks = loadBookmarks();
  const id = `${address.hexagon}_${address.wall}_${address.shelf}_${address.volume}_${address.page}`;
  
  // Remove existing if any
  const filtered = bookmarks.filter((b) => b.id !== id);
  const newBookmark: Bookmark = {
    id,
    address,
    title,
    excerpt: excerpt.slice(0, 200),
    note,
    createdAt: Date.now(),
  };

  filtered.unshift(newBookmark);
  saveBookmarks(filtered);
  return newBookmark;
}

export function removeBookmark(id: string): void {
  const bookmarks = loadBookmarks();
  const filtered = bookmarks.filter((b) => b.id !== id);
  saveBookmarks(filtered);
}

export function exportBookmarksJSON(): string {
  const bookmarks = loadBookmarks();
  return JSON.stringify(bookmarks, null, 2);
}

export function importBookmarksJSON(jsonString: string): Bookmark[] {
  const parsed = JSON.parse(jsonString);
  if (!Array.isArray(parsed)) {
    throw new Error("Неверный формат данных: ожидается массив закладок");
  }
  saveBookmarks(parsed);
  return parsed;
}

export function loadSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load search history", e);
    return [];
  }
}

export function saveSearchHistory(history: SearchHistoryItem[]): void {
  try {
    // Keep at most 50 entries
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch (e) {
    console.error("Failed to save search history", e);
  }
}

export function addSearchHistoryItem(
  query: string,
  mode: SearchHistoryItem["mode"],
  address?: Address
): void {
  const history = loadSearchHistory();
  const item: SearchHistoryItem = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    query,
    mode,
    address,
    timestamp: Date.now(),
  };
  history.unshift(item);
  saveSearchHistory(history);
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error("Failed to clear search history", e);
  }
}
