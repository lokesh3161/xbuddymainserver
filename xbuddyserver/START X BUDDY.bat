@echo off
title XBuddy Shop Package - START
color 0A
echo.
echo  =======================================================
echo   XBuddy Print Agent - Startup ^& Launcher
echo  =======================================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Node.js was not found on your system.
    echo  [!] Running automatic installation...
    if exist "install.bat" (
        call install.bat
    ) else (
        echo  [!] Please install Node.js from https://nodejs.org/
        pause
        exit /b 1
    )
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

if not exist "config\shop-config.json" (
    if not exist "shop-config.json" (
        echo  [!] shop-config.json is missing!
        echo  [!] Please download your personalized Shop Package from XBuddy website.
        pause
        exit /b 1
    )
)

echo  [OK] Launching XBuddy Print Agent...
echo.
node index.js
pause
