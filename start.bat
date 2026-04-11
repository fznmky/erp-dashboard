@echo off
echo Starting Quote Manager ERP Ecosystem...
echo.

echo 1/2: Checking Requirements
:: Check if node_modules exists, if not, install dependencies automatically
if not exist "node_modules\" (
    echo Installing required dependencies...
    call npm install
)

echo 2/3: Starting Backend API (Local File System Save Agent)
start "ERP Backend" cmd /k "node server.js"

echo 3/3: Starting Frontend Engine (Vite)
start "ERP Frontend" cmd /k "npx vite"

echo.
echo Process complete. The application will open in your default browser.
timeout /t 3 >nul
