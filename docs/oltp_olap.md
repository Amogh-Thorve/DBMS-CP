# Operational (OLTP) vs Analytical (OLAP) Systems Comparison

| Feature | OLTP System (Oracle Database) | OLAP System (Data Warehouse) |
|---|---|---|
| **Primary Purpose** | Operational traffic management, fine issuance & payment transactions | Strategic decision support, traffic trend analysis, hotspot detection |
| **Data Workload** | High volume of short, atomic `INSERT`, `UPDATE`, `DELETE` operations | Complex read-heavy queries aggregating historical multi-year records |
| **Database Design** | Normalized 3NF / BCNF Relational Schema (22 entities) | De-normalized Star Schema (Central Fact + Dimensions) |
| **Data Currency** | Real-time current operational data state | Historical periodic snapshots loaded via batch ETL pipelines |
| **Query Complexity** | Simple single-row lookups (`SELECT * FROM FINE WHERE fine_id = ?`) | Aggregations with `GROUP BY ROLLUP`, `CUBE`, window functions |
| **Indexing** | Selective B-Tree indexes on Primary/Foreign Keys | Bit-map indexes, columnar Parquet indexes, dimension surrogate keys |
| **Response Time** | Milliseconds (< 10ms) | Seconds to minutes for multi-terabyte queries |
| **Users** | Traffic Officers, Payment Operators, Vehicle Owners | Traffic Commissioners, Urban Planners, Data Analysts |
