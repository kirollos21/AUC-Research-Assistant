@echo off
setlocal enabledelayedexpansion

echo 🚀 Setting up AUC Research Assistant Mobile App...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js v16 or higher.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% LSS 16 (
    echo ❌ Node.js version 16 or higher is required. Current version: 
    node --version
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed.
    pause
    exit /b 1
)

echo ✅ npm version: 
npm --version

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies.
    pause
    exit /b 1
)

REM Check if React Native CLI is installed globally
react-native --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing React Native CLI globally...
    call npm install -g @react-native-community/cli
    if errorlevel 1 (
        echo ❌ Failed to install React Native CLI.
        pause
        exit /b 1
    )
)

echo ✅ React Native CLI installed

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    (
        echo API_BASE_URL=http://127.0.0.1:8000
        echo ENVIRONMENT=development
    ) > .env
    echo ✅ .env file created
)

REM Check for Android Studio/SDK
if exist "%USERPROFILE%\AppData\Local\Android\Sdk" (
    echo ✅ Android SDK found
) else if exist "C:\Android\Sdk" (
    echo ✅ Android SDK found
) else (
    echo ⚠️  Android SDK not found in common locations.
    echo    Please install Android Studio and set up the Android SDK.
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Start the backend server: cd ..\backend ^&^& python main.py
echo 2. Start Metro bundler: npm start
echo 3. Run on Android: npm run android
echo.
echo For more information, see README.md
pause 