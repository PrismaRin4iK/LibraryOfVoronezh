import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Search,
  Shuffle,
  Target,
  Sparkles,
  BookOpen,
  Tag,
  Loader2,
  Compass,
  Quote,
  ArrowRight,
} from "lucide-react";
import { searchLibrary, getRandomPage } from "../api/client";
import ResultCard from "./ResultCard";
import type { SearchMode, SearchResult, Address, ModeOption } from "../types";
import { addSearchHistoryItem } from "../utils/bookmarks";
import { libraryAudio } from "../utils/audio";

const MODES: ModeOption[] = [
  {
    value: "exact",
    label: "Точное совпадение",
    description: "Текст + пробелы",
    icon: "target",
  },
  {
    value: "random_chars",
    label: "Случайные символы",
    description: "Текст среди шума",
    icon: "sparkles",
  },
  {
    value: "random_words",
    label: "Случайные слова",
    description: "Текст среди слов",
    icon: "book",
  },
  {
    value: "title",
    label: "Название тома",
    description: "Поиск по заголовку",
    icon: "tag",
  },
];

const PRESETS = [
  {
    author: "Осип Мандельштам",
    source: "Воронежские тетради",
    text: "мы живем под собою не чуя страны",
    mode: "exact" as SearchMode,
  },
  {
    author: "Андрей Платонов",
    source: "Чевенгур / Воронеж",
    text: "без меня народ неполный",
    mode: "random_words" as SearchMode,
  },
  {
    author: "Хорхе Луис Борхес",
    source: "Вавилонская библиотека",
    text: "библиотека есть вселенная",
    mode: "random_chars" as SearchMode,
  },
  {
    author: "Александр Пушкин",
    source: "К***",
    text: "я помню чудное мгновенье",
    mode: "exact" as SearchMode,
  },
  {
    author: "Фёдор Достоевский",
    source: "Идиот",
    text: "красота спасет мир",
    mode: "exact" as SearchMode,
  },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  target: <Target className="w-4 h-4" />,
  sparkles: <Sparkles className="w-4 h-4" />,
  book: <BookOpen className="w-4 h-4" />,
  tag: <Tag className="w-4 h-4" />,
};

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [mode, setMode] = useState<SearchMode>(
    (searchParams.get("mode") as SearchMode) || "exact"
  );
  const [loading, setLoading] = useState(false);
  const [wandering, setWandering] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const maxLen = mode === "title" ? 25 : 3200;

  // Auto-search if query param present on initial load
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      const m = (searchParams.get("mode") as SearchMode) || "exact";
      setMode(m);
      performSearch(q, m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performSearch = async (searchQuery: string, searchMode: SearchMode) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await searchLibrary(searchQuery, searchMode);
      setResult(res);
      addSearchHistoryItem(searchQuery, searchMode, res.address);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch(query, mode);
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setQuery(preset.text);
    setMode(preset.mode);
    performSearch(preset.text, preset.mode);
  };

  const handleWander = async () => {
    setWandering(true);
    setError(null);
    try {
      libraryAudio.playPageTurn();
      const addr = await getRandomPage();
      navigateToReader(addr, 0, 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка");
    } finally {
      setWandering(false);
    }
  };

  const navigateToReader = (
    address: Address,
    offset: number,
    queryLength: number
  ) => {
    const params = new URLSearchParams({
      hex: address.hexagon,
      wall: String(address.wall),
      shelf: String(address.shelf),
      volume: String(address.volume),
      page: String(address.page),
      offset: String(offset),
      len: String(queryLength),
    });
    navigate(`/read?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8 animate-fade-in">
      {/* ── Hero ───────────────────────────────────── */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-babel-gold/10 border border-babel-gold/30 text-babel-gold text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          Вселенная из 34 символов
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-babel-gold via-amber-300 to-babel-gold bg-clip-text text-transparent">
          Поиск в Вавилонской Библиотеке
        </h2>
        <p className="text-babel-muted max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Каждая книга, каждая мысль, каждое сокровенное признание на русском
          языке уже хранится в одной из шестигранных комнат. Введите фразу, чтобы
          вычислить её точные вечные координаты.
        </p>
      </div>

      {/* ── Quick Literature Presets ───────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-babel-muted">
          <span className="flex items-center gap-1.5">
            <Quote className="w-3.5 h-3.5 text-babel-gold" />
            Быстрые примеры из русской литературы:
          </span>
          <Link
            to="/browse"
            className="flex items-center gap-1 text-babel-gold/80 hover:text-babel-gold transition-colors font-mono"
          >
            <Compass className="w-3.5 h-3.5" />
            Открыть Навигатор полок
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetSelect(p)}
              className="text-left px-3 py-1.5 rounded-xl bg-babel-card/70 border border-babel-border/40 hover:border-babel-gold/40 hover:bg-babel-surface text-xs transition-all flex items-baseline gap-2 group"
            >
              <span className="font-mono text-babel-gold group-hover:text-amber-300 transition-colors">
                «{p.text}»
              </span>
              <span className="text-[10px] text-babel-muted/60">
                — {p.author}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Mode Selector ──────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all duration-200 ${
              mode === m.value
                ? "bg-babel-gold/10 border-babel-gold/50 shadow-lg shadow-amber-900/20"
                : "bg-babel-card/50 border-babel-border/40 hover:border-babel-border/70 hover:bg-babel-card/80"
            }`}
          >
            <div
              className={`${
                mode === m.value ? "text-babel-gold" : "text-babel-muted"
              } transition-colors`}
            >
              {ICON_MAP[m.icon]}
            </div>
            <span
              className={`text-xs font-medium ${
                mode === m.value ? "text-babel-cream" : "text-babel-muted"
              } transition-colors`}
            >
              {m.label}
            </span>
            <span className="text-[10px] text-babel-muted/60 text-center">
              {m.description}
            </span>
            {mode === m.value && (
              <div className="absolute -bottom-px left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-babel-gold to-transparent" />
            )}
          </button>
        ))}
      </div>

      {/* ── Search Input ───────────────────────────── */}
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, maxLen))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder={
            mode === "title"
              ? "Введите название тома (до 25 символов)…"
              : "Введите текст для поиска (русские буквы, пробелы, запятые, точки — до 3200 знаков)…"
          }
          rows={mode === "title" ? 2 : 4}
          className="w-full bg-babel-card/80 border border-babel-border/50 rounded-2xl px-5 py-4 text-babel-cream placeholder-babel-muted/40 font-mono text-sm resize-none focus:outline-none focus:border-babel-gold/50 focus:ring-1 focus:ring-babel-gold/20 transition-all shadow-inner"
        />
        <div className="absolute bottom-3.5 right-4 text-[10px] text-babel-muted/40 font-mono">
          {query.length}/{maxLen}
        </div>
      </div>

      {/* ── Action Buttons ─────────────────────────── */}
      <div className="flex gap-3">
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-babel-gold to-amber-600 text-babel-bg font-semibold hover:from-amber-400 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-amber-900/30 hover:shadow-amber-800/40"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {loading ? "Вычисление координат…" : "Искать в Библиотеке"}
        </button>

        <button
          onClick={handleWander}
          disabled={wandering}
          className="flex items-center gap-2 py-3 px-6 rounded-xl border border-babel-border/50 text-babel-muted hover:text-babel-cream hover:border-babel-gold/30 hover:bg-babel-card/60 disabled:opacity-40 transition-all duration-200"
          title="Случайное блуждание по бесконечным полкам"
        >
          {wandering ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Shuffle className="w-4 h-4" />
          )}
          Бродить
        </button>
      </div>

      {/* ── Error ──────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Result ─────────────────────────────────── */}
      {result && (
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-semibold text-babel-muted uppercase tracking-widest">
            Найдено в Библиотеке
          </h3>
          <ResultCard
            address={result.address}
            offset={result.offset}
            queryLength={result.query_length}
            preview={result.preview}
            mode={mode}
            onOpen={() =>
              navigateToReader(
                result.address,
                result.offset,
                result.query_length
              )
            }
          />
        </div>
      )}
    </div>
  );
}
