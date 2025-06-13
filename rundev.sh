#!/bin/bash

echo "Running development setup for Trend Tracker Pro"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the frontend
echo "Building frontend..."
npm run build

# Start the development server with both frontend and backend
echo "Starting development server..."
if [ "$1" = "server-only" ]; then
  echo "Running server only..."
  npm run start
else
  echo "Running full development environment..."
  npm run dev & npm run start
fi 