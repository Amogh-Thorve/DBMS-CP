-- ============================================================================
-- STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
-- File: 14_practical_queries.sql
-- Description: 30+ Comprehensive SQL Practical Queries Covering Entire DBMS Syllabus Requirements
-- Author: STVAMS Core Architecture Team
-- ============================================================================

-- Q1: WHERE with equality and AND operator
SELECT registration_no, make, model, fuel_type 
FROM VEHICLE 
WHERE fuel_type = 'PETROL' AND vehicle_class = 'PRIVATE';

-- Q2: WHERE with inequality (<>), OR, and NOT
SELECT camera_code, camera_type, status 
FROM CAMERA 
WHERE (camera_type = 'ANPR' OR camera_type = 'SPEED') AND NOT (status = 'DECOMMISSIONED');

-- Q3: Range search using BETWEEN ... AND
SELECT fine_id, violation_id, total_amount, due_date 
FROM FINE 
WHERE total_amount BETWEEN 1000.00 AND 5000.00;

-- Q4: Pattern matching using LIKE and NOT LIKE
SELECT owner_id, full_name, email, phone 
FROM OWNER 
WHERE email LIKE '%@example.com' AND full_name NOT LIKE 'Owner 1%';

-- Q5: List filtering using IN and NOT IN
SELECT vehicle_id, registration_no, fuel_type 
FROM VEHICLE 
WHERE fuel_type IN ('ELECTRIC', 'CNG', 'HYBRID');

-- Q6: Null checks using IS NULL and IS NOT NULL
SELECT violation_id, vehicle_id, officer_id, remarks 
FROM VIOLATION 
WHERE officer_id IS NOT NULL AND driver_id IS NULL;

-- Q7: String functions (UPPER, LOWER, LENGTH, CONCAT, SUBSTR)
SELECT 
    UPPER(full_name) AS upper_name,
    LOWER(email) AS lower_email,
    LENGTH(phone) AS phone_len,
    SUBSTR(national_id, 1, 5) AS id_prefix
FROM OWNER;

-- Q8: Date & Time functions (SYSDATE, MONTHS_BETWEEN, ADD_MONTHS, TRUNC, TO_CHAR)
SELECT 
    license_number,
    issue_date,
    expiry_date,
    ROUND(MONTHS_BETWEEN(expiry_date, SYSDATE), 1) AS months_remaining,
    TO_CHAR(issue_date, 'YYYY-Mon-DD') AS formatted_issue
FROM LICENSE;

-- Q9: Numeric functions (ROUND, TRUNC, MOD, ABS)
SELECT 
    event_id,
    observed_speed,
    ROUND(observed_speed, 0) AS rounded_speed,
    MOD(event_id, 2) AS even_odd_flag
FROM VEHICLE_EVENT;

-- Q10: Aggregate functions with GROUP BY and HAVING
SELECT 
    camera_id,
    COUNT(event_id) AS total_events,
    ROUND(AVG(observed_speed), 2) AS avg_speed,
    MAX(observed_speed) AS max_speed,
    MIN(observed_speed) AS min_speed
FROM VEHICLE_EVENT
GROUP BY camera_id
HAVING COUNT(event_id) > 5
ORDER BY total_events DESC;

-- Q11: SET OPERATOR - UNION (Distinct vehicles registered or involved in events)
SELECT registration_no FROM VEHICLE
UNION
SELECT license_plate_raw FROM VEHICLE_EVENT WHERE license_plate_raw IS NOT NULL;

-- Q12: SET OPERATOR - UNION ALL (All registrations including duplicates)
SELECT registration_no FROM VEHICLE
UNION ALL
SELECT license_plate_raw FROM VEHICLE_EVENT WHERE license_plate_raw IS NOT NULL;

-- Q13: SET OPERATOR - INTERSECT (Vehicles that have both active registration and recorded events)
SELECT registration_no FROM VEHICLE
INTERSECT
SELECT license_plate_raw FROM VEHICLE_EVENT;

-- Q14: SET OPERATOR - MINUS (Vehicles registered that have never had a camera event recorded)
SELECT registration_no FROM VEHICLE
MINUS
SELECT license_plate_raw FROM VEHICLE_EVENT;

-- Q15: Equijoin (Inner Join across VEHICLE and OWNER)
SELECT v.registration_no, v.make, v.model, o.full_name, o.phone
FROM VEHICLE v
INNER JOIN OWNER o ON v.owner_id = o.owner_id;

-- Q16: Left Outer Join (All Cameras, even those without registered maintenance)
SELECT c.camera_code, c.camera_type, cm.maintenance_date, cm.issue_description
FROM CAMERA c
LEFT OUTER JOIN CAMERA_MAINTENANCE cm ON c.camera_id = cm.camera_id;

-- Q17: Right Outer Join (All Officers and associated violations)
SELECT viol.violation_id, viol.violation_dt, off.badge_number, off.full_name
FROM VIOLATION viol
RIGHT OUTER JOIN OFFICER off ON viol.officer_id = off.officer_id;

-- Q18: Full Outer Join (All Owners and Drivers regardless of pairing)
SELECT o.full_name AS owner_name, d.full_name AS driver_name
FROM OWNER o
FULL OUTER JOIN DRIVER d ON o.owner_id = d.owner_id;

-- Q19: Non-Equijoin (Speeding penalty slab categorization)
SELECT ve.event_id, ve.observed_speed, r.speed_limit_kmh,
       (ve.observed_speed - r.speed_limit_kmh) AS excess_speed
FROM VEHICLE_EVENT ve
JOIN CAMERA c ON ve.camera_id = c.camera_id
JOIN ROAD_SEGMENT rs ON c.segment_id = rs.segment_id
JOIN ROAD r ON rs.road_id = r.road_id
WHERE ve.observed_speed > r.speed_limit_kmh;

-- Q20: Self Join (Finding Owners living in the same address/location)
SELECT o1.full_name AS owner_A, o2.full_name AS owner_B, o1.address
FROM OWNER o1
JOIN OWNER o2 ON o1.address = o2.address AND o1.owner_id <> o2.owner_id;

-- Q21: Single-Row Subquery (= operator)
SELECT registration_no, make, model
FROM VEHICLE
WHERE owner_id = (SELECT owner_id FROM OWNER WHERE national_id = 'NATID00000001');

-- Q22: Multi-Row Subquery using IN
SELECT registration_no, make
FROM VEHICLE
WHERE vehicle_id IN (
    SELECT vehicle_id FROM VIOLATION WHERE type_id = (SELECT type_id FROM VIOLATION_TYPE WHERE code = 'WRONG_SIDE')
);

-- Q23: Multi-Row Subquery using ANY
SELECT fine_id, total_amount
FROM FINE
WHERE total_amount > ANY (SELECT base_fine FROM VIOLATION_TYPE WHERE severity = 'MINOR');

-- Q24: Multi-Row Subquery using ALL
SELECT fine_id, total_amount
FROM FINE
WHERE total_amount >= ALL (SELECT base_fine FROM VIOLATION_TYPE WHERE severity = 'SEVERE');

-- Q25: Correlated Subquery with EXISTS
SELECT o.owner_id, o.full_name
FROM OWNER o
WHERE EXISTS (
    SELECT 1 FROM VEHICLE v 
    JOIN VIOLATION viol ON v.vehicle_id = viol.vehicle_id 
    WHERE v.owner_id = o.owner_id
);

-- Q26: Correlated Subquery with NOT EXISTS
SELECT o.owner_id, o.full_name
FROM OWNER o
WHERE NOT EXISTS (
    SELECT 1 FROM VEHICLE v WHERE v.owner_id = o.owner_id
);

-- Q27: Subquery in SELECT clause (Scalar Subquery)
SELECT 
    c.camera_code,
    c.camera_type,
    (SELECT COUNT(*) FROM VEHICLE_EVENT ve WHERE ve.camera_id = c.camera_id) AS total_events
FROM CAMERA c;

-- Q28: DML with Subquery (UPDATE based on subquery condition)
UPDATE FINE
SET status = 'OVERDUE'
WHERE violation_id IN (
    SELECT violation_id FROM VIOLATION WHERE violation_dt < SYSDATE - 60
) AND status = 'UNPAID';

-- Q29: DML with Subquery (DELETE based on subquery condition)
DELETE FROM CAMERA_MAINTENANCE
WHERE camera_id IN (
    SELECT camera_id FROM CAMERA WHERE status = 'DECOMMISSIONED'
);

-- Q30: Complex Analytical Query with Window Functions (DENSE_RANK)
SELECT 
    v.registration_no,
    COUNT(viol.violation_id) AS total_violations,
    DENSE_RANK() OVER (ORDER BY COUNT(viol.violation_id) DESC) AS rank_in_city
FROM VEHICLE v
JOIN VIOLATION viol ON v.vehicle_id = viol.vehicle_id
GROUP BY v.registration_no;
