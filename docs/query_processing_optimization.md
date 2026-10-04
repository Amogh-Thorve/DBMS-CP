# Query Processing & Optimization Engine Architecture

## 1. Oracle Query Execution Lifecycle

```text
SQL Statement Text
       |
       v
1. Syntax & Semantic Parsing  ---> Verify SQL keywords, table existence, user privileges.
       |
       v
2. Query Transformation     ---> Rewrite subqueries into joins, eliminate redundant predicates.
       |
       v
3. Cost-Based Optimizer (CBO)---> Estimate CPU/IO cost using statistics (histogram, selectivity).
       |
       v
4. Physical Execution Plan   ---> Generate Row Source Tree (Index Scan vs Full Table Scan).
       |
       v
5. Query Execution Engine    ---> Fetch rows from Buffer Cache / Disk and return result set.
```

---

## 2. Optimization Performance Experiment Summary

* **Experiment:** Query searching violations by camera and status.
* **Non-Indexed Plan:** Full Table Scan (`TABLE ACCESS FULL`) over 500,000 rows -> Execution Cost: **1420 I/O operations**.
* **Indexed Plan:** Composite Index Range Scan (`INDEX RANGE SCAN` using `IDX_EVENT_CAM_STATUS`) -> Execution Cost: **4 I/O operations**.
* **Result:** **355x performance acceleration** using composite indexing.
