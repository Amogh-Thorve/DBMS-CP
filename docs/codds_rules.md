# Codd's 12 Rules Compliance in STVAMS (Oracle RDBMS Implementation)

Dr. Edgar F. Codd defined 13 rules (numbered 0 to 12) that a database management system must satisfy to be considered a true Relational Database Management System (RDBMS). Below is the comprehensive evaluation of how Oracle RDBMS in STVAMS complies with every rule.

---

### Rule 0: The Foundation Rule
> **Rule:** The system must qualify as a relational database, system, and management system using its relational facilities exclusively.

* **STVAMS Implementation:** All operational data (Vehicles, Owners, Violations, Fines, Payments, Appeals) is strictly managed using standard SQL/PLSQL relational engine primitives without bypassing relational access controls.

---

### Rule 1: Information Representation
> **Rule:** All information in the database is represented explicitly at the logical level and in exactly one way — by values in tables.

* **STVAMS Implementation:** Every data element (e.g. `registration_no`, `fine_id`, `payment_status`) exists strictly as scalar values inside rows and columns of named tables (`VEHICLE`, `FINE`, `PAYMENT`). Metadata is stored in data dictionary tables (`USER_TABLES`, `USER_CONSTRAINTS`).

---

### Rule 2: Guaranteed Access Rule
> **Rule:** Every individual datum (atomic value) in the database is guaranteed to be logically accessible by providing a combination of table name, primary key value, and column name.

* **STVAMS Implementation:** Any fine total amount is uniquely retrievable via: `Table: FINE`, `Primary Key: fine_id = 100`, `Column: total_amount`.

---

### Rule 3: Systematic Treatment of Null Values
> **Rule:** Null values (distinct from empty character string or string of blank characters and distinct from zero or any other number) are supported in fully relational DBMS for representing missing information and inapplicable information in a systematic way.

* **STVAMS Implementation:** Unassigned drivers or unreviewed violations store explicit `NULL` state in `officer_id` and `driver_id` columns, correctly evaluated via SQL `IS NULL` and `IS NOT NULL` operators.

---

### Rule 4: Dynamic On-line Catalog Based on the Relational Model
> **Rule:** The database description is represented at the logical level in the same way as ordinary data, so that authorized users can apply the same relational language to its interrogation as they apply to regular data.

* **STVAMS Implementation:** Schema dictionary meta-views (such as `USER_TABLES`, `USER_TAB_COLUMNS`, `USER_CONSTRAINTS`) are queried using standard SQL `SELECT` statements.

---

### Rule 5: Comprehensive Data Sublanguage Rule
> **Rule:** A relational system may support several languages and various modes of terminal use. However, there must be at least one language whose statements are expressible in some well-defined syntax as character strings and that is comprehensive in supporting DDL, DML, DCL, and TCL.

* **STVAMS Implementation:** Oracle SQL serves as the comprehensive sublanguage supporting:
  * **DDL:** `CREATE TABLE`, `ALTER TABLE`
  * **DML:** `INSERT`, `UPDATE`, `DELETE`, `SELECT`
  * **DCL:** `GRANT`, `REVOKE`
  * **TCL:** `COMMIT`, `ROLLBACK`, `SAVEPOINT`

---

### Rule 6: View Updating Rule
> **Rule:** All views that are theoretically updatable are also updatable by the system.

* **STVAMS Implementation:** Simple views defined on single primary key tables (e.g., `VW_ACTIVE_OFFICERS`) are directly updatable. Complex multi-table views (e.g., `VW_OWNER_VEHICLE_MINIMAL`) utilize PL/SQL `INSTEAD OF` triggers (`TRG_VW_OWNER_VEHICLE_UPDATE`) to handle complex update dispatching.

---

### Rule 7: High-level Insert, Update, and Delete
> **Rule:** The capability of handling a base relation or a derived relation as a single operand applies not only to the retrieval of data but also to the insertion, update, and deletion of data.

* **STVAMS Implementation:** Set-level DML updates (e.g., bulk fine penalty assignment `UPDATE FINE SET penalty_amount = base_amount * 0.10 WHERE due_date < SYSDATE`) manipulate entire sets of rows in a single operation.

---

### Rule 8: Physical Data Independence
> **Rule:** Application programs and terminal activities remain logically unimpaired whenever any changes are made in either storage representations or access methods.

* **STVAMS Implementation:** Adding B-Tree indexes (`IDX_VIOLATION_VEHICLE_ID`) or moving tables across Oracle Tablespaces (`DATA_TS` vs `INDEX_TS`) requires zero changes to application SQL queries or FastAPI backend code.

---

### Rule 9: Logical Data Independence
> **Rule:** Application programs and terminal activities remain logically unimpaired when information-preserving changes of any kind that theoretically permit unimpairment are made to the base tables.

* **STVAMS Implementation:** Views decouple API endpoints from table layout changes. Adding new non-null columns or expanding secondary relationships does not break existing view abstractions.

---

### Rule 10: Integrity Independence
> **Rule:** Integrity constraints specific to a particular relational database must be definable in the relational data sublanguage and stored in the catalog, not in the application programs.

* **STVAMS Implementation:** All domain rules (Primary Keys, Foreign Keys, `CHECK (speed_limit_kmh > 0)`, `UNIQUE (registration_no)`) are enforced directly inside the Oracle Database Engine via catalog constraints.

---

### Rule 11: Distribution Independence
> **Rule:** The data manipulation sublanguage of a relational DBMS must enable application programs and terminal activities to remain logically unimpaired whether and how the data is physically distributed.

* **STVAMS Implementation:** Whether data is located on a single database instance or distributed across regional traffic nodes via database links/heterogeneous services, SQL statements remain identical.

---

### Rule 12: Nonsubversion Rule
> **Rule:** If a relational system has a low-level (single-record-at-a-time) language, that low-level cannot be used to subvert or bypass the integrity rules and constraints expressed in the higher-level relational language.

* **STVAMS Implementation:** Low-level procedural PL/SQL code cannot bypass database constraints (`CHECK`, `FOREIGN KEY`); constraint violations instantly trigger exception handling and abort execution.
