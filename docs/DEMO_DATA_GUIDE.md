# STVAMS Demonstration Data Guide

**System:** Smart Traffic Violation & Vehicle Analytics Management System (STVAMS)  
**Evaluation Scope:** Academic DBMS Demonstration & Faculty Review  
**Data Scope:** 22 Operational Relational Tables, MongoDB Event Store, Star Schema Data Warehouse, Columnar Parquet File, Hadoop MapReduce Outputs

---

## 1. Overview & Seed Data Philosophy

STVAMS uses a deterministic, production-scale synthetic data pipeline configured with a fixed pseudo-random seed (`RANDOM_SEED = 42`). This architecture guarantees that all mathematical distributions, referential relationships, peak traffic curves, and analytics KPIs remain 100% reproducible across every demo run and reboot.

### Key Tenets
1. **Zero Fabrication**: All metrics displayed on the frontend dashboard and analytics views derive dynamically via SQL queries (`COUNT`, `SUM`, `GROUP BY`, `JOIN`) from real database rows.
2. **Deterministic Indian Traffic Context**: Registration series reflect real Indian RTO standards (`MH01`, `MH02`, `MH12`, `MH14` for Maharashtra; `DL01`, `DL03`, `DL07` for Delhi; `KA01`, `KA03`, `KA05` for Karnataka). Offense categories match Motor Vehicles (Amendment) Act rules.
3. **Idempotent Safety**: Existing operational data is preserved. Destructive resets require explicit confirmation (`--reset`).

---

## 2. Operational Database Record Counts

Validated via `python database/seed/validate_seed.py`:

| Operational Entity | Record Count | Description | Primary Key / Natural Key |
|---|:---:|---|---|
| **Cities** | `3` | Metro nodes: Mumbai, New Delhi, Bengaluru | `city_id` |
| **Traffic Zones** | `10` | High-density corridors (e.g., BKC, Silk Board, CP) | `zone_id` (`zone_code`) |
| **Roads** | `30` | Arterial expressways, highways, avenues | `road_id` |
| **Road Segments** | `50` | Road subdivisions with GIS coordinates & lengths | `segment_id` |
| **Cameras** | `40` | ANPR, SPEED, RED_LIGHT, CCTV, AI_TRAFFIC nodes | `camera_id` (`camera_code`) |
| **Camera Maintenance** | `20` | Technician servicing and calibration history | `maintenance_id` |
| **Traffic Officers** | `30` | Enforcing officers with ranks and badge IDs | `officer_id` (`badge_number`) |
| **Violation Types** | `8` | Statutorily defined traffic offenses | `type_id` (`type_code`) |
| **Vehicle Owners** | `201` | Citizen, Corporate, and Government owners | `owner_id` (`national_id`) |
| **Drivers** | `151` | Licensed drivers with contact info & blood group | `driver_id` |
| **Driver Licenses** | `150` | Valid/Suspended licenses with demerit points | `license_id` (`license_number`) |
| **Vehicles** | `301` | Registered vehicles across Private and Commercial classes | `vehicle_id` (`registration_no`) |
| **Vehicle Insurance** | `301` | Active, Expiring, and Expired policies | `policy_id` (`policy_number`) |
| **PUC Certificates** | `301` | Emission test certifications with CO2 levels | `puc_id` (`certificate_no`) |
| **Vehicle Events** | `2,500` | Automated sensor telemetry records | `event_id` |
| **Violations** | `900` | Formally confirmed traffic violation citations | `violation_id` |
| **Fines** | `900` | Financial penalties (Base statutory fine + Overdue penalty) | `fine_id` |
| **Payments** | `480` | Settlement audit receipts (UPI, Credit Card, NetBanking) | `payment_id` (`transaction_ref`) |
| **Appeals** | `75` | Citizen disputed citations | `appeal_id` |
| **Appeal Reviews** | `50` | Judicial/Officer review verdicts (APPROVED/REJECTED) | `review_id` |
| **Evidence Metadata** | `750` | Photographic & video snapshots with SHA-256 hashes | `evidence_id` |

---

## 3. Data Warehouse & Multi-Model Storage Counts

| Technology / Component | Dataset / Table Name | Record Count | Purpose |
|---|---|:---:|---|
| **Data Warehouse (Star Schema)** | `DIM_DATE` | 365 | 1-Year Temporal Dimension |
| **Data Warehouse (Star Schema)** | `DIM_TIME` | 24 | 24-Hour Time Slice Dimension |
| **Data Warehouse (Star Schema)** | `DIM_VEHICLE` | 300 | Vehicle Dimension with SCD Type 1 |
| **Data Warehouse (Star Schema)** | `DIM_CAMERA` | 40 | Camera Node GIS Dimension |
| **Data Warehouse (Star Schema)** | `DIM_ZONE` | 10 | Administrative Traffic Zone Dimension |
| **Data Warehouse (Star Schema)** | `DIM_VIOLATION_TYPE` | 8 | Offense Categorization Dimension |
| **Data Warehouse (Star Schema)** | `FACT_VIOLATION` | 900 | Granular Violation Fact Ledger |
| **Data Warehouse (Star Schema)** | `FACT_PAYMENT` | 480 | Financial Revenue Fact Ledger |
| **Columnar Data Lake** | `data/parquet/events.json` | 500 / 2,500 | Parquet Columnar Storage |
| **NoSQL Event Store** | `data/mongodb/seed_events.json` | 1,500 | Semi-Structured JSON Sensor Telemetry |
| **Hadoop MapReduce Output** | `bigdata/mapreduce/output/` | 3 Output Files | Big Data Aggregation Checkpoints |

---

## 4. Referential & Mathematical Consistency Proofs

The demonstration dataset guarantees 100% mathematical and referential integrity:

### A. Referential Integrity (Foreign Key Constraints)
- **Zero Orphan Vehicles**: Every vehicle references a valid existing record in `owner`.
- **Zero Orphan Licenses**: Every license references a valid record in `driver`.
- **Zero Orphan Violations**: Every violation references a valid vehicle in `vehicle`, a camera in `camera`, and an offense category in `violation_type`.
- **Zero Orphan Fines**: Every fine maps 1:1 to an existing violation in `violation`.
- **Zero Orphan Payments**: Every payment maps directly to an existing fine in `fine`.
- **Zero Orphan Appeals & Reviews**: All citizen appeals trace to real citations, and reviews trace to active appeal cases.

### B. Financial Ledger Reconciliation
```
Total Fines Levied     = SUM(fine.total_amount) = ₹1,029,000.00
Total Fines Collected  = SUM(payment.payment_amount WHERE status = 'SUCCESS') = ₹549,400.00
Collection Rate        = ₹549,400.00 / ₹1,029,000.00 = 53.39%
Total Pending Fines    = ₹1,029,000.00 - ₹549,400.00 = ₹479,600.00
Unpaid Citations Count = 420 citations (345 UNPAID + 75 UNDER_APPEAL)
Paid Citations Count   = 480 citations
```
- In `fine`, `total_amount = base_amount + penalty_amount` holds true for every row.
- For all 480 paid citations, a corresponding row exists in `payment` with `status = 'SUCCESS'`.

### C. Camera Fleet Reconciled Telemetry
- Total Deployed Nodes: `40`
- Active Online Cameras: `34` (85.0%)
- Maintenance Mode: `4` (10.0%)
- Offline / Fault: `2` (5.0%)
- Mathematical Check: `34 + 4 + 2 = 40` (100% Reconciled).

---

## 5. Pinned Demonstration Records for Evaluators

Keep these verified reference IDs ready for immediate entry during the faculty presentation:

### A. Dedicated Faculty Live-Demo Vehicle (Clean Record)
- **Registration Plate:** `MH02DM2026`
- **Vehicle Details:** White Hyundai Creta 1.5 SX (Petrol, Private Class, Year 2024)
- **Registered Owner:** Prof. Rajiv Sharma (`demo.faculty@stvams.gov.in`)
- **Address:** Dept. of Computer Science & Engineering, IIT Bombay, Powai, Mumbai
- **Demonstration Role:** Use this vehicle to demonstrate issuing a brand new live violation in Phase 4. It starts with zero existing violations!

### B. Known Repeat Offender Vehicle (Analytics Demonstration)
- **Registration Plate:** `MH14ZC1103`
- **Violation Count:** `6` citations
- **Owner:** Verified Commercial Logistics Fleet
- **Demonstration Role:** Search for this plate in the **Vehicles** view to prove repeat offender demerit tracking.

### C. Key Traffic Cameras for GIS Map Demo
- **Mumbai (BKC Hub):** `CAM-MUM-001` (Bandra-Kurla Complex Junction, ANPR, 19.0596° N, 72.8656° E)
- **Delhi (CP Circle):** `CAM-DEL-001` (Connaught Place Inner Circle, SPEED, 28.6328° N, 77.2197° E)
- **Bengaluru (MG Road):** `CAM-BLR-001` (MG Road Commercial Corridor, RED_LIGHT, 12.9756° N, 77.6066° E)

---

## 6. How to Populate or Verify Demonstration Data

### Step 1: Pre-Flight Check (Non-Destructive)
Verify that all data tables and records are intact:
```powershell
python database/seed/validate_seed.py
```
*Expected Output: `SEED VALIDATION AUDIT COMPLETE: ALL CHECKS PASSED!`*

### Step 2: Idempotent Demo Priming (Safe)
Ensures the dedicated faculty demo vehicle (`MH02DM2026`) and related records exist without resetting the database:
```powershell
python database/seed/demo_seed.py
```

### Step 3: Emergency Full Reset & Re-Seed (Destructive)
If the database was corrupted or intentionally modified during practice testing:
```powershell
python database/seed/demo_seed.py --reset
```
*Prompts for explicit safety confirmation (`CONFIRM`) before executing table drop and full pipeline generation.*
