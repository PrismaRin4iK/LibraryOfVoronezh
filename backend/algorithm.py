"""
Русская Вавилонская Библиотека — Ядро алгоритма биекции.

Обратимое отображение между:
  - Текстом страницы (3200 символов из 34-символьного русского алфавита)
  - Адресом в библиотеке (шестиугольник, стена, полка, том, страница)

Математическая основа: аффинный шифр над кольцом Z_{34^3200}
  encrypt(x) = (A * x + B) mod M
  decrypt(y) = A^{-1} * (y - B) mod M

Свойство биекции: для любого текста T длины 3200 символов
  generate_page(*locate_text(T)) == T
"""

import hashlib
import random
import time


# ═══════════════════════════════════════════════════════════════════════
#  Алфавит библиотеки
# ═══════════════════════════════════════════════════════════════════════

ALPHABET = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя "
BASE = len(ALPHABET)  # 34
assert BASE == 34, f"Ожидается 34 символа в алфавите, получено {BASE}"

CHAR_TO_INDEX: dict[str, int] = {c: i for i, c in enumerate(ALPHABET)}
SPACE_INDEX = CHAR_TO_INDEX[" "]


# ═══════════════════════════════════════════════════════════════════════
#  Параметры библиотеки
# ═══════════════════════════════════════════════════════════════════════

PAGE_LEN = 3200       # символов на странице
TITLE_LEN = 25        # символов в названии тома
ROWS = 40             # строк для отображения
COLS = 80             # столбцов для отображения

WALLS = 4             # стен в шестиугольнике
SHELVES = 5           # полок на стене
VOLUMES = 32          # томов на полке
PAGES = 410           # страниц в томе

LOCAL_PAGES = WALLS * SHELVES * VOLUMES * PAGES   # 262 400
LOCAL_VOLUMES = WALLS * SHELVES * VOLUMES          # 640


# ═══════════════════════════════════════════════════════════════════════
#  Построение криптографических констант
# ═══════════════════════════════════════════════════════════════════════

def _build_coprime(seed: str, modulus: int) -> int:
    """
    Генерирует большое число, взаимно простое с modulus = 34^k.

    Поскольку 34 = 2 × 17, число должно быть нечётным
    и не делиться на 17. Генерация детерминирована через SHAKE-256.
    """
    needed_bytes = modulus.bit_length() // 8 + 32
    data = hashlib.shake_256(seed.encode()).digest(needed_bytes)
    n = int.from_bytes(data, "big") % modulus
    if n < 2:
        n = 3
    if n % 2 == 0:
        n += 1
    while n % 17 == 0:
        n += 2
    return n


def _build_addend(seed: str, modulus: int) -> int:
    """Генерирует аддитивную константу (произвольное число mod M)."""
    needed_bytes = modulus.bit_length() // 8 + 32
    data = hashlib.shake_256(seed.encode()).digest(needed_bytes)
    return int.from_bytes(data, "big") % modulus


# ───────────────────── Инициализация при загрузке модуля ─────────────────────

print("[*] Inicializacija Vavilonskoj Biblioteki...")

_t0 = time.time()
M_PAGE = BASE ** PAGE_LEN    # ~10^4901 -- modul dlja stranic
M_TITLE = BASE ** TITLE_LEN  # ~10^38  -- modul dlja nazvanij
print(f"  [+] Moduli vychisleny ({time.time() - _t0:.3f}s)")

_t0 = time.time()
A_PAGE = _build_coprime("babel_rus_page_multiplier_v1", M_PAGE)
B_PAGE = _build_addend("babel_rus_page_addend_v1", M_PAGE)
A_TITLE = _build_coprime("babel_rus_title_multiplier_v1", M_TITLE)
B_TITLE = _build_addend("babel_rus_title_addend_v1", M_TITLE)
print(f"  [+] Kljuchi sgenerirovanы ({time.time() - _t0:.3f}s)")

_t0 = time.time()
A_PAGE_INV = pow(A_PAGE, -1, M_PAGE)
A_TITLE_INV = pow(A_TITLE, -1, M_TITLE)
print(f"  [+] Obratnye kljuchi vychisleny ({time.time() - _t0:.3f}s)")

print("[OK] Biblioteka gotova k rabote.\n")


# ═══════════════════════════════════════════════════════════════════════
#  Кодирование: текст ↔ число
# ═══════════════════════════════════════════════════════════════════════

def normalize_text(text: str) -> str:
    """
    Нормализация текста для библиотеки:
    - Приведение к нижнему регистру
    - Замена любых символов вне алфавита на пробел
    """
    text = text.lower()
    return "".join(ch if ch in CHAR_TO_INDEX else " " for ch in text)


def text_to_number(text: str) -> int:
    """
    Перевод строки из символов алфавита в число (схема Горнера, big-endian).

    Каждый символ — цифра в системе счисления с основанием 34.
    Первый символ — старший разряд.
    """
    n = 0
    for ch in text:
        n = n * BASE + CHAR_TO_INDEX.get(ch, SPACE_INDEX)
    return n


def number_to_text(n: int, length: int) -> str:
    """
    Перевод числа обратно в строку заданной длины.

    Извлечение цифр от младшего разряда к старшему, затем разворот.
    """
    if n < 0:
        n %= BASE ** length
    chars = []
    for _ in range(length):
        n, r = divmod(n, BASE)
        chars.append(ALPHABET[r])
    return "".join(reversed(chars))


# ═══════════════════════════════════════════════════════════════════════
#  Кодирование шестиугольника (hex-строка)
# ═══════════════════════════════════════════════════════════════════════

def encode_hexagon(n: int) -> str:
    """Кодирует номер шестиугольника в шестнадцатеричную строку."""
    if n == 0:
        return "0"
    return format(n, "x")


def decode_hexagon(s: str) -> int:
    """Декодирует шестнадцатеричную строку в номер шестиугольника."""
    if not s:
        return 0
    s_clean = s.strip().lower()
    if s_clean.startswith("0x"):
        s_clean = s_clean[2:]
    s_valid = "".join(c for c in s_clean if c in "0123456789abcdef")
    if not s_valid:
        return 0
    return int(s_valid, 16)


# ═══════════════════════════════════════════════════════════════════════
#  Адрес ↔ Линейный индекс
# ═══════════════════════════════════════════════════════════════════════

def address_to_index(hexagon: str, wall: int, shelf: int,
                     volume: int, page: int) -> int:
    """
    Полный адрес страницы → линейный индекс.

    Формула:
      index = hex_num * LOCAL_PAGES +
              (wall-1) * SHELVES * VOLUMES * PAGES +
              (shelf-1) * VOLUMES * PAGES +
              (volume-1) * PAGES +
              (page-1)
    """
    hex_num = decode_hexagon(hexagon)
    local = (
        (wall - 1) * SHELVES * VOLUMES * PAGES
        + (shelf - 1) * VOLUMES * PAGES
        + (volume - 1) * PAGES
        + (page - 1)
    )
    return hex_num * LOCAL_PAGES + local


def index_to_address(index: int) -> dict:
    """Линейный индекс → полный адрес страницы."""
    hex_num, local = divmod(index, LOCAL_PAGES)
    page = local % PAGES + 1
    local //= PAGES
    volume = local % VOLUMES + 1
    local //= VOLUMES
    shelf = local % SHELVES + 1
    local //= SHELVES
    wall = local % WALLS + 1
    return {
        "hexagon": encode_hexagon(hex_num),
        "wall": wall,
        "shelf": shelf,
        "volume": volume,
        "page": page,
    }


def volume_address_to_index(hexagon: str, wall: int, shelf: int,
                            volume: int) -> int:
    """Адрес тома → линейный индекс тома."""
    hex_num = decode_hexagon(hexagon)
    local = (
        (wall - 1) * SHELVES * VOLUMES
        + (shelf - 1) * VOLUMES
        + (volume - 1)
    )
    return hex_num * LOCAL_VOLUMES + local


def volume_index_to_address(index: int) -> dict:
    """Линейный индекс тома → адрес тома."""
    hex_num, local = divmod(index, LOCAL_VOLUMES)
    volume = local % VOLUMES + 1
    local //= VOLUMES
    shelf = local % SHELVES + 1
    local //= SHELVES
    wall = local % WALLS + 1
    return {
        "hexagon": encode_hexagon(hex_num),
        "wall": wall,
        "shelf": shelf,
        "volume": volume,
    }


# ═══════════════════════════════════════════════════════════════════════
#  Биекция: аффинный шифр
# ═══════════════════════════════════════════════════════════════════════

def encrypt_page(index: int) -> int:
    """Прямое преобразование: линейный индекс → число содержимого страницы."""
    return (A_PAGE * index + B_PAGE) % M_PAGE


def decrypt_page(value: int) -> int:
    """Обратное преобразование: число содержимого → линейный индекс."""
    return (A_PAGE_INV * (value - B_PAGE)) % M_PAGE


def encrypt_title(index: int) -> int:
    """Прямое преобразование для названий томов."""
    return (A_TITLE * index + B_TITLE) % M_TITLE


def decrypt_title(value: int) -> int:
    """Обратное преобразование для названий томов."""
    return (A_TITLE_INV * (value - B_TITLE)) % M_TITLE


# ═══════════════════════════════════════════════════════════════════════
#  Публичный API: генерация и поиск страниц/названий
# ═══════════════════════════════════════════════════════════════════════

def generate_page(hexagon: str, wall: int, shelf: int,
                  volume: int, page: int) -> str:
    """По адресу генерирует содержимое страницы (ровно 3200 символов)."""
    index = address_to_index(hexagon, wall, shelf, volume, page)
    cipher = encrypt_page(index)
    return number_to_text(cipher, PAGE_LEN)


def locate_text(text_3200: str) -> dict:
    """По тексту страницы (ровно 3200 символов) вычисляет её адрес."""
    if len(text_3200) != PAGE_LEN:
        raise ValueError(
            f"Текст должен содержать ровно {PAGE_LEN} символов, получено {len(text_3200)}"
        )
    n = text_to_number(text_3200)
    index = decrypt_page(n)
    return index_to_address(index)


def generate_title(hexagon: str, wall: int, shelf: int, volume: int) -> str:
    """По адресу тома генерирует его название (ровно 25 символов)."""
    index = volume_address_to_index(hexagon, wall, shelf, volume)
    cipher = encrypt_title(index)
    return number_to_text(cipher, TITLE_LEN)


def locate_title(title_25: str) -> dict:
    """По названию тома (ровно 25 символов) вычисляет адрес тома."""
    if len(title_25) != TITLE_LEN:
        raise ValueError(
            f"Название должно содержать ровно {TITLE_LEN} символов, получено {len(title_25)}"
        )
    n = text_to_number(title_25)
    index = decrypt_title(n)
    return volume_index_to_address(index)


def generate_shelf_titles(hexagon: str, wall: int, shelf: int) -> list[dict]:
    """Генерирует названия для всех томов (1..VOLUMES) на заданной полке."""
    titles = []
    for vol in range(1, VOLUMES + 1):
        t = generate_title(hexagon, wall, shelf, vol).strip()
        titles.append({
            "volume": vol,
            "title": t or "—"
        })
    return titles


# ═══════════════════════════════════════════════════════════════════════
#  Режимы поиска
# ═══════════════════════════════════════════════════════════════════════

def _make_preview(page: str, offset: int, length: int) -> str:
    """Формирует превью: до 200 символов вокруг найденного текста."""
    start = max(0, offset - 80)
    end = min(PAGE_LEN, start + 200)
    return page[start:end]


def search_exact(query: str) -> dict:
    """
    Режим 1: Точное совпадение.

    Искомая фраза помещается в начало страницы,
    остаток заполняется пробелами.
    """
    cleaned = normalize_text(query)[:PAGE_LEN]
    offset = 0
    page = cleaned + " " * (PAGE_LEN - len(cleaned))
    address = locate_text(page)
    return {
        "address": address,
        "offset": offset,
        "query_length": len(cleaned),
        "preview": _make_preview(page, offset, len(cleaned)),
    }


def search_random_chars(query: str) -> dict:
    """
    Режим 2: Среди случайных символов.

    Фраза помещается на случайную позицию,
    остаток заполняется случайными символами алфавита.
    """
    cleaned = normalize_text(query)[:PAGE_LEN]
    max_offset = PAGE_LEN - len(cleaned)
    offset = random.randint(0, max_offset) if max_offset > 0 else 0

    left = "".join(random.choice(ALPHABET) for _ in range(offset))
    right_len = PAGE_LEN - offset - len(cleaned)
    right = "".join(random.choice(ALPHABET) for _ in range(right_len))
    page = left + cleaned + right

    address = locate_text(page)
    return {
        "address": address,
        "offset": offset,
        "query_length": len(cleaned),
        "preview": _make_preview(page, offset, len(cleaned)),
    }


def _fill_with_words(target_len: int, wordlist: list[str]) -> str:
    """
    Заполняет target_len символов случайными словами из словаря,
    разделёнными пробелами. Остаток дополняется пробелами.
    """
    if target_len <= 0:
        return ""
    parts: list[str] = []
    current = 0
    attempts = 0
    max_attempts = target_len * 2
    while current < target_len and attempts < max_attempts:
        word = random.choice(wordlist)
        sep = 1 if current > 0 else 0
        if current + sep + len(word) <= target_len:
            if sep:
                parts.append(" ")
                current += 1
            parts.append(word)
            current += len(word)
        else:
            attempts += 1
    result = "".join(parts)
    return result + " " * (target_len - len(result))


def search_random_words(query: str, wordlist: list[str]) -> dict:
    """
    Режим 3: Среди случайных русских слов.

    Фраза встраивается на случайную позицию страницы,
    свободное пространство заполняется словами из словаря.
    """
    cleaned = normalize_text(query)[:PAGE_LEN]
    max_offset = PAGE_LEN - len(cleaned)
    offset = random.randint(0, max_offset) if max_offset > 0 else 0

    left = _fill_with_words(offset, wordlist)
    right_len = PAGE_LEN - offset - len(cleaned)
    right = _fill_with_words(right_len, wordlist)
    page = left + cleaned + right

    if len(page) != PAGE_LEN:
        raise RuntimeError(
            f"Ошибка формирования страницы: {len(page)} != {PAGE_LEN}"
        )

    address = locate_text(page)
    return {
        "address": address,
        "offset": offset,
        "query_length": len(cleaned),
        "preview": _make_preview(page, offset, len(cleaned)),
    }


def search_title(query: str) -> dict:
    """
    Режим 4: Поиск по названию тома.

    Запрос обрезается до 25 символов, дополняется пробелами,
    и по нему вычисляется адрес тома.
    """
    cleaned = normalize_text(query)[:TITLE_LEN]
    padded = cleaned.ljust(TITLE_LEN)
    vol_addr = locate_title(padded)
    return {
        "address": {**vol_addr, "page": 1},
        "offset": 0,
        "query_length": len(cleaned),
        "preview": padded.strip(),
    }


# ═══════════════════════════════════════════════════════════════════════
#  Случайный адрес для «блуждания»
# ═══════════════════════════════════════════════════════════════════════

def random_address() -> dict:
    """Генерирует случайный адрес в библиотеке."""
    return {
        "hexagon": encode_hexagon(random.randint(0, 2**64 - 1)),
        "wall": random.randint(1, WALLS),
        "shelf": random.randint(1, SHELVES),
        "volume": random.randint(1, VOLUMES),
        "page": random.randint(1, PAGES),
    }
