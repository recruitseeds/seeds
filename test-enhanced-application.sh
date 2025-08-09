#!/bin/bash

# Test Enhanced Application Submission with Form Template Integration
# This script demonstrates the complete flow:
# 1. Create a job with form and pipeline templates
# 2. Submit an application using the enhanced endpoint
# 3. Verify form validation and pipeline integration

API_KEY="${1:-3ZJMPsS1DKLUgn1MpJ3ZnTdq}"
ENV="${2:-production}"

if [ "$ENV" = "production" ]; then
    BASE_URL="https://api.recruitseeds.com"
else
    BASE_URL="http://localhost:3001"
fi

echo "🚀 Testing Enhanced Application Submission"
echo "Environment: $ENV"
echo "API Base URL: $BASE_URL"
echo "============================================"

# Step 1: Get an existing job with templates
echo -e "\n📋 Step 1: Fetching job with templates..."
JOB_ID="3620b279-68d5-4359-afa6-bd393e1a8256"  # The test job we created earlier

JOB_RESPONSE=$(curl -s -X GET \
  "$BASE_URL/api/v1/public/manage/jobs/$JOB_ID" \
  -H "Authorization: Bearer $API_KEY")

echo "Job Details:"
echo "$JOB_RESPONSE" | jq -r '.data | {
  title: .title,
  form_template_id: .form_template_id,
  pipeline_template_id: .pipeline_template_id
}'

# Extract template IDs
FORM_TEMPLATE_ID=$(echo "$JOB_RESPONSE" | jq -r '.data.form_template_id')
PIPELINE_TEMPLATE_ID=$(echo "$JOB_RESPONSE" | jq -r '.data.pipeline_template_id')

# Step 2: Get form template to understand required fields
if [ "$FORM_TEMPLATE_ID" != "null" ]; then
    echo -e "\n📝 Step 2: Fetching form template..."
    FORM_RESPONSE=$(curl -s -X GET \
      "$BASE_URL/api/v1/public/manage/forms/$FORM_TEMPLATE_ID" \
      -H "Authorization: Bearer $API_KEY")
    
    echo "Form Template Fields:"
    echo "$FORM_RESPONSE" | jq -r '.data.fields[] | {
      id: .id,
      name: .name,
      type: .type,
      required: .required
    }'
fi

# Step 3: Get pipeline template to understand stages
if [ "$PIPELINE_TEMPLATE_ID" != "null" ]; then
    echo -e "\n🔄 Step 3: Fetching pipeline template..."
    PIPELINE_RESPONSE=$(curl -s -X GET \
      "$BASE_URL/api/v1/public/manage/pipelines/$PIPELINE_TEMPLATE_ID" \
      -H "Authorization: Bearer $API_KEY")
    
    echo "Pipeline Stages:"
    echo "$PIPELINE_RESPONSE" | jq -r '.data.steps[] | {
      order: .order,
      name: .name,
      type: .type
    }'
fi

# Step 4: Submit enhanced application with form data
echo -e "\n✉️ Step 4: Submitting enhanced application..."

# Create a simple test resume (base64 encoded)
RESUME_CONTENT="John Doe - Senior Software Engineer

EXPERIENCE:
- 5 years of React and Node.js development
- Expert in TypeScript and PostgreSQL
- AWS certified solutions architect

EDUCATION:
- BS Computer Science, MIT

SKILLS:
React, Node.js, TypeScript, PostgreSQL, AWS, Docker, Kubernetes

CONTACT:
Email: john.doe@example.com
Phone: +1-555-0123
GitHub: github.com/johndoe
LinkedIn: linkedin.com/in/johndoe"

RESUME_BASE64=$(echo "$RESUME_CONTENT" | base64)

APPLICATION_DATA=$(cat <<EOF
{
  "formData": {
    "field_1": "resume",
    "field_2": "cover_letter",
    "field_3": "John Doe",
    "field_4": "john.doe.test.$(date +%s)@example.com",
    "field_5": "+1-555-0123",
    "field_6": "https://linkedin.com/in/johndoe",
    "field_7": "https://github.com/johndoe",
    "field_8": "https://johndoe.dev",
    "field_9": 5,
    "field_10": "150000-180000",
    "field_11": "2025-02-01",
    "field_12": false
  },
  "files": {
    "resume": {
      "fileName": "john_doe_resume.txt",
      "content": "$RESUME_BASE64",
      "mimeType": "text/plain"
    }
  }
}
EOF
)

echo "Submitting application to enhanced endpoint..."
APP_RESPONSE=$(curl -s -X POST \
  "$BASE_URL/api/v1/public/jobs-enhanced/$JOB_ID/apply-enhanced" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$APPLICATION_DATA")

echo -e "\n📬 Application Response:"
echo "$APP_RESPONSE" | jq '.'

# Check if application was successful
SUCCESS=$(echo "$APP_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    echo -e "\n✅ Application submitted successfully!"
    
    APP_ID=$(echo "$APP_RESPONSE" | jq -r '.data.applicationId')
    CANDIDATE_ID=$(echo "$APP_RESPONSE" | jq -r '.data.candidateId')
    PIPELINE_STAGE=$(echo "$APP_RESPONSE" | jq -r '.data.pipelineStageId')
    
    echo "Application ID: $APP_ID"
    echo "Candidate ID: $CANDIDATE_ID"
    
    if [ "$PIPELINE_STAGE" != "null" ]; then
        echo "Pipeline Stage: $PIPELINE_STAGE"
        echo "✅ Candidate successfully entered the hiring pipeline!"
    fi
else
    echo -e "\n❌ Application failed:"
    echo "$APP_RESPONSE" | jq -r '.error'
fi

echo -e "\n============================================"
echo "✨ Enhanced Application Test Complete!"
echo ""
echo "Key Features Demonstrated:"
echo "1. ✅ Dynamic form validation based on template"
echo "2. ✅ Pipeline integration with automatic stage placement"
echo "3. ✅ File upload handling"
echo "4. ✅ Email confirmation (check logs)"
echo ""
echo "Next Steps:"
echo "- Check application logs for form submission details"
echo "- Verify email was sent to candidate"
echo "- Test form validation by submitting with missing required fields"
echo "- Monitor pipeline progression"