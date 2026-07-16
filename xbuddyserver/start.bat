@echo off
title XBuddy Print Agent
color 0A
echo.
echo  ================================
echo   XBuddy Print Agent
echo  ================================
echo.
cd /d "%~dp0"
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  Node.js not found. Please run SETUP.bat first.
    pause
    exit /b 1
)
if not exist "node_modules" (
    echo  Installing dependencies...
    call npm install --silent
)
if exist "cloudflared.exe" (
    start "" /min cmd /c "cloudflared.exe tunnel --url http://localhost:3001 > tunnel.log 2>&1"
)
node index.js
pause
