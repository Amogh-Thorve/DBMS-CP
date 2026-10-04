# STVAMS Relational Algebra Operations & SQL Mapping

This document provides formal Relational Algebra expressions and their direct SQL equivalents across all major relational operations.

---

## 1. Selection ($\sigma$)

* **Relational Algebra:**
  $$\sigma_{\text{fuel\_type} = \text{'PETROL'} \land \text{vehicle\_class} = \text{'PRIVATE'}}(\text{VEHICLE})$$

* **Equivalent SQL:**
  ```sql
  SELECT * FROM VEHICLE 
  WHERE fuel_type = 'PETROL' AND vehicle_class = 'PRIVATE';
  ```

---

## 2. Projection ($\pi$)

* **Relational Algebra:**
  $$\pi_{\text{registration\_no, make, model}}(\text{VEHICLE})$$

* **Equivalent SQL:**
  ```sql
  SELECT registration_no, make, model FROM VEHICLE;
  ```

---

## 3. Cartesian Product ($\times$)

* **Relational Algebra:**
  $$\text{CITY} \times \text{VIOLATION\_TYPE}$$

* **Equivalent SQL:**
  ```sql
  SELECT * FROM CITY CROSS JOIN VIOLATION_TYPE;
  ```

---

## 4. Natural Join ($\bowtie$)

* **Relational Algebra:**
  $$\text{VEHICLE} \bowtie_{\text{owner\_id} = \text{owner\_id}} \text{OWNER}$$

* **Equivalent SQL:**
  ```sql
  SELECT * FROM VEHICLE v JOIN OWNER o ON v.owner_id = o.owner_id;
  ```

---

## 5. Union ($\cup$)

* **Relational Algebra:**
  $$\pi_{\text{registration\_no}}(\text{VEHICLE}) \cup \pi_{\text{license\_plate\_raw}}(\text{VEHICLE\_EVENT})$$

* **Equivalent SQL:**
  ```sql
  SELECT registration_no FROM VEHICLE
  UNION
  SELECT license_plate_raw FROM VEHICLE_EVENT WHERE license_plate_raw IS NOT NULL;
  ```

---

## 6. Set Difference ($-$) / MINUS

* **Relational Algebra:**
  $$\pi_{\text{registration\_no}}(\text{VEHICLE}) - \pi_{\text{license\_plate\_raw}}(\text{VEHICLE\_EVENT})$$

* **Equivalent SQL:**
  ```sql
  SELECT registration_no FROM VEHICLE
  MINUS
  SELECT license_plate_raw FROM VEHICLE_EVENT;
  ```

---

## 7. Aggregation ($\gamma$)

* **Relational Algebra:**
  $$_{\text{camera\_id}}\gamma_{\text{COUNT}(\text{event\_id}) \rightarrow \text{total\_events}, \text{AVG}(\text{observed\_speed}) \rightarrow \text{avg\_speed}}(\text{VEHICLE\_EVENT})$$

* **Equivalent SQL:**
  ```sql
  SELECT camera_id, COUNT(event_id) AS total_events, AVG(observed_speed) AS avg_speed
  FROM VEHICLE_EVENT
  GROUP BY camera_id;
  ```
