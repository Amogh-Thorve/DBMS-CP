# STVAMS DBMS Syllabus Traceability Matrix

This document provides complete, line-by-line traceability proving that **EVERY SINGLE TOPIC** from Units 1 through 6 of the DBMS syllabus is implemented, demonstrated, or analyzed within the STVAMS repository.

---

## UNIT 1: Database System Concepts & Data Modeling

| Syllabus Topic | Where Implemented | File / Script / API Path | Evidence / Implementation Details |
|---|---|---|---|
| **Need of DBMS** | Project Architecture Doc | [`docs/architecture.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/architecture.md) | Section 1: Problems solved over traditional file systems (data redundancy, anomalies, security, multi-user concurrency). |
| **Evolution** | Architecture Doc | [`docs/architecture.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/architecture.md) | Section 2: Historical trace from Flat files -> Hierarchical -> Network -> Relational -> NoSQL -> NewSQL/Big Data. |
| **Database System Concepts** | Architecture & Config | [`backend/app/config/settings.py`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/backend/app/config/settings.py) | Schema isolation, data independence, DBMS catalog management. |
| **Architecture (3-Schema)** | Architecture Doc | [`docs/architecture.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/architecture.md) | External (Views), Conceptual (Oracle Schema), Internal (Oracle Datafiles/Tablespaces). |
| **Database Design Process** | ER & EER Docs | [`docs/er_diagram.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/er_diagram.md) | Requirements analysis -> Conceptual modeling -> Logical design -> Physical DDL execution. |
| **ER Model** | ER Diagram & Specs | [`docs/er_diagram.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/er_diagram.md) | Mermaid ER diagram with 22 entities, attributes, primary keys, and cardinality constraints. |
| **Extended ER Model (EER)** | EER Diagram & Specs | [`docs/eer_diagram.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/eer_diagram.md) | Specialization/Generalization (VEHICLE -> PRIVATE/COMMERCIAL, CAMERA -> ANPR/SPEED/RED_LIGHT). |
| **Relational Model** | DDL Schema | [`database/oracle/01_schema.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/01_schema.sql) | Normalized relational tables with primary keys, foreign keys, and referential integrity. |
| **Codd's Rules** | Codd's Rules Doc | [`docs/codds_rules.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/codds_rules.md) | Detailed verification of all 13 rules (Rules 0-12) mapped to Oracle & STVAMS features. |

---

## UNIT 2: Relational Database Design & Normalization

| Syllabus Topic | Where Implemented | File / Script / API Path | Evidence / Implementation Details |
|---|---|---|---|
| **Need for Normalization** | Normalization Doc | [`docs/normalization.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/normalization.md) | Section 1: Elimination of Insertion, Deletion, and Update anomalies in traffic records. |
| **Functional Dependencies (FD)** | Normalization Doc | [`docs/normalization.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/normalization.md) | Section 2: Complete set of FDs derived from STVAMS domain attributes. |
| **Inference Rules (Armstrong's)** | Normalization Doc | [`docs/normalization.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/normalization.md) | Reflexivity, Augmentation, Transitivity, Decomposition, Union, Pseudo-transitivity applied with proofs. |
| **FD Closure (F+)** | Normalization Doc | [`docs/normalization.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/normalization.md) | Algorithm step-by-step computation of functional dependency closure. |
| **Attribute Closure (X+)** | Normalization Doc | [`docs/normalization.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/normalization.md) | Candidate key determination algorithm via attribute closure set expansion. |
| **Minimal Cover (Canonical)** | Normalization Doc | [`docs/normalization.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/normalization.md) | Step-by-step reduction to minimal canonical cover for STVAMS relations. |
| **Decomposition Properties** | Normalization Doc | [`docs/normalization.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/normalization.md) | Proof of Lossless-Join Decomposition & Dependency Preservation. |
| **1NF, 2NF, 3NF, BCNF** | Normalization Doc | [`docs/normalization.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/normalization.md) | Step-by-step normalization of un-normalized traffic violation relation down to BCNF. |
| **Multivalued Dependency (MVD) & 4NF** | Normalization Doc | [`docs/normalization.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/normalization.md) | Identification of MVD `vehicle_id ->> owner_id` and decomposition into 4NF. |
| **Relational Synthesis** | Normalization Doc | [`docs/normalization.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/normalization.md) | 3NF Relational Synthesis algorithm execution mapping FDs to database schema tables. |

---

## UNIT 3: Relational Languages (SQL, PL/SQL, Relational Algebra)

| Syllabus Topic | Where Implemented | File / Script / API Path | Evidence / Implementation Details |
|---|---|---|---|
| **Relational Algebra** | Relational Algebra Doc | [`docs/relational_algebra.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/relational_algebra.md) | Selection (σ), Projection (π), Union (∪), Difference (-), Product (×), Join (⋈), Rename (ρ). |
| **Mapping Algebra to SQL** | Relational Algebra Doc | [`docs/relational_algebra.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/relational_algebra.md) | Side-by-side formal relational algebraic expressions and equivalent Oracle SQL queries. |
| **SQL DDL Commands** | Oracle DDL Script | [`database/oracle/01_schema.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/01_schema.sql) | CREATE TABLE, ALTER TABLE, DROP TABLE, TRUNCATE TABLE, PK, FK, CHECK, DEFAULT, UNIQUE. |
| **SQL DML Commands** | Oracle DML Script | [`database/oracle/14_practical_queries.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/14_practical_queries.sql) | Extensive INSERT, UPDATE, DELETE queries with scalar & correlated subqueries. |
| **SQL DCL Commands** | Oracle DCL Script | [`database/oracle/13_dcl.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/13_dcl.sql) | GRANT, REVOKE across roles: ADMIN, OFFICER, ANALYST, PAYMENT_OPERATOR. |
| **SQL TCL Commands** | Oracle TCL Script | [`database/oracle/10_transactions.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/10_transactions.sql) | COMMIT, ROLLBACK, SAVEPOINT demonstrations during payment workflow. |
| **SELECT & Operators** | Practical Queries | [`database/oracle/14_practical_queries.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/14_practical_queries.sql) | WHERE, =, <>, >, <, >=, <=, AND, OR, NOT, LIKE, IN, BETWEEN, IS NULL, ORDER BY. |
| **Aggregates & Grouping** | Practical Queries | [`database/oracle/14_practical_queries.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/14_practical_queries.sql) | COUNT, SUM, AVG, MIN, MAX, GROUP BY, HAVING, DISTINCT queries. |
| **Joins & Set Operators** | Practical Queries | [`database/oracle/14_practical_queries.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/14_practical_queries.sql) | Equijoin, Non-equijoin, Self Join, Inner, Outer, UNION, UNION ALL, INTERSECT, MINUS. |
| **Nested Subqueries** | Practical Queries | [`database/oracle/14_practical_queries.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/14_practical_queries.sql) | Single-row, Multi-row (IN, ANY, ALL), Correlated (EXISTS, NOT EXISTS), Subquery DML. |
| **PL/SQL Procedures** | Procedures Script | [`database/oracle/06_procedures.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/06_procedures.sql) | 8 Procedures: REGISTER_VEHICLE, REGISTER_VIOLATION, GENERATE_FINE, PROCESS_PAYMENT, etc. |
| **PL/SQL Functions** | Functions Script | [`database/oracle/07_functions.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/07_functions.sql) | 6 Functions: CALCULATE_FINE, GET_TOTAL_UNPAID_FINE, GET_REPEAT_OFFENDER_SCORE, etc. |
| **PL/SQL Cursors** | Cursors Script | [`database/oracle/08_cursors.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/08_cursors.sql) | Implicit, Explicit, Parameterized, Cursor FOR Loop, REF CURSOR (SYS_REFCURSOR). |
| **PL/SQL Triggers** | Triggers Script | [`database/oracle/09_triggers.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/09_triggers.sql) | BEFORE, AFTER, Row-level, Statement-level, INSTEAD OF Triggers. |

---

## UNIT 4: Physical Storage, Query Processing, Transactions & Concurrency Control

| Syllabus Topic | Where Implemented | File / Script / API Path | Evidence / Implementation Details |
|---|---|---|---|
| **Storage & File Structures** | Storage Doc | [`docs/storage_file_structures.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/storage_file_structures.md) | Physical mapping: Database -> Tablespaces -> Datafiles -> Segments -> Extents -> Blocks. |
| **Indexing (Single & Multi-level)** | Oracle Indexes Script | [`database/oracle/05_indexes.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/05_indexes.sql) | B-Tree single-column, composite, and function-based indexes. |
| **Query Processing** | Query Mechanics Script | [`database/oracle/11_query_processing.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/11_query_processing.sql) | EXPLAIN PLAN breakdown: Parsing -> Optimization -> Physical Execution. |
| **Query Optimization** | Optimization Script | [`database/oracle/12_query_optimization.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/oracle/12_query_optimization.sql) | Before/After performance benchmarks comparing Full Table Scans vs Index Range Scans. |
| **Apache Parquet Columnar Storage** | Parquet Export Pipeline | [`backend/app/integrations/parquet/parquet_export.py`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/backend/app/integrations/parquet/parquet_export.py) | Python PyArrow pipeline converting relational data into compressed columnar Parquet files. |
| **Transaction & ACID Properties** | Transaction Doc & Service | [`docs/transactions.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/transactions.md) | Atomicity, Consistency, Isolation, Durability proven through fine payment workflow. |
| **Transaction States** | Transaction Doc | [`docs/transactions.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/transactions.md) | Active -> Partially Committed -> Committed / Failed -> Aborted transition diagram. |
| **Schedules & Serializability** | Concurrency Doc | [`docs/concurrency.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/concurrency.md) | Conflict serializability, View serializability, Precedence Graphs (Serialization Graphs). |
| **Concurrency Control & 2PL** | Concurrency Doc | [`docs/concurrency.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/concurrency.md) | Shared (S) and Exclusive (X) locks, Strict Two-Phase Locking (2PL) protocol analysis. |
| **Recovery Techniques** | Recovery Doc | [`docs/recovery.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/recovery.md) | Write-Ahead Logging (WAL), Checkpoints, UNDO/REDO crash recovery algorithms. |

---

## UNIT 5: Distributed, Parallel & Search Architectures

| Syllabus Topic | Where Implemented | File / Script / API Path | Evidence / Implementation Details |
|---|---|---|---|
| **Parallel Database Architecture** | Parallel DB Doc | [`docs/parallel_databases.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/parallel_databases.md) | Shared-Memory, Shared-Disk, Shared-Nothing architectures analyzed. |
| **Parallelism Types** | Parallel DB Doc | [`docs/parallel_databases.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/parallel_databases.md) | I/O Parallelism (striping), Interquery Parallelism, Intraquery Parallelism (parallel scan/join). |
| **Interoperation & Interoperability** | Interoperation Doc | [`docs/interoperation.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/interoperation.md) | ETL pipelines synchronizing Oracle -> MongoDB -> Elasticsearch -> Parquet -> HDFS. |
| **Distributed Database Types** | Distributed DB Doc | [`docs/distributed_databases.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/distributed_databases.md) | Homogeneous vs Heterogeneous, Client-Server, Peer-to-Peer, Federated architectures. |
| **Distributed Storage & Querying** | Distributed DB Doc | [`docs/distributed_databases.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/distributed_databases.md) | Horizontal fragmentation by traffic zone (Zone A, B, C) and distributed join processing. |
| **Elasticsearch Subsystem** | Search Integration | [`backend/app/routers/search.py`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/backend/app/routers/search.py) | Inverted index search API over traffic violations, fast plate lookup, and full-text filter. |
| **Cloud Databases & DBaaS** | Cloud DBaaS Doc | [`docs/cloud_dbaas.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/cloud_dbaas.md) | Provisioning, scalability, elasticity, multi-tenant DBaaS, cloud backups and security. |

---

## UNIT 6: NoSQL, Big Data & Data Warehousing (OLAP)

| Syllabus Topic | Where Implemented | File / Script / API Path | Evidence / Implementation Details |
|---|---|---|---|
| **NoSQL Systems** | NoSQL & MongoDB | [`database/mongodb/mongodb_queries.js`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/mongodb/mongodb_queries.js) | Document Store paradigm, flexible schema, JSON/BSON detection event storage. |
| **BASE Principles** | CAP & BASE Doc | [`docs/cap_base.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/cap_base.md) | Basically Available, Soft State, Eventual Consistency analyzed for event ingestion. |
| **CAP Theorem** | CAP & BASE Doc | [`docs/cap_base.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/cap_base.md) | Consistency vs Availability vs Partition Tolerance trade-offs across Oracle vs MongoDB. |
| **Big Data 5Vs** | Big Data Doc | [`docs/big_data.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/big_data.md) | Volume, Velocity, Variety, Veracity, Value mapped to traffic camera streaming data. |
| **Hadoop & HDFS** | Big Data & HDFS Guide | [`bigdata/hdfs/README.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/bigdata/hdfs/README.md) | NameNode, DataNode, Block replication, distributed file system architecture. |
| **MapReduce** | MapReduce Scripts | [`bigdata/mapreduce/driver.py`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/bigdata/mapreduce/driver.py) | Python MapReduce streaming job (mapper.py, reducer.py) for zone violation aggregation. |
| **Data Warehouse Architecture** | Warehouse Schema | [`database/warehouse/schema.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/warehouse/schema.sql) | Operational DB -> Staging -> Dimensional Data Warehouse -> Analytics API pipeline. |
| **Warehouse Schemas** | Warehouse Schema | [`database/warehouse/schema.sql`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/database/warehouse/schema.sql) | Star Schema implemented with Fact (FACT_VIOLATION) and Dimensions (DIM_DATE, DIM_ZONE). |
| **OLTP vs OLAP** | OLTP vs OLAP Doc | [`docs/oltp_olap.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/oltp_olap.md) | High-concurrency transactional processing vs complex multi-dimensional analytical queries. |
