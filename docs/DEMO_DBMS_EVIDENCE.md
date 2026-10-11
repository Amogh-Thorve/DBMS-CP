# STVAMS DBMS Academic Evidence & Faculty Viva Reference

**System:** Smart Traffic Violation & Vehicle Analytics Management System (STVAMS)  
**Course Code:** Database Management Systems (DBMS / Advanced DBMS)  
**Architecture:** Enterprise Polyglot DBMS (Relational SQL + PL/SQL + NoSQL MongoDB + Star Schema OLAP + Big Data MapReduce)

---

## 1. Relational Database Concepts & Schema Design

### A. Entity-Relationship & Relational Mapping
- **22 Relational Tables** normalized up to **Boyce-Codd Normal Form (BCNF)**.
- **Cardinalities Implemented:**
  - `City (1) ── (N) TrafficZone`: One city contains multiple traffic zones.
  - `TrafficZone (1) ── (N) Road`: One zone contains multiple roads.
  - `Road (1) ── (N) RoadSegment`: Roads are segmented for precise GIS speed tracking.
  - `RoadSegment (1) ── (N) Camera`: Multiple camera sensors per road segment.
  - `Owner (1) ── (N) Vehicle`: An owner can possess multiple vehicles.
  - `Driver (1) ── (1) License`: 1:1 relationship enforced via unique foreign key.
  - `Violation (1) ── (1) Fine`: 1:1 automatic monetary ledger mapping.
  - `Fine (1) ── (N) Payment`: Supports partial/complete audit settlements.
  - `Violation (1) ── (0..1) Appeal`: Optional citizen dispute lifecycle.

### B. Normalization & Decomposition Proof
1. **1NF (First Normal Form)**: All table attributes are atomic. No multi-valued attributes or repeating groups (e.g., driver phone and license numbers are stored in atomic single values).
2. **2NF (Second Normal Form)**: No partial dependencies. Tables with composite primary keys (e.g. `audit_log`, `fact_violation`) have every non-key attribute fully functionally dependent on the entire primary key.
3. **3NF & BCNF (Third Normal Form / Boyce-Codd)**: Transitive dependencies are eliminated.
   - *Example*: In traffic routing, a camera is located on a road segment, which belongs to a road, which belongs to a zone, which belongs to a city:
     $$\text{Camera} \rightarrow \text{Segment} \rightarrow \text{Road} \rightarrow \text{Zone} \rightarrow \text{City}$$
   - *Decomposition*: Rather than storing `city_name` or `zone_name` redundantly inside `Camera` (which would cause update and deletion anomalies), the schema decomposes them into dedicated tables: `camera`, `road_segment`, `road`, `traffic_zone`, and `city`.

---

## 2. Oracle SQL Evidence (DDL, Constraints & DML)

All scripts are located in `database/oracle/`.

### A. Complex 5-Table Inner Join Query
Demonstrates relational navigation from raw violation to geographic municipality:
```sql
SELECT 
    v.violation_id,
    veh.registration_no,
    vt.title AS offense,
    cam.camera_code,
    r.road_name,
    z.zone_name,
    c.city_name,
    v.violation_dt
FROM violation v
JOIN vehicle veh ON v.vehicle_id = veh.vehicle_id
JOIN violation_type vt ON v.type_id = vt.type_id
JOIN camera cam ON v.camera_id = cam.camera_id
JOIN road_segment rs ON cam.segment_id = rs.segment_id
JOIN road r ON rs.road_id = r.road_id
JOIN traffic_zone z ON r.zone_id = z.zone_id
JOIN city c ON z.city_id = c.city_id
WHERE v.status = 'PAID'
ORDER BY v.violation_dt DESC;
```
*DBMS Concept Demonstrated: Multi-table inner joins, referential integrity preservation, projection, and selection.*

### B. Aggregation with `HAVING` (Repeat Offender Identification)
Locates vehicles with more than 3 violations and flags high-risk repeat violators:
```sql
SELECT 
    veh.registration_no,
    o.full_name AS owner_name,
    COUNT(v.violation_id) AS total_violations,
    SUM(f.total_amount) AS total_fines_incurred
FROM vehicle veh
JOIN owner o ON veh.owner_id = o.owner_id
JOIN violation v ON veh.vehicle_id = v.vehicle_id
JOIN fine f ON v.violation_id = f.violation_id
GROUP BY veh.registration_no, o.full_name
HAVING COUNT(v.violation_id) >= 5
ORDER BY total_violations DESC;
```
*DBMS Concept Demonstrated: Grouping, Aggregate functions (`COUNT`, `SUM`), `HAVING` predicate filter.*

### C. Correlated Subquery & Set Operators
Identifies vehicles registered in the system that have never committed a single violation:
```sql
SELECT veh.registration_no, veh.make, veh.model
FROM vehicle veh
WHERE NOT EXISTS (
    SELECT 1 FROM violation v WHERE v.vehicle_id = veh.vehicle_id
);
```
*DBMS Concept Demonstrated: Correlated subquery using `NOT EXISTS`.*

---

## 3. PL/SQL Evidence (Procedures, Functions, Cursors & Triggers)

Scripts located in `database/oracle/06_procedures.sql` to `database/oracle/09_triggers.sql`.

### A. Stored Procedure with Transaction & Exception Handling (`SP_PROCESS_FINE_PAYMENT`)
```sql
CREATE OR REPLACE PROCEDURE SP_PROCESS_FINE_PAYMENT (
    p_fine_id        IN  NUMBER,
    p_amount         IN  NUMBER,
    p_payment_method IN  VARCHAR2,
    p_txn_ref_no     IN  VARCHAR2,
    p_payment_id     OUT NUMBER
) AS
    v_fine_status   VARCHAR2(20);
    v_total_amount  NUMBER(10,2);
BEGIN
    -- Check fine existence and lock row
    SELECT status, total_amount INTO v_fine_status, v_total_amount
    FROM fine WHERE fine_id = p_fine_id FOR UPDATE;

    IF v_fine_status = 'PAID' THEN
        RAISE_APPLICATION_ERROR(-20001, 'Fine is already paid in full.');
    END IF;

    IF p_amount < v_total_amount THEN
        RAISE_APPLICATION_ERROR(-20002, 'Payment amount less than total fine.');
    END IF;

    -- Record Payment
    INSERT INTO payment (fine_id, payment_amount, payment_date, payment_method, txn_ref_no, status)
    VALUES (p_fine_id, p_amount, SYSDATE, p_payment_method, p_txn_ref_no, 'SUCCESS')
    RETURNING payment_id INTO p_payment_id;

    -- Update Fine and Violation status
    UPDATE fine SET status = 'PAID' WHERE fine_id = p_fine_id;
    UPDATE violation SET status = 'PAID' 
    WHERE violation_id = (SELECT violation_id FROM fine WHERE fine_id = p_fine_id);

    COMMIT;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20003, 'Fine ID not found in database.');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/
```
*DBMS Concept Demonstrated: ACID transactions, row-level locking (`FOR UPDATE`), parameterized procedures, exception handling blocks, rollback on failure.*

### B. Explicit Cursor (`08_cursors.sql`)
Demonstrates parameterized explicit cursor scanning overdue fines and applying late penalties:
```sql
DECLARE
    CURSOR c_overdue_fines IS
        SELECT fine_id, due_date, total_amount
        FROM fine
        WHERE status = 'UNPAID' AND due_date < SYSDATE;
    v_fine c_overdue_fines%ROWTYPE;
BEGIN
    OPEN c_overdue_fines;
    LOOP
        FETCH c_overdue_fines INTO v_fine;
        EXIT WHEN c_overdue_fines%NOTFOUND;
        
        UPDATE fine
        SET penalty_amount = penalty_amount + 200.00,
            total_amount = total_amount + 200.00,
            status = 'OVERDUE'
        WHERE fine_id = v_fine.fine_id;
    END LOOP;
    CLOSE c_overdue_fines;
    COMMIT;
END;
/
```
*DBMS Concept Demonstrated: Explicit cursor lifecycle (`DECLARE`, `OPEN`, `FETCH`, `%NOTFOUND`, `CLOSE`).*

### C. Row-Level Audit Trigger (`09_triggers.sql`)
```sql
CREATE OR REPLACE TRIGGER TRG_AUDIT_VIOLATION_STATUS
AFTER UPDATE OF status ON violation
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, old_value, new_value, timestamp)
    VALUES ('VIOLATION', :OLD.violation_id, 'STATUS_UPDATE', :OLD.status, :NEW.status, SYSDATE);
END;
/
```
*DBMS Concept Demonstrated: Event-driven active database trigger, row-level `:OLD` and `:NEW` pseudo-records.*

---

## 4. Data Warehouse & OLAP Operations

Star schema model in `database/warehouse/models.py` and queries in `database/warehouse/olap_queries.sql`.

### Star Schema Architecture
```
        [DIM_DATE]           [DIM_TIME]
             \                   /
              \                 /
     [DIM_VEHICLE]──[FACT_VIOLATION]──[DIM_CAMERA]
              /                 \
             /                   \
    [DIM_VIOLATION_TYPE]      [DIM_ZONE]
```

### OLAP Demonstration Operations

| OLAP Operation | Description | Verified SQL Implementation |
|---|---|---|
| **Roll-Up** | Aggregates fine revenue from zone level up to City and Year | `SELECT d.year, z.city_name, SUM(fv.total_fine_amt) FROM FACT_VIOLATION fv JOIN DIM_DATE d ... GROUP BY d.year, z.city_name` |
| **Drill-Down** | Navigates from City level down to specific Camera node and Hour-of-day | `SELECT z.zone_name, c.camera_code, t.hour_24, COUNT(fv.fact_id) ... WHERE z.zone_code = 'Z-MUM-01' GROUP BY ...` |
| **Slice** | Isolates a single dimension value (e.g. only `MORNING_PEAK` violations) | `SELECT z.zone_name, vt.title, SUM(fv.total_fine_amt) ... WHERE t.time_of_day = 'MORNING_PEAK' GROUP BY ...` |
| **Dice** | Sub-cube filtering across 3 dimensions: Critical Zone + Overspeeding + Weekend | `WHERE z.risk_level = 'CRITICAL' AND vt.code = 'SPEED_01' AND d.is_weekend = 1` |

---

## 5. NoSQL MongoDB & Big Data Integration

### A. MongoDB Document Model (`database/mongodb/seed.js`)
Stores flexible, semi-structured high-velocity sensor telemetry:
```json
{
  "_id": "670845a1b3f92",
  "event_id": "EVT-2026-00452",
  "camera": {
    "camera_code": "CAM-MUM-001",
    "location": "BKC Junction",
    "type": "ANPR"
  },
  "detection": {
    "license_plate": "MH02DM2026",
    "observed_speed": 82.4,
    "confidence": 0.985,
    "vehicle_class": "SEDAN"
  },
  "timestamp": "2026-10-11T08:30:00Z"
}
```

### B. MongoDB Aggregation Pipeline
Finds average vehicle speed per camera sensor across millions of detections:
```javascript
db.detection_events.aggregate([
  { $match: { "detection.observed_speed": { $gt: 50.0 } } },
  { $group: {
      _id: "$camera.camera_code",
      avg_speed: { $avg: "$detection.observed_speed" },
      total_detections: { $sum: 1 }
  }},
  { $sort: { avg_speed: -1 } }
]);
```

### C. Hadoop MapReduce Python Streaming (`bigdata/mapreduce/`)
- **Mapper (`mapper.py`)**: Emits `(zone_code, 1)` and `(hour, fine_amount)` key-value pairs from raw telemetry streams.
- **Reducer (`reducer.py`)**: Aggregates totals by key, simulating distributed big-data processing without requiring an external multi-node cluster.

---

## 6. Ready-to-Run Live Proof Commands (For Presentation)

Run these commands in PowerShell in front of evaluators to verify the database live:

```powershell
# 1. Verify Complete Seed Data & Referential Integrity
python database/seed/validate_seed.py

# 2. Run OLAP Warehouse ETL Execution
python database/warehouse/etl.py

# 3. Run Big Data MapReduce Streaming Simulation
python bigdata/mapreduce/driver.py

# 4. Run Pytest End-to-End Suite
pytest backend/tests
```
