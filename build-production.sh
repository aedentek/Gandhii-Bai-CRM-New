#!/bin/bash

# Production Build Script for Gandhi Bai Healthcare CRM
# This script prepares the app for deployment with custom domain

echo "🚀 Building Gandhi Bai Healthcare CRM for Production..."
echo "🌐 Domain: crm.gandhibaideaddictioncenter.com"
echo "📅 Build Date: $(date)"

# Set production environment
export NODE_ENV=production
export VITE_API_URL=https://crm.gandhibaideaddictioncenter.com/api
export VITE_BASE_URL=https://crm.gandhibaideaddictioncenter.com

echo "✅ Environment variables set"
echo "📦 Starting build process..."

# Clean previous build
rm -rf dist/

# Build the React app
npm run build

echo "✅ Build completed successfully!"
echo "📁 Built files are in ./dist directory"
echo "🚀 Ready for deployment to Render.com"
