import type {
  Address,
  SearchMode,
  SearchResult,
  BrowseResult,
  ShelfResponse,
  LibraryStats,
} from "../types";

// In Vite dev environment with proxy configured, relative path /api works directly.
// If accessed directly from other ports, fallback to http://localhost:8000
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (window.location.port === "5173" ? "" : "http://localhost:8000");

export async function searchLibrary(
  query: string,
  mode: SearchMode
): Promise<SearchResult> {
  const res = await fetch(`${API_BASE}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, mode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Ошибка поиска");
  }
  return res.json();
}

export async function browsePage(address: Address): Promise<BrowseResult> {
  const params = new URLSearchParams({
    hexagon: address.hexagon,
    wall: String(address.wall),
    shelf: String(address.shelf),
    volume: String(address.volume),
    page: String(address.page),
  });
  const res = await fetch(`${API_BASE}/api/browse?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Ошибка загрузки страницы");
  }
  return res.json();
}

export async function getShelf(
  hexagon: string,
  wall: number,
  shelf: number
): Promise<ShelfResponse> {
  const params = new URLSearchParams({
    hexagon,
    wall: String(wall),
    shelf: String(shelf),
  });
  const res = await fetch(`${API_BASE}/api/shelf?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Ошибка загрузки полок");
  }
  return res.json();
}

export async function getRandomPage(): Promise<Address> {
  const res = await fetch(`${API_BASE}/api/random`);
  if (!res.ok) {
    throw new Error("Ошибка генерации случайного адреса");
  }
  return res.json();
}

export async function getStats(): Promise<LibraryStats> {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) {
    throw new Error("Ошибка получения параметров библиотеки");
  }
  return res.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}
