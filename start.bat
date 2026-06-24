@echo off
echo Starting World Cup 2026 App...
echo.

cd /d "%~dp0backend"
echo Starting Backend on port 3001...
start "WorldCup Backend" cmd /k "npm run dev"

cd /d "%~dp0frontend"
echo Starting Frontend on port 3000...
start "WorldCup Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
pause