@echo off
title Haider Desktop Commander - Native Windows Bridge
color 0b

echo =======================================================
echo   HAIDER DESKTOP COMMANDER - WINDOWS LOCAL BRIDGE      
echo =======================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH!
    echo Please install Node.js from https://nodejs.org/ to proceed.
    pause
    exit /b 1
)

:: Check if node_modules exists, if not install
if not exist "node_modules\" (
    echo [SETUP] Installing required dependencies (express, cors, ws)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install npm dependencies.
        pause
        exit /b 1
    )
)

:: Set default environment variables if not provided
if "%DESKTOP_COMMANDER_PORT%"=="" set DESKTOP_COMMANDER_PORT=9742
if "%DESKTOP_COMMANDER_TOKEN%"=="" set DESKTOP_COMMANDER_TOKEN=haider_commander_token_local

echo [STARTING] Launching Desktop Commander on port %DESKTOP_COMMANDER_PORT%...
echo [INFO] Authentication token: %DESKTOP_COMMANDER_TOKEN%
echo.

node server.js

pause
