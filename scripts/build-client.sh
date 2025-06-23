#!/bin/bash

# Build script for Netlify deployment
# This script ensures all dependencies are installed and builds the client

set -e  # Exit on any error

echo "🚀 Starting Netlify build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Clean install dependencies
print_status "Installing dependencies..."
npm ci

# Check if vite is available
if ! command -v npx vite &> /dev/null; then
    print_error "Vite not found. Installing it globally..."
    npm install -g vite
fi

# Build the client
print_status "Building client for production..."
npx vite build

# Check if build was successful
if [ ! -d "dist/public" ]; then
    print_error "Build failed - dist/public directory not found"
    exit 1
fi

print_status "✅ Client build completed successfully!"

# Check build output
BUILD_SIZE=$(du -sh dist/public | cut -f1)
print_status "Build size: $BUILD_SIZE"

# List built files
print_status "Built files:"
ls -la dist/public/

# Check for common issues
if [ -f "dist/public/index.html" ]; then
    print_status "✅ index.html found"
else
    print_error "❌ index.html not found - build may be incomplete"
    exit 1
fi

# Check for assets
if [ -d "dist/public/assets" ]; then
    ASSET_COUNT=$(ls dist/public/assets/ | wc -l)
    print_status "✅ Assets directory found with $ASSET_COUNT files"
else
    print_warning "⚠️  Assets directory not found"
fi

echo ""
print_status "🎉 Netlify build completed successfully!" 