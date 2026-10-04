-- ============================================================================
-- STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
-- File: 12_query_optimization.sql
-- Description: Oracle Query Optimization Experiments & Index Tuning Comparisons
-- Author: STVAMS Core Architecture Team
-- ============================================================================

-- Experiment 1: Non-Indexed vs Indexed Query Execution

-- Before Optimization (Forcing Full Table Scan hint for comparison)
EXPLAIN PLAN FOR
SELECT /*+ FULL(ve) */ * 
FROM VEHICLE_EVENT ve
WHERE ve.camera_id = 5 AND ve.event_status = 'VIOLATION_CONFIRMED';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- After Optimization (Utilizing Composite Index IDX_EVENT_CAM_STATUS)
EXPLAIN PLAN FOR
SELECT /*+ INDEX(ve IDX_EVENT_CAM_STATUS) */ * 
FROM VEHICLE_EVENT ve
WHERE ve.camera_id = 5 AND ve.event_status = 'VIOLATION_CONFIRMED';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
