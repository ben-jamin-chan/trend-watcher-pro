#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('Starting Trend Tracker Pro Server...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 5001);

// Check if node_modules exists
if (!existsSync('./node_modules')) {
  console.log('Installing dependencies...');
  try {
    execSync('npm install --production --no-audit --prefer-offline', {
      stdio: 'inherit',
      timeout: 120000 // 2 minutes timeout
    });
    console.log('Dependencies installed successfully');
  } catch (error) {
    console.error('Failed to install dependencies:', error.message);
    console.log('Attempting to start server anyway...');
  }
} else {
  console.log('Dependencies already installed');
}

console.log('Starting server...');

// Import and start the server
try {
  await import('./server.js');
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 