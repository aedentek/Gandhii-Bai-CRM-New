#!/usr/bin/env node

/**
 * Frontend Build Script for Gandhi Bai Healthcare CRM
 * This script will build the React frontend and deploy it
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

console.log('🏥 Building Gandhi Bai Healthcare CRM Frontend...');

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build the React app
  console.log('⚡ Building React frontend...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if build was successful
  const distIndex = './dist/index.html';
  if (existsSync(distIndex)) {
    const content = readFileSync(distIndex, 'utf-8');
    if (content.includes('<script') && content.includes('assets/')) {
      console.log('✅ React build successful!');
      console.log('🚀 Frontend is ready to serve the full CRM UI');
    } else {
      console.log('⚠️ Build completed but may not be a proper React build');
    }
  }

} catch (error) {
  console.log('❌ Build failed:', error.message);
  console.log('💡 The server will fallback to the static landing page');
  console.log('🔧 Check dependencies and fix build issues to enable full UI');
}

console.log('📡 Server will automatically serve the best available version');
