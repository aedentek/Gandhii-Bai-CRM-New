# Fix path-to-regexp Build Issue

echo "🔧 Fixing path-to-regexp build issue..."

# Install exact compatible versions
npm install react-router-dom@6.26.1 --save-exact

# Force install path-to-regexp compatible version
npm install path-to-regexp@6.2.1 --save-exact

# Clear node_modules and package-lock to force fresh install
rm -rf node_modules package-lock.json

# Clean install
npm install

# Build with verbose logging
npm run build --verbose

echo "✅ Build should now complete without path-to-regexp errors"
