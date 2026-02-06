#!/bin/bash

# Test Gemini Integration
# Usage: ./test-gemini.sh

echo "🧪 Testing Gemini API Integration..."
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:8765"

# Test 1: Health check
echo -e "${BLUE}[1/5] Testing health endpoint...${NC}"
HEALTH=$(curl -s $API_URL/health)
if [[ $HEALTH == *"ok"* ]]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: Create session
echo -e "${BLUE}[2/5] Creating new session...${NC}"
SESSION=$(curl -s -X POST $API_URL/api/session/create)
SESSION_ID=$(echo $SESSION | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)
if [ -z "$SESSION_ID" ]; then
    echo -e "${RED}❌ Failed to create session${NC}"
    echo "Response: $SESSION"
    exit 1
fi
echo -e "${GREEN}✅ Session created: $SESSION_ID${NC}"
echo ""

# Test 3: Get tools list
echo -e "${BLUE}[3/5] Getting available tools...${NC}"
TOOLS=$(curl -s $API_URL/api/tools)
TOOL_COUNT=$(echo $TOOLS | grep -o '"count":[0-9]*' | cut -d':' -f2)
if [ -z "$TOOL_COUNT" ]; then
    echo -e "${RED}❌ Failed to get tools${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Found $TOOL_COUNT tools${NC}"
echo ""

# Test 4: Test Gemini connection
echo -e "${BLUE}[4/5] Testing Gemini API connection...${NC}"
CONNECTION=$(curl -s -X POST $API_URL/api/debug/test-gemini)
if [[ $CONNECTION == *"connected"* ]]; then
    echo -e "${GREEN}✅ Gemini connection verified${NC}"
else
    echo -e "${RED}⚠️  Could not verify Gemini connection${NC}"
    echo "Make sure GOOGLE_GEMINI_API_KEY is set in .env"
fi
echo ""

# Test 5: Send chat message
echo -e "${BLUE}[5/5] Sending test message...${NC}"
MESSAGE=$(curl -s -X POST $API_URL/api/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"userMessage\": \"Create a simple login frame\"
  }")

if [[ $MESSAGE == *"success"* ]]; then
    echo -e "${GREEN}✅ Chat message processed successfully${NC}"
    echo ""
    echo "Response preview:"
    echo $MESSAGE | jq '.' 2>/dev/null || echo $MESSAGE
else
    echo -e "${RED}❌ Chat message failed${NC}"
    echo "Response: $MESSAGE"
fi
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:8765/api/session/$SESSION_ID to see the session"
echo "2. Send more messages to the same session"
echo "3. Build the React UI (Phase 2) to make it user-friendly"
