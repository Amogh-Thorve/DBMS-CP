# STVAMS Transaction Management & ACID Principles

## 1. ACID Properties Breakdown

In STVAMS, transaction processing is centered around the **Fine Payment Workflow**:

### A - Atomicity ("All or Nothing")
* **Requirement:** Paying a fine involves inserting a record into `PAYMENT`, updating `FINE.status = 'PAID'`, and updating `VIOLATION.status = 'PAID'`.
* **Implementation:** Wrapped inside a single PL/SQL procedure `PROCESS_PAYMENT` with `SAVEPOINT` and `ROLLBACK`. If any step fails (e.g. database disconnect during fine update), all partial updates are reverted.

### C - Consistency
* **Requirement:** Database state transitions from one valid state satisfying all constraints to another.
* **Implementation:** Foreign keys, check constraints (`CHECK (payment_amount > 0)`), and state validation rules prevent paying already-settled fines or overpaying fine totals.

### I - Isolation
* **Requirement:** Concurrent execution of payment transactions must yield the same result as executing them serially.
* **Implementation:** Handled via Oracle `SELECT ... FOR UPDATE` row locks preventing lost updates when two operators process payment for the same fine simultaneously.

### D - Durability
* **Requirement:** Once a transaction is committed, its changes survive system crashes.
* **Implementation:** Oracle Redo Log Buffer and LGWR process write transaction changes to physical Redo Log Files prior to `COMMIT` completion.

---

## 2. Transaction State Machine

```text
       +------------+
       |   ACTIVE   |
       +-----+------+
             |
             v
   +-------------------+
   | PARTIALLY COMMITTED|
   +---------+---------+
             |
       +-----+-----+
       |           |
       v           v
  +----------+ +--------+
  | COMMITTED| | FAILED |
  +----------+ +---+----+
                   |
                   v
              +---------+
              | ABORTED |
              +---------+
```

1. **Active:** Initial state while executing procedure statements.
2. **Partially Committed:** Final statement executed; changes in memory buffers.
3. **Committed:** Redo logs flushed to disk; `COMMIT` successful.
4. **Failed:** Error detected during validation or lock acquisition.
5. **Aborted:** `ROLLBACK` executed; database restored to pre-transaction state.
