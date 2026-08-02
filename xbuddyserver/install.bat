@echo off
title XBuddy Shop Package - Installation
color 0A
echo.
echo  =======================================================
echo   XBuddy SaaS - Dependency Installation
echo  =======================================================
echo.

cd /d "%~dp0"

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Node.js is missing. Downloading portable installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.20.4/node-v18.20.4-x64.msi' -OutFile '%TEMP%\node-setup.msi'"
    echo  [!] Installing Node.js...
    msiexec /i "%TEMP%\node-setup.msi" /quiet /norestart
    del "%TEMP%\node-setup.msi"
    echo  [OK] Node.js successfully installed!
) else (
    echo  [OK] Node.js is present!
)

:: Install npm dependencies
echo.
echo  [..] Installing npm packages...
call npm install --no-audit
if %errorlevel% neq 0 (
    echo  [!] npm install encountered an error. Please check your internet connection.
    pause
    exit /b 1
)
echo  [OK] Installation completed successfully!
echo.
echo  =======================================================
echo   Setup ready! Double-click START.bat to run XBuddy.
echo  =======================================================
echo.
pause
