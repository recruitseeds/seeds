#!/bin/bash

echo "🚀 Deploying API updates to server..."
echo "=================================="

# Connect to server and deploy
ssh -i ~/.ssh/id_ed25519 deploy@api.recruitseeds.com << 'EOF'
    echo "📦 Pulling latest changes..."
    cd /var/www/api/seeds/apps/api
    git pull origin main
    
    echo "🔨 Building application..."
    npm run build
    
    echo "🔄 Restarting PM2..."
    pm2 restart api
    
    echo "📊 Checking PM2 status..."
    pm2 status
    
    echo "✅ Deployment complete!"
EOF

echo ""
echo "⏳ Waiting 10 seconds for deployment to stabilize..."
sleep 10

echo ""
echo "🧪 Testing rejection email endpoint..."
echo "====================================="

# Test with dry run
echo "1. Testing dry run..."
curl -X POST https://api.recruitseeds.com/api/v1/internal/cron/send-rejection-emails \
  -H "Authorization: Internal f2b9acdf932dd0135a497516ce3fd0a7d002d027307918e0a44090ec059b63f1" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}' \
  -w "\nHTTP Status: %{http_code}\nTotal time: %{time_total}s\n"

echo ""
echo "2. Testing health endpoint..."
curl -X GET https://api.recruitseeds.com/api/v1/health \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Testing complete!"