#!/usr/bin/env node

/**
 * EMERGENCY RENDER START - Uses minimal server to bypass all dependency issues
 * This bypasses Express and all problematic dependencies
 */

// Set production environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

console.log('� EMERGENCY START - Using minimal server to bypass dependencies');
console.log('✅ This will eliminate all path-to-regexp and Express dependency issues');
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
console.log(`🔧 Port: ${process.env.PORT || '4000'}`);
console.log('⚡ Using only Node.js built-in modules');

// Import and run the minimal server
import('./minimal-server.js').catch((error) => {
  console.error('💥 Failed to start minimal server:', error);
  process.exit(1);
});
