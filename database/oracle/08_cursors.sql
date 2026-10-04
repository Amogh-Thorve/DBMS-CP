-- ============================================================================
-- STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
-- File: 08_cursors.sql
-- Description: Complete PL/SQL Cursors Demonstration (Implicit, Explicit, Parameterized, Cursor FOR Loop, REF CURSOR)
-- Author: STVAMS Core Architecture Team
-- ============================================================================

SET SERVEROUTPUT ON;

-- 1. Implicit Cursor Demonstration (SQL%FOUND, SQL%NOTFOUND, SQL%ROWCOUNT)
DECLARE
    v_rows_updated NUMBER;
BEGIN
    UPDATE FINE
    SET penalty_amount = penalty_amount + 50
    WHERE status = 'OVERDUE';

    IF SQL%FOUND THEN
        v_rows_updated := SQL%ROWCOUNT;
        DBMS_OUTPUT.PUT_LINE('Implicit Cursor: Updated ' || v_rows_updated || ' overdue fine records.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Implicit Cursor: No overdue fines found.');
    END IF;
    ROLLBACK; -- Reset demo update
END;
/

-- 2. Explicit Cursor Demonstration (OPEN, FETCH, CLOSE, %NOTFOUND)
DECLARE
    CURSOR c_unpaid_fines IS
        SELECT f.fine_id, v.registration_no, f.total_amount, f.due_date
        FROM FINE f
        JOIN VIOLATION viol ON f.violation_id = viol.violation_id
        JOIN VEHICLE v ON viol.vehicle_id = v.vehicle_id
        WHERE f.status = 'UNPAID'
        ORDER BY f.due_date ASC;

    v_fine_id   FINE.FINE_ID%TYPE;
    v_reg_no    VEHICLE.REGISTRATION_NO%TYPE;
    v_amount    FINE.TOTAL_AMOUNT%TYPE;
    v_due_date  FINE.DUE_DATE%TYPE;
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== EXPLICIT CURSOR DEMO: UNPAID FINES ===');
    OPEN c_unpaid_fines;
    LOOP
        FETCH c_unpaid_fines INTO v_fine_id, v_reg_no, v_amount, v_due_date;
        EXIT WHEN c_unpaid_fines%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE('Fine ID: ' || v_fine_id || ' | Vehicle: ' || v_reg_no || ' | Due: ' || TO_CHAR(v_due_date, 'YYYY-MM-DD') || ' | Amount: ₹' || v_amount);
    END LOOP;
    CLOSE c_unpaid_fines;
END;
/

-- 3. Parameterized Cursor Demonstration
DECLARE
    CURSOR c_zone_violations (p_zone_id NUMBER) IS
        SELECT viol.violation_id, vt.title, viol.violation_dt
        FROM VIOLATION viol
        JOIN VIOLATION_TYPE vt ON viol.type_id = vt.type_id
        JOIN CAMERA c ON viol.camera_id = c.camera_id
        JOIN ROAD_SEGMENT rs ON c.segment_id = rs.segment_id
        JOIN ROAD r ON rs.road_id = r.road_id
        WHERE r.zone_id = p_zone_id;

    v_rec c_zone_violations%ROWTYPE;
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== PARAMETERIZED CURSOR DEMO (ZONE 1) ===');
    OPEN c_zone_violations(1);
    LOOP
        FETCH c_zone_violations INTO v_rec;
        EXIT WHEN c_zone_violations%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE('Violation ID: ' || v_rec.violation_id || ' | Type: ' || v_rec.title || ' | Date: ' || v_rec.violation_dt);
    END LOOP;
    CLOSE c_zone_violations;
END;
/

-- 4. Cursor FOR Loop Demonstration (Automated Open, Fetch, Close)
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== CURSOR FOR LOOP DEMO: TOP OFFENDERS ===');
    FOR rec IN (
        SELECT v.registration_no, o.full_name, COUNT(viol.violation_id) AS v_count
        FROM VEHICLE v
        JOIN OWNER o ON v.owner_id = o.owner_id
        JOIN VIOLATION viol ON v.vehicle_id = viol.vehicle_id
        GROUP BY v.registration_no, o.full_name
        HAVING COUNT(viol.violation_id) >= 2
        ORDER BY v_count DESC
    ) LOOP
        DBMS_OUTPUT.PUT_LINE('Reg No: ' || rec.registration_no || ' | Owner: ' || rec.full_name || ' | Violations: ' || rec.v_count);
    END LOOP;
END;
/

-- 5. REF CURSOR Demonstration (Dynamic SYS_REFCURSOR)
CREATE OR REPLACE PROCEDURE GET_VIOLATIONS_BY_STATUS (
    p_status    IN VARCHAR2,
    p_cursor    OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT v.violation_id, veh.registration_no, vt.title, v.status, v.violation_dt
        FROM VIOLATION v
        JOIN VEHICLE veh ON v.vehicle_id = veh.vehicle_id
        JOIN VIOLATION_TYPE vt ON v.type_id = vt.type_id
        WHERE v.status = UPPER(p_status)
        ORDER BY v.violation_dt DESC;
END;
/
