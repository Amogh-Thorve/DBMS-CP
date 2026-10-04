-- ============================================================================
-- STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
-- File: 05_indexes.sql
-- Description: Oracle Database Indexing Strategy & Performance Optimization
-- Author: STVAMS Core Architecture Team
-- ============================================================================

-- 1. Single Column Indexes for High-Cardinality Foreign Keys & Search Fields
CREATE INDEX IDX_VEHICLE_REG_NO ON VEHICLE(registration_no);
CREATE INDEX IDX_VEHICLE_OWNER_ID ON VEHICLE(owner_id);
CREATE INDEX IDX_DRIVER_LICENSE_ID ON LICENSE(driver_id);
CREATE INDEX IDX_EVENT_CAMERA_ID ON VEHICLE_EVENT(camera_id);
CREATE INDEX IDX_VIOLATION_VEHICLE_ID ON VIOLATION(vehicle_id);
CREATE INDEX IDX_VIOLATION_DT ON VIOLATION(violation_dt);
CREATE INDEX IDX_FINE_STATUS ON FINE(status);
CREATE INDEX IDX_PAYMENT_FINE_ID ON PAYMENT(fine_id);

-- 2. Composite Indexes for Frequent Multi-Column Filter Queries
-- Query: Find violations by vehicle within a date range
CREATE INDEX IDX_VIOL_VEH_DATE ON VIOLATION(vehicle_id, violation_dt);

-- Query: Find unpaid fines by due date
CREATE INDEX IDX_FINE_STATUS_DUE ON FINE(status, due_date);

-- Query: Filter events by camera and status
CREATE INDEX IDX_EVENT_CAM_STATUS ON VEHICLE_EVENT(camera_id, event_status);

-- 3. Function-Based Index Demonstration
-- Enables fast upper-case searches on registration numbers and license plate text
CREATE INDEX IDX_VEHICLE_REG_UPPER ON VEHICLE(UPPER(registration_no));
CREATE INDEX IDX_EVENT_PLATE_UPPER ON VEHICLE_EVENT(UPPER(license_plate_raw));

-- 4. Unique Indexes (Implicitly created by constraints, explicitly named here for reference)
-- CREATE UNIQUE INDEX IDX_UQ_NATIONAL_ID ON OWNER(national_id);
