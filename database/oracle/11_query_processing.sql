-- ============================================================================
-- STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
-- File: 11_query_processing.sql
-- Description: Oracle Query Processing Mechanics & EXPLAIN PLAN Analysis
-- Author: STVAMS Core Architecture Team
-- ============================================================================

-- Query Processing Phases in Oracle:
-- 1. Syntax & Semantic Parsing
-- 2. Logical Query Transformation & Optimization (CBO)
-- 3. Execution Plan Generation
-- 4. Physical Row Source Execution

EXPLAIN PLAN FOR
SELECT v.registration_no, o.full_name, COUNT(viol.violation_id) AS total_violations
FROM VEHICLE v
JOIN OWNER o ON v.owner_id = o.owner_id
JOIN VIOLATION viol ON v.vehicle_id = viol.vehicle_id
WHERE viol.violation_dt >= SYSDATE - 30
GROUP BY v.registration_no, o.full_name;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
