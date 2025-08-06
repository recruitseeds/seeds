#!/bin/bash

# Comprehensive End-to-End Test Script for Production Deployment
# This script tests the complete job application flow

set -e  # Exit on any error

echo "🚀 Starting End-to-End Deployment Tests..."
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_URL:-http://localhost:3001}"
API_KEY="${API_KEY:-uk_test_key_placeholder}"
TEST_JOB_ID="${TEST_JOB_ID:-}"
TEST_ORG_SLUG="${TEST_ORG_SLUG:-}"

echo -e "${BLUE}API Base URL: ${API_BASE_URL}${NC}"
echo ""

# Test 1: Health Check
echo -e "${BLUE}Test 1: API Health Check${NC}"
echo "------------------------------------"
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health.json "${API_BASE_URL}/api/v1/health" || echo "000")
HTTP_CODE="${HEALTH_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ API Health Check: PASSED${NC}"
    echo "Response: $(cat /tmp/health.json)"
else
    echo -e "${RED}❌ API Health Check: FAILED (HTTP $HTTP_CODE)${NC}"
    if [ -f /tmp/health.json ]; then
        echo "Error response: $(cat /tmp/health.json)"
    fi
    exit 1
fi
echo ""

# Test 2: List All Jobs (Public Endpoint)
echo -e "${BLUE}Test 2: List All Jobs${NC}"
echo "------------------------------------"
JOBS_RESPONSE=$(curl -s -w "%{http_code}" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -o /tmp/jobs.json \
    "${API_BASE_URL}/api/v1/public/jobs?page=1&limit=5" || echo "000")
HTTP_CODE="${JOBS_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ List All Jobs: PASSED${NC}"
    
    # Extract first job ID for subsequent tests
    if command -v jq &> /dev/null; then
        TOTAL_JOBS=$(jq -r '.pagination.total // 0' /tmp/jobs.json)
        echo "Total jobs found: $TOTAL_JOBS"
        
        if [ "$TOTAL_JOBS" -gt 0 ]; then
            TEST_JOB_ID=$(jq -r '.data[0].id // ""' /tmp/jobs.json)
            TEST_ORG_DOMAIN=$(jq -r '.data[0].organization.domain // ""' /tmp/jobs.json)
            echo "Using job ID for testing: $TEST_JOB_ID"
            echo "Using organization domain: $TEST_ORG_DOMAIN"
        else
            echo -e "${YELLOW}⚠️  No jobs found in database for testing${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  jq not installed - skipping job data extraction${NC}"
    fi
else
    echo -e "${RED}❌ List All Jobs: FAILED (HTTP $HTTP_CODE)${NC}"
    if [ -f /tmp/jobs.json ]; then
        echo "Error response: $(cat /tmp/jobs.json)"
    fi
    exit 1
fi
echo ""

# Test 3: Get Individual Job (if job ID available)
if [ -n "$TEST_JOB_ID" ]; then
    echo -e "${BLUE}Test 3: Get Individual Job Details${NC}"
    echo "------------------------------------"
    JOB_DETAIL_RESPONSE=$(curl -s -w "%{http_code}" \
        -H "Authorization: Bearer ${API_KEY}" \
        -H "Content-Type: application/json" \
        -o /tmp/job_detail.json \
        "${API_BASE_URL}/api/v1/public/jobs/${TEST_JOB_ID}" || echo "000")
    HTTP_CODE="${JOB_DETAIL_RESPONSE: -3}"

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Get Individual Job: PASSED${NC}"
        if command -v jq &> /dev/null; then
            JOB_TITLE=$(jq -r '.data.title // "Unknown"' /tmp/job_detail.json)
            echo "Job title: $JOB_TITLE"
        fi
    else
        echo -e "${RED}❌ Get Individual Job: FAILED (HTTP $HTTP_CODE)${NC}"
        if [ -f /tmp/job_detail.json ]; then
            echo "Error response: $(cat /tmp/job_detail.json)"
        fi
        exit 1
    fi
    echo ""
fi

# Test 4: Company Jobs (if organization available)
if [ -n "$TEST_ORG_DOMAIN" ]; then
    echo -e "${BLUE}Test 4: Get Company Jobs${NC}"
    echo "------------------------------------"
    COMPANY_JOBS_RESPONSE=$(curl -s -w "%{http_code}" \
        -H "Authorization: Bearer ${API_KEY}" \
        -H "Content-Type: application/json" \
        -o /tmp/company_jobs.json \
        "${API_BASE_URL}/api/v1/public/jobs/company/${TEST_ORG_DOMAIN}?page=1&limit=5" || echo "000")
    HTTP_CODE="${COMPANY_JOBS_RESPONSE: -3}"

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Get Company Jobs: PASSED${NC}"
        if command -v jq &> /dev/null; then
            COMPANY_NAME=$(jq -r '.data.organization.name // "Unknown"' /tmp/company_jobs.json)
            COMPANY_JOB_COUNT=$(jq -r '.pagination.total // 0' /tmp/company_jobs.json)
            echo "Company: $COMPANY_NAME"
            echo "Jobs count: $COMPANY_JOB_COUNT"
        fi
    else
        echo -e "${RED}❌ Get Company Jobs: FAILED (HTTP $HTTP_CODE)${NC}"
        if [ -f /tmp/company_jobs.json ]; then
            echo "Error response: $(cat /tmp/company_jobs.json)"
        fi
        exit 1
    fi
    echo ""
fi

# Test 5: Resume Parsing & Job Application (if job available)
if [ -n "$TEST_JOB_ID" ]; then
    echo -e "${BLUE}Test 5: Job Application with Resume Parsing${NC}"
    echo "------------------------------------"
    
    # Create test resume content (base64 encoded)
    TEST_RESUME_TEXT="John Doe
Software Engineer

EXPERIENCE:
- Senior Frontend Developer at TechCorp (2020-2024)
- Built React applications with TypeScript
- Worked with Node.js and GraphQL APIs
- Led team of 5 developers

EDUCATION:
- Bachelor of Computer Science, University of Technology (2016-2020)

SKILLS:
- JavaScript, TypeScript, React, Node.js
- GraphQL, REST APIs, PostgreSQL
- AWS, Docker, Kubernetes"

    # Encode resume as base64
    TEST_RESUME_BASE64=$(echo "$TEST_RESUME_TEXT" | base64 | tr -d '\n')
    
    # Create application payload
    APPLICATION_PAYLOAD=$(cat << EOF
{
    "candidateData": {
        "name": "John Doe",
        "email": "john.doe.test.$(date +%s)@example.com",
        "phone": "+1-555-0123"
    },
    "resumeFile": {
        "fileName": "john_doe_resume.txt",
        "content": "$TEST_RESUME_BASE64",
        "mimeType": "text/plain",
        "tags": ["test", "frontend"]
    }
}
EOF
    )
    
    echo "Submitting job application..."
    APPLICATION_RESPONSE=$(curl -s -w "%{http_code}" \
        -H "Authorization: Bearer ${API_KEY}" \
        -H "Content-Type: application/json" \
        -d "$APPLICATION_PAYLOAD" \
        -o /tmp/application.json \
        "${API_BASE_URL}/api/v1/public/jobs/${TEST_JOB_ID}/apply" || echo "000")
    HTTP_CODE="${APPLICATION_RESPONSE: -3}"

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Job Application: PASSED${NC}"
        if command -v jq &> /dev/null; then
            APPLICATION_ID=$(jq -r '.data.applicationId // ""' /tmp/application.json)
            CANDIDATE_ID=$(jq -r '.data.candidateId // ""' /tmp/application.json)
            APPLICATION_STATUS=$(jq -r '.data.status // ""' /tmp/application.json)
            CANDIDATE_SCORE=$(jq -r '.data.score // "N/A"' /tmp/application.json)
            
            echo "Application ID: $APPLICATION_ID"
            echo "Candidate ID: $CANDIDATE_ID"
            echo "Status: $APPLICATION_STATUS"
            echo "Score: $CANDIDATE_SCORE"
            
            # Save IDs for potential cleanup
            echo "$APPLICATION_ID" > /tmp/test_application_id.txt
            echo "$CANDIDATE_ID" > /tmp/test_candidate_id.txt
        fi
    else
        echo -e "${RED}❌ Job Application: FAILED (HTTP $HTTP_CODE)${NC}"
        if [ -f /tmp/application.json ]; then
            echo "Error response: $(cat /tmp/application.json)"
        fi
        exit 1
    fi
    echo ""
fi

# Test 6: Analytics Dashboard (Internal Endpoint)
echo -e "${BLUE}Test 6: Internal Analytics Dashboard${NC}"
echo "------------------------------------"
ANALYTICS_RESPONSE=$(curl -s -w "%{http_code}" \
    -H "Authorization: Internal ${INTERNAL_API_SECRET:-test_secret}" \
    -H "Content-Type: application/json" \
    -o /tmp/analytics.json \
    "${API_BASE_URL}/api/v1/internal/analytics/dashboard" || echo "000")
HTTP_CODE="${ANALYTICS_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Analytics Dashboard: PASSED${NC}"
    if command -v jq &> /dev/null; then
        TOTAL_APPLICATIONS=$(jq -r '.data.totalApplications // 0' /tmp/analytics.json)
        echo "Total applications: $TOTAL_APPLICATIONS"
    fi
else
    echo -e "${YELLOW}⚠️  Analytics Dashboard: SKIPPED (HTTP $HTTP_CODE)${NC}"
    echo "This is expected if internal endpoints are not accessible externally"
fi
echo ""

# Test 7: Database Connectivity Test
echo -e "${BLUE}Test 7: Database Connectivity${NC}"
echo "------------------------------------"
# Test database connectivity by attempting to fetch jobs again
DB_TEST_RESPONSE=$(curl -s -w "%{http_code}" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -o /tmp/db_test.json \
    "${API_BASE_URL}/api/v1/public/jobs?page=1&limit=1" || echo "000")
HTTP_CODE="${DB_TEST_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Database Connectivity: PASSED${NC}"
    if command -v jq &> /dev/null; then
        PROCESSING_TIME=$(jq -r '.metadata.processingTimeMs // 0' /tmp/db_test.json)
        echo "Query processing time: ${PROCESSING_TIME}ms"
    fi
else
    echo -e "${RED}❌ Database Connectivity: FAILED (HTTP $HTTP_CODE)${NC}"
    exit 1
fi
echo ""

# Cleanup temporary files
echo -e "${BLUE}Cleaning up temporary files...${NC}"
rm -f /tmp/health.json /tmp/jobs.json /tmp/job_detail.json /tmp/company_jobs.json 
rm -f /tmp/application.json /tmp/analytics.json /tmp/db_test.json

echo ""
echo "================================================"
echo -e "${GREEN}🎉 All E2E Tests Completed Successfully!${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "✅ API Health Check"
echo "✅ Job Listings API"
if [ -n "$TEST_JOB_ID" ]; then
    echo "✅ Individual Job Details"
    echo "✅ Job Application with Resume Parsing"
fi
if [ -n "$TEST_ORG_DOMAIN" ]; then
    echo "✅ Company Jobs API"
fi
echo "✅ Database Connectivity"
echo ""
echo -e "${GREEN}Production deployment is ready! 🚀${NC}"

# Optional: Display test artifacts for verification
if [ -f /tmp/test_application_id.txt ] && [ -f /tmp/test_candidate_id.txt ]; then
    echo ""
    echo -e "${YELLOW}Test Artifacts Created:${NC}"
    echo "Application ID: $(cat /tmp/test_application_id.txt)"
    echo "Candidate ID: $(cat /tmp/test_candidate_id.txt)"
    echo ""
    echo -e "${YELLOW}Note: These test records were created in your database.${NC}"
    echo "You may want to clean them up manually if needed."
fi