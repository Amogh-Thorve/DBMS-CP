-- ============================================================================
-- STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
-- File: 04_views.sql
-- Description: Oracle Views Implementation (Simple, Updatable, Aggregate & INSTEAD OF Triggers)
-- Author: STVAMS Core Architecture Team
-- ============================================================================

-- 1. VW_VEHICLE_VIOLATION_SUMMARY (Aggregate Multi-Table View)
CREATE OR REPLACE VIEW VW_VEHICLE_VIOLATION_SUMMARY AS
SELECT 
    v.vehicle_id,
    v.registration_no,
    o.full_name AS owner_name,
    o.phone AS owner_phone,
    COUNT(v1.violation_id) AS total_violations,
    NVL(SUM(f.total_amount), 0) AS total_fine_amount,
    SUM(CASE WHEN f.status IN ('UNPAID', 'OVERDUE') THEN f.total_amount ELSE 0 END) AS pending_fine_amount
FROM VEHICLE v
JOIN OWNER o ON v.owner_id = o.owner_id
LEFT JOIN VIOLATION v1 ON v.vehicle_id = v1.vehicle_id
LEFT JOIN FINE f ON v1.violation_id = f.violation_id
GROUP BY v.vehicle_id, v.registration_no, o.full_name, o.phone;

-- 2. VW_PENDING_FINES (Filtered Action View)
CREATE OR REPLACE VIEW VW_PENDING_FINES AS
SELECT 
    f.fine_id,
    f.violation_id,
    v.registration_no,
    o.full_name AS owner_name,
    o.email AS owner_email,
    vt.title AS violation_type,
    f.total_amount,
    f.issue_date,
    f.due_date,
    f.status
FROM FINE f
JOIN VIOLATION viol ON f.violation_id = viol.violation_id
JOIN VEHICLE v ON viol.vehicle_id = v.vehicle_id
JOIN OWNER o ON v.owner_id = o.owner_id
JOIN VIOLATION_TYPE vt ON viol.type_id = vt.type_id
WHERE f.status IN ('UNPAID', 'OVERDUE');

-- 3. VW_CAMERA_PERFORMANCE (Operational Analytics View)
CREATE OR REPLACE VIEW VW_CAMERA_PERFORMANCE AS
SELECT 
    c.camera_id,
    c.camera_code,
    c.camera_type,
    z.zone_name,
    COUNT(ve.event_id) AS total_detections,
    SUM(CASE WHEN ve.event_status = 'VIOLATION_CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_violations,
    ROUND(AVG(ve.ai_confidence), 2) AS avg_ai_confidence
FROM CAMERA c
JOIN ROAD_SEGMENT rs ON c.segment_id = rs.segment_id
JOIN ROAD r ON rs.road_id = r.road_id
JOIN TRAFFIC_ZONE z ON r.zone_id = z.zone_id
LEFT JOIN VEHICLE_EVENT ve ON c.camera_id = ve.camera_id
GROUP BY c.camera_id, c.camera_code, c.camera_type, z.zone_name;

-- 4. VW_TRAFFIC_HOTSPOTS (High-Risk Zone Analytics View)
CREATE OR REPLACE VIEW VW_TRAFFIC_HOTSPOTS AS
SELECT 
    z.zone_id,
    z.zone_code,
    z.zone_name,
    ct.city_name,
    z.risk_level,
    COUNT(viol.violation_id) AS violation_count,
    NVL(SUM(f.total_amount), 0) AS total_fines_levied
FROM TRAFFIC_ZONE z
JOIN CITY ct ON z.city_id = ct.city_id
JOIN ROAD r ON z.zone_id = r.zone_id
JOIN ROAD_SEGMENT rs ON r.road_id = rs.road_id
JOIN CAMERA c ON rs.segment_id = c.segment_id
LEFT JOIN VIOLATION viol ON c.camera_id = viol.camera_id
LEFT JOIN FINE f ON viol.violation_id = f.violation_id
GROUP BY z.zone_id, z.zone_code, z.zone_name, ct.city_name, z.risk_level;

-- 5. VW_OFFICER_CASES (Officer Activity View)
CREATE OR REPLACE VIEW VW_OFFICER_CASES AS
SELECT 
    off.officer_id,
    off.badge_number,
    off.full_name AS officer_name,
    COUNT(viol.violation_id) AS reviewed_violations,
    COUNT(ar.review_id) AS reviewed_appeals
FROM OFFICER off
LEFT JOIN VIOLATION viol ON off.officer_id = viol.officer_id
LEFT JOIN APPEAL_REVIEW ar ON off.officer_id = ar.officer_id
GROUP BY off.officer_id, off.badge_number, off.full_name;

-- 6. Simple Updatable View Demonstration & Restrictions
-- View on single base table with primary key
CREATE OR REPLACE VIEW VW_ACTIVE_OFFICERS AS
SELECT officer_id, badge_number, full_name, rank_title, phone, email, status
FROM OFFICER
WHERE status = 'ACTIVE'
WITH CHECK OPTION;

-- 7. INSTEAD OF Trigger Demonstration for Multi-Table View Updates
CREATE OR REPLACE VIEW VW_OWNER_VEHICLE_MINIMAL AS
SELECT 
    o.owner_id,
    o.full_name AS owner_name,
    o.email,
    v.vehicle_id,
    v.registration_no,
    v.status AS vehicle_status
FROM OWNER o
JOIN VEHICLE v ON o.owner_id = v.owner_id;

CREATE OR REPLACE TRIGGER TRG_VW_OWNER_VEHICLE_UPDATE
INSTEAD OF UPDATE ON VW_OWNER_VEHICLE_MINIMAL
FOR EACH ROW
BEGIN
    UPDATE OWNER
    SET email = :NEW.email
    WHERE owner_id = :OLD.owner_id;

    UPDATE VEHICLE
    SET status = :NEW.vehicle_status
    WHERE vehicle_id = :OLD.vehicle_id;
END;
/
