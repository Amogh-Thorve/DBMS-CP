-- ============================================================================
-- STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
-- File: 10_transactions.sql
-- Description: Oracle Transaction Control Language (TCL) Practical Demonstrations
-- Author: STVAMS Core Architecture Team
-- ============================================================================

SET SERVEROUTPUT ON;

-- 1. Successful Transaction with SAVEPOINT & COMMIT
DECLARE
    v_fine_id NUMBER := 10;
    v_pay_id NUMBER;
BEGIN
    SAVEPOINT sp_start_payment;
    
    DBMS_OUTPUT.PUT_LINE('Step 1: Savepoint sp_start_payment established.');

    -- Insert draft payment record
    INSERT INTO PAYMENT (fine_id, payment_amount, payment_date, payment_method, txn_ref_no, status)
    VALUES (v_fine_id, 1500.00, SYSDATE, 'UPI', 'TXN_TCL_001', 'SUCCESS')
    RETURNING payment_id INTO v_pay_id;

    SAVEPOINT sp_payment_inserted;
    DBMS_OUTPUT.PUT_LINE('Step 2: Payment record inserted. Savepoint sp_payment_inserted created.');

    -- Update Fine table state
    UPDATE FINE SET status = 'PAID' WHERE fine_id = v_fine_id;

    -- Commit transaction to persist changes permanently
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Step 3: Transaction COMMITTED successfully.');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK TO sp_start_payment;
        DBMS_OUTPUT.PUT_LINE('Transaction Error: Rolled back to sp_start_payment.');
END;
/

-- 2. Transaction Rollback Demonstration (Controlled Failure Simulation)
DECLARE
    v_fine_id NUMBER := 11;
BEGIN
    SAVEPOINT sp_before_fail;

    UPDATE FINE SET status = 'PAID' WHERE fine_id = v_fine_id;
    
    -- Intentional rollback simulation
    DBMS_OUTPUT.PUT_LINE('Simulating unexpected error... Rolling back transaction.');
    ROLLBACK TO sp_before_fail;
    
    DBMS_OUTPUT.PUT_LINE('Rollback verified: Database restored to pre-transaction state.');
END;
/
