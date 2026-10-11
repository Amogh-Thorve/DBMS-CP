# ==============================================================================
# STVAMS - Smart Traffic Violation & Vehicle Analytics Management System
# Script: scripts/start_demo.ps1
# Description: Automated, idempotent launch of STVAMS Backend and Frontend
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " STVAMS LIVE DEMO LAUNCH CONTROLLER" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendPath = Join-Path $rootPath "backend"
$frontendPath = Join-Path $rootPath "frontend"
$logsPath = Join-Path $rootPath "logs"
$dbPath = Join-Path $rootPath "stvams_dev.db"

# Ensure logs directory exists
if (-not (Test-Path $logsPath)) {
    New-Item -ItemType Directory -Path $logsPath -Force | Out-Null
}

$backendLog = Join-Path $logsPath "backend.log"
$frontendLog = Join-Path $logsPath "frontend.log"

# --- 1. PREREQUISITES VERIFICATION ---
Write-Host "[1/4] Verifying Prerequisites..." -ForegroundColor Yellow

if (-not (Test-Path $dbPath)) {
    Write-Host "  [FAIL] Database file not found at: $dbPath" -ForegroundColor Red
    Write-Host "         Please run 'python database/seed/master_seed.py' first." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Master Database Verified : $dbPath" -ForegroundColor Green

# --- 2. BACKEND LAUNCH (Port 8000) ---
Write-Host ""
Write-Host "[2/4] Starting FastAPI Backend (Port 8000)..." -ForegroundColor Yellow

$backendAlreadyRunning = $false
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
    if ($res.status -in @("online", "HEALTHY", "ONLINE")) {
        $backendAlreadyRunning = $true
        Write-Host "  [OK] FastAPI Backend is ALREADY running and healthy on port 8000." -ForegroundColor Green
    }
} catch {
    $backendAlreadyRunning = $false
}

if (-not $backendAlreadyRunning) {
    Write-Host "  -> Launching uvicorn process..." -ForegroundColor Cyan
    $backendProcess = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c", "start", "`"STVAMS Backend Server`"", "cmd.exe", "/k", "cd /d `"$backendPath`" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000" `
        -PassThru

    # Poll health endpoint up to 10 seconds
    $backendStarted = $false
    for ($i = 1; $i -le 10; $i++) {
        Start-Sleep -Seconds 1
        try {
            $h = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get -TimeoutSec 1 -ErrorAction Stop
            if ($h.status -in @("online", "HEALTHY", "ONLINE")) {
                $backendStarted = $true
                break
            }
        } catch {}
    }

    if ($backendStarted) {
        Write-Host "  [OK] FastAPI Backend started successfully!" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Backend did not respond within 10 seconds." -ForegroundColor Red
    }
}

# --- 3. FRONTEND LAUNCH (Port 5173) ---
Write-Host ""
Write-Host "[3/4] Starting React Frontend Dev Server (Port 5173)..." -ForegroundColor Yellow

$frontendAlreadyRunning = $false
try {
    $fe = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    if ($fe.StatusCode -eq 200) {
        $frontendAlreadyRunning = $true
        Write-Host "  [OK] Vite Dev Server is ALREADY running on port 5173." -ForegroundColor Green
    }
} catch {
    $frontendAlreadyRunning = $false
}

if (-not $frontendAlreadyRunning) {
    Write-Host "  -> Launching npm run dev..." -ForegroundColor Cyan
    $frontendProcess = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c", "start", "`"STVAMS Frontend Dev Server`"", "cmd.exe", "/k", "cd /d `"$frontendPath`" && npm run dev" `
        -PassThru

    # Poll frontend up to 10 seconds
    $frontendStarted = $false
    for ($i = 1; $i -le 10; $i++) {
        Start-Sleep -Seconds 1
        try {
            $fRes = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop
            if ($fRes.StatusCode -eq 200) {
                $frontendStarted = $true
                break
            }
        } catch {}
    }

    if ($frontendStarted) {
        Write-Host "  [OK] Frontend Dev Server started successfully! (PID: $($frontendProcess.Id))" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Frontend did not respond within 10 seconds." -ForegroundColor Red
        Write-Host "         Inspect error log at: $logsPath/frontend_err.log" -ForegroundColor Yellow
    }
}

# --- 4. SUMMARY & NAVIGATION ---
Write-Host ""
Write-Host "[4/4] LIVE DEMO URL ACCESS POINTS" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  Frontend Dashboard UI : http://localhost:5173" -ForegroundColor Green
Write-Host "  Backend REST API Docs  : http://localhost:8000/api/v1/docs" -ForegroundColor Green
Write-Host "  System Health Check    : http://localhost:8000/health" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful Demo Management Commands:" -ForegroundColor DarkGray
Write-Host "  - Check Status : powershell -ExecutionPolicy Bypass -File scripts/check_demo.ps1" -ForegroundColor DarkGray
Write-Host "  - Stop Stack   : powershell -ExecutionPolicy Bypass -File scripts/stop_demo.ps1" -ForegroundColor DarkGray
Write-Host ""
