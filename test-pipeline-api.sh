#!/bin/bash

# Test script for Pipeline Template API
# Usage: ./test-pipeline-api.sh [api-key] [environment]

API_KEY="${1:-3ZJMPsS1DKLUgn1MpJ3ZnTdq}"
ENVIRONMENT="${2:-production}"

if [ "$ENVIRONMENT" = "local" ]; then
  BASE_URL="http://localhost:3001/api/v1/public"
else
  BASE_URL="https://api.recruitseeds.com/api/v1/public"
fi

echo "Testing Pipeline Templates API with key: ${API_KEY:0:10}..."
echo ""

echo "1. Testing GET /pipelines (list all pipeline templates)"
curl -X GET "$BASE_URL/pipelines" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n" \
  | jq '.' 2>/dev/null || echo "Response not valid JSON"

echo ""
echo "2. Testing POST /pipelines (create new pipeline template)"
curl -X POST "$BASE_URL/pipelines" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n" \
  -d '{
    "name": "Test Pipeline",
    "description": "A test pipeline template",
    "category": "engineering",
    "is_default": false,
    "steps": [
      {
        "id": "step_1",
        "name": "Application Review",
        "type": "application",
        "order": 1,
        "config": {}
      },
      {
        "id": "step_2",
        "name": "Phone Screen",
        "type": "interview",
        "order": 2,
        "config": {
          "duration": 30
        }
      },
      {
        "id": "step_3",
        "name": "Final Interview",
        "type": "interview",
        "order": 3,
        "config": {
          "duration": 60
        }
      }
    ]
  }' \
  | jq '.' 2>/dev/null || echo "Response not valid JSON"

echo ""
echo "3. Testing GET /pipelines again (should now show the created pipeline)"
curl -X GET "$BASE_URL/pipelines" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n" \
  | jq '.' 2>/dev/null || echo "Response not valid JSON"

echo ""
echo "Pipeline API testing complete!"