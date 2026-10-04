# STVAMS Big Data & HDFS Architecture

## Distributed Storage Layout
In STVAMS, historical camera detection streams and Parquet datasets are exported to HDFS for large-scale distributed analytics.

```text
/stvams/
├── raw_events/
│   └── year=2026/
│       └── month=09/
│           ├── events_part_001.parquet
│           └── events_part_002.parquet
├── warehouse/
│   ├── fact_violation/
│   └── dim_vehicle/
└── mapreduce_output/
    ├── zone_violations/
    ├── hourly_speed_avg/
    └── repeat_offenders/
```

## HDFS Commands Reference
```bash
# Initialize Directory Structure
hdfs dfs -mkdir -p /stvams/raw_events/2026/09
hdfs dfs -mkdir -p /stvams/mapreduce_output

# Copy Parquet Export Data to HDFS
hdfs dfs -put ../../data/parquet/events.parquet /stvams/raw_events/2026/09/

# Verify HDFS Replication and Data Nodes
hdfs dfsadmin -report
```
