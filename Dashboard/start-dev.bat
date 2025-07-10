@echo off
echo Starting Dashboard Development Environment...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd Backend && npm run dev:backend-only"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Development Server...
start "Frontend Server" cmd /k "cd Frontend/client && npm run dev:frontend-only"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause > nul
