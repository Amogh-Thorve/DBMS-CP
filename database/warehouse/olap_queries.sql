-- ============================================================================
-- STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
-- File: olap_queries.sql
-- Description: Analytical OLAP Queries Demonstrating Roll-Up, Drill-Down, Slice, Dice & ROLLUP/CUBE
-- Author: STVAMS Core Architecture Team
-- ============================================================================

-- 1. ROLL-UP Operation (Aggregating from Month level up to Year & City level)
SELECT 
    d.year,
    z.city_name,
    COUNT(fv.fact_id) AS total_violations,
    SUM(fv.total_fine_amt) AS total_revenue
FROM FACT_VIOLATION fv
JOIN DIM_DATE d ON fv.date_key = d.date_key
JOIN DIM_ZONE z ON fv.zone_sk = z.zone_sk
GROUP BY d.year, z.city_name;

-- 2. DRILL-DOWN Operation (Moving from Zone summary down to Specific Road/Camera & Hour level)
SELECT 
    z.zone_name,
    c.camera_code,
    t.hour_24,
    COUNT(fv.fact_id) AS violation_count,
    AVG(fv.observed_speed) AS avg_speed
FROM FACT_VIOLATION fv
JOIN DIM_ZONE z ON fv.zone_sk = z.zone_sk
JOIN DIM_CAMERA c ON fv.camera_sk = c.camera_sk
JOIN DIM_TIME t ON fv.time_key = t.time_key
WHERE z.zone_code = 'Z-MUM-01'
GROUP BY z.zone_name, c.camera_code, t.hour_24
ORDER BY t.hour_24;

-- 3. SLICE Operation (Filtering single dimension value: e.g., Only MORNING_PEAK violations)
SELECT 
    z.zone_name,
    vt.title AS violation_type,
    SUM(fv.total_fine_amt) AS total_fines
FROM FACT_VIOLATION fv
JOIN DIM_TIME t ON fv.time_key = t.time_key
JOIN DIM_ZONE z ON fv.zone_sk = z.zone_sk
JOIN DIM_VIOLATION_TYPE vt ON fv.type_sk = vt.type_sk
WHERE t.time_of_day = 'MORNING_PEAK'
GROUP BY z.zone_name, vt.title;

-- 4. DICE Operation (Sub-cube filtering across multiple dimensions: High Risk Zones + Overspeeding + Weekend)
SELECT 
    z.city_name,
    z.zone_name,
    vt.title,
    COUNT(fv.fact_id) AS incident_count
FROM FACT_VIOLATION fv
JOIN DIM_ZONE z ON fv.zone_sk = z.zone_sk
JOIN DIM_VIOLATION_TYPE vt ON fv.type_sk = vt.type_sk
JOIN DIM_DATE d ON fv.date_key = d.date_key
WHERE z.risk_level IN ('HIGH', 'CRITICAL')
  AND vt.code = 'SPEED_01'
  AND d.is_weekend = 1
GROUP BY z.city_name, z.zone_name, vt.title;

-- 5. ROLLUP Extension Query (Hierarchy Subtotals)
SELECT 
    z.city_name,
    z.zone_name,
    SUM(fv.total_fine_amt) AS fine_sum
FROM FACT_VIOLATION fv
JOIN DIM_ZONE z ON fv.zone_sk = z.zone_sk
GROUP BY ROLLUP (z.city_name, z.zone_name);

-- 6. CUBE Extension Query (Cross-Dimensional Aggregations)
SELECT 
    z.city_name,
    vt.severity,
    COUNT(fv.fact_id) AS total_cases
FROM FACT_VIOLATION fv
JOIN DIM_ZONE z ON fv.zone_sk = z.zone_sk
JOIN DIM_VIOLATION_TYPE vt ON fv.type_sk = vt.type_sk
GROUP BY CUBE (z.city_name, vt.severity);
