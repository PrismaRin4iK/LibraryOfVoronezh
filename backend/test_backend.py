"""
Тесты для Русской Вавилонской Библиотеки.
Запуск: python test_backend.py
"""

import unittest

from algorithm import (
    generate_page,
    locate_text,
    generate_title,
    locate_title,
    generate_shelf_titles,
    decode_hexagon,
    search_exact,
    search_random_chars,
    search_random_words,
    search_title,
    random_address,
    normalize_text,
    PAGE_LEN,
    TITLE_LEN,
    VOLUMES,
)
from dictionary import RUSSIAN_WORDS
from main import (
    api_health,
    api_stats,
    api_search,
    api_browse,
    api_shelf,
    api_random,
    SearchRequest,
)


class TestBabelAlgorithm(unittest.TestCase):
    def test_page_bijection(self):
        """Проверка строгой биективности: locate_text(generate_page(addr)) == addr"""
        hex_id = "4f8a12bc"
        w, s, v, p = 2, 3, 15, 88
        page_text = generate_page(hex_id, w, s, v, p)
        self.assertEqual(len(page_text), PAGE_LEN)

        addr = locate_text(page_text)
        self.assertEqual(addr["hexagon"], hex_id)
        self.assertEqual(addr["wall"], w)
        self.assertEqual(addr["shelf"], s)
        self.assertEqual(addr["volume"], v)
        self.assertEqual(addr["page"], p)

    def test_title_bijection(self):
        """Проверка обратимости названий томов: locate_title(generate_title(addr)) == addr"""
        hex_id = "77aa"
        w, s, v = 1, 4, 29
        title = generate_title(hex_id, w, s, v)
        self.assertEqual(len(title), TITLE_LEN)

        addr = locate_title(title)
        self.assertEqual(addr["hexagon"], hex_id)
        self.assertEqual(addr["wall"], w)
        self.assertEqual(addr["shelf"], s)
        self.assertEqual(addr["volume"], v)

    def test_shelf_titles(self):
        """Проверка генерации списка всех 32 томов на полке."""
        titles = generate_shelf_titles("abc12", 1, 1)
        self.assertEqual(len(titles), VOLUMES)
        for i, item in enumerate(titles, start=1):
            self.assertEqual(item["volume"], i)
            self.assertIsInstance(item["title"], str)
            self.assertTrue(len(item["title"]) > 0)

    def test_decode_hexagon_safety(self):
        """Проверка безопасного декодирования строк гексагона."""
        self.assertEqual(decode_hexagon("0x1a"), 26)
        self.assertEqual(decode_hexagon("1a"), 26)
        self.assertEqual(decode_hexagon("  1a  "), 26)
        self.assertEqual(decode_hexagon(""), 0)
        self.assertEqual(decode_hexagon("xyz"), 0)

    def test_search_exact(self):
        """Проверка режима точного поиска."""
        q = "воронеж колыбель флота"
        res = search_exact(q)
        addr = res["address"]
        text = generate_page(addr["hexagon"], addr["wall"], addr["shelf"], addr["volume"], addr["page"])
        norm = normalize_text(q)
        self.assertTrue(text.startswith(norm))

    def test_search_random_chars(self):
        """Проверка режима поиска среди случайных символов."""
        q = "платонов котлован"
        res = search_random_chars(q)
        addr = res["address"]
        offset = res["offset"]
        text = generate_page(addr["hexagon"], addr["wall"], addr["shelf"], addr["volume"], addr["page"])
        norm = normalize_text(q)
        self.assertEqual(text[offset : offset + len(norm)], norm)

    def test_search_random_words(self):
        """Проверка режима поиска среди случайных слов."""
        q = "мандельштам воронежские тетради"
        res = search_random_words(q, RUSSIAN_WORDS)
        addr = res["address"]
        offset = res["offset"]
        text = generate_page(addr["hexagon"], addr["wall"], addr["shelf"], addr["volume"], addr["page"])
        norm = normalize_text(q)
        self.assertEqual(text[offset : offset + len(norm)], norm)

    def test_search_title(self):
        """Проверка поиска по названию тома."""
        q = "бесконечная библиотека"
        res = search_title(q)
        addr = res["address"]
        t = generate_title(addr["hexagon"], addr["wall"], addr["shelf"], addr["volume"])
        norm = normalize_text(q)
        self.assertTrue(t.startswith(norm))


class TestFastAPIEndpoints(unittest.TestCase):
    def test_health(self):
        res = api_health()
        self.assertEqual(res["status"], "ok")

    def test_stats(self):
        res = api_stats()
        self.assertEqual(res.alphabet_size, 34)
        self.assertEqual(res.page_length, 3200)
        self.assertEqual(res.volumes_per_shelf, 32)
        self.assertEqual(res.pages_per_volume, 410)

    def test_random(self):
        res = api_random()
        self.assertTrue(isinstance(res.hexagon, str))
        self.assertTrue(1 <= res.wall <= 4)
        self.assertTrue(1 <= res.shelf <= 5)
        self.assertTrue(1 <= res.volume <= 32)
        self.assertTrue(1 <= res.page <= 410)

    def test_browse(self):
        res = api_browse(hexagon="1a2b", wall=1, shelf=1, volume=1, page=1)
        self.assertEqual(len(res.text), 3200)
        self.assertEqual(len(res.title), 25)

    def test_shelf(self):
        res = api_shelf(hexagon="1a2b", wall=2, shelf=3)
        self.assertEqual(len(res.volumes), 32)
        self.assertEqual(res.volumes[0].volume, 1)

    def test_search_endpoint(self):
        req = SearchRequest(query="русский космос", mode="exact")
        res = api_search(req)
        self.assertEqual(res.query_length, len("русский космос"))
        self.assertTrue(isinstance(res.preview, str))


if __name__ == "__main__":
    unittest.main()
