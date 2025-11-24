#!/bin/bash
# deploy.sh - Automated deployment script with testing

set -e  # Exit on error

echo "🚀 Vibers Deployment Script"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get commit message
COMMIT_MSG="${1:-deploy: Automated deployment}"

echo -e "${BLUE}📝 Commit message: $COMMIT_MSG${NC}"
echo ""

# Step 1: Build
echo -e "${BLUE}🔨 Step 1/4: Building application...${NC}"
if npm run build; then
	echo -e "${GREEN}✅ Build successful${NC}"
else
	echo -e "${RED}❌ Build failed${NC}"
	exit 1
fi
echo ""

# Step 2: E2E Tests
echo -e "${BLUE}🧪 Step 2/4: Running E2E tests...${NC}"
if npm run e2e; then
	echo -e "${GREEN}✅ E2E tests passed${NC}"
else
	echo -e "${RED}❌ E2E tests failed${NC}"
	exit 1
fi
echo ""

# Step 3: Commit and Push
echo -e "${BLUE}📤 Step 3/4: Committing and pushing to GitHub...${NC}"
git add -A
if git commit -m "$COMMIT_MSG"; then
	echo -e "${GREEN}✅ Changes committed${NC}"
else
	echo -e "${YELLOW}⚠️  No changes to commit${NC}"
fi

if git push; then
	echo -e "${GREEN}✅ Pushed to GitHub${NC}"
else
	echo -e "${RED}❌ Push failed${NC}"
	exit 1
fi
echo ""

# Step 4: Monitor Deployment
echo -e "${BLUE}👀 Step 4/4: Monitoring deployment...${NC}"
echo "Waiting for Dokploy to start deployment..."
sleep 10

# Run deployment monitor
./scripts/deploy-watch.sh &
WATCH_PID=$!

# Wait for deployment to complete (max 5 minutes)
TIMEOUT=300
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
	STATUS=$(curl -s "http://167.88.45.173:3000/api/deployment.all?applicationId=NSEQ0t6REHcO0COK02xo0" \
		-H "x-api-key: vibersNaEermIkbmKbFLQGokkhtxDYegyBUMwAvywMqAqVQHfJyKDpoAalHACgaWIfurSL" \
		| jq -r '.[0].status')
	
	if [ "$STATUS" = "done" ]; then
		kill $WATCH_PID 2>/dev/null || true
		echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
		echo ""
		echo -e "${BLUE}🌐 Verifying site...${NC}"
		sleep 5
		
		HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://vibers.kr)
		if [ "$HTTP_STATUS" = "200" ]; then
			echo -e "${GREEN}✅ Site is accessible: https://vibers.kr${NC}"
		else
			echo -e "${RED}❌ Site returned HTTP $HTTP_STATUS${NC}"
			echo "Check Dokploy logs for details"
		fi
		exit 0
	elif [ "$STATUS" = "error" ]; then
		kill $WATCH_PID 2>/dev/null || true
		echo -e "${RED}❌ Deployment failed!${NC}"
		echo "Running error checker..."
		./scripts/deploy-error-check.sh auto
		exit 1
	fi
	
	sleep 5
	ELAPSED=$((ELAPSED + 5))
done

kill $WATCH_PID 2>/dev/null || true
echo -e "${YELLOW}⚠️  Deployment timeout (5 minutes)${NC}"
echo "Check deployment status manually"
