@echo off
setlocal

REM One-click start for backend (Django) + frontend (React)
REM Run from project root: start-dev.bat

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%easys_django"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

if not exist "%BACKEND_DIR%\manage.py" (
  echo [ERROR] Backend manage.py not found: %BACKEND_DIR%\manage.py
  pause
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Frontend package.json not found: %FRONTEND_DIR%\package.json
  pause
  exit /b 1
)

echo Starting Django backend on http://127.0.0.1:8000 ...
start "Django Backend" cmd /k "cd /d "%BACKEND_DIR%" && python manage.py runserver 127.0.0.1:8000"

timeout /t 2 /nobreak >nul

echo Starting React frontend on http://127.0.0.1:3000 ...
start "React Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm start"

echo.
echo Done. Two terminals launched.
echo - Backend:  http://127.0.0.1:8000
echo - Frontend: http://127.0.0.1:3000
echo.
endlocal
