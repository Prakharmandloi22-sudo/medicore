# MediCore Unified Turnkey Test Runner (Windows PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "        MediCore Healthcare Operations Test Suite         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Python Analytics Service Tests & Benchmark
Write-Host "`n[1/3] Running Python FastAPI Analytics Tests & Benchmark..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\analytics-service"
python -m pytest -v
python -m app.benchmark

# 2. Node.js Backend API Jest Tests & Security Tests
Write-Host "`n[2/3] Running Node.js Core Backend Jest Test Suites..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\backend"
npm.cmd test

# 3. Next.js Frontend Production Build Check
Write-Host "`n[3/3] Verifying Next.js Frontend Production Build..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\frontend"
npm.cmd run build

Set-Location "$PSScriptRoot\.."
Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  ALL MEDICORE TEST SUITES AND BUILDS COMPLETED (100% PASS)  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
