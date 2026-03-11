#!/bin/bash
# Quick Start Script for CRM Backend

echo "================================================"
echo "  CRM Backend - Quick Start Setup"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"
echo ""

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB CLI not found, but it may still be running locally"
    echo "If not, please start MongoDB manually:"
    echo "  macOS: brew services start mongodb-community"
    echo "  Windows: Start MongoDB from Services"
    echo "  Linux: sudo systemctl start mongod"
    echo ""
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "🔧 Creating .env file from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env with your MongoDB URI"
    echo "  Current: MONGODB_URI=mongodb://localhost:27017/crm_db"
    echo ""
fi

# Display menu options
echo "================================================"
echo "  Select an option:"
echo "================================================"
echo ""
echo "  1) Start server (development mode with nodemon)"
echo "  2) Start server (production mode)"
echo "  3) Seed database with sample data"
echo "  4) Verify API endpoints"
echo "  5) View API documentation"
echo "  6) Edit .env file"
echo "  7) Exit"
echo ""

read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting server in development mode..."
        npm run dev
        ;;
    2)
        echo ""
        echo "🚀 Starting server in production mode..."
        npm start
        ;;
    3)
        echo ""
        echo "🌱 Seeding database..."
        npm run seed
        ;;
    4)
        echo ""
        echo "✔️  Verifying API endpoints..."
        npm run verify
        ;;
    5)
        echo ""
        echo "📖 Opening API documentation..."
        if command -v open &> /dev/null; then
            open API_DOCUMENTATION.md
        elif command -v xdg-open &> /dev/null; then
            xdg-open API_DOCUMENTATION.md
        else
            echo "Please open API_DOCUMENTATION.md manually"
        fi
        ;;
    6)
        echo ""
        echo "📝 Opening .env for editing..."
        if [ -n "$EDITOR" ]; then
            $EDITOR .env
        elif command -v nano &> /dev/null; then
            nano .env
        else
            echo "Please edit .env manually"
        fi
        ;;
    7)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please select 1-7."
        exit 1
        ;;
esac
