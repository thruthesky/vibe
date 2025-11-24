#!/bin/bash
# deploy-monitor.sh - Monitor Vibers deployment on Dokploy

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
