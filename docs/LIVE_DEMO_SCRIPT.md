# STVAMS Live Demonstration Script

**System:** Smart Traffic Violation & Vehicle Analytics Management System (STVAMS)  
**Target Duration:** 8–10 Minutes (Standard Faculty Presentation)  
**Compressed Fallback:** 3–5 Minutes (Fast Track)  
**Presenter:** Project Lead / Developer  

---

## 1. Opening Introduction (Duration: ~1 Minute)

> *"Good morning, respected faculty and evaluators. Today, I am presenting **STVAMS** — the **Smart Traffic Violation & Vehicle Analytics Management System**.*
>
> *Urban traffic authorities handle millions of high-velocity vehicle detection events every day. Legacy municipal systems struggle with data fragmentation, slow adjudication, and lack of real-time analytics.*
>
> *STVAMS solves this with a **Multi-Model Polyglot DBMS Architecture**. We implement a 22-table Relational Database normalized to BCNF with PL/SQL triggers and ACID transactions, an OLAP Star Schema Data Warehouse for dimensional slicing and dicing, a NoSQL MongoDB document store for flexible telemetry, and an Apache Parquet / MapReduce layer for scalable big data analytics.*
>
> *Everything you are about to see is live, fully persisted, and running on real backend database records."*

---

## 2. Standard 8–10 Minute Walkthrough Sequence

### Step 1: Command Center Dashboard Overview (~1.5 Mins)
- **Action:** Open `http://localhost:5173` in browser.
- **What Appears:**
  - 4 High-Contrast KPI Cards: **Violations Today**, **Pending Fines (₹479.6K)**, **Collection Rate (53.4%)**, **Active Cameras (34/40)**.
  - Interactive GIS Traffic Map with Mumbai/Delhi/Bengaluru quick presets and real camera status pins.
  - Daily Violation & Fine Revenue Trend Area Chart.
  - Offense Category Donut Distribution.
  - Recent Citations Financial Audit Ledger.
- **Database Concept Demonstrated:** Real-time SQL aggregations (`SUM`, `COUNT`, `AVG`, `GROUP BY`), multi-table joins, and view-level projections.
- **Spoken Sentence:**
  > *"Here on the STVAMS Command Center, every KPI derives dynamically from our relational database. You can see our fleet of 40 cameras across 3 metro cities, with exactly 34 active, 4 under maintenance, and 2 offline — reconciled with 100% mathematical consistency."*

---

### Step 2: Vehicle Directory & Registration Lookup (~1 Min)
- **Action:** Click **Vehicles** in the sidebar. In the search box, type `MH02DM2026`.
- **What Appears:**
  - Dedicated demonstration record: White Hyundai Creta 1.5 SX owned by Prof. Rajiv Sharma.
  - Shows `ACTIVE` status, linked valid insurance policy, and valid PUC certificate.
- **Database Concept Demonstrated:** Primary Key / Unique indexing (`registration_no`), foreign key constraint linking to `owner`, `vehicle_insurance`, and `pollution_certificate`.
- **Spoken Sentence:**
  > *"Here in the Vehicle Registry, we see full referential integrity. Notice vehicle `MH02DM2026`, registered to Prof. Rajiv Sharma with valid insurance and PUC certificates. It currently has a clean violation history, which we will now use for our live transaction."*

---

### Step 3: Camera Node Selection & GIS Spatial Point (~1 Min)
- **Action:** Click **Cameras** in the sidebar. Select `CAM-MUM-001` (BKC Junction).
- **What Appears:**
  - Node specifications: ANPR Camera, IP address `10.14.2.11`, linked to Road Segment 2, Bandra-Kurla Complex Zone.
- **Database Concept Demonstrated:** Spatial normalization — `Camera` decomposed from `RoadSegment`, `Road`, `TrafficZone`, and `City` to prevent transitive functional dependency anomalies.
- **Spoken Sentence:**
  > *"Every camera node in STVAMS is bound to a road segment and traffic control zone. This strict 3NF decomposition ensures zero geographic data redundancy."*

---

### Step 4: Live Violation Citation & Automatic Fine Generation (~2 Mins)
- **Action:**
  1. Click **Violations** in the sidebar.
  2. Click the **+ Issue Violation** button.
  3. Select Vehicle `MH02DM2026`.
  4. Select Camera `CAM-MUM-001`.
  5. Select Offense: `Red Light Violation` (Base Fine: ₹1,000).
  6. Remarks: `Faculty Live Demonstration - Red Light Signal Breach`.
  7. Click **Confirm & Issue Citation**.
- **What Appears:**
  - Success toast appears.
  - The newly created citation is rendered immediately in the table with status `UNPAID`, fine amount `₹1,000`, and plate `MH02DM2026`.
- **Database Concept Demonstrated:** ACID Transactional Atomicity. An insert into `violation` immediately triggers a corresponding insert into `fine` with automated calculation of due dates and statutory base penalties.
- **Spoken Sentence:**
  > *"When an enforcement officer issues a violation, our backend executes an atomic ACID transaction: it persists the violation record and automatically generates the linked fine in the financial ledger with statutory penalties."*

---

### Step 5: Financial Settlement & Payment Processing (~1.5 Mins)
- **Action:**
  1. Click **Fines & Revenue** in the sidebar.
  2. Filter by `Unpaid` tab or search `MH02DM2026`.
  3. Click **Pay Fine** next to the ₹1,000 fine.
  4. Select Payment Method: `UPI` (or `Credit Card`).
  5. Click **Process Payment**.
- **What Appears:**
  - Status updates in real-time from `UNPAID` to `PAID`.
  - Transaction reference number generated (`TXN_...`).
  - Total Outstanding Fine Balance drops by ₹1,000, and Collection Rate increases.
- **Database Concept Demonstrated:** Relational row-level lock (`FOR UPDATE`), referential check constraint, payment foreign key integrity, and trigger-based audit logging.
- **Spoken Sentence:**
  > *"Our payment processing demonstrates row-level locking to prevent double-spending. The payment transaction updates the fine status to PAID, archives an immutable audit entry in `audit_log`, and updates overall collection metrics."*

---

### Step 6: Citizen Appeal Review Lifecycle (~1 Min)
- **Action:** Click **Appeals** in the sidebar.
- **What Appears:**
  - List of citizen disputes showing status `SUBMITTED`, `APPROVED`, or `REJECTED`.
  - Demonstrates adjudication notes and officer remarks.
- **Database Concept Demonstrated:** Relational State Machine pattern and judicial audit trail.
- **Spoken Sentence:**
  > *"Citizens can lodge appeals against automated camera detections. Enforcement reviewers evaluate the evidence snapshot and adjudicate the case, ensuring due process."*

---

### Step 7: Technical Proof & Data Warehouse OLAP (~1.5 Mins)
- **Action:** Switch to terminal or display `database/warehouse/olap_queries.sql`.
- **Execution:**
  ```powershell
  python database/warehouse/etl.py
  ```
- **What Appears:**
  - ETL pipeline extracts from operational database, transforms records into surrogate dimensions (`DimDate`, `DimVehicle`, `DimCamera`), and loads fact rows into `FactViolation` and `FactPayment`.
- **Database Concept Demonstrated:** Star Schema Design, Extract-Transform-Load (ETL) pipeline, OLAP multidimensional analysis (Roll-up, Drill-down, Slice, Dice).
- **Spoken Sentence:**
  > *"Beyond transactional OLTP, STVAMS features an automated Star Schema ETL pipeline. This enables city planners to perform multidimensional OLAP operations — rolling up fine revenues across fiscal quarters and drilling down to hourly congestion bottlenecks."*

---

## 3. Closing Statement (Duration: ~30 Seconds)

> *"In summary, STVAMS bridges academic DBMS theory with real-world smart-city infrastructure. We have demonstrated BCNF relational normalization, ACID transactions, PL/SQL procedural logic, Star Schema OLAP warehousing, and NoSQL telemetry storage.*
>
> *Thank you. I am now open to your questions and technical review."*

---

## 4. Emergency 3–5 Minute Fallback (Fast Track)

If faculty gives you a strict 3-minute limit:

| Minute | Screen | Key Talking Point |
|:---:|---|---|
| **0:00 - 1:00** | **Dashboard** (`http://localhost:5173`) | Present 4 KPIs, GIS map, reconciled 40 camera nodes, and multi-model architecture. |
| **1:00 - 2:30** | **Violations & Fines** | Issue violation for `MH02DM2026`, show instant fine generation, and process payment. Highlights ACID transaction and normalization. |
| **2:30 - 3:30** | **Terminal Proof** | Run `python database/seed/validate_seed.py` showing 0 orphan records and all 22 tables verified. |
| **3:30 - 4:00** | **Conclusion** | Highlight BCNF schema, Star Schema OLAP, and answer faculty questions. |

---

## 5. Contingency Plan: What to Skip if Short on Time

1. **Skip:** Adding a new driver or owner manually (focus on existing demo vehicle `MH02DM2026`).
2. **Skip:** Parquet and MapReduce slides unless faculty specifically asks about Big Data components.
3. **Skip:** Docker container inspection (rely on local verified SQLite fallback).
