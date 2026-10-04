# STVAMS DBMS Academic Viva Preparation Guide

This guide prepares students for academic viva examinations by explaining **WHY**, **WHAT**, **HOW**, and **SYLLABUS** mappings for every major technology, alongside top 20 potential viva questions and concise, authoritative answers.

---

## Technology Justification Cheat Sheet

### 1. Oracle RDBMS
* **WHY:** Traffic violation management requires strict ACID compliance for legal fines and payment transactions.
* **WHAT:** Stores authoritative relational tables (`VEHICLE`, `OWNER`, `VIOLATION`, `FINE`, `PAYMENT`).
* **HOW:** FastAPI backend interfaces with Oracle via SQLAlchemy ORM and direct PL/SQL procedure execution.
* **SYLLABUS:** Relational Model, SQL DDL/DML/DCL/TCL, PL/SQL, ACID, Indexing, Transactions.

### 2. MongoDB
* **WHY:** Traffic cameras capture non-uniform semi-structured metadata (AI confidence, bounding box coordinates, camera vendor specific fields).
* **WHAT:** Stores raw camera detection event documents.
* **HOW:** PyMongo driver handles JSON document insertion and aggregation queries.
* **SYLLABUS:** NoSQL Document Stores, BASE Consistency, CAP Theorem.

### 3. Elasticsearch
* **WHY:** Sub-second multi-column full-text search across millions of historical traffic violation logs.
* **WHAT:** Inverted search indexes (`traffic_violations`).
* **HOW:** FastAPI `/api/v1/search` endpoint dispatches search queries to Elasticsearch REST API.
* **SYLLABUS:** Information Retrieval, Inverted Indexing, Search Architectures.

### 4. Apache Parquet & Hadoop/HDFS
* **WHY:** High-density columnar compression for long-term historical analytical data lakes and batch MapReduce processing.
* **WHAT:** Historical traffic event datasets.
* **HOW:** Python PyArrow converts operational records to Parquet files; MapReduce jobs process aggregate metrics.
* **SYLLABUS:** Columnar Storage, Big Data 5Vs, HDFS Distributed File System, MapReduce Programming.

---

## Essential Viva Questions & Comprehensive Answers

### Q1: Why Oracle for payment processing?
**Answer:** Oracle RDBMS provides full ACID compliance, strict foreign key constraints, row-level locking (`FOR UPDATE`), and Write-Ahead Logging (WAL) to guarantee zero loss of financial records and prevent duplicate or uncommitted payments.

### Q2: Why MongoDB for detection events?
**Answer:** MongoDB is a NoSQL document store that offers high write throughput and a flexible JSON/BSON schema. This allows camera streams from multiple hardware vendors (with varying bounding box attributes, AI confidence metrics, and camera metadata) to be ingested without requiring rigid schema alterations.

### Q3: Why Elasticsearch?
**Answer:** Elasticsearch uses inverted indexing to provide sub-second, multi-field full-text search over millions of historical violation records (registration numbers, zone codes, officer remarks) where traditional SQL `LIKE %pattern%` full table scans would be prohibitively slow.

### Q4: Why Parquet?
**Answer:** Apache Parquet is a compressed, columnar storage format. Unlike row-based CSV/JSON, Parquet allows analytical queries to read only the specific columns needed (e.g., speed and zone_code), dramatically reducing disk I/O and enabling fast batch analytics.

### Q5: Why OLTP and OLAP separately?
**Answer:** OLTP (Oracle) is optimized for short, high-frequency, row-by-row transactional writes (issuing fines, taking payments). OLAP (Data Warehouse Star Schema) is optimized for complex, multi-table aggregate read queries over multi-year datasets. Keeping them separate prevents analytical batch reporting from locking live operational transaction tables.

### Q6: Why ACID?
**Answer:** ACID (Atomicity, Consistency, Isolation, Durability) guarantees that database transactions are processed reliably. For example, during a fine payment, if the payment record is inserted but the fine status update fails, the system rolls back entirely (Atomicity), maintaining valid financial balances (Consistency).

### Q7: Why BASE?
**Answer:** BASE (Basically Available, Soft State, Eventual Consistency) is used in high-velocity NoSQL event stores like MongoDB. It prioritizes continuous write availability for thousands of camera streams over instant consistency across nodes, ensuring no camera detection frame is dropped.

### Q8: How does the CAP Theorem apply to STVAMS?
**Answer:** CAP states a distributed system can guarantee at most 2 out of Consistency, Availability, and Partition Tolerance. STVAMS uses a polyglot approach: Oracle operates as a CP system (prioritizing strict Consistency for legal payments), while MongoDB operates as an AP system (prioritizing Availability for high-speed camera streams).

### Q9: Why normalization?
**Answer:** Normalization structures relational tables to reduce data redundancy and eliminate insertion, update, and deletion anomalies. For instance, normalizing owner details out of the vehicle table ensures updating an owner's address requires editing a single tuple in `OWNER` rather than thousands in `VEHICLE`.

### Q10: What is BCNF?
**Answer:** Boyce-Codd Normal Form (BCNF) is a stricter version of 3NF. A relation is in BCNF if, for every non-trivial functional dependency $X \rightarrow Y$, $X$ MUST be a superkey. BCNF eliminates anomalies resulting from overlapping candidate keys.

### Q11: What is a correlated subquery?
**Answer:** A correlated subquery is a nested query that evaluates once for every row processed by the outer query because it references columns from the outer query table (e.g., `WHERE EXISTS (SELECT 1 FROM VEHICLE v WHERE v.owner_id = o.owner_id)`).

### Q12: What is a cursor in PL/SQL?
**Answer:** A cursor is a pointer to a context area in memory where Oracle parses and executes SQL statements. Implicit cursors (`SQL%ROWCOUNT`) handle single statements, while explicit cursors (`OPEN`, `FETCH`, `CLOSE`, `SYS_REFCURSOR`) allow sequential processing of multi-row result sets.

### Q13: What is the difference between a PL/SQL procedure and a function?
**Answer:** A Function MUST return a single value to the caller using the `RETURN` keyword and can be invoked directly inside SQL queries. A Procedure performs actions (DML, business logic) and can return zero, one, or multiple values via `OUT`/`IN OUT` parameters, but cannot be called directly inside an `in-line` SQL SELECT statement.

### Q14: What makes a database view non-updatable?
**Answer:** A view becomes non-updatable directly via standard SQL `UPDATE`/`INSERT` if its definition includes `GROUP BY`, aggregate functions (`SUM`, `AVG`), `DISTINCT`, set operators (`UNION`, `MINUS`), or joins over multiple tables. In such cases, PL/SQL `INSTEAD OF` triggers must be used.

### Q15: What is conflict serializability?
**Answer:** A schedule is conflict serializable if it is conflict equivalent to a serial schedule — meaning non-interleaving execution of operations. This can be verified by drawing a Precedence Graph (Serialization Graph); if the graph contains no cycles, the schedule is conflict serializable.

### Q16: What is Two-Phase Locking (2PL)?
**Answer:** 2PL is a concurrency control protocol ensuring serializability. It consists of two phases: 
1. **Growing Phase:** Transactions acquire locks (Shared or Exclusive) but cannot release any.
2. **Shrinking Phase:** Transactions release locks but cannot acquire new ones.

### Q17: What is MapReduce?
**Answer:** MapReduce is a distributed programming framework for processing large datasets in parallel across clusters. The **Mapper** filters and transforms raw data into key-value pairs (e.g., `zone_code -> 1,speed`), the framework **Shuffles & Sorts** keys, and the **Reducer** aggregates values per key (e.g., computing total violations and average speed).
