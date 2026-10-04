# STVAMS Relational Normalization & Functional Dependency Analysis

This document presents a step-by-step mathematical and relational normalization demonstration of the STVAMS database schema from Unnormalized Form (UNF) down to Boyce-Codd Normal Form (BCNF) and 4th Normal Form (4NF).

---

## 1. Functional Dependencies (FD Set F)

Consider the comprehensive Traffic Violation Relation:
`TRAFFIC_VIOLATION_UNF(reg_no, owner_name, owner_email, owner_phone, vehicle_make, vehicle_model, camera_code, location, viol_type_code, viol_title, base_fine, viol_date, fine_status, payment_txn_ref)`

### Candidate Functional Dependencies (F):
1. `reg_no -> owner_name, owner_email, owner_phone, vehicle_make, vehicle_model`
2. `owner_email -> owner_name, owner_phone`
3. `camera_code -> location`
4. `viol_type_code -> viol_title, base_fine`
5. `(reg_no, camera_code, viol_date) -> viol_type_code, fine_status`
6. `payment_txn_ref -> fine_status, reg_no, viol_date`

---

## 2. Armstrong's Inference Rules & Proofs

Armstrong's Axioms are used to compute the closure set of functional dependencies $F^+$:

1. **Reflexivity:** If $Y \subseteq X$, then $X \rightarrow Y$.
   * *Proof:* `{reg_no, owner_name} -> reg_no`.
2. **Augmentation:** If $X \rightarrow Y$, then $XZ \rightarrow YZ$.
   * *Proof:* Given `camera_code -> location`, then `{camera_code, viol_date} -> {location, viol_date}`.
3. **Transitivity:** If $X \rightarrow Y$ and $Y \rightarrow Z$, then $X \rightarrow Z$.
   * *Proof:* Given `reg_no -> owner_email` and `owner_email -> owner_phone`, by transitivity `reg_no -> owner_phone`.

---

## 3. Attribute Closure Algorithm & Candidate Keys

To find candidate keys for `TRAFFIC_VIOLATION_UNF`:

Compute Closure `{reg_no, camera_code, viol_date}^+`:
1. Start with $X^{(0)} = \{\text{reg\_no, camera\_code, viol\_date}\}$.
2. Using FD 1: Add `owner_name, owner_email, owner_phone, vehicle_make, vehicle_model`.
3. Using FD 3: Add `location`.
4. Using FD 5: Add `viol_type_code, fine_status`.
5. Using FD 4: Add `viol_title, base_fine`.
6. $X^+ = \text{All Attributes in Relation}$.

**Conclusion:** Composite Key `(reg_no, camera_code, viol_date)` is a Candidate Key.

---

## 4. Minimal Cover (Canonical Cover)

A minimal cover $F_m$ for $F$ is obtained by:
1. Converting RHS of FDs to singletons.
2. Removing extraneous attributes from LHS.
3. Removing redundant FDs.

**Minimal Cover $F_m$:**
* `reg_no -> owner_name`
* `reg_no -> owner_email`
* `reg_no -> vehicle_make`
* `owner_email -> owner_phone`
* `camera_code -> location`
* `viol_type_code -> base_fine`
* `(reg_no, camera_code, viol_date) -> viol_type_code`

---

## 5. Step-by-Step Normalization

### Unnormalized Form (UNF)
Contains repeating groups of violations per vehicle and non-atomic address strings.

### 1st Normal Form (1NF)
* **Requirement:** All attribute values must be atomic; no repeating groups.
* **Transformation:** Multi-valued phone numbers and repeated violation entries are flattened into distinct tuples.

### 2nd Normal Form (2NF)
* **Requirement:** Must be in 1NF and no non-prime attribute is partially dependent on any candidate key.
* **Partial Dependency Identified:** `(reg_no, camera_code, viol_date) -> vehicle_make` is violated because `reg_no -> vehicle_make` (partial key dependency).
* **Decomposition:**
  * `R1_VEHICLE(reg_no, owner_email, vehicle_make, vehicle_model)`
  * `R2_CAMERA(camera_code, location)`
  * `R3_VIOLATION(reg_no, camera_code, viol_date, viol_type_code)`

### 3rd Normal Form (3NF)
* **Requirement:** Must be in 2NF and no non-prime attribute is transitively dependent on a candidate key.
* **Transitive Dependency Identified:** In `R1_VEHICLE`: `reg_no -> owner_email` and `owner_email -> owner_phone`.
* **Decomposition:**
  * `R1a_OWNER(owner_email, owner_name, owner_phone)`
  * `R1b_VEHICLE(reg_no, owner_email, vehicle_make, vehicle_model)`

### Boyce-Codd Normal Form (BCNF)
* **Requirement:** For every non-trivial functional dependency $X \rightarrow Y$, $X$ must be a superkey.
* All decomposed relations in STVAMS satisfy BCNF.

---

## 6. 4th Normal Form (4NF) & Multivalued Dependencies (MVD)

* **Definition:** A relation is in 4NF if for every non-trivial MVD $X \twoheadrightarrow Y$, $X$ is a superkey.
* **Scenario:** Consider `VEHICLE_PERMIT_DRIVER(reg_no, permit_type, driver_name)` where a vehicle has multiple independent permits and multiple authorized drivers.
* **MVD:** `reg_no ->> permit_type` and `reg_no ->> driver_name`.
* **4NF Decomposition:**
  * `VEHICLE_PERMITS(reg_no, permit_type)`
  * `VEHICLE_DRIVERS(reg_no, driver_name)`

---

## 7. Decomposition Properties Verification

1. **Lossless-Join Guarantee:** $R_1 \cap R_2 \rightarrow R_1$ or $R_1 \cap R_2 \rightarrow R_2$.
   * `R1b_VEHICLE` $\cap$ `R1a_OWNER` = `{owner_email}`, which is the primary key of `OWNER`. Hence, the join is lossless.
2. **Dependency Preservation:** Every FD in $F$ is present in $\pi_{R1}(F) \cup \pi_{R2}(F) \dots$
   * All FDs in $F_m$ are preserved across the decomposed table schemas.
