#!/bin/bash

# ODAVL Studio Hub - Load Testing Script
# Runs k6 load tests against staging or production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="${ENVIRONMENT:-staging}"
TEST_FILE="${TEST_FILE:-tests/load/dashboard.js}"
BASE_URL="${BASE_URL:-http://localhost:3000}"
VUS="${VUS:-100}"
DURATION="${DURATION:-5m}"

echo -e "${GREEN}🚀 ODAVL Load Testing Suite${NC}"
echo "=================================="
echo "Environment: $ENVIRONMENT"
echo "Test File: $TEST_FILE"
echo "Base URL: $BASE_URL"
echo "VUs: $VUS"
echo "Duration: $DURATION"
echo "=================================="

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 is not installed${NC}"
    echo "Install k6: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Create results directory
mkdir -p test-results

# Run load test
echo -e "${YELLOW}Running load test...${NC}"

k6 run \
  --out json=test-results/load-test-$(date +%Y%m%d-%H%M%S).json \
  --summary-export=test-results/summary-$(date +%Y%m%d-%H%M%S).json \
  -e BASE_URL=$BASE_URL \
  -e ENVIRONMENT=$ENVIRONMENT \
  $TEST_FILE

# Check exit code
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Load test passed!${NC}"
else
    echo -e "${RED}❌ Load test failed!${NC}"
    exit 1
fi

# Generate HTML report (if k6-reporter is installed)
if command -v k6-reporter &> /dev/null; then
    echo -e "${YELLOW}Generating HTML report...${NC}"
    k6-reporter test-results/load-test-*.json
fi

echo -e "${GREEN}Load test completed successfully!${NC}"
