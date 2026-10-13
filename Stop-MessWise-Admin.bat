@echo off
title Stop MessWise OS Web Admin
setlocal

echo ========================================================
echo       Stopping MessWise OS Web Admin Server (Port 3000)
echo ========================================================

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo [INFO] Terminating PID %%a on port 3000...
    taskkill /f /pid %%a >nul 2>&1
)

echo [SUCCESS] Web Admin server has been stopped cleanly.
timeout /t 2 >nul
exit /b 0
