"""
Русская Вавилонская Библиотека — FastAPI-сервер.

Эндпоинты:
  POST /api/search  — поиск текста (4 режима)
  GET  /api/browse  — просмотр страницы по адресу
  GET  /api/shelf   — список томов на заданной полке
  GET  /api/random  — случайный адрес для «блуждания»
  GET  /api/stats   — характеристики и статистика библиотеки
  GET  /api/health  — проверка работоспособности сервиса
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal, List

from algorithm import (
    generate_page,
    generate_title,
    generate_shelf_titles,
    search_exact,
    search_random_chars,
    search_random_words,
    search_title,
    random_address,
    WALLS,
    SHELVES,
    VOLUMES,
    PAGES,
    PAGE_LEN,
    TITLE_LEN,
    ALPHABET,
    LOCAL_PAGES,
    LOCAL_VOLUMES,
)
from dictionary import RUSSIAN_WORDS


# ═══════════════════════════════════════════════════════════════════════
#  Приложение FastAPI
# ═══════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="Русская Вавилонская Библиотека",
    description="API для навигации по бесконечной библиотеке русского текста",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════
#  Pydantic-модели
# ═══════════════════════════════════════════════════════════════════════

class AddressModel(BaseModel):
    hexagon: str
    wall: int = Field(ge=1, le=WALLS)
    shelf: int = Field(ge=1, le=SHELVES)
    volume: int = Field(ge=1, le=VOLUMES)
    page: int = Field(ge=1, le=PAGES)


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=3200)
    mode: Literal["exact", "random_chars", "random_words", "title"]


class SearchResponse(BaseModel):
    address: AddressModel
    offset: int
    query_length: int
    preview: str


class BrowseResponse(BaseModel):
    text: str
    title: str


class RandomResponse(BaseModel):
    hexagon: str
    wall: int
    shelf: int
    volume: int
    page: int


class VolumeItem(BaseModel):
    volume: int
    title: str


class ShelfResponse(BaseModel):
    hexagon: str
    wall: int
    shelf: int
    volumes: List[VolumeItem]


class StatsResponse(BaseModel):
    alphabet_size: int
    alphabet: str
    page_length: int
    title_length: int
    walls_per_hex: int
    shelves_per_wall: int
    volumes_per_shelf: int
    pages_per_volume: int
    volumes_per_hex: int
    pages_per_hex: int
    dictionary_size: int
    total_combinations: str


# ═══════════════════════════════════════════════════════════════════════
#  Эндпоинты
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/health")
def api_health():
    """Проверка доступности API."""
    return {"status": "ok", "service": "Русская Вавилонская Библиотека"}


@app.get("/api/stats", response_model=StatsResponse)
def api_stats():
    """Возвращает параметры и статистику библиотеки."""
    return StatsResponse(
        alphabet_size=len(ALPHABET),
        alphabet=ALPHABET,
        page_length=PAGE_LEN,
        title_length=TITLE_LEN,
        walls_per_hex=WALLS,
        shelves_per_wall=SHELVES,
        volumes_per_shelf=VOLUMES,
        pages_per_volume=PAGES,
        volumes_per_hex=LOCAL_VOLUMES,
        pages_per_hex=LOCAL_PAGES,
        dictionary_size=len(RUSSIAN_WORDS),
        total_combinations="34^3200 (~1.95 × 10^4900)",
    )


@app.post("/api/search", response_model=SearchResponse)
def api_search(req: SearchRequest):
    """
    Поиск текста в библиотеке.

    Режимы:
    - exact: точное совпадение (остаток — пробелы)
    - random_chars: среди случайных символов
    - random_words: среди случайных русских слов
    - title: поиск по названию тома
    """
    try:
        if req.mode == "exact":
            result = search_exact(req.query)
        elif req.mode == "random_chars":
            result = search_random_chars(req.query)
        elif req.mode == "random_words":
            result = search_random_words(req.query, RUSSIAN_WORDS)
        elif req.mode == "title":
            result = search_title(req.query)
        else:
            raise HTTPException(status_code=400, detail=f"Неизвестный режим: {req.mode}")

        return SearchResponse(
            address=AddressModel(**result["address"]),
            offset=result["offset"],
            query_length=result["query_length"],
            preview=result["preview"],
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/browse", response_model=BrowseResponse)
def api_browse(
    hexagon: str = Query(..., description="Идентификатор шестиугольника (hex)"),
    wall: int = Query(..., ge=1, le=WALLS, description="Стена (1-4)"),
    shelf: int = Query(..., ge=1, le=SHELVES, description="Полка (1-5)"),
    volume: int = Query(..., ge=1, le=VOLUMES, description="Том (1-32)"),
    page: int = Query(..., ge=1, le=PAGES, description="Страница (1-410)"),
):
    """Просмотр конкретной страницы библиотеки по её адресу."""
    try:
        text = generate_page(hexagon, wall, shelf, volume, page)
        title = generate_title(hexagon, wall, shelf, volume)
        return BrowseResponse(text=text, title=title)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка генерации страницы: {str(e)}")


@app.get("/api/shelf", response_model=ShelfResponse)
def api_shelf(
    hexagon: str = Query(..., description="Идентификатор шестиугольника (hex)"),
    wall: int = Query(..., ge=1, le=WALLS, description="Стена (1-4)"),
    shelf: int = Query(..., ge=1, le=SHELVES, description="Полка (1-5)"),
):
    """Возвращает список всех 32 томов на заданной полке с их сгенерированными названиями."""
    try:
        volumes = generate_shelf_titles(hexagon, wall, shelf)
        return ShelfResponse(
            hexagon=hexagon,
            wall=wall,
            shelf=shelf,
            volumes=[VolumeItem(**v) for v in volumes],
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка загрузки полки: {str(e)}")


@app.get("/api/random", response_model=RandomResponse)
def api_random():
    """Генерирует случайный адрес для «блуждания по библиотеке»."""
    addr = random_address()
    return RandomResponse(**addr)
