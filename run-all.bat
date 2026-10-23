@echo off
title Hyder OS & Desktop Commander - Dual Engine Launch
color 0b

echo ======================================================================
echo    HYDER OS - DUAL-ENGINE LAUNCHER (WEB UI + DESKTOP BRIDGE)
echo ======================================================================
echo.

:: 1. Verify Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH!
    echo Please install Node.js (v18+) from https://nodejs.org/ to proceed.
    pause
    exit /b 1
)

:: 2. Check root dependencies
if not exist "node_modules\" (
    echo [SETUP] Installing main dependencies...
    call npm install
)

:: 3. Check desktop-commander dependencies
if not exist "desktop-commander\node_modules\" (
    echo [SETUP] Installing Desktop Commander dependencies...
    cd desktop-commander
    call npm install
    cd ..
)

echo.
echo [1/3] Launching Desktop Commander Bridge on port 9742 in background window...
start "Hyder Desktop Commander [Bridge: 9742]" cmd /k "cd desktop-commander && node server.js"

echo [2/3] Starting Hyder OS Web Interface on port 3000...
echo [3/3] Opening browser at http://localhost:3000 ...

timeout /t 2 >nul
start http://localhost:3000

call npm run dev

pause
