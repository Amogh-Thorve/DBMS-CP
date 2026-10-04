-- ============================================================================
-- STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
-- File: 09_triggers.sql
-- Description: Oracle Triggers (BEFORE, AFTER, Row-Level, Statement-Level, Audit Logging)
-- Author: STVAMS Core Architecture Team
-- ============================================================================

-- 1. BEFORE Row-Level Trigger: Prevent Violation Registration for Suspended/Scrapped Vehicles
CREATE OR REPLACE TRIGGER TRG_BEFORE_VIOLATION_INSERT
BEFORE INSERT ON VIOLATION
FOR EACH ROW
DECLARE
    v_veh_status VARCHAR2(20);
BEGIN
    SELECT status INTO v_veh_status FROM VEHICLE WHERE vehicle_id = :NEW.vehicle_id;
    
    IF v_veh_status = 'SCRAPPED' THEN
        RAISE_APPLICATION_ERROR(-20010, 'Cannot issue violation for a scrapped vehicle.');
    END IF;
END;
/

-- 2. AFTER Row-Level Trigger: Automatic Fine Generation & Audit Logging upon Violation Creation
CREATE OR REPLACE TRIGGER TRG_AFTER_VIOLATION_INSERT
AFTER INSERT ON VIOLATION
FOR EACH ROW
DECLARE
    v_base_fine NUMBER(10,2);
BEGIN
    -- Fetch Base Fine
    SELECT base_fine INTO v_base_fine FROM VIOLATION_TYPE WHERE type_id = :NEW.type_id;

    -- Automatically Generate Fine Record
    INSERT INTO FINE (violation_id, base_amount, penalty_amount, issue_date, due_date, status)
    VALUES (:NEW.violation_id, v_base_fine, 0.00, TRUNC(:NEW.violation_dt), TRUNC(:NEW.violation_dt + 30), 'UNPAID');

    -- Insert Audit Trail
    INSERT INTO AUDIT_LOG (entity_name, entity_id, action, old_value, new_value, performed_by, timestamp)
    VALUES ('VIOLATION', :NEW.violation_id, 'INSERT', NULL, 'Status: ISSUED, TypeID: ' || :NEW.type_id, USER, CURRENT_TIMESTAMP);
END;
/

-- 3. AFTER Row-Level Trigger: Audit Trail for Payment Modifications
CREATE OR REPLACE TRIGGER TRG_AFTER_PAYMENT_AUDIT
AFTER INSERT OR UPDATE ON PAYMENT
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (entity_name, entity_id, action, old_value, new_value, performed_by, timestamp)
    VALUES (
        'PAYMENT',
        :NEW.payment_id,
        CASE WHEN INSERTING THEN 'INSERT' ELSE 'UPDATE' END,
        CASE WHEN UPDATING THEN 'Status: ' || :OLD.status || ', Amount: ' || :OLD.payment_amount ELSE NULL END,
        'Status: ' || :NEW.status || ', Amount: ' || :NEW.payment_amount || ', TxnRef: ' || :NEW.txn_ref_no,
        USER,
        CURRENT_TIMESTAMP
    );
END;
/

-- 4. Statement-Level Trigger: Bulk Maintenance Logging
CREATE OR REPLACE TRIGGER TRG_STATEMENT_CAMERA_MAINT
AFTER UPDATE OF status ON CAMERA
BEGIN
    INSERT INTO AUDIT_LOG (entity_name, entity_id, action, old_value, new_value, performed_by, timestamp)
    VALUES ('CAMERA_BULK', 0, 'STATUS_CHANGE', NULL, 'Bulk Camera Status Updated', USER, CURRENT_TIMESTAMP);
END;
/
