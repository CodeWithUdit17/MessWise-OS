@echo off
title MessWise OS — Web Admin Launcher
setlocal

echo ========================================================
echo       Starting MessWise OS Web Admin Command Center
echo ========================================================

cd /d "%~dp0web-admin"

:: Check if port 3000 is already in use
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [INFO] Web Admin is already running on http://localhost:3000!
    goto OPEN_BROWSER
)

echo [INFO] Launching Web Admin server in the background...
start /min "MessWise Admin Server" cmd /c "npm run dev"

:: Wait up to 10 seconds for the server to spin up
echo [INFO] Waiting for server to initialize...
set /a attempts=0
:WAIT_LOOP
timeout /t 1 /nobreak >nul
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% equ 0 goto OPEN_BROWSER
set /a attempts+=1
if %attempts% lss 15 goto WAIT_LOOP

:OPEN_BROWSER
echo [SUCCESS] Server is live! Opening browser...
start http://localhost:3000
echo ========================================================
echo MessWise OS Web Admin is running at http://localhost:3000
echo To stop the server later, run Stop-MessWise-Admin.bat
echo ========================================================
timeout /t 3 >nul
exit /b 0
