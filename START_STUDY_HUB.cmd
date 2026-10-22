@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
 call npm ci
 if errorlevel 1 exit /b 1
)
powershell.exe -NoLogo -NoProfile -File "%~dp0scripts\manage-local.ps1" -Action Start
if errorlevel 1 (
 echo Could not start Study Hub. See the error above.
 pause
 exit /b 1
)
start "" "http://127.0.0.1:5173/"
