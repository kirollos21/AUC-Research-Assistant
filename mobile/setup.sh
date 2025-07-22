#!/bin/bash

# AUC Research Assistant Mobile App Setup Script
# This script sets up the React Native mobile app environment

set -e

echo "🚀 Setting up AUC Research Assistant Mobile App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if React Native CLI is installed globally
if ! command -v react-native &> /dev/null; then
    echo "📦 Installing React Native CLI globally..."
    npm install -g @react-native-community/cli
fi

echo "✅ React Native CLI installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
API_BASE_URL=http://127.0.0.1:8000
ENVIRONMENT=development
EOF
    echo "✅ .env file created"
fi

# Platform-specific setup
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected - Setting up iOS..."
    
    # Check if Xcode is installed
    if ! command -v xcodebuild &> /dev/null; then
        echo "⚠️  Xcode not found. iOS development will not be available."
        echo "   Please install Xcode from the App Store."
    else
        echo "✅ Xcode found"
        
        # Install iOS dependencies
        echo "📦 Installing iOS dependencies..."
        cd ios && pod install && cd ..
        echo "✅ iOS dependencies installed"
    fi
fi

# Check if Android Studio is installed (basic check)
if [ -d "$HOME/Android/Sdk" ] || [ -d "/usr/local/android-sdk" ] || [ -d "/opt/android-sdk" ]; then
    echo "✅ Android SDK found"
else
    echo "⚠️  Android SDK not found in common locations."
    echo "   Please install Android Studio and set up the Android SDK."
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start the backend server: cd ../backend && python main.py"
echo "2. Start Metro bundler: npm start"
echo "3. Run on Android: npm run android"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "4. Run on iOS: npm run ios"
fi
echo ""
echo "For more information, see README.md" 