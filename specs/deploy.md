# Vibers Dokploy Deployment Guide

## Overview

Vibers uses Dokploy for automated deployment. When you push code to GitHub, Dokploy automatically triggers a deployment workflow.

## Deployment Configuration

- **Dokploy Server**: http://167.88.45.173:3000
- **Application ID**: `NSEQ0t6REHcO0COK02xo0`
- **API Key**: `vibersNaEermIkbmKbFLQGokkhtxDYegyBUMwAvywMqAqVQHfJyKDpoAalHACgaWIfurSL`
- **Swagger API Docs**: http://167.88.45.173:3000/swagger

## Deployment Workflow

### Pre-Deployment Testing (필수)

배포 전에 **반드시** 테스트를 실행하여 코드에 이상이 없는지 확인:

```bash
# 1. 빌드 테스트
pnpm run build

# 2. E2E 테스트 (홈페이지 로드 확인)
pnpm run e2e
```

**E2E 테스트 내용:**

- 홈페이지가 정상적으로 로드되는지 확인
- 로그인 버튼이 표시되는지 확인
- 로그인 모달이 열리는지 확인
- 주요 UI 요소들이 렌더링되는지 확인

### Automated Deployment

가장 간단한 배포 방법:

```bash
# 빌드 + 테스트 + 커밋 + 푸시를 한 번에
pnpm run deploy

# 또는 커밋 메시지 지정
./scripts/deploy.sh "feat: Add new feature"
```

### Manual Deployment Steps

수동으로 배포하려면:

1. **Push to GitHub**: `git push origin main`
2. **Automatic Trigger**: Dokploy detects the push and starts deployment
3. **Build Process**:
   - Clones repository
   - Builds Docker image using `Dockerfile`
   - Runs with `docker-compose.yml` configuration
4. **Deploy**: Container is started with Traefik routing

## Monitoring Deployments

### Quick Status Check

Use this command to check the latest deployment status:

```bash
#!/bin/bash
# deploy-status.sh - Quick deployment status check

DOKPLOY="http://167.88.45.173:3000"
APP_ID="NSEQ0t6REHcO0COK02xo0"
KEY="vibersNaEermIkbmKbFLQGokkhtxDYegyBUMwAvywMqAqVQHfJyKDpoAalHACgaWIfurSL"

echo "🔍 Checking Vibers deployment status..."
curl -s "$DOKPLOY/api/deployment.all?applicationId=$APP_ID" \
  -H "x-api-key: $KEY" | jq -r '.[] | select(.deploymentId != null) |
  "[\(.status)] \(.createdAt) - \(.title // "Deployment")"' | head -5
```

### Detailed Deployment Monitor

For comprehensive monitoring with real-time updates:

```bash
#!/bin/bash
# deploy-monitor.sh - Continuous deployment monitoring

DOKPLOY="http://167.88.45.173:3000"
APP_ID="NSEQ0t6REHcO0COK02xo0"
KEY="vibersNaEermIkbmKbFLQGokkhtxDYegyBUMwAvywMqAqVQHfJyKDpoAalHACgaWIfurSL"

echo "📊 Vibers Deployment Monitor"
echo "=============================="
echo ""

# Get all deployments
DEPLOYMENTS=$(curl -s "$DOKPLOY/api/deployment.all?applicationId=$APP_ID" \
  -H "x-api-key: $KEY")

# Show latest deployment details
echo "Latest Deployment:"
echo "$DEPLOYMENTS" | jq -r '.[0] |
  "Status: \(.status)
  Created: \(.createdAt)
  Title: \(.title // "N/A")
  Deployment ID: \(.deploymentId)"'

echo ""
echo "Recent Deployments:"
echo "$DEPLOYMENTS" | jq -r '.[] |
  "[\(.status)] \(.createdAt | split("T")[0]) - \(.title // "Deployment")"' | head -10
```

### Watch Deployment Progress

Monitor deployment in real-time:

```bash
#!/bin/bash
# deploy-watch.sh - Watch deployment progress

DOKPLOY="http://167.88.45.173:3000"
APP_ID="NSEQ0t6REHcO0COK02xo0"
KEY="vibersNaEermIkbmKbFLQGokkhtxDYegyBUMwAvywMqAqVQHfJyKDpoAalHACgaWIfurSL"

echo "👀 Watching Vibers deployment..."
echo "Press Ctrl+C to stop"
echo ""

while true; do
  clear
  echo "🔄 Vibers Deployment Status - $(date '+%Y-%m-%d %H:%M:%S')"
  echo "=================================================="

  LATEST=$(curl -s "$DOKPLOY/api/deployment.all?applicationId=$APP_ID" \
    -H "x-api-key: $KEY" | jq -r '.[0]')

  STATUS=$(echo "$LATEST" | jq -r '.status')
  CREATED=$(echo "$LATEST" | jq -r '.createdAt')
  TITLE=$(echo "$LATEST" | jq -r '.title // "Deployment"')

  case "$STATUS" in
    "running")
      echo "🔵 Status: RUNNING"
      ;;
    "done")
      echo "✅ Status: SUCCESS"
      ;;
    "error")
      echo "❌ Status: FAILED"
      ;;
    *)
      echo "⚪ Status: $STATUS"
      ;;
  esac

  echo "📅 Created: $CREATED"
  echo "📝 Title: $TITLE"
  echo ""
  echo "Recent history:"
  curl -s "$DOKPLOY/api/deployment.all?applicationId=$APP_ID" \
    -H "x-api-key: $KEY" | jq -r '.[] |
    "  [\(.status)] \(.createdAt | split("T")[0] + " " + split("T")[1] | split(".")[0])"' | head -5

  sleep 5
done
```

## Deployment Status Meanings

| Status      | Icon | Meaning                           |
| ----------- | ---- | --------------------------------- |
| `running`   | 🔵   | Deployment is in progress         |
| `done`      | ✅   | Deployment completed successfully |
| `error`     | ❌   | Deployment failed - check logs    |
| `cancelled` | ⚠️   | Deployment was cancelled          |
| `queued`    | ⏳   | Deployment is waiting to start    |

## Troubleshooting Deployments

### 1. Check Deployment Logs

```bash
# Get the latest deployment ID
DEPLOYMENT_ID=$(curl -s "$DOKPLOY/api/deployment.all?applicationId=$APP_ID" \
  -H "x-api-key: $KEY" | jq -r '.[0].deploymentId')

# View deployment logs (check Dokploy UI for full logs)
echo "Latest Deployment ID: $DEPLOYMENT_ID"
```

### 2. Common Issues

**Build Fails with "unknown instruction: version:"**

- Problem: Dokploy is trying to use `docker-compose.yml` as Dockerfile
- Solution: Ensure Dockerfile exists and is properly configured

**pnpm not found**

- Problem: Dockerfile doesn't install pnpm
- Solution: Dockerfile should include `RUN npm install -g pnpm`

**Port conflicts**

- Problem: Port 3000 is already in use
- Solution: Check docker-compose.yml port configuration

**TailwindCSS build errors**

- Problem: Native bindings not found
- Solution: Use pnpm instead of npm (already configured)

### 3. Manual Deployment Trigger

If automatic deployment doesn't trigger, you can manually trigger via Dokploy UI:

1. Go to http://167.88.45.173:3000
2. Navigate to your application
3. Click "Deploy" button

## API Reference

### Get All Deployments

```bash
GET /api/deployment.all?applicationId={APP_ID}
Headers: x-api-key: {API_KEY}
```

### Get Deployment by ID

```bash
GET /api/deployment.one?deploymentId={DEPLOYMENT_ID}
Headers: x-api-key: {API_KEY}
```

### Official Documentation

- **Dokploy Deployment API**: https://docs.dokploy.com/docs/api/reference-deployment
- **Full API Reference**: http://167.88.45.173:3000/swagger

## Post-Deployment Verification

**⚠️ CRITICAL: 배포 완료 후 반드시 사이트 접속 확인 필요!**

After deployment completes, **ALWAYS** verify the site is accessible:

### 1. 사이트 접속 확인 (필수)

배포가 `done` 상태가 되면 즉시 사이트에 접속하여 확인:

```bash
# HTTP 상태 확인
curl -I https://vibers.kr

# 페이지 내용 확인
curl https://vibers.kr
```

**브라우저에서 직접 확인:**

- https://vibers.kr 접속
- 페이지가 정상적으로 로드되는지 확인
- 502, 503, 504 에러가 없는지 확인

### 2. 기능 테스트

사이트가 정상적으로 열리면 다음 기능들을 테스트:

1. **Main Domain**: https://vibers.kr
2. **Health Check**: Ensure the page loads
3. **Authentication**: Test Google login
4. **Chat Interface**: Verify sidebar appears when logged in
5. **AI Generation**: Test creating an app with a prompt

### 3. 문제 발생 시

만약 502, 503 에러가 발생하면:

```bash
# 에러 로그 확인
./scripts/deploy-error-check.sh auto

# 컨테이너 상태 확인 (Dokploy UI)
http://167.88.45.173:3000
```

## Quick Reference Commands

```bash
# Check latest deployment status
curl -s "http://167.88.45.173:3000/api/deployment.all?applicationId=NSEQ0t6REHcO0COK02xo0" \
  -H "x-api-key: vibersNaEermIkbmKbFLQGokkhtxDYegyBUMwAvywMqAqVQHfJyKDpoAalHACgaWIfurSL" \
  | jq '.[0]'

# List last 5 deployments
curl -s "http://167.88.45.173:3000/api/deployment.all?applicationId=NSEQ0t6REHcO0COK02xo0" \
  -H "x-api-key: vibersNaEermIkbmKbFLQGokkhtxDYegyBUMwAvywMqAqVQHfJyKDpoAalHACgaWIfurSL" \
  | jq -r '.[] | "[\(.status)] \(.createdAt)"' | head -5

# Watch deployment (continuous)
watch -n 5 'curl -s "http://167.88.45.173:3000/api/deployment.all?applicationId=NSEQ0t6REHcO0COK02xo0" \
  -H "x-api-key: vibersNaEermIkbmKbFLQGokkhtxDYegyBUMwAvywMqAqVQHfJyKDpoAalHACgaWIfurSL" \
  | jq ".[0]"'
```

## Deployment Checklist

### Using Automated Deployment Script (Recommended)

```bash
# One command to do everything
pnpm run deploy

# Or with custom commit message
./scripts/deploy.sh "feat: Your commit message"
```

The script will automatically:

- ✅ Run build
- ✅ Run E2E tests
- ✅ Commit changes
- ✅ Push to GitHub
- ✅ Monitor deployment
- ✅ Verify site accessibility

### Manual Deployment Checklist

If deploying manually:

- [ ] **🔴 CRITICAL: Run build test** `pnpm run build`
- [ ] **🔴 CRITICAL: Run E2E tests** `pnpm run e2e`
- [ ] Test locally with `pnpm dev`
- [ ] Commit all changes: `git add -A && git commit -m "..."`
- [ ] Push to GitHub: `git push origin main`
- [ ] Monitor deployment: `./scripts/deploy-watch.sh`
- [ ] **Wait for deployment status: `done`**
- [ ] **🔴 CRITICAL: 사이트 접속 확인** `curl -I https://vibers.kr`
- [ ] **🔴 CRITICAL: 브라우저에서 https://vibers.kr 접속 확인**
- [ ] Test core features: Login, chat, AI generation

## Testing

### E2E Tests

Playwright를 사용한 End-to-End 테스트:

```bash
# Run E2E tests (headless)
pnpm run e2e

# Run with UI (for debugging)
pnpm run test:ui

# Run with browser visible
pnpm run e2e:headed
```

**테스트 파일 위치:** `tests/e2e/homepage.spec.ts`

**테스트 내용:**

- 홈페이지 로드 확인
- 로그인 모달 기능 확인
- UI 요소 렌더링 확인

## Emergency Rollback

If deployment fails and site is down:

1. Check previous successful deployment ID
2. Use Dokploy UI to rollback to previous version
3. Or push a revert commit: `git revert HEAD && git push`
