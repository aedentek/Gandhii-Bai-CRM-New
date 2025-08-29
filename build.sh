#!/bin/bash

# Vercel Build Script
echo "🏗️ Starting Vercel build process..."

# Ensure we have the right Node version
node --version
npm --version

# Clean install dependencies
echo "📦 Installing dependencies..."
npm ci

# List installed packages to verify Vite is installed
echo "🔍 Verifying Vite installation..."
npm list vite || npm list --depth=0 | grep vite

# Run the build
echo "🚀 Building application..."
npx vite build

# Verify build output
echo "✅ Build completed. Contents of dist folder:"
ls -la dist/

echo "🎉 Vercel build completed successfully!"
