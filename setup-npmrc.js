#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('Setting up Tiptap Pro registry configuration...');

// Set the registry for @tiptap-pro packages
execSync('npm config set "@tiptap-pro:registry" https://registry.tiptap.dev/', { stdio: 'inherit' });

// Set the auth token for the registry
const token = process.env.NPM_TOKEN;
if (!token) {
  console.error('NPM_TOKEN environment variable is required');
  process.exit(1);
}

execSync(`npm config set "//registry.tiptap.dev/:_authToken" ${token}`, { stdio: 'inherit' });

console.log('Tiptap Pro registry configuration completed successfully');