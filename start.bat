@echo off
echo Starting Inventory Management System...
echo.

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install root dependencies
    pause
    exit /b 1
)

cd server
echo Installing server dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install server dependencies
    pause
    exit /b 1
)

cd ..\client
echo Installing client dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install client dependencies
    pause
    exit /b 1
)

cd ..
echo.
echo All dependencies installed successfully!
echo.
echo Starting the application...
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.
echo Default login credentials:
echo Admin: admin / admin123
echo Manager: manager / manager123
echo Cashier: cashier / cashier123
echo.
echo Press Ctrl+C to stop the application
echo.

call npm run dev
