#!/usr/bin/env bash
# deploy-error-check.sh - Fetch and display deployment error logs

set -euo pipefail

DOKPLOY="http://167.88.45.173:3000"
APP_ID="NSEQ0t6REHcO0COK02xo0"
KEY="vibersNaEermIkbmKbFLQGokkhtxDYegyBUMwAvywMqAqVQHfJyKDpoAalHACgaWIfurSL"
SSH_HOST="root@167.88.45.173"

DEPLOYMENT_ID="${1:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Vibers Deployment Error Checker${NC}"
echo "======================================"
echo ""

# If no deployment ID provided, show recent deployments
if [[ -z "$DEPLOYMENT_ID" ]]; then
  echo -e "${YELLOW}No deployment ID provided. Showing recent deployments...${NC}"
  echo ""
  
  DEPLOYMENTS=$(curl -s "$DOKPLOY/api/deployment.all?applicationId=$APP_ID" \
    -H "x-api-key: $KEY")
  
  echo "Recent Deployments:"
  echo "$DEPLOYMENTS" | jq -r '.[] | 
    "\(if .status == "done" then "✅" elif .status == "error" then "❌" elif .status == "running" then "🔵" else "⚪" end) [\(.status | ascii_upcase)] \(.deploymentId) - \(.createdAt | split("T")[0] + " " + (split("T")[1] | split(".")[0])) - \(.title // "Deployment")"' | head -10
  
  echo ""
  echo -e "${YELLOW}Usage: $0 <deploymentId>${NC}"
  echo ""
  echo "Example:"
  LATEST_ID=$(echo "$DEPLOYMENTS" | jq -r '.[0].deploymentId')
  echo "  $0 $LATEST_ID"
  echo ""
  echo "To check the latest failed deployment automatically:"
  echo "  $0 auto"
  exit 0
fi

# Auto mode - get latest failed deployment
if [[ "$DEPLOYMENT_ID" == "auto" ]]; then
  echo -e "${BLUE}🔍 Finding latest failed deployment...${NC}"
  DEPLOYMENTS=$(curl -s "$DOKPLOY/api/deployment.all?applicationId=$APP_ID" \
    -H "x-api-key: $KEY")
  
  DEPLOYMENT_ID=$(echo "$DEPLOYMENTS" | jq -r '.[] | select(.status == "error") | .deploymentId' | head -1)
  
  if [[ -z "$DEPLOYMENT_ID" ]]; then
    echo -e "${GREEN}✅ No failed deployments found!${NC}"
    exit 0
  fi
  
  echo -e "${YELLOW}Found failed deployment: $DEPLOYMENT_ID${NC}"
  echo ""
fi

# Get deployment details
echo -e "${BLUE}📊 Fetching deployment details...${NC}"
DEPLOYMENT=$(curl -s "$DOKPLOY/api/deployment.all?applicationId=$APP_ID" \
  -H "x-api-key: $KEY" | jq -r ".[] | select(.deploymentId == \"$DEPLOYMENT_ID\")")

if [[ -z "$DEPLOYMENT" ]] || [[ "$DEPLOYMENT" == "null" ]]; then
  echo -e "${RED}❌ Deployment not found: $DEPLOYMENT_ID${NC}"
  exit 1
fi

STATUS=$(echo "$DEPLOYMENT" | jq -r '.status')
CREATED=$(echo "$DEPLOYMENT" | jq -r '.createdAt')
TITLE=$(echo "$DEPLOYMENT" | jq -r '.title // "N/A"')
LOG_PATH=$(echo "$DEPLOYMENT" | jq -r '.logPath // ""')

echo ""
echo "Deployment Information:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ID:      $DEPLOYMENT_ID"
echo "Status:  $STATUS"
echo "Created: $CREATED"
echo "Title:   $TITLE"
echo "LogPath: $LOG_PATH"
echo ""

# Fetch error logs if available
if [[ -n "$LOG_PATH" ]] && [[ "$LOG_PATH" != "null" ]]; then
  echo -e "${BLUE}📄 Fetching error logs from server...${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # Try to fetch logs via SSH
  if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$SSH_HOST" "test -f $LOG_PATH" 2>/dev/null; then
    echo -e "${GREEN}✅ Log file found on server${NC}"
    echo ""
    echo "Error Log Contents:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Fetch and display logs with error highlighting
    ssh -o StrictHostKeyChecking=no "$SSH_HOST" "cat $LOG_PATH" | while IFS= read -r line; do
      if [[ "$line" =~ ERROR|Error|error|FAILED|Failed|failed ]]; then
        echo -e "${RED}$line${NC}"
      elif [[ "$line" =~ WARNING|Warning|warning ]]; then
        echo -e "${YELLOW}$line${NC}"
      elif [[ "$line" =~ SUCCESS|Success|success|DONE|Done ]]; then
        echo -e "${GREEN}$line${NC}"
      else
        echo "$line"
      fi
    done
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  else
    echo -e "${RED}❌ Cannot access log file: $LOG_PATH${NC}"
    echo "Please check SSH access to $SSH_HOST"
  fi
else
  echo -e "${YELLOW}⚠️  No log path available for this deployment${NC}"
fi

echo ""
echo -e "${BLUE}💡 Troubleshooting Tips:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ "$STATUS" == "error" ]]; then
  echo "1. Check Dokploy UI for detailed logs:"
  echo "   http://167.88.45.173:3000"
  echo ""
  echo "2. Common issues to check:"
  echo "   - Dockerfile syntax errors"
  echo "   - Missing dependencies (pnpm, node modules)"
  echo "   - Build failures (check pnpm run build locally)"
  echo "   - Port conflicts"
  echo "   - Environment variables"
  echo ""
  echo "3. Test build locally:"
  echo "   docker build -t vibers-test ."
  echo "   docker run -p 3000:3000 vibers-test"
elif [[ "$STATUS" == "done" ]]; then
  echo -e "${GREEN}✅ Deployment successful!${NC}"
  echo "Visit: https://vibers.kr"
fi

echo ""
