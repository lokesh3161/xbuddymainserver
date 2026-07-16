@echo off
title X Buddy Print Agent
color 0A
echo.
echo  X Buddy Print Agent Starting...
echo  ================================
echo.
cd /d "%~dp0"
start "" /min cloudflared.exe tunnel --url http://localhost:3001
XBuddy-PrintAgent.exe
pause
