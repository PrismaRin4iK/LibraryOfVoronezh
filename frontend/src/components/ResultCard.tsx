import type { Address } from "../types";
import { BookOpen, Hexagon, Layers, BookMarked, FileText } from "lucide-react";

interface ResultCardProps {
  address: Address;
  offset: number;
  queryLength: number;
  preview: string;
  mode: string;
  onOpen: () => void;
}

export default function ResultCard({
  address,
  offset,
  queryLength,
  preview,
  mode,
  onOpen,
}: ResultCardProps) {
  const hexDisplay =
    address.hexagon.length > 24
      ? address.hexagon.slice(0, 12) + "…" + address.hexagon.slice(-12)
      : address.hexagon;

  return (
    <div className="group bg-babel-card/80 backdrop-blur-sm border border-babel-border/50 rounded-xl p-5 hover:border-babel-gold/40 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300">
      {/* ── Coordinates ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Hexagon className="w-3.5 h-3.5 text-babel-gold/70" />
          <span className="text-babel-muted text-xs">Hex:</span>
          <span className="text-babel-cream font-mono text-xs truncate max-w-[120px]" title={address.hexagon}>
            {hexDisplay}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Layers className="w-3.5 h-3.5 text-babel-gold/70" />
          <span className="text-babel-muted text-xs">Стена {address.wall}, Полка {address.shelf}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <BookMarked className="w-3.5 h-3.5 text-babel-gold/70" />
          <span className="text-babel-muted text-xs">Том {address.volume}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-3.5 h-3.5 text-babel-gold/70" />
          <span className="text-babel-muted text-xs">Стр. {address.page}</span>
        </div>
      </div>

      {/* ── Preview ───────────────────────────── */}
      {preview && (
        <div className="bg-babel-bg/60 rounded-lg p-3 mb-4 border border-babel-border/30">
          <p className="font-mono text-xs text-babel-cream/70 leading-relaxed break-all line-clamp-3">
            {mode !== "title" ? (
              <>
                <span className="text-babel-muted/50">
                  {preview.slice(0, Math.max(0, offset < 80 ? offset : 0))}
                </span>
                <span className="bg-babel-gold/20 text-babel-gold px-0.5 rounded">
                  {preview.slice(
                    Math.max(0, offset < 80 ? offset : 0),
                    Math.max(0, offset < 80 ? offset : 0) + queryLength
                  )}
                </span>
                <span className="text-babel-muted/50">
                  {preview.slice(Math.max(0, offset < 80 ? offset : 0) + queryLength)}
                </span>
              </>
            ) : (
              <span className="text-babel-gold">«{preview}»</span>
            )}
          </p>
        </div>
      )}

      {/* ── Open Button ───────────────────────── */}
      <button
        onClick={onOpen}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-babel-gold/20 to-amber-700/20 border border-babel-gold/30 text-babel-gold hover:from-babel-gold/30 hover:to-amber-700/30 hover:border-babel-gold/50 transition-all duration-200 text-sm font-medium"
      >
        <BookOpen className="w-4 h-4" />
        Открыть книгу
      </button>
    </div>
  );
}
