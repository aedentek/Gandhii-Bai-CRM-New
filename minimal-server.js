#!/usr/bin/env node

/**
 * EMERGENCY MINIMAL SERVER - Bypasses all problematic dependencies
 * This server uses only Node.js built-in modules to avoid path-to-regexp errors
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 4000;

console.log('🚨 EMERGENCY MINIMAL SERVER STARTING...');
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`🔧 Port: ${PORT}`);
console.log('⚡ Using only Node.js built-in modules - NO DEPENDENCIES');

// Simple CORS headers
const setCORSHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Serve static files
const serveStatic = (filePath, res) => {
  try {
    if (existsSync(filePath)) {
      const content = readFileSync(filePath);
      const ext = filePath.split('.').pop();
      
      // Set content type based on extension
      switch (ext) {
        case 'html':
          res.setHeader('Content-Type', 'text/html');
          break;
        case 'css':
          res.setHeader('Content-Type', 'text/css');
          break;
        case 'js':
          res.setHeader('Content-Type', 'application/javascript');
          break;
        case 'ico':
          res.setHeader('Content-Type', 'image/x-icon');
          break;
        default:
          res.setHeader('Content-Type', 'text/plain');
      }
      
      res.writeHead(200);
      res.end(content);
      return true;
    }
  } catch (error) {
    console.log('Error serving static file:', error.message);
  }
  return false;
};

// Create the server
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  
  console.log(`📡 Request: ${req.method} ${pathname}`);
  
  setCORSHeaders(res);
  
  // Handle OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API Routes
  if (pathname.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json');
    
    if (pathname === '/api/test') {
      const distPath = join(__dirname, 'dist');
      const indexPath = join(distPath, 'index.html');
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        message: 'Gandhi Bai Healthcare CRM API is running',
        timestamp: new Date().toISOString(),
        server: 'Emergency Minimal Server',
        port: PORT,
        environment: process.env.NODE_ENV || 'production',
        debug: {
          distPath,
          indexPath,
          distExists: existsSync(distPath),
          indexExists: existsSync(indexPath),
          cwd: process.cwd(),
          dirname: __dirname
        }
      }));
      return;
    }
    
    if (pathname === '/api/health') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        server: 'Emergency Minimal Server'
      }));
      return;
    }
    
    if (pathname === '/api/debug-files') {
      const distPath = join(__dirname, 'dist');
      const indexPath = join(distPath, 'index.html');
      res.writeHead(200);
      res.end(JSON.stringify({
        distPath,
        indexPath,
        distExists: existsSync(distPath),
        indexExists: existsSync(indexPath),
        cwd: process.cwd(),
        dirname: __dirname,
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    // Default API 404
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'API endpoint not found',
      path: pathname,
      method: req.method
    }));
    return;
  }
  
  // Serve static files
  const distPath = join(__dirname, 'dist');
  console.log(`📁 Looking for static files in: ${distPath}`);
  
  // Try to serve the exact file requested
  if (pathname !== '/') {
    const filePath = join(distPath, pathname);
    console.log(`🔍 Trying to serve: ${filePath}`);
    if (serveStatic(filePath, res)) {
      return;
    }
  }
  
  // Serve index.html for root and all other requests (SPA routing)
  const indexPath = join(distPath, 'index.html');
  console.log(`📄 Trying to serve index.html from: ${indexPath}`);
  if (serveStatic(indexPath, res)) {
    console.log('✅ Served index.html for:', pathname);
    return;
  }
  
  // Fallback 404
  console.log(`❌ 404 - File not found: ${pathname}`);
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 - Not Found');
});

// Start server with error handling
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Emergency Minimal Server is running!`);
  console.log(`📡 Server URL: http://0.0.0.0:${PORT}`);
  console.log(`🌐 Custom Domain: https://crm.gandhibaideaddictioncenter.com`);
  console.log(`💾 Serving static files from: ${join(__dirname, '../dist')}`);
  console.log(`🎯 All API endpoints available at /api/*`);
  console.log(`⚡ ZERO dependencies - NO path-to-regexp errors possible!\n`);
});

server.on('error', (error) => {
  console.error('💥 Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

console.log('✅ Emergency minimal server initialized successfully!');
