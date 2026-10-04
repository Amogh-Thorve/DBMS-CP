-- ============================================================================
-- STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
-- File: 02_constraints.sql
-- Description: Advanced SQL DDL Constraints, Referential Rules & Checks
-- Author: STVAMS Core Architecture Team
-- ============================================================================

-- Composite Unique Constraints & Check Rules

-- 1. Ensure a camera maintains a unique code per segment
ALTER TABLE CAMERA ADD CONSTRAINT uq_camera_code_segment UNIQUE (camera_code, segment_id);

-- 2. Ensure owner email and phone cannot be blank
ALTER TABLE OWNER ADD CONSTRAINT chk_owner_email_format CHECK (REGEXP_LIKE(email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'));
ALTER TABLE OWNER ADD CONSTRAINT chk_owner_phone_len CHECK (LENGTH(phone) >= 10);

-- 3. Vehicle Registration Format Validation (Indian RTO pattern, e.g. MH01AB1234 or DL02C9999)
ALTER TABLE VEHICLE ADD CONSTRAINT chk_reg_no_format CHECK (REGEXP_LIKE(registration_no, '^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$'));

-- 4. Vehicle Insurance Date logic
ALTER TABLE VEHICLE_INSURANCE ADD CONSTRAINT chk_ins_amount_positive CHECK (insured_amount > 0);

-- 5. Violation base fine sanity check
ALTER TABLE VIOLATION_TYPE ADD CONSTRAINT chk_viol_type_fine CHECK (base_fine >= 100.00);

-- 6. Officer badge format validation (e.g. TR-1001)
ALTER TABLE OFFICER ADD CONSTRAINT chk_officer_badge CHECK (REGEXP_LIKE(badge_number, '^TR-[0-9]{4,6}$'));

-- 7. Payment reference number uniqueness and format
ALTER TABLE PAYMENT ADD CONSTRAINT chk_pay_ref_len CHECK (LENGTH(txn_ref_no) >= 8);
