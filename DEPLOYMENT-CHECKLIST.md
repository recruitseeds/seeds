# 🚀 Production Deployment Checklist

## 📋 Pre-Deployment Checklist

### **1. Environment Variables Configuration**

#### **Local Development (.env)**
- [x] ✅ OPENAI_API_KEY
- [x] ✅ SUPABASE Configuration
- [x] ✅ UNKEY Configuration  
- [x] ✅ RESEND_API_KEY
- [ ] ⚠️  **MISSING: Cloudflare R2 Variables**

#### **Production Server Environment Variables Required**
```bash
# Copy these to your droplet's .env file:

# Core Configuration
NODE_ENV=production
PORT=3001

# OpenAI Configuration
OPENAI_API_KEY=your_production_openai_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bvmkfsnrfgzrftzpkhkp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# 🔥 CRITICAL: Cloudflare R2 Configuration (Currently Missing)
CLOUDFLARE_R2_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id  
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=recruit-seeds-storage

# Authentication & Security
UNKEY_API_KEY=your_production_unkey_api_key
UNKEY_APP_ID=your_production_unkey_app_id
INTERNAL_API_SECRET=your_production_internal_secret

# Email Configuration
RESEND_API_KEY=your_production_resend_key
DEFAULT_FROM_EMAIL=noreply@recruitseeds.com

# Monitoring (Optional but Recommended)
SENTRY_DSN=your_production_sentry_dsn
POSTHOG_API_KEY=your_production_posthog_key
POSTHOG_HOST=https://us.i.posthog.com
```

### **2. Cloudflare R2 Setup (URGENT)**

**📍 You need to configure Cloudflare R2 storage:**

1. **Login to Cloudflare Dashboard**
2. **Go to R2 Object Storage**
3. **Create or locate your bucket**: `recruit-seeds-storage`
4. **Generate API Keys**:
   - Go to "Manage R2 API tokens"
   - Create token with R2:Edit permissions
   - Copy: Account ID, Access Key ID, Secret Access Key
5. **Update both local and production .env files**

### **3. Testing & Verification**

#### **Local Testing**
```bash
# Run local tests
npm test

# Run E2E tests locally  
./test-e2e-deployment.sh
```

#### **Production Testing**
```bash
# Deploy to production
./deploy-to-production.sh

# Run E2E tests against production
API_URL=https://your-api-domain.com API_KEY=your_production_api_key ./test-e2e-deployment.sh
```

## 🔧 **Current Issues to Fix**

### **❌ Critical Issues**
1. **Missing Cloudflare R2 configuration** - Will cause startup failure
2. **API_KEY not configured** - Need valid Unkey API key for testing

### **⚠️  Warning Issues**  
1. **Jobs app API URL** - Update for production domain
2. **CORS configuration** - Ensure production domain is allowed

## 📝 **Deployment Commands**

### **Your Current Process**
```bash
# SSH into droplet
ssh root@167.71.97.125

# Navigate and update
cd /var/www/api/seeds && git pull

# Build and restart
cd apps/api && npm run build && pm2 restart all
```

### **Enhanced Process (Using Our Scripts)**
```bash
# From your local machine:
./deploy-to-production.sh

# Then run E2E tests:
API_URL=https://your-production-domain.com ./test-e2e-deployment.sh
```

## ✅ **Post-Deployment Verification**

### **1. Health Checks**
- [ ] API responds to health endpoint
- [ ] Database connectivity working
- [ ] File upload functionality working (requires R2)
- [ ] Email sending working
- [ ] Resume parsing working

### **2. E2E Test Results**
- [ ] ✅ API Health Check
- [ ] ✅ Job Listings API  
- [ ] ✅ Individual Job Details
- [ ] ✅ Company Jobs API
- [ ] ✅ Job Application with Resume Upload
- [ ] ✅ Resume Parsing & Scoring
- [ ] ✅ Email Automation
- [ ] ✅ Database Operations

### **3. Monitoring**
- [ ] PM2 processes running
- [ ] No errors in logs
- [ ] Response times acceptable
- [ ] Memory usage normal

## 🆘 **Troubleshooting**

### **Common Issues**

#### **"Cloudflare R2 environment variables are required"**
**Solution**: Add R2 config to production .env file

#### **"File upload failed"**
**Solution**: Verify R2 bucket permissions and API keys

#### **"Database connection failed"** 
**Solution**: Check Supabase service role key

#### **"Resume parsing timeout"**
**Solution**: Check OpenAI API key and quota

### **Debug Commands**
```bash
# Check PM2 status
pm2 status

# View logs  
pm2 logs

# Monitor resources
pm2 monit

# Restart specific process
pm2 restart api

# Check environment variables
printenv | grep -E "(CLOUDFLARE|SUPABASE|OPENAI)"
```

## 🎯 **Priority Actions**

### **Immediate (Before Next Deployment)**
1. **🔥 Configure Cloudflare R2 credentials**
2. **🔥 Test file upload functionality** 
3. **Update production API URL in jobs app**

### **Short Term**
1. Set up production domain SSL
2. Configure monitoring alerts
3. Set up automated backups
4. Create staging environment

### **Long Term**
1. Implement CI/CD pipeline
2. Add comprehensive logging
3. Set up error tracking
4. Performance optimization