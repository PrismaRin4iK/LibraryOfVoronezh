import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bookmark as BookmarkIcon,
  History,
  X,
  Trash2,
  ExternalLink,
  Download,
  Upload,
  BookOpen,
  Calendar,
  FileText,
  Search,
} from "lucide-react";
import type { Bookmark, SearchHistoryItem } from "../types";
import {
  loadBookmarks,
  removeBookmark,
  exportBookmarksJSON,
  importBookmarksJSON,
  loadSearchHistory,
  clearSearchHistory,
  addBookmark,
} from "../utils/bookmarks";

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookmarksChange?: () => void;
}

export default function BookmarksModal({
  isOpen,
  onClose,
  onBookmarksChange,
}: BookmarksModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"bookmarks" | "history">("bookmarks");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const refreshData = () => {
    setBookmarks(loadBookmarks());
    setHistory(loadSearchHistory());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteBookmark = (id: string) => {
    removeBookmark(id);
    refreshData();
    onBookmarksChange?.();
  };

  const handleSaveNote = (b: Bookmark) => {
    addBookmark(b.address, b.title, b.excerpt, noteText.trim());
    setEditingNoteId(null);
    setNoteText("");
    refreshData();
    onBookmarksChange?.();
  };

  const handleExport = () => {
    const json = exportBookmarksJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `babel_bookmarks_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        importBookmarksJSON(text);
        refreshData();
        onBookmarksChange?.();
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Ошибка импорта файла");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClearHistory = () => {
    if (window.confirm("Очистить историю поисков?")) {
      clearSearchHistory();
      refreshData();
    }
  };

  const openBookmark = (b: Bookmark) => {
    onClose();
    const params = new URLSearchParams({
      hex: b.address.hexagon,
      wall: String(b.address.wall),
      shelf: String(b.address.shelf),
      volume: String(b.address.volume),
      page: String(b.address.page),
    });
    navigate(`/read?${params.toString()}`);
  };

  const searchFromHistory = (item: SearchHistoryItem) => {
    onClose();
    if (item.address) {
      const params = new URLSearchParams({
        hex: item.address.hexagon,
        wall: String(item.address.wall),
        shelf: String(item.address.shelf),
        volume: String(item.address.volume),
        page: String(item.address.page),
      });
      navigate(`/read?${params.toString()}`);
    } else {
      navigate(`/?q=${encodeURIComponent(item.query)}&mode=${item.mode}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-babel-card border border-babel-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-babel-border/40 flex items-center justify-between bg-babel-surface/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "bookmarks"
                  ? "bg-babel-gold/15 text-babel-gold border border-babel-gold/40"
                  : "text-babel-muted hover:text-babel-cream"
              }`}
            >
              <BookmarkIcon className="w-4 h-4" />
              Закладки ({bookmarks.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "history"
                  ? "bg-babel-gold/15 text-babel-gold border border-babel-gold/40"
                  : "text-babel-muted hover:text-babel-cream"
              }`}
            >
              <History className="w-4 h-4" />
              История ({history.length})
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-babel-muted hover:text-babel-cream p-1.5 rounded-lg hover:bg-babel-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar for active tab */}
        <div className="px-6 py-2.5 bg-babel-surface/20 border-b border-babel-border/20 flex items-center justify-between text-xs">
          {activeTab === "bookmarks" ? (
            <>
              <span className="text-babel-muted">Сохранённые страницы библиотеки</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  disabled={bookmarks.length === 0}
                  className="flex items-center gap-1 text-babel-muted hover:text-babel-gold disabled:opacity-40 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Экспорт
                </button>
                <span className="text-babel-border">|</span>
                <label className="flex items-center gap-1 text-babel-muted hover:text-babel-gold cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Импорт
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>
            </>
          ) : (
            <>
              <span className="text-babel-muted">Предыдущие поисковые запросы</span>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1 text-red-400/80 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Очистить всё
                </button>
              )}
            </>
          )}
        </div>

        {importError && (
          <div className="px-6 py-2 bg-red-500/10 text-red-400 text-xs border-b border-red-500/20">
            {importError}
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {activeTab === "bookmarks" ? (
            bookmarks.length === 0 ? (
              <div className="text-center py-12 text-babel-muted">
                <BookmarkIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Закладок пока нет</p>
                <p className="text-xs text-babel-muted/60 mt-1">
                  Нажмите на значок закладки во время чтения страницы, чтобы сохранить её.
                </p>
              </div>
            ) : (
              bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl bg-babel-surface/60 border border-babel-border/40 hover:border-babel-gold/30 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-mono text-babel-gold flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        {b.title ? `«${b.title.trim()}»` : "Без названия"}
                      </div>
                      <div className="text-[11px] text-babel-muted mt-0.5">
                        Гексагон {b.address.hexagon.length > 16 ? b.address.hexagon.slice(0, 8) + "…" + b.address.hexagon.slice(-6) : b.address.hexagon}
                        {" · "}Стена {b.address.wall}
                        {" · "}Полка {b.address.shelf}
                        {" · "}Том {b.address.volume}
                        {" · "}Стр. {b.address.page}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openBookmark(b)}
                        title="Открыть в Читальном зале"
                        className="p-1.5 rounded-lg text-babel-muted hover:text-babel-gold hover:bg-babel-card transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBookmark(b.id)}
                        title="Удалить закладку"
                        className="p-1.5 rounded-lg text-babel-muted hover:text-red-400 hover:bg-babel-card transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {b.excerpt && (
                    <div className="font-mono text-[11px] text-babel-cream/60 bg-babel-bg/60 p-2.5 rounded-lg border border-babel-border/20 line-clamp-2">
                      {b.excerpt}…
                    </div>
                  )}

                  {/* Note block */}
                  {editingNoteId === b.id ? (
                    <div className="pt-2 border-t border-babel-border/20 flex gap-2">
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Заметка к странице…"
                        className="flex-1 bg-babel-bg text-xs px-3 py-1.5 rounded-lg border border-babel-border focus:border-babel-gold outline-none text-babel-cream"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveNote(b);
                        }}
                      />
                      <button
                        onClick={() => handleSaveNote(b)}
                        className="px-3 py-1.5 bg-babel-gold text-babel-bg text-xs font-semibold rounded-lg hover:bg-amber-400"
                      >
                        ОК
                      </button>
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="px-2 py-1.5 text-xs text-babel-muted hover:text-babel-cream"
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-babel-muted/70 pt-1">
                      <span
                        onClick={() => {
                          setEditingNoteId(b.id);
                          setNoteText(b.note || "");
                        }}
                        className="cursor-pointer hover:text-babel-gold flex items-center gap-1 italic"
                      >
                        <FileText className="w-3 h-3" />
                        {b.note ? `Заметка: ${b.note}` : "+ Добавить заметку"}
                      </span>
                      <span className="flex items-center gap-1 text-[10px]">
                        <Calendar className="w-3 h-3" />
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-babel-muted">
              <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">История поиска пуста</p>
              <p className="text-xs text-babel-muted/60 mt-1">
                Все выполненные поисковые запросы будут сохранены здесь.
              </p>
            </div>
          ) : (
            history.map((h) => (
              <div
                key={h.id}
                onClick={() => searchFromHistory(h)}
                className="p-3.5 rounded-xl bg-babel-surface/50 border border-babel-border/30 hover:border-babel-gold/40 hover:bg-babel-surface/80 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded-lg bg-babel-card text-babel-gold">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono text-babel-cream group-hover:text-babel-gold truncate transition-colors">
                      {h.query}
                    </div>
                    <div className="text-[10px] text-babel-muted mt-0.5">
                      Режим:{" "}
                      {h.mode === "exact"
                        ? "Точное совпадение"
                        : h.mode === "random_chars"
                        ? "Среди символов"
                        : h.mode === "random_words"
                        ? "Среди слов"
                        : "По названию"}
                      {" · "}
                      {new Date(h.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-babel-muted/40 group-hover:text-babel-gold transition-colors shrink-0 ml-2" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
