# Data Interoperation & Multi-Engine Integration

## Polyglot Persistence Data Flow

STVAMS uses a Polyglot Persistence architecture combining relational, document, search, columnar, and big-data storage.

```text
               +-----------------------+
               |  Oracle RDBMS Core    |
               | (Authoritative ACID)  |
               +-----------+-----------+
                           |
       +-------------------+-------------------+
       |                   |                   |
       v                   v                   v
+--------------+   +---------------+   +---------------+
| MongoDB Doc  |   | Elasticsearch |   |  Apache       |
| Store        |   | Search Index  |   |  Parquet      |
| (Raw Events) |   | (Fast Search) |   | (Columnar)    |
+--------------+   +---------------+   +-------+-------+
                                               |
                                               v
                                       +---------------+
                                       |  Hadoop HDFS  |
                                       |  / MapReduce  |
                                       +---------------+
```

## Integration Pipelines:
1. **Oracle -> MongoDB:** Synced via background event listeners linking `event_id` to `mongo_doc_id`.
2. **Oracle -> Elasticsearch:** Search indexing pipeline ingesting violation records for sub-second text searching.
3. **Oracle -> Parquet:** `parquet_export.py` converting relational rows into compressed columnar files.
4. **Parquet -> HDFS:** Distributed file system loading for MapReduce batch execution.
