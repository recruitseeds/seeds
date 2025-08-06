#!/bin/bash

echo "🔍 Debugging redirect issue on localhost:3002"
echo "=========================================="

# Step 1: Clear Next.js cache
echo "1. Clearing Next.js cache..."
rm -rf apps/jobs/.next
rm -rf apps/jobs/out

# Step 2: Clear Node modules cache (optional but recommended)
echo "2. Clearing node_modules cache..."
rm -rf apps/jobs/node_modules/.cache

# Step 3: Check for service workers
echo "3. Instructions for browser cleanup:"
echo "   a) Open Chrome DevTools (F12)"
echo "   b) Go to Application tab"
echo "   c) Click on 'Storage' in left sidebar"
echo "   d) Click 'Clear site data'"
echo "   OR"
echo "   e) Go to Application > Service Workers"
echo "   f) Unregister any service workers for localhost:3002"

# Step 4: Check for any redirect rules in public folder
echo "4. Checking for _redirects or redirect files..."
if [ -f "apps/jobs/public/_redirects" ]; then
    echo "   ⚠️  Found _redirects file:"
    cat apps/jobs/public/_redirects
fi

if [ -f "apps/jobs/public/vercel.json" ]; then
    echo "   ⚠️  Found vercel.json file:"
    cat apps/jobs/public/vercel.json
fi

# Step 5: Start fresh
echo "5. Starting fresh development server..."
echo "   Run: cd apps/jobs && npm run dev"
echo ""
echo "6. Test in incognito/private window:"
echo "   - Chrome: Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)"
echo "   - Firefox: Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)"
echo ""
echo "7. Direct test URL: http://localhost:3002/"
echo "   Should show the home page with HeroSection, not redirect to /browse"