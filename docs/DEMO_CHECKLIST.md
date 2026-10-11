# STVAMS Faculty Demo Checklist

**System:** Smart Traffic Violation & Vehicle Analytics Management System (STVAMS)  
**Evaluation Target:** DBMS Project Faculty Review  
**Presenter:** Project Lead  

---

## 1. 10 Minutes Before Presentation (Pre-Flight Setup)

| Check | Item | Verification Command / Action | Expected Result |
|:---:|---|---|---|
| [ ] | **Start Demo Stack** | `powershell -ExecutionPolicy Bypass -File scripts/start_demo.ps1` | Launches Backend and Frontend |
| [ ] | **Run System Diagnostic** | `powershell -ExecutionPolicy Bypass -File scripts/check_demo.ps1` | Returns `ALL CHECKS PASSED` |
| [ ] | **Prime Live-Demo Vehicle** | `python database/seed/demo_seed.py` | Confirms `MH02DM2026` is ready |
| [ ] | **Open Frontend Dashboard** | Browser: `http://localhost:5173` | Dark dashboard with 4 KPI cards & map |
| [ ] | **Open Swagger API Docs** | Browser: `http://localhost:8000/api/v1/docs` | Interactive OpenAPI documentation |
| [ ] | **Prepare Terminal Tab** | Windows Terminal or PowerShell in repo root | Ready to run SQL / seed queries if asked |

---

## 2. Browser Tabs to Keep Open

Organize your browser tabs in this exact order:
1. **Tab 1: STVAMS Command Center** (`http://localhost:5173`) — Primary demonstration UI.
2. **Tab 2: FastAPI Interactive Docs** (`http://localhost:8000/api/v1/docs`) — To prove backend REST architecture.
3. **Tab 3: System Health Endpoint** (`http://localhost:8000/api/v1/health/dependencies`) — Live dependency telemetry.

---

## 3. Reference Values to Memorize

| Item | Reference Value |
|---|---|
| **Live Demonstration Vehicle** | `MH02DM2026` (White Hyundai Creta, Prof. Rajiv Sharma) |
| **Top Repeat Offender** | `MH14ZC1103` (6 Violations, Commercial Class) |
| **Primary Live Camera** | `CAM-MUM-001` (BKC Junction, ANPR, 10.14.2.11) |
| **Total Fleet Size** | `40 Cameras` (34 Active, 4 Maintenance, 2 Offline) |
| **Relational Table Count** | `22 Tables` (Normalized to BCNF) |
| **Seed Random Seed** | `42` (Deterministic synthetic distribution) |

---

## 4. Emergency Backup Commands

Keep these 3 commands handy in your clipboard:

```powershell
# 1. Quick Health Check:
powershell -ExecutionPolicy Bypass -File scripts/check_demo.ps1

# 2. Complete Stack Restart:
powershell -ExecutionPolicy Bypass -File scripts/stop_demo.ps1; powershell -ExecutionPolicy Bypass -File scripts/start_demo.ps1

# 3. Seed & Integrity Verification:
python database/seed/validate_seed.py
```
