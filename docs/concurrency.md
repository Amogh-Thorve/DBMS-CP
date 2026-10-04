# STVAMS Concurrency Control & Serializability

## 1. Locks & Lock Compatibility Matrix

| Lock Type | Shared (S) | Exclusive (X) |
|---|---|---|
| **Shared (S)** | Granted | Blocked |
| **Exclusive (X)** | Blocked | Blocked |

* **Shared Lock (S):** Acquired during `SELECT` queries for reading fine amounts.
* **Exclusive Lock (X):** Acquired during `UPDATE FINE` or `PROCESS_PAYMENT` execution.

---

## 2. Two-Phase Locking (2PL) Protocol

Strict Two-Phase Locking (Strict 2PL) is enforced by Oracle:
1. **Growing Phase:** Transaction acquires all necessary row-level exclusive locks during `FOR UPDATE`.
2. **Shrinking Phase:** All locks are held until the transaction finishes and releases them simultaneously upon `COMMIT` or `ROLLBACK`.

---

## 3. Conflict Serializability & Precedence Graph

Consider two concurrent transactions:
* **T1 (Officer A):** Approves appeal and waives Fine #10.
* **T2 (Payment Operator B):** Attempts to process payment for Fine #10.

### Schedule $S$:
$$T_1: R(F_{10}), T_2: R(F_{10}), T_1: W(F_{10}), T_2: W(F_{10})$$

### Precedence Graph:
```text
(T1) ---- [W(F10) -> W(F10)] ----> (T2)
```

Because the precedence graph contains no cycles, Schedule $S$ is **Conflict Serializable** equivalent to serial order $T_1 \rightarrow T_2$.
