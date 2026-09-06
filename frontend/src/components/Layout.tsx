import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Library,
  Search,
  Compass,
  Info,
  Bookmark as BookmarkIcon,
  Volume2,
  VolumeX,
  Shuffle,
  Loader2,
} from "lucide-react";
import BookmarksModal from "./BookmarksModal";
import { loadBookmarks } from "../utils/bookmarks";
import { libraryAudio } from "../utils/audio";
import { getRandomPage } from "../api/client";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [wandering, setWandering] = useState(false);

  const updateCount = () => {
    setBookmarksCount(loadBookmarks().length);
  };

  useEffect(() => {
    updateCount();
  }, []);

  const toggleAudio = () => {
    const playing = libraryAudio.toggleAmbient();
    setIsAudioPlaying(playing);
  };

  const handleRandomWander = async () => {
    setWandering(true);
    try {
      libraryAudio.playPageTurn();
      const addr = await getRandomPage();
      const params = new URLSearchParams({
        hex: addr.hexagon,
        wall: String(addr.wall),
        shelf: String(addr.shelf),
        volume: String(addr.volume),
        page: String(addr.page),
      });
      navigate(`/read?${params.toString()}`);
    } catch (e) {
      console.error(e);
    } finally {
      setWandering(false);
    }
  };

  const navLinks = [
    { to: "/", label: "Поиск", icon: Search },
    { to: "/browse", label: "Навигатор", icon: Compass },
    { to: "/about", label: "О библиотеке", icon: Info },
  ];

  return (
    <div className="min-h-screen bg-babel-bg text-babel-cream flex flex-col selection:bg-babel-gold/30 selection:text-babel-cream">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="border-b border-babel-border/40 backdrop-blur-md bg-babel-surface/70 sticky top-0 z-40 transition-all">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-babel-gold to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30 group-hover:shadow-amber-700/50 group-hover:scale-105 transition-all">
              <Library className="w-5 h-5 text-babel-bg" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-wide text-babel-cream group-hover:text-babel-gold transition-colors">
                Вавилонская Библиотека
              </h1>
              <p className="text-[9px] uppercase tracking-[0.25em] text-babel-muted">
                Русское издание · Library of Voronezh
              </p>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1 bg-babel-card/60 p-1 rounded-xl border border-babel-border/40">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active =
                to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? "bg-babel-gold text-babel-bg font-bold shadow-md shadow-amber-900/20"
                      : "text-babel-muted hover:text-babel-cream hover:bg-babel-surface"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Ambient sound toggle */}
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                isAudioPlaying
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-900/40"
                  : "border-babel-border/40 text-babel-muted hover:text-babel-cream hover:bg-babel-card"
              }`}
              title={
                isAudioPlaying
                  ? "Выключить атмосферный звук библиотеки"
                  : "Включить атмосферный звук читального зала"
              }
            >
              {isAudioPlaying ? (
                <Volume2 className="w-3.5 h-3.5 animate-pulse text-babel-gold" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isAudioPlaying ? "Звук вкл" : "Звук"}
              </span>
            </button>

            {/* Wander random button */}
            <button
              onClick={handleRandomWander}
              disabled={wandering}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-babel-border/40 text-babel-muted hover:text-babel-cream hover:bg-babel-card text-xs transition-all disabled:opacity-40"
              title="Случайная страница библиотеки"
            >
              {wandering ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Shuffle className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Бродить</span>
            </button>

            {/* Bookmarks Modal Trigger */}
            <button
              onClick={() => setIsBookmarksOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-babel-border/40 text-babel-muted hover:text-babel-cream hover:bg-babel-card text-xs transition-all"
              title="Открыть сохранённые закладки и историю"
            >
              <BookmarkIcon className="w-3.5 h-3.5 text-babel-gold" />
              <span className="hidden sm:inline">Закладки</span>
              {bookmarksCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-babel-gold text-babel-bg font-bold rounded-full">
                  {bookmarksCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-babel-border/20 py-2 px-4 bg-babel-card/30">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const active =
              to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg transition-colors ${
                  active ? "text-babel-gold font-bold" : "text-babel-muted"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Bookmarks & History Modal ──────────────────────── */}
      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        onBookmarksChange={updateCount}
      />

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-babel-border/30 py-8 bg-babel-surface/30 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-babel-muted/70">
          <div className="text-center md:text-left space-y-1">
            <p>
              Вдохновлено рассказом Хорхе Луиса Борхеса <em>«Вавилонская библиотека»</em> (1941)
              и литературным духом Воронежа (Осип Мандельштам, Андрей Платонов).
            </p>
            <p className="text-[11px] text-babel-muted/50">
              Посвящается идее открытого знания Джонатана Базиля (
              <a
                href="https://libraryofbabel.info"
                target="_blank"
                rel="noopener noreferrer"
                className="text-babel-gold/70 hover:text-babel-gold underline transition-colors"
              >
                libraryofbabel.info
              </a>
              ). Все права на русский алгоритм биекции принадлежат литературе.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/" className="hover:text-babel-cream transition-colors">
              Поиск
            </Link>
            <span>·</span>
            <Link to="/browse" className="hover:text-babel-cream transition-colors">
              Навигатор
            </Link>
            <span>·</span>
            <Link to="/about" className="hover:text-babel-cream transition-colors">
              О проекте
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
