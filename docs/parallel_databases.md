# Parallel Database Architectures & Parallel Processing in STVAMS

This document outlines the parallel database architecture principles demonstrated in **STVAMS**, distinguishing between actual software experiments implemented in Python/SQL and conceptual enterprise demonstrations.

---

## 1. Parallel Hardware Architectures

1. **Shared Memory Architecture:**  
   Multiple CPUs share a single global main memory (RAM) and disk storage bus. Implemented in the local multi-threaded FastAPI application server handling asynchronous HTTP requests.
2. **Shared Disk Architecture:**  
   Independent server nodes possess local memory but share a common SAN/NAS storage array. Demonstrated conceptually via Oracle Real Application Clusters (RAC) database configurations.
3. **Shared Nothing Architecture:**  
   Each node maintains dedicated CPU, RAM, and storage spindles. Demonstrated via Hadoop/HDFS distributed storage clusters and MapReduce batch data partitioning across distinct execution nodes.

---

## 2. Parallelism Modes & Implementation Status

```text
                               +-------------------------------------+
                               |      Parallel Processing Modes      |
                               +------------------+------------------+
                                                  |
           +--------------------------------------+--------------------------------------+
           |                                      |                                      |
           v                                      v                                      v
  [I/O PARALLELISM]                     [INTERQUERY PARALLELISM]               [INTRAQUERY PARALLELISM]
- Multi-file Tablespaces               - Concurrent REST API Handlers         - Oracle Parallel Query Hints
- Asynchronous Disk I/O                - Asynchronous Connection Pool          - Multi-core Pandas Chunking
(Status: Implemented Experiment)       (Status: Implemented Experiment)        (Status: Implemented Experiment)
```

| Parallelism Mode | Description in STVAMS | Implementation Mechanism | Status |
|---|---|---|:---:|
| **I/O Parallelism** | Striping table and index data across multiple data files (`DATAFILE_01.dbf`, `DATAFILE_02.dbf`) to allow concurrent disk read/write operations. | Oracle Tablespaces with multi-file striping & Asynchronous file I/O in Python integrations | `Implemented Experiment` |
| **Interquery Parallelism** | Concurrent execution of multiple independent queries submitted simultaneously by different traffic officers or automated camera nodes. | FastAPI asynchronous event loop (`asyncio`) + SQLAlchemy connection pooling (`pool_size=20`) | `Implemented Experiment` |
| **Intraquery Parallelism** | Decomposing a single heavy analytical query into parallel execution tasks assigned to multiple CPU worker threads. | Oracle SQL `PARALLEL` hint (`SELECT /*+ PARALLEL(v, 4) */ ...`) & PyArrow parallel dataset scanning | `Implemented Experiment` |

---

## 3. Practical Verification Experiments

### Experiment 1: Interquery Concurrent REST API Load
Executing concurrent API requests using `pytest` async client to verify connection pool scaling and non-blocking handling:
```bash
pytest backend/tests/test_extended_backend.py
```

### Experiment 2: Intraquery Oracle SQL Hints
Executing parallel aggregation over large violation datasets in Oracle SQL:
```sql
SELECT /*+ PARALLEL(v, 4) */ 
    v.camera_id, 
    COUNT(*) AS total_violations
FROM violation v
GROUP BY v.camera_id;
```

### Experiment 3: MapReduce Parallel Shuffle & Sort
Executing local streaming driver sorting mapped intermediate keys across separate execution passes:
```bash
python bigdata/mapreduce/driver.py --job zone
```
