#!/bin/bash

set -e  # Exit on any error

echo "Building React frontend..."
npm install
npm run build

# Verify build was successful
if [ ! -f "dist/index.html" ]; then
    echo "Error: React build failed - dist/index.html not found"
    exit 1
fi

echo "✓ React build successful - dist/index.html found"
ls -la dist/

echo "Installing server dependencies..."
cd server
npm install

echo "Build complete!" 