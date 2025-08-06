#!/bin/bash

# Production Deployment Script for Recruit Seeds API
# Run this script to deploy to your Digital Ocean droplet

set -e  # Exit on any error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DROPLET_IP="167.71.97.125"
DROPLET_USER="root"
PROJECT_PATH="/var/www/api/seeds"
API_PATH="$PROJECT_PATH/apps/api"

echo -e "${BLUE}🚀 Starting Production Deployment to Droplet...${NC}"
echo "================================================"
echo "Droplet: $DROPLET_USER@$DROPLET_IP"
echo "Project Path: $PROJECT_PATH"
echo ""

# Function to run commands on the droplet
run_remote() {
    echo -e "${BLUE}Running on droplet: $1${NC}"
    ssh "$DROPLET_USER@$DROPLET_IP" "$1"
}

# Step 1: Test connection to droplet
echo -e "${BLUE}Step 1: Testing connection to droplet...${NC}"
if run_remote "echo 'Connection successful'"; then
    echo -e "${GREEN}✅ Droplet connection: PASSED${NC}"
else
    echo -e "${RED}❌ Droplet connection: FAILED${NC}"
    echo "Please check your SSH connection to $DROPLET_USER@$DROPLET_IP"
    exit 1
fi
echo ""

# Step 2: Navigate to project and pull latest code
echo -e "${BLUE}Step 2: Pulling latest code...${NC}"
run_remote "cd $PROJECT_PATH && git pull origin main"
echo -e "${GREEN}✅ Code updated${NC}"
echo ""

# Step 3: Install/update dependencies
echo -e "${BLUE}Step 3: Installing dependencies...${NC}"
run_remote "cd $API_PATH && npm install"
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 4: Run type checking
echo -e "${BLUE}Step 4: Running type checking...${NC}"
if run_remote "cd $API_PATH && npm run typecheck"; then
    echo -e "${GREEN}✅ Type checking: PASSED${NC}"
else
    echo -e "${RED}❌ Type checking: FAILED${NC}"
    echo "Please fix TypeScript errors before deploying"
    exit 1
fi
echo ""

# Step 5: Run linting
echo -e "${BLUE}Step 5: Running linter...${NC}"
if run_remote "cd $API_PATH && npm run lint"; then
    echo -e "${GREEN}✅ Linting: PASSED${NC}"
else
    echo -e "${YELLOW}⚠️  Linting: WARNINGS FOUND${NC}"
    echo "Consider fixing linting warnings, but continuing deployment..."
fi
echo ""

# Step 6: Build the application
echo -e "${BLUE}Step 6: Building application...${NC}"
if run_remote "cd $API_PATH && npm run build"; then
    echo -e "${GREEN}✅ Build: SUCCESSFUL${NC}"
else
    echo -e "${RED}❌ Build: FAILED${NC}"
    echo "Build failed - cannot deploy"
    exit 1
fi
echo ""

# Step 7: Restart PM2 processes
echo -e "${BLUE}Step 7: Restarting PM2 processes...${NC}"
run_remote "pm2 restart all"
echo -e "${GREEN}✅ PM2 processes restarted${NC}"
echo ""

# Step 8: Check PM2 status
echo -e "${BLUE}Step 8: Checking PM2 status...${NC}"
run_remote "pm2 status"
echo ""

# Step 9: Wait for application to start
echo -e "${BLUE}Step 9: Waiting for application to start...${NC}"
sleep 5
echo -e "${GREEN}✅ Application startup delay completed${NC}"
echo ""

# Step 10: Run health check
echo -e "${BLUE}Step 10: Running health check...${NC}"
if run_remote "curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1"; then
    echo -e "${GREEN}✅ Health check: PASSED${NC}"
else
    echo -e "${RED}❌ Health check: FAILED${NC}"
    echo "Application may not be running correctly"
    echo "Check PM2 logs: pm2 logs"
    exit 1
fi
echo ""

echo "================================================"
echo -e "${GREEN}🎉 Deployment Completed Successfully!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Run E2E tests: ./test-e2e-deployment.sh"
echo "2. Check application logs: ssh $DROPLET_USER@$DROPLET_IP 'pm2 logs'"
echo "3. Monitor application: ssh $DROPLET_USER@$DROPLET_IP 'pm2 monit'"
echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo "• Make sure all environment variables are set correctly on the droplet"
echo "• Verify Cloudflare R2 credentials are configured"
echo "• Check that all external services (Supabase, OpenAI, etc.) are accessible"
echo ""