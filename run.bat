@echo off
echo =========================================================================
echo  Smart Traffic Violation & Vehicle Analytics Management System (STVAMS)
echo =========================================================================
echo.
echo Starting STVAMS Services...
echo.

echo Launching FastAPI Backend (http://localhost:8000)...
start "STVAMS Backend Server" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Launching React Frontend (http://localhost:5173)...
start "STVAMS Frontend Dev Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =========================================================================
echo  STVAMS Services Launched Successfully!
echo =========================================================================
echo  Frontend Dashboard UI : http://localhost:5173
echo  Backend REST API Docs  : http://localhost:8000/api/v1/docs
echo =========================================================================
echo.
pause
