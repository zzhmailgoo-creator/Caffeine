@echo off
setlocal

cd /d "%~dp0"

echo Starting Caffeine Tracker Pro...
echo.
echo Local URL: http://127.0.0.1:4173/
echo Press Ctrl+C to stop the dev server.
echo.

call npm run dev -- --host 127.0.0.1 --port 4173
