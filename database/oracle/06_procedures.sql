-- ============================================================================
-- STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
-- File: 06_procedures.sql
-- Description: Oracle PL/SQL Stored Procedures with Business Logic & Transactions
-- Author: STVAMS Core Architecture Team
-- ============================================================================

SET SERVEROUTPUT ON;

-- 1. REGISTER_VEHICLE Procedure
CREATE OR REPLACE PROCEDURE REGISTER_VEHICLE (
    p_reg_no        IN VARCHAR2,
    p_owner_id      IN NUMBER,
    p_class         IN VARCHAR2,
    p_make          IN VARCHAR2,
    p_model         IN VARCHAR2,
    p_fuel          IN VARCHAR2,
    p_mfg_year      IN NUMBER,
    p_vehicle_id    OUT NUMBER
) AS
    v_owner_cnt NUMBER;
BEGIN
    -- Input Validation
    SELECT COUNT(*) INTO v_owner_cnt FROM OWNER WHERE owner_id = p_owner_id;
    IF v_owner_cnt = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Owner ID ' || p_owner_id || ' does not exist.');
    END IF;

    INSERT INTO VEHICLE (registration_no, owner_id, vehicle_class, make, model, fuel_type, mfg_year, reg_date, status)
    VALUES (UPPER(p_reg_no), p_owner_id, p_class, p_make, p_model, p_fuel, p_mfg_year, SYSDATE, 'ACTIVE')
    RETURNING vehicle_id INTO p_vehicle_id;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Vehicle registered successfully. ID: ' || p_vehicle_id);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/

-- 2. REGISTER_VIOLATION Procedure
CREATE OR REPLACE PROCEDURE REGISTER_VIOLATION (
    p_event_id      IN NUMBER,
    p_vehicle_id    IN NUMBER,
    p_driver_id     IN NUMBER,
    p_type_id       IN NUMBER,
    p_camera_id     IN NUMBER,
    p_officer_id    IN NUMBER,
    p_remarks       IN VARCHAR2,
    p_violation_id  OUT NUMBER
) AS
BEGIN
    INSERT INTO VIOLATION (event_id, vehicle_id, driver_id, type_id, camera_id, officer_id, violation_dt, status, remarks)
    VALUES (p_event_id, p_vehicle_id, p_driver_id, p_type_id, p_camera_id, p_officer_id, SYSDATE, 'ISSUED', p_remarks)
    RETURNING violation_id INTO p_violation_id;

    -- Update event status if linked
    IF p_event_id IS NOT NULL THEN
        UPDATE VEHICLE_EVENT SET event_status = 'VIOLATION_CONFIRMED' WHERE event_id = p_event_id;
    END IF;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/

-- 3. GENERATE_FINE Procedure
CREATE OR REPLACE PROCEDURE GENERATE_FINE (
    p_violation_id  IN NUMBER,
    p_fine_id       OUT NUMBER
) AS
    v_base_fine NUMBER(10,2);
    v_due_days  NUMBER := 30;
BEGIN
    SELECT vt.base_fine 
    INTO v_base_fine
    FROM VIOLATION v
    JOIN VIOLATION_TYPE vt ON v.type_id = vt.type_id
    WHERE v.violation_id = p_violation_id;

    INSERT INTO FINE (violation_id, base_amount, penalty_amount, issue_date, due_date, status)
    VALUES (p_violation_id, v_base_fine, 0.00, TRUNC(SYSDATE), TRUNC(SYSDATE + v_due_days), 'UNPAID')
    RETURNING fine_id INTO p_fine_id;

    UPDATE VIOLATION SET status = 'FINE_GENERATED' WHERE violation_id = p_violation_id;

    COMMIT;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20002, 'Violation ID not found or missing fine configuration.');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/

-- 4. PROCESS_PAYMENT Procedure (ACID Transaction Demonstration)
CREATE OR REPLACE PROCEDURE PROCESS_PAYMENT (
    p_fine_id       IN NUMBER,
    p_amount        IN NUMBER,
    p_method        IN VARCHAR2,
    p_txn_ref       IN VARCHAR2,
    p_payment_id    OUT NUMBER
) AS
    v_fine_status   VARCHAR2(20);
    v_total_due     NUMBER(10,2);
    v_current_paid  NUMBER(10,2) := 0;
BEGIN
    SAVEPOINT before_payment;

    -- Lock Fine row for update
    SELECT status, total_amount INTO v_fine_status, v_total_due
    FROM FINE
    WHERE fine_id = p_fine_id
    FOR UPDATE;

    IF v_fine_status = 'PAID' THEN
        RAISE_APPLICATION_ERROR(-20003, 'Fine ID ' || p_fine_id || ' is already fully paid.');
    END IF;

    SELECT NVL(SUM(payment_amount), 0) INTO v_current_paid
    FROM PAYMENT
    WHERE fine_id = p_fine_id AND status = 'SUCCESS';

    IF (v_current_paid + p_amount) > v_total_due THEN
        RAISE_APPLICATION_ERROR(-20004, 'Payment amount exceeds outstanding fine balance.');
    END IF;

    -- Insert Payment Record
    INSERT INTO PAYMENT (fine_id, payment_amount, payment_date, payment_method, txn_ref_no, status)
    VALUES (p_fine_id, p_amount, SYSDATE, p_method, p_txn_ref, 'SUCCESS')
    RETURNING payment_id INTO p_payment_id;

    -- Update Fine Status
    IF (v_current_paid + p_amount) = v_total_due THEN
        UPDATE FINE SET status = 'PAID' WHERE fine_id = p_fine_id;
        UPDATE VIOLATION SET status = 'PAID' WHERE violation_id = (SELECT violation_id FROM FINE WHERE fine_id = p_fine_id);
    ELSE
        UPDATE FINE SET status = 'PARTIALLY_PAID' WHERE fine_id = p_fine_id;
    END IF;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK TO before_payment;
        RAISE;
END;
/

-- 5. MARK_OVERDUE_FINES Procedure (Batch Processing)
CREATE OR REPLACE PROCEDURE MARK_OVERDUE_FINES AS
    v_updated_count NUMBER := 0;
BEGIN
    UPDATE FINE
    SET status = 'OVERDUE',
        penalty_amount = base_amount * 0.10 -- 10% late fee penalty
    WHERE status IN ('UNPAID', 'PARTIALLY_PAID')
      AND due_date < TRUNC(SYSDATE);

    v_updated_count := SQL%ROWCOUNT;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Marked ' || v_updated_count || ' fines as OVERDUE with penalty.');
END;
/

-- 6. FILE_APPEAL Procedure
CREATE OR REPLACE PROCEDURE FILE_APPEAL (
    p_violation_id  IN NUMBER,
    p_appellant_id  IN NUMBER,
    p_reason        IN VARCHAR2,
    p_appeal_id     OUT NUMBER
) AS
    v_status VARCHAR2(20);
BEGIN
    SELECT status INTO v_status FROM VIOLATION WHERE violation_id = p_violation_id;
    IF v_status = 'PAID' THEN
        RAISE_APPLICATION_ERROR(-20005, 'Cannot appeal a violation that has already been paid.');
    END IF;

    INSERT INTO APPEAL (violation_id, appellant_id, appeal_date, reason, status)
    VALUES (p_violation_id, p_appellant_id, SYSDATE, p_reason, 'SUBMITTED')
    RETURNING appeal_id INTO p_appeal_id;

    UPDATE VIOLATION SET status = 'UNDER_APPEAL' WHERE violation_id = p_violation_id;

    COMMIT;
END;
/

-- 7. REVIEW_APPEAL Procedure
CREATE OR REPLACE PROCEDURE REVIEW_APPEAL (
    p_appeal_id     IN NUMBER,
    p_officer_id    IN NUMBER,
    p_decision      IN VARCHAR2, -- 'APPROVED' or 'REJECTED'
    p_comments      IN VARCHAR2
) AS
    v_viol_id NUMBER;
BEGIN
    SELECT violation_id INTO v_viol_id FROM APPEAL WHERE appeal_id = p_appeal_id;

    INSERT INTO APPEAL_REVIEW (appeal_id, officer_id, review_date, decision, comments)
    VALUES (p_appeal_id, p_officer_id, SYSDATE, p_decision, p_comments);

    UPDATE APPEAL SET status = p_decision WHERE appeal_id = p_appeal_id;

    IF p_decision = 'APPROVED' THEN
        UPDATE VIOLATION SET status = 'DISMISSED' WHERE violation_id = v_viol_id;
        UPDATE FINE SET status = 'WAIVED' WHERE violation_id = v_viol_id;
    ELSE
        UPDATE VIOLATION SET status = 'FINE_GENERATED' WHERE violation_id = v_viol_id;
    END IF;

    COMMIT;
END;
/

-- 8. GENERATE_VEHICLE_REPORT Procedure
CREATE OR REPLACE PROCEDURE GENERATE_VEHICLE_REPORT (
    p_registration_no IN VARCHAR2
) AS
    v_veh_id NUMBER;
    v_owner  VARCHAR2(150);
    v_count  NUMBER;
    v_fines  NUMBER;
BEGIN
    SELECT v.vehicle_id, o.full_name
    INTO v_veh_id, v_owner
    FROM VEHICLE v
    JOIN OWNER o ON v.owner_id = o.owner_id
    WHERE v.registration_no = UPPER(p_registration_no);

    SELECT COUNT(*), NVL(SUM(f.total_amount), 0)
    INTO v_count, v_fines
    FROM VIOLATION viol
    LEFT JOIN FINE f ON viol.violation_id = f.violation_id
    WHERE viol.vehicle_id = v_veh_id;

    DBMS_OUTPUT.PUT_LINE('--- VEHICLE REPORT ---');
    DBMS_OUTPUT.PUT_LINE('Registration: ' || UPPER(p_registration_no));
    DBMS_OUTPUT.PUT_LINE('Owner Name:   ' || v_owner);
    DBMS_OUTPUT.PUT_LINE('Violations:   ' || v_count);
    DBMS_OUTPUT.PUT_LINE('Total Fines:  ₹' || v_fines);
END;
/
