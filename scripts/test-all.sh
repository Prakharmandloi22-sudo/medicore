#!/bin/bash
set -e

echo "=========================================================="
echo "        MediCore Healthcare Operations Test Suite         "
echo "=========================================================="

# 1. Python Analytics Service
echo -e "\n[1/3] Running Python FastAPI Analytics Tests & Benchmark..."
cd "$(dirname "$0")/../analytics-service"
python -m pytest -v
python -m app.benchmark

# 2. Node.js Backend API
echo -e "\n[2/3] Running Node.js Core Backend Jest Test Suites..."
cd "$(dirname "$0")/../backend"
npm test

# 3. Next.js Frontend
echo -e "\n[3/3] Verifying Next.js Frontend Production Build..."
cd "$(dirname "$0")/../frontend"
npm run build

echo -e "\n=========================================================="
echo "  ALL MEDICORE TEST SUITES AND BUILDS COMPLETED (100% PASS)  "
echo "=========================================================="
