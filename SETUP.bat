@echo off
title X Buddy Setup
color 0A
echo.
echo  ================================
echo   X Buddy Print Agent Setup
echo  ================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Node.js not found. Installing...
    echo  [!] Downloading Node.js installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.20.4/node-v18.20.4-x64.msi' -OutFile 'node-setup.msi'"
    echo  [!] Installing Node.js...
    msiexec /i node-setup.msi /quiet /norestart
    del node-setup.msi
    echo  [OK] Node.js installed!
) else (
    echo  [OK] Node.js found!
)

:: Install dependencies
echo.
echo  [..] Installing dependencies...
call npm install --prefix "%~dp0"
echo  [OK] Dependencies installed!

:: Done
echo.
echo  ================================
echo   Setup Complete! 
echo   Now double-click START.bat
echo  ================================
echo.
pause
