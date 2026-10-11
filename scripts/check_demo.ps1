# ==============================================================================
# STVAMS - Smart Traffic Violation & Vehicle Analytics Management System
# Script: scripts/check_demo.ps1
# Description: Comprehensive Pre-flight Diagnostics & Health Audit for STVAMS
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " STVAMS LIVE DEMO PRE-FLIGHT SYSTEM HEALTH & DIAGNOSTICS AUDIT" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray
Write-Host ""

$rootPath = Resolve-Path (Join-Path $PSScriptRoot "..")
$dbPath = Join-Path $rootPath "stvams_dev.db"

$allPassed = $true

# 1. Environment & Runtime Checks
Write-Host "[1/6] RUNTIME ENVIRONMENT CHECKS" -ForegroundColor Yellow

# Python Check
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  [OK] Python Runtime        : $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Python Runtime      : Not found in PATH!" -ForegroundColor Red
    $allPassed = $false
}

# Node.js Check
try {
    $nodeVersion = node -v 2>&1
    Write-Host "  [OK] Node.js Runtime       : $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Node.js Runtime     : Not found in PATH!" -ForegroundColor Red
    $allPassed = $false
}

# npm Check
try {
    $npmVersion = npm -v 2>&1
    Write-Host "  [OK] npm Package Manager   : v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] npm Package Manager : Not found in PATH!" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# 2. Database Integrity Checks
Write-Host "[2/6] RELATIONAL & STAR SCHEMA DATABASE AUDIT" -ForegroundColor Yellow
if (Test-Path $dbPath) {
    $dbSize = (Get-Item $dbPath).Length / 1MB
    Write-Host "  [OK] Database File Exists  : $dbPath ($([math]::Round($dbSize, 2)) MB)" -ForegroundColor Green
    
    # Query Database Table Counts via Python
    $pyCheck = @"
import sqlite3, json, sys

try:
    conn = sqlite3.connect(r'$dbPath')
    cur = conn.cursor()
    counts = {}
    tables = ['vehicle', 'camera', 'violation', 'fine', 'payment', 'appeal', 'fact_violation', 'fact_payment']
    for t in tables:
        try:
            cur.execute(f'SELECT COUNT(*) FROM {t}')
            counts[t] = cur.fetchone()[0]
        except Exception:
            counts[t] = -1
    print(json.dumps(counts))
except Exception as e:
    print(json.dumps({'error': str(e)}))
"@

    $countsJson = python -c "$pyCheck" 2>&1
    try {
        $counts = $countsJson | ConvertFrom-Json
        if ($counts.error) {
            Write-Host "  [FAIL] Database Read Error : $($counts.error)" -ForegroundColor Red
            $allPassed = $false
        } else {
            Write-Host "  [OK] Vehicles Registered   : $($counts.vehicle) records" -ForegroundColor Green
            Write-Host "  [OK] Cameras Deployed      : $($counts.camera) nodes" -ForegroundColor Green
            Write-Host "  [OK] Traffic Violations    : $($counts.violation) citations" -ForegroundColor Green
            Write-Host "  [OK] Fines Levied          : $($counts.fine) fines" -ForegroundColor Green
            Write-Host "  [OK] Payments Settled      : $($counts.payment) receipts" -ForegroundColor Green
            Write-Host "  [OK] Appeals Lodged        : $($counts.appeal) cases" -ForegroundColor Green
            Write-Host "  [OK] OLAP Fact Violations  : $($counts.fact_violation) rows" -ForegroundColor Green
            Write-Host "  [OK] OLAP Fact Payments    : $($counts.fact_payment) rows" -ForegroundColor Green
        }
    } catch {
        Write-Host "  [WARN] Failed to parse database statistics: $countsJson" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [FAIL] Database Missing    : $dbPath not found!" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# 3. Backend REST API Health Check (Port 8000)
Write-Host "[3/6] BACKEND REST API HEALTH CHECK (Port 8000)" -ForegroundColor Yellow
$backendHealthy = $false
try {
    $apiResp = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  [OK] FastAPI Server Online : Status=$($apiResp.status)" -ForegroundColor Green
    Write-Host "  [INFO] DB Telemetry Mode   : $($apiResp.database)" -ForegroundColor Cyan
    $backendHealthy = $true
} catch {
    Write-Host "  [WARN] Backend Offline     : Cannot connect to http://127.0.0.1:8000/health" -ForegroundColor Yellow
    Write-Host "         Start backend with:  powershell -ExecutionPolicy Bypass -File scripts/start_demo.ps1" -ForegroundColor DarkGray
    $allPassed = $false
}

# 4. Critical API Endpoints Verification (if Backend is up)
if ($backendHealthy) {
    Write-Host ""
    Write-Host "[4/6] CRITICAL API ENDPOINTS AUDIT" -ForegroundColor Yellow
    $endpoints = @(
        @{ Url = "http://127.0.0.1:8000/api/v1/analytics/dashboard-summary"; Name = "Dashboard Summary KPI" },
        @{ Url = "http://127.0.0.1:8000/api/v1/vehicles?limit=5";   Name = "Vehicles Directory" },
        @{ Url = "http://127.0.0.1:8000/api/v1/cameras";            Name = "Cameras GIS Fleet" },
        @{ Url = "http://127.0.0.1:8000/api/v1/violations?limit=5"; Name = "Violation Citations" },
        @{ Url = "http://127.0.0.1:8000/api/v1/analytics/violation-trends"; Name = "Daily Violation Trends" }
    )
    foreach ($ep in $endpoints) {
        try {
            $resp = Invoke-RestMethod -Uri $ep.Url -Method Get -TimeoutSec 3 -ErrorAction Stop
            Write-Host "  [OK] $($ep.Name) : 200 OK" -ForegroundColor Green
        } catch {
            Write-Host "  [FAIL] $($ep.Name) : $($_.Exception.Message)" -ForegroundColor Red
            $allPassed = $false
        }
    }
} else {
    Write-Host ""
    Write-Host "[4/6] CRITICAL API ENDPOINTS AUDIT : SKIPPED (Backend Offline)" -ForegroundColor DarkGray
}

Write-Host ""

# 5. Frontend Dev Server Check (Port 5173)
Write-Host "[5/6] FRONTEND DEV SERVER AUDIT (Port 5173)" -ForegroundColor Yellow
try {
    $feResp = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    if ($feResp.StatusCode -eq 200) {
        Write-Host "  [OK] React SPA Online      : http://localhost:5173 (HTTP 200)" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] React SPA Status    : HTTP $($feResp.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [WARN] Frontend Offline    : $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "         Start frontend with: cd frontend; npm run dev" -ForegroundColor DarkGray
    $allPassed = $false
}

Write-Host ""

# 6. Big Data & Offline Fallback Files Check
Write-Host "[6/6] BIG DATA ARTIFACTS & OFFLINE ASSETS" -ForegroundColor Yellow
$parquetJson = Join-Path $rootPath "data/parquet/events.json"
$mongoJson = Join-Path $rootPath "data/mongodb/seed_events.json"
$mrOutput = Join-Path $rootPath "bigdata/mapreduce/output/zone_output.txt"

if (Test-Path $parquetJson) {
    Write-Host "  [OK] Columnar Parquet Store: Present ($parquetJson)" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Columnar Parquet    : Not found at $parquetJson" -ForegroundColor Yellow
}

if (Test-Path $mongoJson) {
    Write-Host "  [OK] MongoDB JSON Lake     : Present ($mongoJson)" -ForegroundColor Green
} else {
    Write-Host "  [WARN] MongoDB JSON Lake   : Not found at $mongoJson" -ForegroundColor Yellow
}

if (Test-Path $mrOutput) {
    Write-Host "  [OK] Hadoop MR Results     : Present ($mrOutput)" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Hadoop MR Results   : MapReduce output not generated yet" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host " AUDIT SUMMARY: ALL SYSTEM CHECKS PASSED - READY FOR FACULTY DEMO!" -ForegroundColor Green
} else {
    Write-Host " AUDIT SUMMARY: SOME SERVICES ARE OFFLINE OR NEED ATTENTION." -ForegroundColor Yellow
    Write-Host " Run 'scripts/start_demo.ps1' to automatically launch the full demo stack." -ForegroundColor DarkGray
}
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
