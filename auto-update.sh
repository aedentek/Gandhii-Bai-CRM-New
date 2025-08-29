#!/bin/bash

# Auto-update script for dependencies and deployment

echo "🚀 Starting auto-update process..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Update dependencies
echo "📦 Updating npm dependencies..."
npm update

# Fix security vulnerabilities
echo "🔒 Fixing security vulnerabilities..."
npm audit fix --force || true

# Build the project to ensure it works
echo "🏗️ Building project..."
npm run build

# Check if there are any changes
if [ -n "$(git status --porcelain)" ]; then
    echo "✅ Changes detected, committing..."
    
    # Add all changes
    git add .
    
    # Commit with timestamp
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    git commit -m "chore: auto-update dependencies and build - $TIMESTAMP"
    
    # Push to main branch
    echo "🚢 Pushing to remote repository..."
    git push origin main
    
    echo "✅ Auto-update completed successfully!"
else
    echo "ℹ️ No changes detected, skipping commit"
fi

echo "🎉 Process completed!"
