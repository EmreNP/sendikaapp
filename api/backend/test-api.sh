#!/bin/bash

# Test script for SendikaApp Backend API
BASE_URL="http://localhost:3001"

echo "🧪 Testing SendikaApp Backend API..."
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
curl -s "$BASE_URL/api/health" | jq .
echo ""
echo ""

# Test 2: Register Basic
echo "2️⃣ Testing Basic Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register/basic" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test'$(date +%s)'@example.com",
    "password": "Test1234",
    "birthDate": "1990-01-01",
    "gender": "male"
  }')

echo "$REGISTER_RESPONSE" | jq .
echo ""

# Extract token from response
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Token not found in response"
  exit 1
fi

echo "✅ Token received: ${TOKEN:0:20}..."
echo ""

# Test 3: Register Details (with auth)
echo "3️⃣ Testing Detailed Registration (with auth)..."
curl -s -X POST "$BASE_URL/api/auth/register/details" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "branchId": "test-branch-123",
    "phone": "05551234567",
    "city": "Istanbul",
    "district": "Kadıköy"
  }' | jq .

echo ""
echo "✅ All tests completed!"

