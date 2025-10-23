#!/bin/bash

# Test Cron Job Script
# This script helps test the cron job endpoint locally or in production

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Price Tracker - Cron Job Test Script ===${NC}\n"

# Check if CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
    echo -e "${RED}Error: CRON_SECRET environment variable is not set${NC}"
    echo -e "${YELLOW}Please set it first:${NC}"
    echo -e "  export CRON_SECRET='your-secret-here'"
    echo -e "  or source your .env.local file"
    exit 1
fi

# Determine environment
if [ "$1" == "prod" ] || [ "$1" == "production" ]; then
    if [ -z "$2" ]; then
        echo -e "${RED}Error: Production URL required${NC}"
        echo -e "${YELLOW}Usage:${NC} ./test-cron.sh prod https://your-app.vercel.app"
        exit 1
    fi
    URL="$2/api/cron/check-prices"
    ENV="PRODUCTION"
else
    URL="http://localhost:3000/api/cron/check-prices"
    ENV="LOCAL"
fi

echo -e "${YELLOW}Environment:${NC} $ENV"
echo -e "${YELLOW}Endpoint:${NC} $URL"
echo -e "${YELLOW}Timestamp:${NC} $(date)\n"

# Test the cron endpoint
echo -e "${YELLOW}Triggering cron job...${NC}\n"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
    -H "Authorization: Bearer $CRON_SECRET" \
    -H "Content-Type: application/json")

# Extract HTTP status code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${YELLOW}Response:${NC}"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Check status
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Success! HTTP $HTTP_CODE${NC}"
else
    echo -e "${RED}✗ Failed! HTTP $HTTP_CODE${NC}"
fi

echo -e "\n${YELLOW}=== Test Complete ===${NC}"

