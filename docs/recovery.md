# STVAMS Database Recovery Techniques & Crash Resilience

## 1. Recovery Architecture Components

* **Write-Ahead Logging (WAL):** Oracle DB logs all modifications into Redo Log Buffers before writing dirty blocks to disk files (`.dbf`).
* **Checkpoints (CKPT):** Periodic events synchronizing modified dirty memory buffers (Buffer Cache) to datafiles on disk, recording Checkpoint SCN (System Change Number) in control files.

---

## 2. Recovery Algorithms (UNDO / REDO)

When a failure occurs (e.g. power failure during payment processing):

```text
[Crash SCN]
    |
    v
1. Analysis Phase   ---> Inspect Redo Logs from last Checkpoint SCN.
2. REDO Phase (Roll-Forward) ---> Replay all committed transactions to restore memory state.
3. UNDO Phase (Roll-Back)   ---> Rollback uncommitted active transactions using Undo Segments.
```

* **REDO:** Ensures Durability for committed transactions.
* **UNDO:** Ensures Atomicity by removing uncommitted changes.
