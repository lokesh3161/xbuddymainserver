@echo off
title XBuddy Shop Package - START
color 0A
echo.
echo  =======================================================
echo   XBuddy SaaS - Automatic Shop Agent Setup & Launcher
echo  =======================================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Node.js was not found on your system.
    echo  [!] Running automatic installation...
    call install.bat
    if %errorlevel% neq 0 (
        echo  [!] Setup failed. Please install Node.js manually.
        pause
        exit /b 1
    )
)

if not exist "node_modules\express" (
    echo  [..] Installing required dependencies...
    call npm install
)

if exist "cloudflared.exe" (
    if exist "tunnel.log" del /f /q "tunnel.log"
    start "" /min cmd /c "cloudflared.exe tunnel --url http://localhost:3001 > tunnel.log 2>&1"
)

echo  [OK] Launching XBuddy...
echo.
node index.js
pause
