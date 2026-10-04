# Data Warehouse Architecture & Star Schema Model

## 1. Dimensional Model Overview

STVAMS separates high-velocity transactional operations (OLTP) from historical multi-dimensional analysis (OLAP) using a Star Schema Data Warehouse.

```text
               +------------------+
               |     DIM_DATE     |
               +--------+---------+
                        |
                        v
+------------------+  +-------------------+  +-------------------+
|   DIM_VEHICLE    |->|   FACT_VIOLATION  |<-|     DIM_CAMERA    |
+------------------+  +---------+---------+  +-------------------+
                        ^       |
                        |       v
               +--------+-+   +--+---------------+
               | DIM_ZONE |   |DIM_VIOLATION_TYPE|
               +----------+   +------------------+
```

### Fact Table:
* `FACT_VIOLATION`: Stores numerical measures (`violation_count`, `base_fine_amt`, `penalty_amt`, `total_fine_amt`, `observed_speed`).

### Dimension Tables:
* `DIM_DATE`: Date surrogate key (YYYYMMDD), day of week, quarter, year, weekend flags.
* `DIM_TIME`: Hour of day, peak hour classification.
* `DIM_VEHICLE`: Vehicle registration, class, make, fuel type.
* `DIM_CAMERA`: Camera code, type, direction.
* `DIM_ZONE`: Zone code, zone name, city name, risk level.
* `DIM_VIOLATION_TYPE`: Violation title, code, severity.
