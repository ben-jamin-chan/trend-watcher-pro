#!/bin/bash

echo "Building React frontend..."
npm install
npm run build

echo "Installing server dependencies..."
cd server
npm install

echo "Build complete!" 