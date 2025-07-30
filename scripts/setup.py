#!/usr/bin/env python3
"""
AUC Research Assistant - Development Setup Script
This script helps set up the development environment for both backend and frontend.
"""

import os
import sys
import subprocess
import platform
from pathlib import Path


def run_command(command, cwd=None, check=True):
    """Run a shell command and handle errors"""
    print(f"Running: {command}")
    try:
        result = subprocess.run(
            command, shell=True, cwd=cwd, check=check, capture_output=True, text=True
        )
        if result.stdout:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Error: {e.stderr}")
        if check:
            sys.exit(1)
        return e


def check_prerequisites():
    """Check if required tools are installed"""
    print("Checking prerequisites...")

    # Check Python
    try:
        result = run_command("python --version")
        print(f"✓ Python found: {result.stdout.strip()}")
    except:
        print("✗ Python not found. Please install Python 3.11+")
        sys.exit(1)

    # Check Node.js
    try:
        result = run_command("node --version")
        print(f"✓ Node.js found: {result.stdout.strip()}")
    except:
        print("✗ Node.js not found. Please install Node.js 18+")
        sys.exit(1)

    # Check npm
    try:
        result = run_command("npm --version")
        print(f"✓ npm found: {result.stdout.strip()}")
    except:
        print("✗ npm not found. Please install npm")
        sys.exit(1)


def setup_backend():
    """Set up the Python backend environment"""
    print("\n🐍 Setting up Backend (Python/FastAPI)...")

    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("✗ Backend directory not found")
        return False

    # Create virtual environment
    venv_path = backend_dir / "venv"
    if not venv_path.exists():
        print("Creating virtual environment...")
        run_command("python -m venv venv", cwd=backend_dir)
    else:
        print("✓ Virtual environment already exists")

    # Activate virtual environment and install dependencies
    if platform.system() == "Windows":
        pip_cmd = "venv\\Scripts\\pip"
        python_cmd = "venv\\Scripts\\python"
    else:
        pip_cmd = "venv/bin/pip"
        python_cmd = "venv/bin/python"

    print("Installing Python dependencies...")
    run_command(f"{pip_cmd} install --upgrade pip", cwd=backend_dir)
    run_command(f"{pip_cmd} install -r requirements.txt", cwd=backend_dir)

    # Create .env file if it doesn't exist
    env_file = backend_dir / ".env"
    env_example = backend_dir / "env.example"
    if not env_file.exists() and env_example.exists():
        print("Creating .env file from template...")
        with open(env_example, "r") as f:
            content = f.read()
        with open(env_file, "w") as f:
            f.write(content)
        print("⚠️  Please edit backend/.env with your configuration")

    print("✓ Backend setup complete!")
    return True


def setup_frontend():
    """Set up the Next.js frontend environment"""
    print("\n⚛️  Setting up Frontend (Next.js)...")

    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("✗ Frontend directory not found")
        return False

    # Check if package.json exists
    package_json = frontend_dir / "package.json"
    if not package_json.exists():
        print(
            "✗ Frontend not initialized. Please run: npx create-next-app@latest frontend"
        )
        return False

    # Install dependencies
    print("Installing Node.js dependencies...")
    run_command("npm install", cwd=frontend_dir)

    # Create .env.local file if it doesn't exist
    env_file = frontend_dir / ".env.local"
    if not env_file.exists():
        print("Creating .env.local file...")
        env_content = """# Next.js Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=AUC Research Assistant
"""
        with open(env_file, "w") as f:
            f.write(env_content)
        print("⚠️  Please edit frontend/.env.local with your configuration")

    print("✓ Frontend setup complete!")
    return True


def create_start_script():
    """Create a convenient start script for development"""
    print("\n📝 Creating development start script...")

    if platform.system() == "Windows":
        script_content = """@echo off
echo Starting AUC Research Assistant Development Environment...

echo Starting Backend...
start "Backend" cmd /k "cd backend && venv\\Scripts\\activate && python main.py"

echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo Both services are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
"""
        with open("start-dev.bat", "w") as f:
            f.write(script_content)
        print("✓ Created start-dev.bat")

    else:
        script_content = """#!/bin/bash
echo "Starting AUC Research Assistant Development Environment..."

echo "Starting Backend..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

echo "Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Both services are starting..."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services"

# Function to cleanup on exit
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup INT
wait
"""
        with open("start-dev.sh", "w") as f:
            f.write(script_content)
        run_command("chmod +x start-dev.sh")
        print("✓ Created start-dev.sh")


def main():
    """Main setup function"""
    print("🚀 AUC Research Assistant - Development Setup")
    print("=" * 50)

    # Change to project root directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    os.chdir(project_root)

    check_prerequisites()

    backend_success = setup_backend()
    frontend_success = setup_frontend()

    if backend_success and frontend_success:
        create_start_script()

        print("\n🎉 Setup complete!")
        print("\nNext steps:")
        print("1. Edit backend/.env with your configuration")
        print("2. Edit frontend/.env.local with your configuration")
        print("3. Start development servers:")
        if platform.system() == "Windows":
            print("   - Run: start-dev.bat")
        else:
            print("   - Run: ./start-dev.sh")
        print("\nServices will be available at:")
        print("- Frontend: http://localhost:3000")
        print("- Backend API: http://localhost:8000")
        print("- API Documentation: http://localhost:8000/docs")
    else:
        print("\n❌ Setup failed. Please check the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
