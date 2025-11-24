#!/bin/bash
# deploy-watch.sh - Real-time deployment monitoring for Vibers

DOKPLOY="http://167.88.45.173:3000"
APP_ID="NSEQ0t6REHcO0COK02xo0"
KEY="vibersNaEermIkbmKbFLQGokkhtxDYegyBUMwAvywMqAqVQHfJyKDpoAalHACgaWIfurSL"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "👀 Vibers Deployment Monitor"
echo "Press Ctrl+C to stop"
echo ""

# Function to get status emoji
get_status_emoji() {
  case "$1" in
    "running") echo "🔵" ;;
    "done") echo "✅" ;;
    "error") echo "❌" ;;
    "cancelled") echo "⚠️" ;;
    "queued") echo "⏳" ;;
    *) echo "⚪" ;;
  esac
}

# Function to get status color
get_status_color() {
  case "$1" in
    "running") echo "$BLUE" ;;
    "done") echo "$GREEN" ;;
    "error") echo "$RED" ;;
    "cancelled") echo "$YELLOW" ;;
    *) echo "$NC" ;;
  esac
}

# Track previous status to detect changes
PREV_STATUS=""
PREV_ID=""

while true; do
  clear
  echo -e "${BLUE}🔄 Vibers Deployment Status - $(date '+%Y-%m-%d %H:%M:%S')${NC}"
  echo "=================================================="
  echo ""
  
  # Get latest deployment
  LATEST=$(curl -s "$DOKPLOY/api/deployment.all?applicationId=$APP_ID" \
    -H "x-api-key: $KEY" | jq -r '.[0]')
  
  if [ -z "$LATEST" ] || [ "$LATEST" = "null" ]; then
    echo -e "${RED}❌ Failed to fetch deployment data${NC}"
    sleep 5
    continue
  fi
  
  STATUS=$(echo "$LATEST" | jq -r '.status')
  CREATED=$(echo "$LATEST" | jq -r '.createdAt')
  TITLE=$(echo "$LATEST" | jq -r '.title // "Deployment"')
  DEPLOYMENT_ID=$(echo "$LATEST" | jq -r '.deploymentId')
  
  # Detect status change
  if [ "$DEPLOYMENT_ID" != "$PREV_ID" ]; then
    echo -e "${YELLOW}🆕 New deployment detected!${NC}"
    PREV_ID="$DEPLOYMENT_ID"
  fi
  
  if [ "$STATUS" != "$PREV_STATUS" ] && [ -n "$PREV_STATUS" ]; then
    echo -e "${YELLOW}📢 Status changed: $PREV_STATUS → $STATUS${NC}"
    PREV_STATUS="$STATUS"
  elif [ -z "$PREV_STATUS" ]; then
    PREV_STATUS="$STATUS"
  fi
  
  # Display current status
  EMOJI=$(get_status_emoji "$STATUS")
  COLOR=$(get_status_color "$STATUS")
  
  echo -e "${COLOR}$EMOJI Status: ${STATUS^^}${NC}"
  echo "📅 Created: $CREATED"
  echo "📝 Title: $TITLE"
  echo "🆔 ID: $DEPLOYMENT_ID"
  echo ""
  
  # Show message based on status
  case "$STATUS" in
    "running")
      echo -e "${BLUE}⏳ Deployment in progress...${NC}"
      ;;
    "done")
      echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
      echo ""
      echo "🌐 Check your app at:"
      echo "   https://vibers.kr"
      ;;
    "error")
      echo -e "${RED}❌ Deployment failed!${NC}"
      echo ""
      echo "📋 Troubleshooting steps:"
      echo "   1. Check Dokploy UI: http://167.88.45.173:3000"
      echo "   2. View logs for deployment ID: $DEPLOYMENT_ID"
      echo "   3. Common issues:"
      echo "      - Dockerfile syntax errors"
      echo "      - Missing dependencies"
      echo "      - Build failures"
      echo "      - Port conflicts"
      ;;
  esac
  
  echo ""
  echo "Recent Deployment History:"
  echo "─────────────────────────────────────────────────"
  
  curl -s "$DOKPLOY/api/deployment.all?applicationId=$APP_ID" \
    -H "x-api-key: $KEY" | jq -r '.[] | 
    "\(if .status == "done" then "✅" elif .status == "error" then "❌" elif .status == "running" then "🔵" else "⚪" end) [\(.status | ascii_upcase)] \(.createdAt | split("T")[0] + " " + (split("T")[1] | split(".")[0])) - \(.title // "Deployment")"' | head -5
  
  echo ""
  echo "Next update in 5 seconds..."
  sleep 5
done
