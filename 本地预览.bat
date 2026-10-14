@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required for local preview. GitHub Pages needs no Node.js.
  echo Install Node.js or deploy to GitHub Pages using README.md.
  pause
  exit /b 1
)
echo Open http://localhost:8080 in Chrome or Edge. Press Ctrl+C to stop.
node preview.cjs --open
pause
