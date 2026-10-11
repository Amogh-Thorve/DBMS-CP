# STVAMS Demo Readiness Report

**Project:** Smart Traffic Violation & Vehicle Analytics Management System (STVAMS)  
**Evaluation Date:** October 2026 (DBMS Academic Evaluation)  
**Architecture:** Multi-Tier Polyglot DBMS (Relational + PL/SQL + NoSQL MongoDB + Data Warehouse Star Schema + Parquet / MapReduce + REST API + React SPA)

---

## 1. Components Discovered

| Layer | Technology | Primary Files / Entry Points | Operational Port / Path |
|---|---|---|---|
| **Frontend UI** | React 19, TypeScript, Vite, Recharts, Leaflet | `frontend/src/main.tsx`, `App.tsx`, `views/` | `http://localhost:5173` |
| **Backend REST API** | FastAPI, Uvicorn, SQLAlchemy, Pydantic | `backend/app/main.py`, `app/routers/` | `http://localhost:8000` (`/api/v1/docs`) |
| **Relational Database** | Oracle 19c / 23c Enterprise (Production Target)<br>SQLite (Autonomous Dev/Demo Fallback) | `database/oracle/*.sql`<br>`backend/app/db/database.py`, `stvams_dev.db` | Port 1521 (`FREEPDB1`)<br>`stvams_dev.db` (Local SQLite file) |
| **NoSQL Event Store** | MongoDB | `database/mongodb/`, `app/db/mongo.py` | Port 27017 (`stvams_events`)<br>Fallback: `data/mongodb/seed_events.json` |
| **Search Engine** | Elasticsearch | `app/db/elasticsearch.py`, `app/routers/search.py` | Port 9200 (`traffic_violations`)<br>Fallback: Relational SQL `LIKE` |
| **Data Warehouse (OLAP)** | Star Schema (SQLAlchemy/SQLite/Oracle) | `database/warehouse/models.py`, `etl.py` | Fact & Dimension tables |
| **Big Data / Data Lake** | Apache Parquet & Python MapReduce | `bigdata/mapreduce/`, `parquet_export.py` | `data/parquet/events.parquet`, MapReduce scripts |

---

## 2. Component Startup Procedures

### A. Minimal Reliable Startup (Self-Contained Local Demonstration)
1. **Backend Server:**
   ```powershell
   cd backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. **Frontend UI:**
   ```powershell
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173` in any modern web browser.

### B. Optional Full-Cluster Startup (Dockerized Stack)
If Docker Desktop is running and full containerization is evaluated:
```powershell
docker-compose up -d oracle mongodb elasticsearch
```

---

## 3. What Currently Works (Verified & Tested)

- **End-to-End Operational Workflow:** Vehicle lookup, Camera node telemetry, Violation recording, automatic fine generation, Payment transaction recording, and Appeal filing all function seamlessly via both REST API and React UI.
- **Relational Integrity & Schema Design:** 21 relational tables with strict foreign keys, cascade rules, composite indexes, and check constraints (`validate_seed.py` passes 100% with 0 orphans).
- **Dashboard Visualization:** 4 Primary KPI cards, GIS Interactive Traffic Map with city presets (Mumbai, Delhi, Bengaluru), daily violation trend area chart, offense category donut distribution, and financial settlement audit ledger.
- **Data Warehouse ETL & OLAP:** Complete star schema (`DimDate`, `DimTime`, `DimVehicle`, `DimCamera`, `DimZone`, `DimViolationType`, `FactViolation`, `FactPayment`) with verified automated ETL pipeline (`database/warehouse/etl.py`).
- **Big Data Storage & Processing:** Parquet columnar export (`data/parquet/events.parquet` / `events.json`) and local Hadoop MapReduce streaming drivers (`driver.py`, `mapper.py`, `reducer.py`).
- **Automated Test Suite:** Pytest backend tests pass 100% (`backend/tests/test_violations_and_payments.py`), frontend TypeScript builds with 0 errors (`npm run build`).

---

## 4. What Was Broken / Misconfigured & How It Was Resolved

1. **Dual SQLite File Drift:**
   - *Problem:* Running the backend from `backend/` accessed `backend/stvams_dev.db` (5 cameras, 5 violations), whereas running seed validation from root accessed root `stvams_dev.db` (40 cameras, 900 violations).
   - *Fix:* Configured `backend/app/db/database.py` with canonical path resolution and synced the full 1.27 MB verified master dataset across both locations.
2. **Camera Statistics Discrepancy:**
   - *Problem:* The previous dashboard showed 5 deployed nodes, 4 active, 1 in maintenance, and 2 offline/warnings (sum = 7 ≠ 5).
   - *Cause:* Falsy zero coercion `allCameras.filter(c => c.status === 'OFFLINE').length || 2` coerced `0` into `2`.
   - *Fix:* Replaced arbitrary fallbacks with exact integer filters. With the full 40-camera fleet, it accurately reports: 40 Deployed = 34 Online + 4 Maintenance + 2 Offline (100% reconciled).
3. **Database Health Crash in SQLite Mode:**
   - *Problem:* `GET /health/db` executed untyped `SELECT 1 FROM DUAL`, throwing a SQLAlchemy syntax error on SQLite.
   - *Fix:* Wrapped SQL expression in SQLAlchemy `text()` and inspects `engine.dialect.name`, returning `DEGRADED (SQLite Fallback)` when Oracle is absent.
4. **Missing Violation Trends Endpoint:**
   - *Problem:* Dashboard heatmap charts relied on hardcoded mock hourly numbers.
   - *Fix:* Implemented `GET /api/v1/analytics/violation-trends` querying real database daily timestamps.

---

## 5. Dependency Classification (Mandatory vs. Optional)

| Dependency | Classification | Fallback Behavior When Offline |
|---|:---:|---|
| **Python 3.11+ & FastAPI** | **Mandatory** | None. Backend REST API is required. |
| **Node.js 18+ & Vite** | **Mandatory** | None. React frontend is required. |
| **Oracle RDBMS 19c/23c** | **Optional** | Autonomous SQLite fallback (`stvams_dev.db`) active; 100% features supported. |
| **MongoDB 6.0+** | **Optional** | Local JSON event lake active (`data/mongodb/seed_events.json`); evidence images load locally. |
| **Elasticsearch 8.x** | **Optional** | SQL `LIKE` query fallback active in `backend/app/routers/search.py`. |
| **Hadoop / HDFS Cluster** | **Optional** | Local Python MapReduce streaming simulation runner (`driver.py`) active. |
| **Internet / Map Tiles** | **Optional** | OpenStreetMap tiles load if online; dark coordinate grid with markers remains fully functional if offline. |

---

## 6. Shortest Reliable Route to Demonstrate the Project

1. Launch backend via `uvicorn app.main:app` (starts in ~1 second).
2. Launch frontend via `npm run dev` (starts in ~300ms).
3. Open `http://localhost:5173`.
4. Walk through:
   - **Dashboard:** Show 4 KPIs, interactive map, and trends.
   - **Vehicles & Violations:** Demonstrate selecting a vehicle and issuing a citation.
   - **Automated Fine & Payment:** Show instant fine generation and settlement.
   - **Database Proof:** Run `python database/seed/validate_seed.py` or inspect SQL scripts in `database/oracle/`.
   - **OLAP & Big Data:** Show Star Schema ETL (`etl.py`) and MapReduce execution (`driver.py`).

---

## 7. Live Demo Failure Risks & Safeguards

| Risk | Likelihood | Impact | Safeguard Implemented |
|---|:---:|:---:|---|
| Oracle Docker container fails to start | Medium | None | Autonomous SQLite fallback preserves 100% of API endpoints and UI features. |
| Faculty asks why MongoDB / Elasticsearch is offline | High | Low | Dashboard honestly shows `OFFLINE` and explains that production uses microservices while demo runs on the self-contained resilient architecture. |
| Port 8000 or 5173 occupied by existing process | Low | High | Demo scripts (`scripts/start_demo.ps1`) test ports before launching and provide clean kill/restart routines. |
| Presentation venue has no Wi-Fi | Medium | Low | All backend databases, frontend assets, MapReduce scripts, and sample images run 100% offline from localhost. |
