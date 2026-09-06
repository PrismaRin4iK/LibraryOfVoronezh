import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Binary,
  Calculator,
  Compass,
  Feather,
  Sparkles,
  Search,
  ExternalLink,
} from "lucide-react";
import { getStats } from "../api/client";
import type { LibraryStats } from "../types";

export default function AboutPage() {
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [calcChars, setCalcChars] = useState<number>(40);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e) => console.error("Stats load error", e));
  }, []);

  // Compute power for calculator: 34^chars
  const calcExponent = Math.min(3200, Math.max(1, calcChars));
  // Approximating base 10 exponent: log10(34) ~ 1.5314789
  const log10approx = (calcExponent * Math.log10(34)).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 animate-fade-in">
      {/* ── Title Banner ─────────────────────────── */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-babel-gold/10 border border-babel-gold/30 text-babel-gold text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          Математическая бесконечность и литература
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-babel-gold via-amber-300 to-babel-gold bg-clip-text text-transparent">
          О Русской Вавилонской Библиотеке
        </h2>
        <p className="text-babel-muted text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Цифровая реализация легендарной метафоры Хорхе Луиса Борхеса:
          пространство, где каждое написанное и ещё не написанное слово уже
          существует на определённой полке.
        </p>
      </div>

      {/* ── Quick Action Cards ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/"
          className="p-5 rounded-2xl bg-babel-card/60 border border-babel-border/40 hover:border-babel-gold/40 hover:bg-babel-card/90 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-babel-gold/10 text-babel-gold">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-babel-cream group-hover:text-babel-gold transition-colors">
                Поиск любого текста
              </div>
              <div className="text-xs text-babel-muted">
                Найти координаты вашей мысли в сотах
              </div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-babel-muted group-hover:text-babel-gold transition-colors" />
        </Link>

        <Link
          to="/browse"
          className="p-5 rounded-2xl bg-babel-card/60 border border-babel-border/40 hover:border-babel-gold/40 hover:bg-babel-card/90 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-babel-gold/10 text-babel-gold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-babel-cream group-hover:text-babel-gold transition-colors">
                Пространственный Навигатор
              </div>
              <div className="text-xs text-babel-muted">
                Исследовать залы, стены и 32 тома полок
              </div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-babel-muted group-hover:text-babel-gold transition-colors" />
        </Link>
      </div>

      {/* ── Literary Lore: Borges & Voronezh ─────── */}
      <section className="bg-babel-card/60 border border-babel-border/40 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 text-babel-gold">
          <Feather className="w-5 h-5" />
          <h3 className="text-lg font-bold">Литературный контекст: Борхес и Воронеж</h3>
        </div>

        <div className="space-y-4 text-sm text-babel-cream/80 leading-relaxed">
          <p>
            В 1941 году аргентинский писатель <strong>Хорхе Луис Борхес</strong> опубликовал
            знаменитый рассказ <em>«Вавилонская библиотека»</em>. Он описал Вселенную
            как колоссальное здание из шестигранных галерей с вентиляционными шахтами
            посередине. В каждом зале 4 стены полок, на каждой полке 32 тома по 410 страниц,
            на странице 40 строк по 80 знаков.
          </p>
          <p>
            Наш проект адаптирует эту концепцию для <strong>русского языка</strong> и
            назван <strong>«Library of Voronezh»</strong> в честь богатого литературного
            наследия Воронежского края. Именно здесь в тяжелейшие годы воронежской ссылки
            (1934–1937) <strong>Осип Мандельштам</strong> создал легендарные <em>«Воронежские тетради»</em>,
            впитавшие мужество поэтического слова вопреки цензуре. Здесь творил создатель
            уникального философского языка <strong>Андрей Платонов</strong> (<em>«Чевенгур»</em>, <em>«Котлован»</em>).
          </p>
          <blockquote className="border-l-2 border-babel-gold/60 pl-4 my-4 italic text-babel-gold/90">
            «Пусть я умру, но в этой библиотеке останется страница с каждым словом,
            которое я мог сказать, и со всеми ответами, которые не успел постичь.»
          </blockquote>
          <p>
            В Библиотеке содержатся все утраченные рукописи, все недописанные стихи
            Мандельштама, точные предсказания будущего, история вашей жизни в мельчайших
            деталях, а также бесчисленные океаны кажущейся бессмыслицы.
          </p>
        </div>
      </section>

      {/* ── Mathematical Bijection ──────────────── */}
      <section className="bg-babel-card/60 border border-babel-border/40 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 text-babel-gold">
          <Binary className="w-5 h-5" />
          <h3 className="text-lg font-bold">Математический алгоритм (Биекция)</h3>
        </div>

        <div className="space-y-4 text-sm text-babel-cream/80 leading-relaxed">
          <p>
            Как можно найти любую книгу без гигантской базы данных размером в квадриллионы серверов?
            Ответ кроется в <strong>взаимно однозначном математическом отображении (биекции)</strong>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            <div className="p-4 rounded-xl bg-babel-surface/70 border border-babel-border/30">
              <div className="text-xs uppercase text-babel-muted font-mono mb-1">Алфавит</div>
              <div className="text-xl font-bold text-babel-gold font-mono">34 символа</div>
              <div className="text-[11px] text-babel-muted mt-1">
                32 буквы (а-я) + пробел + запятая + точка
              </div>
            </div>
            <div className="p-4 rounded-xl bg-babel-surface/70 border border-babel-border/30">
              <div className="text-xs uppercase text-babel-muted font-mono mb-1">Страница</div>
              <div className="text-xl font-bold text-babel-gold font-mono">3 200 знаков</div>
              <div className="text-[11px] text-babel-muted mt-1">
                40 строк по 80 символов
              </div>
            </div>
            <div className="p-4 rounded-xl bg-babel-surface/70 border border-babel-border/30">
              <div className="text-xs uppercase text-babel-muted font-mono mb-1">Всего страниц</div>
              <div className="text-xl font-bold text-babel-gold font-mono">≈ 10⁴⁸⁹⁹</div>
              <div className="text-[11px] text-babel-muted mt-1">
                Число атомов в видимой Вселенной всего ≈ 10⁸⁰
              </div>
            </div>
          </div>

          <p>
            Любой текст длиною 3200 знаков можно представить как колоссальное целое число{" "}
            <code className="font-mono text-babel-gold text-xs px-1.5 py-0.5 rounded bg-babel-bg">
              N ∈ [0, 34³²⁰⁰ - 1]
            </code>{" "}
            в 34-ричной системе счисления.
          </p>
          <p>
            К этому числу применяется обратимый аффинный псевдослучайный шифр над кольцом{" "}
            <code className="font-mono text-babel-gold text-xs px-1.5 py-0.5 rounded bg-babel-bg">
              ℤ / (34³²⁰⁰ ℤ)
            </code>
            :
          </p>

          <div className="p-4 rounded-xl bg-babel-bg/80 border border-babel-border font-mono text-xs text-babel-cream/90 space-y-1">
            <div>
              <span className="text-babel-gold">E(N)</span> = (A · N + B) mod 34³²⁰⁰ &nbsp;&nbsp;[Шифрование / Поиск]
            </div>
            <div>
              <span className="text-babel-gold">D(C)</span> = A⁻¹ · (C - B) mod 34³²⁰⁰ &nbsp;[Дешифрование / Чтение]
            </div>
          </div>

          <p>
            где множитель <code className="font-mono text-babel-gold text-xs">A</code> взаимно прост с модулем (рассчитан через расширенный алгоритм Евклида).
            Число <code className="font-mono text-babel-gold text-xs">C</code> делится на координаты:
            <br />
            <span className="font-mono text-xs text-babel-muted">
              C = Hexagon · 262 400 + (Стена - 1) · 65 600 + (Полка - 1) · 13 120 + (Том - 1) · 410 + (Страница - 1)
            </span>
          </p>
        </div>
      </section>

      {/* ── Interactive Combinatorics Calculator ── */}
      <section className="bg-babel-card/60 border border-babel-border/40 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 text-babel-gold">
          <Calculator className="w-5 h-5" />
          <h3 className="text-lg font-bold">Интерактивный комбинаторный калькулятор</h3>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-babel-muted">
            Передвигайте ползунок, чтобы увидеть, сколько уникальных текстов порождает алфавит из 34 символов:
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-babel-muted">Длина строки (символов):</span>
              <span className="text-babel-gold font-bold text-base">{calcChars}</span>
            </div>
            <input
              type="range"
              min={1}
              max={3200}
              value={calcChars}
              onChange={(e) => setCalcChars(Number(e.target.value))}
              className="w-full accent-babel-gold cursor-pointer"
            />
          </div>

          <div className="p-5 rounded-xl bg-babel-surface/80 border border-babel-border/30 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] text-babel-muted uppercase font-mono">
                Количество возможных текстов (34^{calcExponent})
              </div>
              <div className="text-2xl font-bold font-mono text-babel-gold mt-1">
                ≈ 10^{log10approx}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-babel-muted uppercase font-mono">
                Сравнение с физической вселенной
              </div>
              <div className="text-xs text-babel-cream/80 mt-1">
                {calcChars < 53 ? (
                  <span>
                    Помещается в границах числа атомов видимой Вселенной (~10⁸⁰).
                  </span>
                ) : (
                  <span className="text-amber-300 font-semibold">
                    Превышает общее число элементарных частиц во всей Вселенной!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Physical Specifications Table ───────── */}
      <section className="bg-babel-card/60 border border-babel-border/40 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3 text-babel-gold">
          <BookOpen className="w-5 h-5" />
          <h3 className="text-lg font-bold">Спецификация Библиотеки</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <tbody>
              <tr className="border-b border-babel-border/30">
                <td className="py-2.5 text-babel-muted">Алфавит</td>
                <td className="py-2.5 text-babel-cream font-semibold">
                  {stats ? `${stats.alphabet_size} символа (${stats.alphabet.slice(0, 10)}…)` : "34 символа (32 буквы + пробел + запятая + точка)"}
                </td>
              </tr>
              <tr className="border-b border-babel-border/30">
                <td className="py-2.5 text-babel-muted">Символов на странице</td>
                <td className="py-2.5 text-babel-cream font-semibold">
                  {stats?.page_length || 3200} (40 строк × 80 колонок)
                </td>
              </tr>
              <tr className="border-b border-babel-border/30">
                <td className="py-2.5 text-babel-muted">Страниц в томе</td>
                <td className="py-2.5 text-babel-cream font-semibold">
                  {stats?.pages_per_volume || 410} страниц
                </td>
              </tr>
              <tr className="border-b border-babel-border/30">
                <td className="py-2.5 text-babel-muted">Томов на полке</td>
                <td className="py-2.5 text-babel-cream font-semibold">
                  {stats?.volumes_per_shelf || 32} тома
                </td>
              </tr>
              <tr className="border-b border-babel-border/30">
                <td className="py-2.5 text-babel-muted">Полок на стене</td>
                <td className="py-2.5 text-babel-cream font-semibold">
                  {stats?.shelves_per_wall || 5} полок
                </td>
              </tr>
              <tr className="border-b border-babel-border/30">
                <td className="py-2.5 text-babel-muted">Стен в гексагоне</td>
                <td className="py-2.5 text-babel-cream font-semibold">
                  {stats?.walls_per_hex || 4} стены с книгами (+ 2 коридора)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 text-babel-muted">Томов в одном гексагоне</td>
                <td className="py-2.5 text-babel-gold font-semibold">
                  {stats?.volumes_per_hex || 640} томов ({stats?.pages_per_hex ? stats.pages_per_hex.toLocaleString("ru-RU") : "262 400"} страниц)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
