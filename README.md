# Smart Traffic Violation & Vehicle Analytics Management System (STVAMS)

> **Academic DBMS Project & Enterprise-Grade Backend Architecture**  
> STVAMS demonstrates the end-to-end integration of relational databases (Oracle PL/SQL), NoSQL document stores (MongoDB), full-text search engines (Elasticsearch), big data analytical storage (Apache Parquet & Hadoop MapReduce), and dimensional data warehousing (OLAP).

---

## 1. High-Level System Architecture

```text
Traffic Camera / Detection Event
            |
            v
     FastAPI Backend Gateway
            |
      +-----+--------------------------+
      |                                |
      v                                v
Oracle Database (ACID)            MongoDB (Event Store)
Operational Source of Truth       Semi-Structured Evidence
      |                                |
      +----------------+---------------+
                       |
                       v
                 Elasticsearch
                  Search Layer
                       |
                       v
              Apache Parquet Data Lake
                       |
                       v
                 Hadoop HDFS / MapReduce
                       |
                       v
              Dimensional Data Warehouse (Star Schema)
                       |
                       v
                 OLAP Analytics APIs
```

---

## 2. Technology Stack & Rationale

| Technology | Purpose in STVAMS | Syllabus Topic Demonstrated |
|---|---|---|
| **Python / FastAPI** | High-performance asynchronous REST API backend | Web Application Architecture, OpenAPI/Swagger |
| **Oracle RDBMS / PL/SQL** | Primary transactional database (Vehicles, Fines, Payments, Appeals) | Relational Model, SQL DDL/DML/DCL/TCL, PL/SQL Procedures, Triggers, ACID, Indexing |
| **MongoDB** | Dynamic semi-structured storage for camera detection metadata | NoSQL Document Store, BASE Model, CAP Theorem |
| **Elasticsearch** | Sub-second full-text and multi-field search engine | Inverted Indexing, Search Architectures |
| **Apache Parquet** | Columnar storage for long-term traffic analytics | Columnar Storage, Data Compression |
| **Hadoop / HDFS / MapReduce** | Distributed storage and batch analytics pipeline | Big Data 5Vs, HDFS, MapReduce Programming |
| **Data Warehouse (Star Schema)** | Multi-dimensional analytical processing (OLAP) | Dimensional Modeling, Star Schema, OLAP vs OLTP |

---

## 3. Directory Structure

```text
DBMS-Project/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI Entry Point
│   │   ├── config/                  # Pydantic Settings
│   │   ├── db/                      # Oracle, Mongo, Elasticsearch engines
│   │   ├── models/                  # SQLAlchemy ORM Models (22 Entities)
│   │   ├── schemas/                 # Pydantic Validation Schemas
│   │   ├── services/                # Business Domain & Transaction Logic
│   │   ├── routers/                 # REST API Routers
│   │   └── utils/                   # Security, JWT & Logging
│   ├── tests/                       # Automated Pytest Suite
│   ├── requirements.txt
│   └── .env.example
├── database/
│   ├── oracle/                      # 14 Execution Scripts (DDL, DML, PL/SQL, Views, Indexes, TCL, DCL)
│   ├── mongodb/                     # Mongo Seed & 15+ Advanced Queries
│   └── warehouse/                   # Star Schema DDL, Python ETL & OLAP Queries
├── bigdata/
│   ├── hdfs/                        # HDFS Layout & Admin Commands Guide
│   └── mapreduce/                   # Mapper, Reducer & Local Execution Driver
├── docs/                            # 15 Detailed Academic Technical Documentation Files
├── docker-compose.yml               # Local Infrastructure Composition
└── README.md
```

---

## 4. Quick Start & Setup Instructions

### Prerequisites
* Python 3.10+
* Docker & Docker Compose (Optional for local DB containers)

### Step 1: Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```

### Step 3: Run Database Infrastructure (Docker Compose)
```bash
docker-compose up -d
```

### Step 4: Execute Oracle DDL & Seed Scripts
Run the Oracle SQL scripts in numerical order:
```bash
# In SQL*Plus or SQL Developer:
@database/oracle/01_schema.sql
@database/oracle/02_constraints.sql
@database/oracle/03_seed_data.sql
@database/oracle/04_views.sql
@database/oracle/05_indexes.sql
@database/oracle/06_procedures.sql
@database/oracle/07_functions.sql
@database/oracle/08_cursors.sql
@database/oracle/09_triggers.sql
@database/oracle/10_transactions.sql
```

### Step 5: Start the FastAPI Backend Server
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
Access OpenAPI Swagger Documentation at: `http://localhost:8000/api/v1/docs`

---

## 5. Running Automated Tests

Run the full pytest backend test suite:
```bash
cd backend
pytest -v
```

---

## 6. Running Big Data & Analytics Pipelines

### Parquet Columnar Export:
```bash
python backend/app/integrations/parquet/parquet_export.py
```

### Data Warehouse ETL Execution:
```bash
python database/warehouse/etl.py
```

### Local MapReduce Streaming Job:
```bash
python bigdata/mapreduce/driver.py
```

---

## 7. Comprehensive Academic Traceability

* **Syllabus Traceability Matrix:** [`docs/syllabus_traceability.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/syllabus_traceability.md)
* **Practical Experiments Matrix:** [`docs/practical_traceability.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/practical_traceability.md)
* **Viva Examination Guide:** [`docs/viva_preparation.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/viva_preparation.md)
* **Codd's 12 Rules Compliance:** [`docs/codds_rules.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/codds_rules.md)
* **Normalization (1NF -> 4NF):** [`docs/normalization.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/normalization.md)
* **Relational Algebra Mapping:** [`docs/relational_algebra.md`](file:///c:/Users/amogh/Documents/GitHub/DBMS-Project/docs/relational_algebra.md)
