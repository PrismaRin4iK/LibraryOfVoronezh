@echo off
chcp 65001 > nul
echo ===================================================
echo   Запуск Русской Вавилонской Библиотеки
echo ===================================================
echo.

echo [1/2] Запуск сервера FastAPI (Бэкенд: http://127.0.0.1:8000)...
start "Babel Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --port 8000 --reload"

echo [2/2] Запуск интерфейса Vite (Фронтенд: http://127.0.0.1:5173)...
start "Babel Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Проект запущен!
echo Откройте в браузере: http://127.0.0.1:5173/
echo ===================================================
timeout /t 3 > nul
start http://127.0.0.1:5173/
