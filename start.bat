@echo off
title X Buddy Print Agent
color 0A
echo.
echo  X Buddy Print Agent Starting...
echo  ================================
echo.
cd /d "%~dp0"

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Node.js not found!
    echo  [!] Please run SETUP.bat first
    pause
    exit
)

:: Check dependencies
if not exist "node_modules" (
    echo  [..] Installing dependencies first...
    call npm install
)

:: Start tunnel in background
start "" /min cmd /c "cloudflared.exe tunnel --url http://localhost:3001 > tunnel.log 2>&1"

:: Start print agent
node index.js
pause
