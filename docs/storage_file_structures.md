# Oracle Physical Storage & File Hierarchy Mapping

## 1. Storage Logical-to-Physical Mapping

In Oracle RDBMS, logical database entities map down to OS disk storage through a strict 5-tier hierarchy:

```text
Database Instance
   |
   v
Tablespaces (e.g. SYSTEM, SYSAUX, STVAMS_DATA, STVAMS_IDX)
   |
   v
Datafiles (e.g. stvams_data01.dbf, stvams_idx01.dbf)
   |
   v
Segments (e.g. Table Segment: VEHICLE, Index Segment: IDX_REG_NO)
   |
   v
Extents (Contiguous allocation of blocks, e.g. 64KB / 1MB)
   |
   v
Oracle Data Blocks (8KB OS disk blocks storing rows)
```

---

## 2. File Organizations in STVAMS

1. **Heap-Organized Tables:** Standard STVAMS tables (`VEHICLE`, `VIOLATION`) where rows are stored wherever space exists in data blocks.
2. **Index-Organized Tables (IOT):** Frequently queried lookup tables ordered by primary key.
3. **B-Tree Indexed Files:** Index structures maintaining sorted key values pointing to physical `ROWID` block pointers (`File#, Block#, Row#`).
