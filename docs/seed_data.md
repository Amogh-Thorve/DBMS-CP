# STVAMS Seed Data System Documentation

## 1. Overview & Strategy
The **Smart Traffic Violation & Vehicle Analytics Management System (STVAMS)** incorporates a deterministic, production-scale seed data generation pipeline designed to populate all 22 operational relational entities, semi-structured MongoDB event documents, Data Warehouse Star Schema tables, Apache Parquet columnar event logs, and Hadoop MapReduce outputs.

The seeding pipeline uses a fixed random seed (`RANDOM_SEED = 42`) to guarantee 100% reproducible data generation while preserving strict relational integrity, realistic Indian traffic data formats, and natural statistical distributions.

---

## 2. Seed Data Execution Commands

To execute the master seed pipeline and run the full validation suite:

```bash
# Run Master Seed Pipeline (Oracle/SQLite, MongoDB, DW ETL, Parquet, MapReduce)
python database/seed/master_seed.py

# Run System Seed Validation Audit
python database/seed/validate_seed.py
```

---

## 3. Real Seed Record Counts

### Operational Relational Database (Oracle / SQLite)
| Entity Name | Record Count | Description |
| :--- | :--- | :--- |
| **Cities** | `3` | Metro cities (Mumbai, New Delhi, Bengaluru) |
| **Traffic Zones** | `10` | High-risk & critical traffic control zones |
| **Roads** | `30` | Arterial roads, expressways, national highways |
| **Road Segments** | `50` | Segments with start/end GIS coordinates & lengths |
| **Cameras** | `40` | ANPR, SPEED, RED_LIGHT, CCTV, AI_TRAFFIC nodes |
| **Camera Maintenance** | `20` | Technician servicing and calibration logs |
| **Officers** | `30` | Traffic police officers with badge numbers & ranks |
| **Violation Types** | `8` | Violation categories with base fines & demerit points |
| **Owners** | `200` | Individual, Corporate, and Government vehicle owners |
| **Drivers** | `150` | Drivers with DOB, blood group, & contact details |
| **Licenses** | `150` | Drivers' licenses (LMV, MCWG, HMV, TRANS, COMMERCIAL) |
| **Vehicles** | `300` | Vehicles with realistic Indian plates (MH, DL, KA) |
| **Vehicle Insurance** | `300` | Insurance policies (Valid, Expiring Soon, Expired) |
| **Pollution Certificates** | `300` | PUC emission test certificates |
| **Vehicle Events** | `2,500` | ANPR detection events over a 90-day window |
| **Violations** | `900` | Confirmed traffic violations with officer tags |
| **Fines** | `900` | Fines linked to violations (Base + Penalty) |
| **Payments** | `480` | Financial payment transactions (UPI, Credit Card, Cash) |
| **Appeals** | `75` | Citizen fine appeal submissions |
| **Appeal Reviews** | `50` | Officer adjudication decisions & comments |
| **Evidence Metadata** | `750` | Evidence image/video snapshots with SHA-256 hashes |

---

### Multi-Database & Pipeline Storage
- **MongoDB Collection (`stvams_events.detection_events`)**: `1,500` semi-structured event documents.
- **Data Warehouse (`DIM_DATE`, `DIM_TIME`, `DIM_VEHICLE`, `DIM_CAMERA`, `DIM_ZONE`, `DIM_VIOLATION_TYPE`, `FACT_VIOLATION`, `FACT_PAYMENT`)**: `2,117` star schema dimension & fact records.
- **Parquet Columnar Storage (`data/parquet/events.json` / `.parquet`)**: `2,500` event rows.
- **Hadoop MapReduce Streaming Outputs (`bigdata/mapreduce/output/`)**: `3` job outputs (`zone_output.txt`, `hourly_output.txt`, `segment_output.txt`).

---

## 4. Key Data Characteristics & Analytics Integrity
- **Repeat Offender Distribution**: 120 vehicles have 0 violations; top repeat offenders have up to 6 violations.
- **Peak Hour Traffic Curve**: Peak traffic volume clustered during 07:00–10:00 (35%) and 17:00–21:00 (40%).
- **Financial Reconciliation**: 480 payments reconcile 100% of paid fines with valid transaction reference numbers (`TXN-2026-xxxxx`).
- **Referential Integrity**: **0 orphan records** across all foreign key relationships.
