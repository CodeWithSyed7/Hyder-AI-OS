# Haider Desktop Commander - PowerShell Launcher
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  HAIDER DESKTOP COMMANDER - WINDOWS LOCAL BRIDGE      " -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "[SETUP] Installing dependencies..." -ForegroundColor Yellow
    npm install
}

$env:DESKTOP_COMMANDER_PORT = if ($env:DESKTOP_COMMANDER_PORT) { $env:DESKTOP_COMMANDER_PORT } else { "9742" }
$env:DESKTOP_COMMANDER_TOKEN = if ($env:DESKTOP_COMMANDER_TOKEN) { $env:DESKTOP_COMMANDER_TOKEN } else { "haider_commander_token_local" }

Write-Host "[STARTING] Haider Desktop Commander on port $env:DESKTOP_COMMANDER_PORT..." -ForegroundColor Green
node server.js
