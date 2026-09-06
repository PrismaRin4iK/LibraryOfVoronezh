export interface Address {
  hexagon: string;
  wall: number;
  shelf: number;
  volume: number;
  page: number;
}

export type SearchMode = "exact" | "random_chars" | "random_words" | "title";

export interface SearchRequest {
  query: string;
  mode: SearchMode;
}

export interface SearchResult {
  address: Address;
  offset: number;
  query_length: number;
  preview: string;
}

export interface BrowseResult {
  text: string;
  title: string;
}

export interface ModeOption {
  value: SearchMode;
  label: string;
  description: string;
  icon: string;
}

export interface ShelfVolume {
  volume: number;
  title: string;
}

export interface ShelfResponse {
  hexagon: string;
  wall: number;
  shelf: number;
  volumes: ShelfVolume[];
}

export interface LibraryStats {
  alphabet_size: number;
  alphabet: string;
  page_length: number;
  title_length: number;
  walls_per_hex: number;
  shelves_per_wall: number;
  volumes_per_shelf: number;
  pages_per_volume: number;
  volumes_per_hex: number;
  pages_per_hex: number;
  dictionary_size: number;
  total_combinations: string;
}

export interface Bookmark {
  id: string;
  address: Address;
  title: string;
  excerpt: string;
  note?: string;
  createdAt: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  mode: SearchMode;
  address?: Address;
  timestamp: number;
}

export type ReaderTheme = "cosmic" | "parchment" | "matrix" | "archive";
export type DisplayMode = "grid" | "book";
