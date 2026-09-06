import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Hexagon as HexagonIcon,
  Layers,
  BookOpen,
  ArrowRight,
  Shuffle,
  Loader2,
  Compass,
  Info,
} from "lucide-react";
import { getShelf, getRandomPage } from "../api/client";
import type { ShelfResponse, ShelfVolume } from "../types";
import { libraryAudio } from "../utils/audio";

export default function BrowsePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Current spatial coordinates
  const [hexagon, setHexagon] = useState<string>(
    searchParams.get("hex") || "0"
  );
  const [wall, setWall] = useState<number>(
    Math.min(4, Math.max(1, Number(searchParams.get("wall") || 1)))
  );
  const [shelf, setShelf] = useState<number>(
    Math.min(5, Math.max(1, Number(searchParams.get("shelf") || 1)))
  );

  // Direct coordinate input form state
  const [hexInput, setHexInput] = useState<string>(hexagon);

  // Bookshelf data
  const [shelfData, setShelfData] = useState<ShelfResponse | null>(null);
  const [loadingShelf, setLoadingShelf] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected volume preview in drawer/modal
  const [selectedVolume, setSelectedVolume] = useState<ShelfVolume | null>(null);
  const [previewPage, setPreviewPage] = useState<number>(1);

  const loadShelfData = useCallback(async (h: string, w: number, s: number) => {
    setLoadingShelf(true);
    setError(null);
    try {
      const data = await getShelf(h, w, s);
      setShelfData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить полку");
    } finally {
      setLoadingShelf(false);
    }
  }, []);

  useEffect(() => {
    loadShelfData(hexagon, wall, shelf);
  }, [hexagon, wall, shelf, loadShelfData]);

  const handleHexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHex = hexInput.trim() || "0";
    setHexagon(cleanHex);
  };

  const handleRandomChamber = async () => {
    try {
      const rand = await getRandomPage();
      setHexagon(rand.hexagon);
      setHexInput(rand.hexagon);
      setWall(rand.wall);
      setShelf(rand.shelf);
      libraryAudio.playPageTurn();
    } catch (e) {
      console.error(e);
    }
  };

  const openReader = (volumeNum: number, pageNum: number = 1) => {
    libraryAudio.playPageTurn();
    const params = new URLSearchParams({
      hex: hexagon,
      wall: String(wall),
      shelf: String(shelf),
      volume: String(volumeNum),
      page: String(pageNum),
    });
    navigate(`/read?${params.toString()}`);
  };

  // Spine color variations for shelf aesthetics
  const getSpineClass = (volIndex: number) => {
    const shades = [
      "from-amber-950 via-stone-900 to-zinc-950 border-amber-900/40 text-amber-300",
      "from-red-950 via-stone-900 to-zinc-950 border-red-900/40 text-red-300",
      "from-emerald-950 via-stone-900 to-zinc-950 border-emerald-900/40 text-emerald-300",
      "from-indigo-950 via-stone-900 to-zinc-950 border-indigo-900/40 text-indigo-300",
      "from-yellow-950 via-stone-900 to-zinc-950 border-yellow-900/40 text-yellow-300",
      "from-stone-900 via-zinc-900 to-black border-stone-700/40 text-babel-gold",
    ];
    return shades[volIndex % shades.length];
  };

  const hexShort =
    hexagon.length > 24
      ? `${hexagon.slice(0, 10)}…${hexagon.slice(-10)}`
      : hexagon;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      {/* ── Page Header ─────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-babel-border/30">
        <div>
          <div className="flex items-center gap-2 text-babel-gold text-xs font-semibold uppercase tracking-widest mb-1">
            <Compass className="w-4 h-4" />
            Пространственный Навигатор
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-babel-gold via-amber-300 to-babel-gold bg-clip-text text-transparent">
            Гексагональная галерея
          </h2>
          <p className="text-sm text-babel-muted mt-1 max-w-xl">
            Путешествуйте по бесконечной сотовой структуре библиотеки Борхеса.
            Каждый шестигранник состоит из 4 стен по 5 полок, на каждой полке — 32 тома.
          </p>
        </div>

        <button
          onClick={handleRandomChamber}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-babel-gold/30 bg-babel-gold/10 text-babel-gold hover:bg-babel-gold hover:text-babel-bg font-medium text-sm transition-all shadow-lg shadow-amber-900/10"
        >
          <Shuffle className="w-4 h-4" />
          Случайная комната
        </button>
      </div>

      {/* ── Chamber & Coordinate Control Bar ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hexagon Chamber Floorplan visualization */}
        <div className="bg-babel-card/70 border border-babel-border/40 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="text-xs uppercase tracking-widest text-babel-muted mb-4 font-semibold flex items-center gap-1.5">
            <HexagonIcon className="w-4 h-4 text-babel-gold" />
            План зала (Шестигранник)
          </div>

          {/* Hexagon Chamber Graphic */}
          <div className="relative w-48 h-48 my-2 flex items-center justify-center">
            {/* Hexagon Background SVG */}
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
              <polygon
                points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25"
                className="fill-babel-surface/80 stroke-babel-border/70"
                strokeWidth="2"
              />
              {/* Central shaft / ventilation hole described in Borges */}
              <circle
                cx="50"
                cy="50"
                r="12"
                className="fill-babel-bg stroke-babel-gold/40"
                strokeWidth="1.5"
              />
            </svg>

            {/* Walls 1-4 buttons on the 4 occupied facets */}
            {/* Wall 1: Top-Right */}
            <button
              onClick={() => setWall(1)}
              className={`absolute top-4 right-5 px-2.5 py-1 text-xs font-mono rounded border transition-all ${
                wall === 1
                  ? "bg-babel-gold text-babel-bg font-bold border-babel-gold shadow-md shadow-babel-gold/40"
                  : "bg-babel-card text-babel-muted border-babel-border hover:border-babel-gold/50"
              }`}
            >
              Стена 1
            </button>

            {/* Wall 2: Bottom-Right */}
            <button
              onClick={() => setWall(2)}
              className={`absolute bottom-4 right-5 px-2.5 py-1 text-xs font-mono rounded border transition-all ${
                wall === 2
                  ? "bg-babel-gold text-babel-bg font-bold border-babel-gold shadow-md shadow-babel-gold/40"
                  : "bg-babel-card text-babel-muted border-babel-border hover:border-babel-gold/50"
              }`}
            >
              Стена 2
            </button>

            {/* Wall 3: Bottom-Left */}
            <button
              onClick={() => setWall(3)}
              className={`absolute bottom-4 left-5 px-2.5 py-1 text-xs font-mono rounded border transition-all ${
                wall === 3
                  ? "bg-babel-gold text-babel-bg font-bold border-babel-gold shadow-md shadow-babel-gold/40"
                  : "bg-babel-card text-babel-muted border-babel-border hover:border-babel-gold/50"
              }`}
            >
              Стена 3
            </button>

            {/* Wall 4: Top-Left */}
            <button
              onClick={() => setWall(4)}
              className={`absolute top-4 left-5 px-2.5 py-1 text-xs font-mono rounded border transition-all ${
                wall === 4
                  ? "bg-babel-gold text-babel-bg font-bold border-babel-gold shadow-md shadow-babel-gold/40"
                  : "bg-babel-card text-babel-muted border-babel-border hover:border-babel-gold/50"
              }`}
            >
              Стена 4
            </button>

            {/* Corridors label on Top & Bottom free faces */}
            <div className="absolute top-0 text-[9px] text-babel-muted/40 uppercase tracking-tighter">
              ↑ Коридор
            </div>
            <div className="absolute bottom-0 text-[9px] text-babel-muted/40 uppercase tracking-tighter">
              ↓ Коридор
            </div>
          </div>

          <p className="text-[11px] text-babel-muted/70 text-center mt-3 max-w-xs">
            2 грани открыты для перехода между гексагонами; на остальных 4 гранях стоят книжные шкафы.
          </p>
        </div>

        {/* Coordinate Jump & Shelves Selector */}
        <div className="lg:col-span-2 bg-babel-card/70 border border-babel-border/40 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          {/* Hexagon input form */}
          <div>
            <label className="text-xs uppercase tracking-wider text-babel-muted font-semibold block mb-2">
              Шестнадцатеричный индекс гексагона (Hexagon ID)
            </label>
            <form onSubmit={handleHexSubmit} className="flex gap-2">
              <input
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                placeholder="0 или шестнадцатеричное число (любой длины)…"
                className="flex-1 bg-babel-bg font-mono text-sm px-4 py-2.5 rounded-xl border border-babel-border text-babel-cream focus:outline-none focus:border-babel-gold focus:ring-1 focus:ring-babel-gold/30"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-babel-gold text-babel-bg font-semibold rounded-xl hover:bg-amber-400 transition-colors text-sm shadow-md"
              >
                Перейти
              </button>
            </form>
            <div className="text-[11px] text-babel-muted/60 mt-1 font-mono">
              Текущий: {hexShort}
            </div>
          </div>

          {/* Wall & Shelf selection tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Wall selector */}
            <div>
              <span className="text-xs uppercase tracking-wider text-babel-muted font-semibold block mb-2">
                Стена галереи (1 – 4)
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((w) => (
                  <button
                    key={w}
                    onClick={() => setWall(w)}
                    className={`py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                      wall === w
                        ? "bg-babel-gold text-babel-bg font-bold shadow-md shadow-amber-900/30"
                        : "bg-babel-surface text-babel-muted hover:text-babel-cream border border-babel-border/40"
                    }`}
                  >
                    Стена {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Shelf selector */}
            <div>
              <span className="text-xs uppercase tracking-wider text-babel-muted font-semibold block mb-2">
                Полка шкафа (1 – 5)
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setShelf(s)}
                    className={`py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                      shelf === s
                        ? "bg-babel-gold text-babel-bg font-bold shadow-md shadow-amber-900/30"
                        : "bg-babel-surface text-babel-muted hover:text-babel-cream border border-babel-border/40"
                    }`}
                  >
                    #{s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick coordinate summary pill */}
          <div className="p-3 bg-babel-surface/60 rounded-xl border border-babel-border/30 flex items-center justify-between text-xs font-mono text-babel-muted">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-babel-gold" />
              Координаты: Hex {hexShort} / С{wall} / П{shelf}
            </span>
            <span className="text-babel-cream font-semibold">32 книги на полке</span>
          </div>
        </div>
      </div>

      {/* ── Virtual Bookshelf Section ───────────── */}
      <div className="bg-babel-card/60 border border-babel-border/40 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-babel-border/30">
          <div>
            <h3 className="text-lg font-bold text-babel-cream flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-babel-gold" />
              Полка {shelf} · Стена {wall}
            </h3>
            <p className="text-xs text-babel-muted mt-0.5">
              Нажмите на корешок книги, чтобы раскрыть её название и открыть страницы
            </p>
          </div>

          <div className="text-xs text-babel-muted font-mono">
            {shelfData?.volumes.length || 0} томов обнаружено
          </div>
        </div>

        {/* Visual Bookshelf display */}
        {loadingShelf ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 text-babel-gold animate-spin" />
            <span className="text-xs text-babel-muted font-mono">
              Считывание корешков томов…
            </span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-xl border border-red-500/20 text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wooden shelf structure */}
            <div className="relative pt-6 pb-2 px-3 bg-gradient-to-b from-stone-950 via-zinc-900 to-amber-950/20 rounded-xl border border-amber-950/60 shadow-inner">
              {/* Books Spines Container */}
              <div className="grid grid-cols-8 sm:grid-cols-16 md:grid-cols-32 gap-1 sm:gap-1.5 items-end h-56 px-2">
                {shelfData?.volumes.map((vol, idx) => {
                  const isSelected = selectedVolume?.volume === vol.volume;
                  return (
                    <button
                      key={vol.volume}
                      onClick={() => {
                        setSelectedVolume(vol);
                        setPreviewPage(1);
                        libraryAudio.playPageTurn();
                      }}
                      className={`group relative h-full flex flex-col justify-between items-center rounded-t border bg-gradient-to-b py-2 px-0.5 transition-all duration-200 ${getSpineClass(
                        idx
                      )} ${
                        isSelected
                          ? "ring-2 ring-babel-gold -translate-y-2.5 z-20 shadow-xl shadow-amber-900/60"
                          : "hover:-translate-y-1.5 hover:shadow-lg hover:z-10"
                      }`}
                      title={`Том ${vol.volume}: ${vol.title}`}
                    >
                      {/* Top volume marker */}
                      <span className="text-[9px] font-mono font-bold opacity-80">
                        {vol.volume}
                      </span>

                      {/* Vertical Spine Title Preview (rotated) */}
                      <div className="h-32 w-full flex items-center justify-center overflow-hidden">
                        <span
                          className="font-mono text-[9px] tracking-tight uppercase transform -rotate-90 whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity truncate max-w-[120px]"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          {vol.title.trim().slice(0, 12)}
                        </span>
                      </div>

                      {/* Bottom gold band */}
                      <div className="w-full h-1 bg-babel-gold/30 rounded-full mt-auto" />
                    </button>
                  );
                })}
              </div>

              {/* Wooden shelf board at base */}
              <div className="h-4 -mx-3 mt-1 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-t-2 border-amber-700/60 rounded-b shadow-lg flex items-center justify-center">
                <div className="w-32 h-0.5 bg-amber-600/30 rounded" />
              </div>
            </div>

            {/* Selected Volume Detail Card */}
            {selectedVolume && (
              <div className="p-6 rounded-2xl bg-babel-surface/90 border border-babel-gold/40 shadow-2xl animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-babel-gold">
                    <BookOpen className="w-4 h-4" />
                    ТОМ {selectedVolume.volume} ИЗ 32 · 410 СТРАНИЦ
                  </div>
                  <h4 className="text-xl font-bold font-mono text-babel-cream">
                    «{selectedVolume.title.trim() || "Без названия"}»
                  </h4>
                  <div className="text-xs text-babel-muted flex items-center gap-3">
                    <span>Стена {wall}</span>
                    <span>·</span>
                    <span>Полка {shelf}</span>
                    <span>·</span>
                    <span>Гексагон {hexShort}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Quick page jumper input */}
                  <div className="flex items-center gap-1.5 bg-babel-bg/80 border border-babel-border rounded-xl px-3 py-1.5">
                    <span className="text-xs text-babel-muted">Стр:</span>
                    <input
                      type="number"
                      min={1}
                      max={410}
                      value={previewPage}
                      onChange={(e) =>
                        setPreviewPage(
                          Math.max(1, Math.min(410, Number(e.target.value) || 1))
                        )
                      }
                      className="w-14 bg-transparent font-mono text-xs text-babel-cream text-center focus:outline-none"
                    />
                    <span className="text-[10px] text-babel-muted/60">/ 410</span>
                  </div>

                  <button
                    onClick={() => openReader(selectedVolume.volume, previewPage)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-babel-gold to-amber-600 text-babel-bg font-bold text-sm hover:from-amber-400 hover:to-amber-600 transition-all shadow-lg shadow-amber-900/30"
                  >
                    Читать том
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Architecture Note Card ──────────────── */}
      <div className="p-5 rounded-2xl bg-babel-surface/30 border border-babel-border/30 flex items-start gap-3.5 text-xs text-babel-muted leading-relaxed">
        <Info className="w-5 h-5 text-babel-gold/80 shrink-0 mt-0.5" />
        <div>
          <span className="text-babel-cream font-medium">Геометрия Библиотеки: </span>
          Каждая комната представляет собой правильный шестиугольник с зеркалом в узком коридоре.
          В каждом зале 4 стены, 20 полок, 640 томов и 262 400 страниц.
          Благодаря взаимно однозначной математической биекции, каждый том на этой полке физически
          воспроизводит детерминированный текст, закреплённый за ним навечно.
        </div>
      </div>
    </div>
  );
}
