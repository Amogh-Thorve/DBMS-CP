-- ============================================================================
-- STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
-- File: 07_functions.sql
-- Description: Reusable Oracle PL/SQL User-Defined Functions
-- Author: STVAMS Core Architecture Team
-- ============================================================================

-- 1. CALCULATE_FINE Function (Dynamic Speeding / Multiplier Calculation)
CREATE OR REPLACE FUNCTION CALCULATE_FINE (
    p_type_id       IN NUMBER,
    p_observed_speed IN NUMBER,
    p_speed_limit   IN NUMBER
) RETURN NUMBER IS
    v_base NUMBER(10,2);
    v_excess NUMBER;
    v_final  NUMBER(10,2);
BEGIN
    SELECT base_fine INTO v_base FROM VIOLATION_TYPE WHERE type_id = p_type_id;

    IF p_observed_speed IS NOT NULL AND p_speed_limit IS NOT NULL AND p_observed_speed > p_speed_limit THEN
        v_excess := p_observed_speed - p_speed_limit;
        IF v_excess > 40 THEN
            v_final := v_base * 2.5; -- Double penalty for severe speeding
        ELSIF v_excess > 20 THEN
            v_final := v_base * 1.5;
        ELSE
            v_final := v_base;
        END IF;
    ELSE
        v_final := v_base;
    END IF;

    RETURN v_final;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 1000.00; -- Default fallback
END;
/

-- 2. GET_TOTAL_UNPAID_FINE Function
CREATE OR REPLACE FUNCTION GET_TOTAL_UNPAID_FINE (
    p_vehicle_id IN NUMBER
) RETURN NUMBER IS
    v_total NUMBER(10,2) := 0;
BEGIN
    SELECT NVL(SUM(f.total_amount), 0)
    INTO v_total
    FROM FINE f
    JOIN VIOLATION v ON f.violation_id = v.violation_id
    WHERE v.vehicle_id = p_vehicle_id
      AND f.status IN ('UNPAID', 'OVERDUE', 'PARTIALLY_PAID');

    RETURN v_total;
END;
/

-- 3. GET_VEHICLE_VIOLATION_COUNT Function
CREATE OR REPLACE FUNCTION GET_VEHICLE_VIOLATION_COUNT (
    p_vehicle_id IN NUMBER
) RETURN NUMBER IS
    v_count NUMBER := 0;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM VIOLATION
    WHERE vehicle_id = p_vehicle_id;

    RETURN v_count;
END;
/

-- 4. GET_REPEAT_OFFENDER_SCORE Function (Risk Metric Calculation)
CREATE OR REPLACE FUNCTION GET_REPEAT_OFFENDER_SCORE (
    p_driver_id IN NUMBER
) RETURN NUMBER IS
    v_violation_cnt NUMBER := 0;
    v_points        NUMBER := 0;
    v_risk_score    NUMBER(5,2) := 0.0;
BEGIN
    SELECT COUNT(*), NVL(SUM(vt.demerit_points), 0)
    INTO v_violation_cnt, v_points
    FROM VIOLATION v
    JOIN VIOLATION_TYPE vt ON v.type_id = vt.type_id
    WHERE v.driver_id = p_driver_id;

    -- Weight calculation algorithm
    v_risk_score := (v_violation_cnt * 10) + (v_points * 15);
    IF v_risk_score > 100 THEN
        v_risk_score := 100.00;
    END IF;

    RETURN v_risk_score;
END;
/

-- 5. GET_CAMERA_VIOLATION_COUNT Function
CREATE OR REPLACE FUNCTION GET_CAMERA_VIOLATION_COUNT (
    p_camera_id IN NUMBER
) RETURN NUMBER IS
    v_count NUMBER := 0;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM VIOLATION
    WHERE camera_id = p_camera_id;

    RETURN v_count;
END;
/

-- 6. GET_ZONE_VIOLATION_RATE Function
CREATE OR REPLACE FUNCTION GET_ZONE_VIOLATION_RATE (
    p_zone_id IN NUMBER
) RETURN NUMBER IS
    v_total_events NUMBER := 0;
    v_violations   NUMBER := 0;
    v_rate         NUMBER(5,2) := 0.0;
BEGIN
    SELECT COUNT(ve.event_id), SUM(CASE WHEN ve.event_status = 'VIOLATION_CONFIRMED' THEN 1 ELSE 0 END)
    INTO v_total_events, v_violations
    FROM VEHICLE_EVENT ve
    JOIN CAMERA c ON ve.camera_id = c.camera_id
    JOIN ROAD_SEGMENT rs ON c.segment_id = rs.segment_id
    JOIN ROAD r ON rs.road_id = r.road_id
    WHERE r.zone_id = p_zone_id;

    IF v_total_events > 0 THEN
        v_rate := ROUND((v_violations / v_total_events) * 100, 2);
    END IF;

    RETURN v_rate;
END;
/
