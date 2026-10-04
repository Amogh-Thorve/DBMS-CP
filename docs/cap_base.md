# CAP Theorem & BASE Consistency Analysis in STVAMS

## 1. CAP Theorem Trade-Offs

The CAP theorem states that a distributed system can simultaneously provide at most two out of three guarantees:

```text
       Consistency (C)
            / \
           /   \
          /  *  \
         /       \
Availability (A)---Partition Tolerance (P)
```

### Database Trade-offs in STVAMS:
1. **Oracle RDBMS (CA System):**
   * Prioritizes **Consistency** and **Availability** for financial transactions (fines, payments, vehicle legal status). Under network partitions, partition isolation preserves ACID consistency.
2. **MongoDB Camera Event Ingestion (AP System):**
   * Prioritizes **Availability** and **Partition Tolerance**. High-frequency camera detection events continue writing to local Mongo replicas even during temporary network splits.

---

## 2. BASE Consistency Model

Unlike ACID, MongoDB evidence storage operates on BASE principles:
* **Basically Available:** High availability achieved via MongoDB Replica Set primary/secondary election.
* **Soft State:** Event documents store raw unverified AI detection data subject to change during manual officer verification.
* **Eventually Consistent:** Evidence records background-sync across search nodes and analytical data lakes.
