import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ArrowLeft,
  Hexagon,
  Layers,
  BookMarked,
  FileText,
  Loader2,
  Bookmark as BookmarkIcon,
  Volume2,
  VolumeX,
  Download,
  Palette,
  AlignLeft,
  Grid,
  ZoomIn,
  ZoomOut,
  Compass,
} from "lucide-react";
import { browsePage } from "../api/client";
import type { Address, BrowseResult, ReaderTheme, DisplayMode } from "../types";
import { libraryAudio } from "../utils/audio";
import {
  isPageBookmarked,
  addBookmark,
  removeBookmark,
  loadBookmarks,
} from "../utils/bookmarks";

const ROWS = 40;
const COLS = 80;

export default function ReaderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [pageData, setPageData] = useState<BrowseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Settings & View state
  const [theme, setTheme] = useState<ReaderTheme>("cosmic");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("grid");
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");

  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Bookmarking state
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Jump popover state
  const [showJump, setShowJump] = useState(false);
  const [jumpVol, setJumpVol] = useState(1);
  const [jumpPage, setJumpPage] = useState(1);

  // Parse address from URL params
  const address: Address = {
    hexagon: searchParams.get("hex") || "0",
    wall: Number(searchParams.get("wall") || 1),
    shelf: Number(searchParams.get("shelf") || 1),
    volume: Number(searchParams.get("volume") || 1),
    page: Number(searchParams.get("page") || 1),
  };

  const highlightOffset = Number(searchParams.get("offset") || -1);
  const highlightLen = Number(searchParams.get("len") || 0);

  useEffect(() => {
    setJumpVol(address.volume);
    setJumpPage(address.page);
    setBookmarked(isPageBookmarked(address));
  }, [address.hexagon, address.wall, address.shelf, address.volume, address.page]);

  const fetchPage = useCallback(async (addr: Address) => {
    setLoading(true);
    setError(null);
    try {
      const data = await browsePage(addr);
      setPageData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(address);
    // Stop any ongoing speech when switching pages
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const navigateToPage = (newAddr: Partial<Address>) => {
    libraryAudio.playPageTurn();
    const merged = { ...address, ...newAddr };
    const params = new URLSearchParams({
      hex: merged.hexagon,
      wall: String(merged.wall),
      shelf: String(merged.shelf),
      volume: String(merged.volume),
      page: String(merged.page),
    });
    navigate(`/read?${params.toString()}`);
  };

  const prevPage = () => {
    if (address.page > 1) {
      navigateToPage({ page: address.page - 1 });
    } else if (address.volume > 1) {
      navigateToPage({ volume: address.volume - 1, page: 410 });
    }
  };

  const nextPage = () => {
    if (address.page < 410) {
      navigateToPage({ page: address.page + 1 });
    } else if (address.volume < 32) {
      navigateToPage({ volume: address.volume + 1, page: 1 });
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowJump(false);
    navigateToPage({
      volume: Math.min(32, Math.max(1, jumpVol)),
      page: Math.min(410, Math.max(1, jumpPage)),
    });
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAllText = async () => {
    if (!pageData) return;
    await navigator.clipboard.writeText(pageData.text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const downloadTextFile = () => {
    if (!pageData) return;
    const blob = new Blob([pageData.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Babel_Hex_${address.hexagon.slice(0, 8)}_W${address.wall}_S${address.shelf}_V${address.volume}_P${address.page}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // TTS Toggle
  const toggleTTS = () => {
    if (!pageData || !("speechSynthesis" in window)) {
      alert("Синтез речи не поддерживается в этом браузере.");
      return;
    }

    const synth = window.speechSynthesis;
    synthRef.current = synth;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
    } else {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(pageData.text.slice(0, 1000));
      utterance.lang = "ru-RU";
      utterance.rate = 0.95;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      synth.speak(utterance);
    }
  };

  // Bookmark Toggle
  const toggleBookmark = () => {
    if (bookmarked) {
      const bms = loadBookmarks();
      const match = bms.find(
        (b) =>
          b.address.hexagon === address.hexagon &&
          b.address.wall === address.wall &&
          b.address.shelf === address.shelf &&
          b.address.volume === address.volume &&
          b.address.page === address.page
      );
      if (match) removeBookmark(match.id);
      setBookmarked(false);
    } else {
      setShowNoteModal(true);
    }
  };

  const confirmAddBookmark = () => {
    if (!pageData) return;
    addBookmark(
      address,
      pageData.title,
      pageData.text.slice(0, 180),
      bookmarkNote.trim()
    );
    setBookmarked(true);
    setShowNoteModal(false);
    setBookmarkNote("");
  };

  const hexDisplay =
    address.hexagon.length > 20
      ? address.hexagon.slice(0, 10) + "…" + address.hexagon.slice(-10)
      : address.hexagon;

  // Theme styling rules
  const themeClasses: Record<ReaderTheme, { container: string; text: string; hl: string }> = {
    cosmic: {
      container: "bg-babel-card/70 border-babel-border/40",
      text: "text-babel-cream/80",
      hl: "bg-babel-gold/30 text-babel-gold font-bold",
    },
    parchment: {
      container: "bg-[#f5ecdf] border-[#d8c7ad] text-[#2c2214]",
      text: "text-[#3c3022]",
      hl: "bg-[#c8923a]/30 text-[#844c06] font-bold underline",
    },
    matrix: {
      container: "bg-[#040e06] border-green-900/50 text-green-400 font-mono",
      text: "text-green-400/80",
      hl: "bg-green-500/30 text-green-200 font-bold underline",
    },
    archive: {
      container: "bg-[#141724] border-cyan-900/40 text-slate-200",
      text: "text-slate-300",
      hl: "bg-cyan-500/30 text-cyan-200 font-bold",
    },
  };

  const fontSizeClasses = {
    sm: "text-[10px] sm:text-[11px] leading-[1.3]",
    md: "text-[11px] sm:text-xs leading-[1.35]",
    lg: "text-xs sm:text-sm leading-[1.45]",
  };

  // Render 40x80 Grid
  const renderGrid = () => {
    if (!pageData) return null;
    const text = pageData.text;
    const lines: React.ReactNode[] = [];
    const currentTheme = themeClasses[theme];

    for (let row = 0; row < ROWS; row++) {
      const lineStart = row * COLS;
      const lineChars: React.ReactNode[] = [];

      for (let col = 0; col < COLS; col++) {
        const idx = lineStart + col;
        const ch = idx < text.length ? text[idx] : " ";
        const isHighlighted =
          highlightLen > 0 &&
          highlightOffset >= 0 &&
          idx >= highlightOffset &&
          idx < highlightOffset + highlightLen;

        lineChars.push(
          <span
            key={col}
            className={isHighlighted ? currentTheme.hl : currentTheme.text}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        );
      }

      lines.push(
        <div key={row}>
          {lineChars}
        </div>
      );
    }

    return lines;
  };

  // Render Book / Flowing view
  const renderBookView = () => {
    if (!pageData) return null;
    const text = pageData.text;
    const currentTheme = themeClasses[theme];

    // Highlight query if present
    if (highlightLen > 0 && highlightOffset >= 0) {
      const before = text.slice(0, highlightOffset);
      const target = text.slice(highlightOffset, highlightOffset + highlightLen);
      const after = text.slice(highlightOffset + highlightLen);

      return (
        <div className="space-y-4 font-serif text-sm sm:text-base leading-relaxed tracking-wide text-justify">
          <p>
            {before}
            <mark className={`${currentTheme.hl} px-1 rounded`}>{target}</mark>
            {after}
          </p>
        </div>
      );
    }

    // Split every 400 chars into paragraphs
    const paragraphs: string[] = [];
    for (let i = 0; i < text.length; i += 400) {
      paragraphs.push(text.slice(i, i + 400));
    }

    return (
      <div className="space-y-4 font-serif text-sm sm:text-base leading-relaxed tracking-wide text-justify">
        {paragraphs.map((para, i) => (
          <p key={i} className="indent-6">
            {para}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
      {/* ── Top Bar: Back, Shelf link, Action controls ──────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-babel-muted hover:text-babel-cream transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            К поиску
          </button>
          <span className="text-babel-border">|</span>
          <Link
            to={`/browse?hex=${address.hexagon}&wall=${address.wall}&shelf=${address.shelf}`}
            className="flex items-center gap-1.5 text-babel-gold/80 hover:text-babel-gold transition-colors font-medium"
          >
            <Compass className="w-4 h-4" />
            Вернуться на полку шкафа
          </Link>
        </div>

        {/* Toolbar: Bookmark, Audio TTS, Copy, Download, Theme */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bookmark Button */}
          <button
            onClick={toggleBookmark}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
              bookmarked
                ? "bg-babel-gold/20 text-babel-gold border-babel-gold/50 font-semibold"
                : "border-babel-border/40 text-babel-muted hover:text-babel-cream hover:border-babel-gold/30"
            }`}
            title={bookmarked ? "Удалить закладку" : "Добавить в закладки"}
          >
            <BookmarkIcon className={`w-3.5 h-3.5 ${bookmarked ? "fill-babel-gold" : ""}`} />
            {bookmarked ? "В закладках" : "В закладки"}
          </button>

          {/* TTS Button */}
          <button
            onClick={toggleTTS}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
              isSpeaking
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                : "border-babel-border/40 text-babel-muted hover:text-babel-cream"
            }`}
            title="Озвучить страницу на русском"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Остановить
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                Голос
              </>
            )}
          </button>

          {/* Copy text */}
          <button
            onClick={copyAllText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-babel-border/40 text-babel-muted hover:text-babel-cream text-xs transition-all"
            title="Скопировать весь текст страницы"
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                Скопировано
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Текст
              </>
            )}
          </button>

          {/* Download file */}
          <button
            onClick={downloadTextFile}
            className="p-1.5 rounded-lg border border-babel-border/40 text-babel-muted hover:text-babel-cream hover:border-babel-gold/30 text-xs transition-all"
            title="Скачать файл страницы (.txt)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Theme Dropdown / Buttons */}
          <div className="flex items-center bg-babel-card border border-babel-border/40 rounded-lg p-0.5">
            <button
              onClick={() => setTheme("cosmic")}
              className={`p-1.5 rounded text-xs ${
                theme === "cosmic" ? "bg-babel-gold/20 text-babel-gold font-bold" : "text-babel-muted"
              }`}
              title="Космическая тёмная тема"
            >
              <Palette className="w-3 h-3" />
            </button>
            <button
              onClick={() => setTheme("parchment")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-serif ${
                theme === "parchment" ? "bg-[#e8dcbe] text-[#3c2a12] font-bold" : "text-babel-muted"
              }`}
              title="Пергаментная тема"
            >
              Пергамент
            </button>
            <button
              onClick={() => setTheme("matrix")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                theme === "matrix" ? "bg-green-950 text-green-400 font-bold" : "text-babel-muted"
              }`}
              title="Матрица"
            >
              Matrix
            </button>
          </div>

          {/* Display Mode: Grid vs Flowing Book */}
          <div className="flex items-center bg-babel-card border border-babel-border/40 rounded-lg p-0.5">
            <button
              onClick={() => setDisplayMode("grid")}
              className={`p-1.5 rounded text-xs ${
                displayMode === "grid" ? "bg-babel-gold/20 text-babel-gold" : "text-babel-muted"
              }`}
              title="Сетка 40×80 (оригинал)"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDisplayMode("book")}
              className={`p-1.5 rounded text-xs ${
                displayMode === "book" ? "bg-babel-gold/20 text-babel-gold" : "text-babel-muted"
              }`}
              title="Книжный режим (поток текста)"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Font size zoom */}
          <div className="flex items-center bg-babel-card border border-babel-border/40 rounded-lg p-0.5 text-babel-muted">
            <button
              onClick={() => setFontSize((f) => (f === "lg" ? "md" : "sm"))}
              className="p-1.5 hover:text-babel-cream"
              title="Уменьшить шрифт"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] px-1 font-mono">{fontSize}</span>
            <button
              onClick={() => setFontSize((f) => (f === "sm" ? "md" : "lg"))}
              className="p-1.5 hover:text-babel-cream"
              title="Увеличить шрифт"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Address Bar ────────────────────────────────────────── */}
      <div className="bg-babel-card/80 backdrop-blur-sm border border-babel-border/50 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2" title={address.hexagon}>
            <Hexagon className="w-4 h-4 text-babel-gold/80" />
            <span className="text-babel-muted">Hex:</span>
            <span className="font-mono text-babel-cream text-xs">{hexDisplay}</span>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-babel-gold/80" />
            <span className="text-babel-muted">
              Стена {address.wall}, Полка {address.shelf}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-babel-gold/80" />
            <span className="text-babel-muted">Том {address.volume} / 32</span>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-babel-gold/80" />
            <span className="text-babel-muted">Стр. {address.page} / 410</span>
          </div>

          {/* Quick jump trigger */}
          <div className="relative ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowJump(!showJump)}
              className="px-2.5 py-1 text-xs font-mono rounded-lg border border-babel-border/40 text-babel-gold hover:bg-babel-surface transition-colors"
            >
              Перейти…
            </button>

            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-babel-border/40 text-babel-muted hover:text-babel-cream text-xs transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-400" />
                  Ссылка
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Ссылка
                </>
              )}
            </button>

            {/* Jump popover */}
            {showJump && (
              <div className="absolute right-0 top-10 z-30 p-4 rounded-xl bg-babel-surface border border-babel-border shadow-2xl space-y-3 w-64">
                <div className="text-xs font-semibold text-babel-cream">
                  Быстрый переход в этом гексагоне:
                </div>
                <form onSubmit={handleJumpSubmit} className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-babel-muted">Том (1–32):</span>
                    <input
                      type="number"
                      min={1}
                      max={32}
                      value={jumpVol}
                      onChange={(e) => setJumpVol(Number(e.target.value))}
                      className="w-16 bg-babel-bg border border-babel-border px-2 py-1 rounded text-center font-mono text-babel-cream"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-babel-muted">Стр. (1–410):</span>
                    <input
                      type="number"
                      min={1}
                      max={410}
                      value={jumpPage}
                      onChange={(e) => setJumpPage(Number(e.target.value))}
                      className="w-16 bg-babel-bg border border-babel-border px-2 py-1 rounded text-center font-mono text-babel-cream"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowJump(false)}
                      className="px-2.5 py-1 text-xs text-babel-muted hover:text-babel-cream"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-babel-gold text-babel-bg font-bold text-xs rounded hover:bg-amber-400"
                    >
                      Перейти
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        {pageData && (
          <div className="mt-3 pt-3 border-t border-babel-border/30 flex items-baseline gap-2">
            <span className="text-babel-muted text-xs">Название тома:</span>
            <span className="font-mono text-babel-gold text-sm font-semibold">
              «{pageData.title.trim() || "—"}»
            </span>
          </div>
        )}
      </div>

      {/* ── Page Content Container ─────────────────────────────── */}
      <div
        className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl ${
          themeClasses[theme].container
        }`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-36 space-y-3">
            <Loader2 className="w-8 h-8 text-babel-gold animate-spin" />
            <span className="text-xs text-babel-muted font-mono">
              Считывание детерминированной страницы…
            </span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400">{error}</div>
        ) : (
          <div className="p-6 sm:p-8 overflow-x-auto">
            {displayMode === "grid" ? (
              <div
                className={`font-mono whitespace-pre min-w-[660px] ${fontSizeClasses[fontSize]}`}
              >
                {renderGrid()}
              </div>
            ) : (
              <div className="max-w-3xl mx-auto py-4">
                {renderBookView()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Page Flip Navigation ────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={prevPage}
          disabled={address.page === 1 && address.volume === 1}
          className="flex items-center gap-2 py-2.5 px-5 rounded-xl border border-babel-border/40 text-babel-muted hover:text-babel-cream hover:border-babel-gold/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Предыдущая
        </button>

        <div className="flex items-center gap-3 font-mono text-xs text-babel-muted">
          <span>Том {address.volume} / 32</span>
          <span className="text-babel-border">·</span>
          <span>Стр. {address.page} / 410</span>
        </div>

        <button
          onClick={nextPage}
          disabled={address.page === 410 && address.volume === 32}
          className="flex items-center gap-2 py-2.5 px-5 rounded-xl border border-babel-border/40 text-babel-muted hover:text-babel-cream hover:border-babel-gold/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
        >
          Следующая
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Bookmark Note Modal ────────────────────────────────── */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-babel-card border border-babel-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-babel-cream flex items-center gap-2">
              <BookmarkIcon className="w-4 h-4 text-babel-gold" />
              Добавить закладку
            </h4>
            <p className="text-xs text-babel-muted">
              Страница {address.page} тома {address.volume} (Гексагон {hexDisplay})
            </p>
            <textarea
              value={bookmarkNote}
              onChange={(e) => setBookmarkNote(e.target.value)}
              placeholder="Добавьте примечание или пояснение к закладке (необязательно)…"
              rows={3}
              className="w-full bg-babel-bg border border-babel-border rounded-xl p-3 text-xs text-babel-cream focus:outline-none focus:border-babel-gold resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 text-xs text-babel-muted hover:text-babel-cream"
              >
                Отмена
              </button>
              <button
                onClick={confirmAddBookmark}
                className="px-4 py-2 bg-babel-gold text-babel-bg font-semibold rounded-xl text-xs hover:bg-amber-400"
              >
                Сохранить закладку
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
