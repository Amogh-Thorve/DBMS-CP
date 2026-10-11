# ==============================================================================
# STVAMS - Smart Traffic Violation & Vehicle Analytics Management System
# Script: scripts/stop_demo.ps1
# Description: Gracefully stop STVAMS Backend and Frontend services
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " STVAMS SERVICE SHUTDOWN CONTROLLER" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

function Stop-PortProcess {
    param([int]$Port, [string]$ServiceName)
    
    Write-Host "Checking for $ServiceName on Port $Port..." -ForegroundColor Yellow
    
    # Locate TCP connections or listeners on the specified port
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            if ($procId -gt 0) {
                try {
                    $p = Get-Process -Id $procId -ErrorAction Stop
                    Write-Host "  -> Terminating process '$($p.ProcessName)' (PID: $procId)..." -ForegroundColor Cyan
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                    Write-Host "  [OK] Successfully stopped PID $procId" -ForegroundColor Green
                } catch {
                    Write-Host "  [WARN] Could not stop PID $procId : $($_.Exception.Message)" -ForegroundColor Yellow
                }
            }
        }
    } else {
        Write-Host "  [INFO] Port $Port is already inactive (No active listeners)." -ForegroundColor DarkGray
    }
}

Stop-PortProcess -Port 8000 -ServiceName "FastAPI Backend"
Write-Host ""
Stop-PortProcess -Port 5173 -ServiceName "React Frontend Dev Server"

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " STVAMS Services Shutdown Complete." -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
