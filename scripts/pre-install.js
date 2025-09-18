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

// Packages that contain Tiptap Pro dependencies
const packagePaths = [
  { path: path.join(__dirname, '../apps/web/package.json'), name: 'web' },
  { path: path.join(__dirname, '../packages/editor/package.json'), name: 'editor' }
];

const allOriginalDeps = {};

packagePaths.forEach(({ path: packagePath, name }) => {
  if (!fs.existsSync(packagePath)) {
    console.log(`ℹ️  Package ${name} not found, skipping...`);
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const originalDeps = {};

  // Remove Tiptap Pro packages and store originals
  tiptapProPackages.forEach(pkg => {
    if (packageJson.dependencies && packageJson.dependencies[pkg]) {
      originalDeps[pkg] = packageJson.dependencies[pkg];
      delete packageJson.dependencies[pkg];
    }
  });

  // Save modified package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

  // Store in master backup
  if (Object.keys(originalDeps).length > 0) {
    allOriginalDeps[name] = originalDeps;
    console.log(`✅ Removed Tiptap Pro packages from ${name}`);
  }
});

// Save all original dependencies to restore later
fs.writeFileSync(
  path.join(__dirname, '../tiptap-deps-backup.json'),
  JSON.stringify(allOriginalDeps, null, 2)
);

console.log('📦 All Tiptap Pro dependencies backed up to tiptap-deps-backup.json');