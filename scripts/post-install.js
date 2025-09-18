#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔐 Setting up Tiptap Pro authentication and restoring packages...');

// Set up Tiptap Pro npm config
console.log('Setting up npm registry configuration...');
execSync('npm config set "@tiptap-pro:registry" https://registry.tiptap.dev/', { stdio: 'inherit' });

const token = process.env.NPM_TOKEN || process.env.SHARED_NPM_TOKEN;
if (!token) {
  console.error('❌ NPM_TOKEN environment variable is required');
  process.exit(1);
}

execSync(`npm config set "//registry.tiptap.dev/:_authToken" ${token}`, { stdio: 'inherit' });
console.log('✅ Tiptap Pro registry configured');

// Restore original dependencies
const backupPath = path.join(__dirname, '../tiptap-deps-backup.json');
if (!fs.existsSync(backupPath)) {
  console.log('ℹ️  No Tiptap Pro dependencies to restore');
  return;
}

const allOriginalDeps = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// Package paths for restoration
const packagePaths = [
  { path: path.join(__dirname, '../apps/web/package.json'), name: 'web' },
  { path: path.join(__dirname, '../packages/editor/package.json'), name: 'editor' }
];

// Restore dependencies for each package
packagePaths.forEach(({ path: packagePath, name }) => {
  if (!allOriginalDeps[name] || !fs.existsSync(packagePath)) {
    console.log(`ℹ️  No Tiptap Pro dependencies to restore for ${name}`);
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const originalDeps = allOriginalDeps[name];

  // Restore dependencies
  Object.entries(originalDeps).forEach(([pkg, version]) => {
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }
    packageJson.dependencies[pkg] = version;
  });

  // Save restored package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log(`📦 Tiptap Pro packages restored to ${name}`);
});

// Install the Tiptap Pro packages
console.log('📥 Installing Tiptap Pro packages...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ Tiptap Pro packages installed successfully');
} catch (error) {
  console.error('❌ Failed to install Tiptap Pro packages:', error.message);
  process.exit(1);
}

// Clean up backup file
fs.unlinkSync(backupPath);
console.log('🧹 Cleanup completed');