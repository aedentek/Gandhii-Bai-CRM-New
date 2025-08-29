#!/usr/bin/env node

/**
 * Git Sync Verification Script
 * Checks if all important project files are properly tracked and synced
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Git Sync Verification - Gandhi Bai Healthcare CRM');
console.log('=' .repeat(60));

// Key files to check
const keyFiles = [
  'src/components/dashboard/FastCorporateDashboard.tsx',
  'src/index.css', 
  'server/server.js',
  'render-start.js',
  'package.json',
  'vite.config.ts',
  'tailwind.config.ts'
];

console.log('\n📁 Checking key project files:');
keyFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

try {
  console.log('\n🌿 Git Branch Status:');
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  console.log(`Current branch: ${branch}`);
  
  console.log('\n📊 Git Status:');
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.log('Uncommitted changes:');
    console.log(status);
  } else {
    console.log('✅ Working directory clean');
  }
  
  console.log('\n🚀 Recent Commits:');
  const commits = execSync('git log --oneline -5', { encoding: 'utf8' });
  console.log(commits);
  
  console.log('\n🔗 Remote Status:');
  const remote = execSync('git remote -v', { encoding: 'utf8' });
  console.log(remote);
  
} catch (error) {
  console.error('❌ Git command failed:', error.message);
}

console.log('\n✨ Verification Complete!');
