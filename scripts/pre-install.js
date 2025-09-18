#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🔧 Temporarily removing Tiptap Pro packages for initial install...');

// Packages to remove temporarily
const tiptapProPackages = [
  '@tiptap-pro/extension-details',
  '@tiptap-pro/extension-details-content',
  '@tiptap-pro/extension-details-summary',
  '@tiptap-pro/extension-drag-handle-react',
  '@tiptap-pro/extension-emoji',
  '@tiptap-pro/extension-file-handler',
  '@tiptap-pro/extension-unique-id'
];

// Read and modify web package.json
const webPackagePath = path.join(__dirname, '../apps/web/package.json');
const webPackage = JSON.parse(fs.readFileSync(webPackagePath, 'utf8'));

// Store original dependencies for later restoration
const originalDeps = {};
tiptapProPackages.forEach(pkg => {
  if (webPackage.dependencies[pkg]) {
    originalDeps[pkg] = webPackage.dependencies[pkg];
    delete webPackage.dependencies[pkg];
  }
});

// Save modified package.json
fs.writeFileSync(webPackagePath, JSON.stringify(webPackage, null, 2));

// Save original dependencies to restore later
fs.writeFileSync(
  path.join(__dirname, '../tiptap-deps-backup.json'),
  JSON.stringify(originalDeps, null, 2)
);

console.log('✅ Tiptap Pro packages temporarily removed');
console.log('📦 Original dependencies backed up to tiptap-deps-backup.json');