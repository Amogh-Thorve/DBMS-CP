# STVAMS Big Data Architecture: The 5Vs & MapReduce Pipeline

This document details the Big Data architecture of the **Smart Traffic Violation & Vehicle Analytics Management System (STVAMS)**, covering distributed storage layout, the 5Vs of Traffic Analytics, MapReduce batch processing, and Parquet columnar storage verification.

---

## 1. The 5Vs of Big Data Mapped to Traffic Analytics

```text
                        +----------------------------+
                        |   ANPR Camera Stream       |
                        +--------------+-------------+
                                       |
                                       v
                     +----------------------------------+
                     |  5Vs Traffic Analytics Pipeline   |
                     +-----------------+----------------+
                                       |
          +-------------------+--------+--------+-------------------+
          |                   |                 |                   |
          v                   v                 v                   v
     [VOLUME]            [VELOCITY]         [VARIETY]          [VERACITY]
 500k+ Detections/Day  500 FPS Stream  Unstructured/JSON/  AI Confidence 95%+
 50 GB Daily Storage   <100ms LPR AI     Parquet Columnar     Noise Filtering
          |                   |                 |                   |
          +-------------------+--------+--------+-------------------+
                                       |
                                       v
                                    [VALUE]
                         Blackspot Detection & Revenue
```

1. **Volume:**  
   Across major metropolitan corridors, STVAMS ingests over 500,000 traffic events daily. Raw camera image logs and vehicle telemetry produce approximately **50 GB of uncompressed event logs per day** (over 1.5 TB monthly).
2. **Velocity:**  
   High-definition Automated Number Plate Recognition (ANPR) cameras process video frames at **500+ frames per second per cluster node**, delivering sub-100ms detection payloads to the gateway REST services.
3. **Variety:**  
   STVAMS handles three distinct data formats:
   - *Unstructured:* Raw camera snapshot frames (JPEG/PNG) and video clips.
   - *Semi-Structured:* JSON/BSON detection event payloads stored in MongoDB.
   - *Structured / Columnar:* Oracle PL/SQL relational tables and compressed Apache Parquet analytical storage.
4. **Veracity:**  
   AI plate recognition confidence metrics (`ai_confidence >= 90.0%`) filter out corrupted or blurry plate reads before issuing formal violations into the relational ledger.
5. **Value:**  
   Batch analytical pipelines identify high-density traffic violation hotspots, calculate zone-wise risk profiles, optimize traffic officer deployment, and monitor revenue collection trends.

---

## 2. Component Execution Mapping Matrix

| Pipeline Component | Executable Locally | Requires Hadoop Cluster | Execution Mechanism / Status |
|---|:---:|:---:|---|
| **Parquet Columnar Exporter** | ✅ Yes | ❌ No | Python script `parquet_export.py` generates Parquet / JSON columnar data |
| **Parquet Schema Verifier** | ✅ Yes | ❌ No | `verify_parquet.py` inspects schema, row count, data types, and sample rows |
| **MapReduce Streaming Driver** | ✅ Yes | ❌ No | Python driver `driver.py` executes map-sort-reduce buffer streaming pipeline |
| **Zone Violation Aggregator** | ✅ Yes | ❌ No | `mapper.py --job zone` \| `sort` \| `reducer.py --job zone` |
| **Hourly Traffic Volume** | ✅ Yes | ❌ No | `mapper.py --job hourly` \| `sort` \| `reducer.py --job hourly` |
| **Segment Speed Analysis** | ✅ Yes | ❌ No | `mapper.py --job segment` \| `sort` \| `reducer.py --job segment` |
| **Distributed HDFS Storage** | ⚠️ Single-Node Demo | ✅ Yes | Provided in `docker-compose.hadoop.yml` for single-node HDFS demonstration |
| **Hadoop Streaming JAR** | ❌ Simulated | ✅ Yes | Local streaming simulates Hadoop Streaming JAR (`hadoop-streaming.jar`) execution |

---

## 3. Local MapReduce Execution & Verification Commands

### Job 1: Zone-wise Violation & Speed Aggregation (Default)
```bash
python bigdata/mapreduce/driver.py --job zone
```
**Example Output:**
```text
Z-BLR-01    TotalViolations: 50    AvgSpeed: 82.0 km/h
Z-DEL-01    TotalViolations: 50    AvgSpeed: 80.6 km/h
Z-HYD-01    TotalViolations: 50    AvgSpeed: 82.6 km/h
Z-MAA-01    TotalViolations: 50    AvgSpeed: 84.0 km/h
Z-MUM-01    TotalViolations: 50    AvgSpeed: 80.1 km/h
```

### Job 2: Hourly Traffic Volume Distribution
```bash
python bigdata/mapreduce/driver.py --job hourly
```
**Example Output:**
```text
00:00    TotalTrafficVolume: 41 vehicles
02:00    TotalTrafficVolume: 42 vehicles
...
22:00    TotalTrafficVolume: 41 vehicles
```

### Job 3: Average Speed by Road Segment
```bash
python bigdata/mapreduce/driver.py --job segment
```
**Example Output:**
```text
Segment_01    TotalEvents: 50    AvgSpeed: 80.1 km/h
Segment_02    TotalEvents: 50    AvgSpeed: 81.0 km/h
...
Segment_10    TotalEvents: 50    AvgSpeed: 83.6 km/h
```

---

## 4. Parquet Columnar Export & Verification

### Step 1: Export Data to Parquet / Columnar Format
```bash
python backend/app/integrations/parquet/parquet_export.py
```

### Step 2: Verify Schema and Row Counts
```bash
python bigdata/verify_parquet.py
```
**Sample Verification Output:**
```text
Total Row Count : 500
Total Columns   : 10
Column Names    : ['event_id', 'camera_id', 'segment_id', 'zone_code', 'vehicle_id', 'registration_no', 'observed_speed', 'ai_confidence', 'event_status', 'event_timestamp']
Schema Data Types:
 - event_id            : int64
 - camera_id           : int64
 - segment_id          : int64
 - zone_code           : object
 - vehicle_id          : int64
 - registration_no     : object
 - observed_speed      : int64
 - ai_confidence       : int64
 - event_status        : object
 - event_timestamp     : object
```

---

## 5. Single-Node Hadoop Demonstration (Docker)

To run a single-node HDFS container for demonstration:

```bash
docker-compose -f bigdata/hdfs/docker-compose.hadoop.yml up -d
```
Access HDFS NameNode Web Interface at: `http://localhost:9870`
