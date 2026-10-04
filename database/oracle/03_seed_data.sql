-- ============================================================================
-- STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
-- File: 03_seed_data.sql
-- Description: Deterministic Production-Scale Seed Data Generation Script
-- Author: STVAMS Core Architecture Team
-- ============================================================================

SET DEFINE OFF;
SET SERVEROUTPUT ON;

-- 1. Populate CITIES (3 Major Metro Cities)
INSERT INTO CITY (city_id, city_name, state_name, country) VALUES (1, 'Mumbai', 'Maharashtra', 'India');
INSERT INTO CITY (city_id, city_name, state_name, country) VALUES (2, 'New Delhi', 'Delhi', 'India');
INSERT INTO CITY (city_id, city_name, state_name, country) VALUES (3, 'Bengaluru', 'Karnataka', 'India');

-- 2. Populate TRAFFIC_ZONES (6 Zones)
INSERT INTO TRAFFIC_ZONE (zone_id, zone_code, zone_name, city_id, risk_level) VALUES (1, 'Z-MUM-01', 'South Mumbai Downtown', 1, 'HIGH');
INSERT INTO TRAFFIC_ZONE (zone_id, zone_code, zone_name, city_id, risk_level) VALUES (2, 'Z-MUM-02', 'Bandra-Kurla Complex (BKC)', 1, 'MEDIUM');
INSERT INTO TRAFFIC_ZONE (zone_id, zone_code, zone_name, city_id, risk_level) VALUES (3, 'Z-DEL-01', 'Connaught Place Circle', 2, 'CRITICAL');
INSERT INTO TRAFFIC_ZONE (zone_id, zone_code, zone_name, city_id, risk_level) VALUES (4, 'Z-DEL-02', 'South Delhi Ring Road', 2, 'HIGH');
INSERT INTO TRAFFIC_ZONE (zone_id, zone_code, zone_name, city_id, risk_level) VALUES (5, 'Z-BLR-01', 'MG Road Corridor', 3, 'MEDIUM');
INSERT INTO TRAFFIC_ZONE (zone_id, zone_code, zone_name, city_id, risk_level) VALUES (6, 'Z-BLR-02', 'Outer Ring Road Silk Board', 3, 'CRITICAL');

-- 3. Populate ROADS (15 Roads)
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (1, 'Marine Drive', 'ARTERIAL', 60, 1);
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (2, 'Pedder Road', 'ARTERIAL', 50, 1);
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (3, 'BKC Main Avenue', 'ARTERIAL', 60, 2);
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (4, 'Western Express Highway', 'EXPRESSWAY', 80, 2);
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (5, 'Inner Circle CP', 'ARTERIAL', 40, 3);
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (6, 'Outer Circle CP', 'ARTERIAL', 40, 3);
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (7, 'Ring Road AIIMS Flyover', 'EXPRESSWAY', 70, 4);
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (8, 'Mathura Road', 'NATIONAL_HIGHWAY', 70, 4);
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (9, 'MG Road East', 'ARTERIAL', 50, 5);
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (10, 'Brigade Road', 'SERVICE', 30, 5);
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (11, 'Silk Board Flyover', 'EXPRESSWAY', 60, 6);
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (12, 'Bellandur Stretch', 'NATIONAL_HIGHWAY', 80, 6);
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (13, 'Marathahalli Bridge', 'NATIONAL_HIGHWAY', 80, 6);
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (14, 'Eastern Freeway', 'EXPRESSWAY', 80, 1);
INSERT INTO ROAD (road_id, road_name, road_type, speed_limit_kmh, zone_id) VALUES (15, 'Barapullah Elevated Corridor', 'EXPRESSWAY', 70, 4);

-- 4. Populate ROAD_SEGMENTS (20 Segments)
DECLARE
BEGIN
    FOR i IN 1..20 LOOP
        INSERT INTO ROAD_SEGMENT (segment_id, segment_code, road_id, start_latitude, start_longitude, end_latitude, end_longitude, length_km, is_active)
        VALUES (
            i,
            'SEG-' || LPAD(i, 3, '0'),
            MOD(i, 15) + 1,
            18.9000 + (i * 0.01),
            72.8000 + (i * 0.01),
            18.9100 + (i * 0.01),
            72.8100 + (i * 0.01),
            1.5 + (i * 0.2),
            1
        );
    END LOOP;
END;
/

-- 5. Populate CAMERAS (25 Cameras)
DECLARE
    v_types VARCHAR2(100) := 'ANPR,SPEED,RED_LIGHT,CCTV,AI_TRAFFIC';
    v_type_table DBMS_SQL.VARCHAR2_TABLE;
BEGIN
    FOR i IN 1..25 LOOP
        INSERT INTO CAMERA (camera_id, camera_code, camera_type, segment_id, installation_dt, direction, status, ip_address)
        VALUES (
            i,
            'CAM-SYS-' || LPAD(i, 3, '0'),
            CASE MOD(i, 5) 
                WHEN 0 THEN 'ANPR'
                WHEN 1 THEN 'SPEED'
                WHEN 2 THEN 'RED_LIGHT'
                WHEN 3 THEN 'CCTV'
                ELSE 'AI_TRAFFIC'
            END,
            MOD(i, 20) + 1,
            SYSDATE - (i * 10),
            CASE MOD(i, 4)
                WHEN 0 THEN 'NORTHBOUND'
                WHEN 1 THEN 'SOUTHBOUND'
                WHEN 2 THEN 'EASTBOUND'
                ELSE 'WESTBOUND'
            END,
            'ACTIVE',
            '192.168.1.' || (100 + i)
        );
    END LOOP;
END;
/

-- 6. Populate OFFICERS (10 Officers)
INSERT INTO OFFICER (officer_id, badge_number, full_name, rank_title, zone_id, phone, email, status) VALUES (1, 'TR-1001', 'Inspector Rajesh Sharma', 'Senior Inspector', 1, '9820011111', 'rajesh.sharma@traffic.gov.in', 'ACTIVE');
INSERT INTO OFFICER (officer_id, badge_number, full_name, rank_title, zone_id, phone, email, status) VALUES (2, 'TR-1002', 'Sub-Inspector Priya Verma', 'Sub-Inspector', 2, '9820022222', 'priya.verma@traffic.gov.in', 'ACTIVE');
INSERT INTO OFFICER (officer_id, badge_number, full_name, rank_title, zone_id, phone, email, status) VALUES (3, 'TR-1003', 'Assistant Inspector Amit Kumar', 'Assistant Inspector', 3, '9820033333', 'amit.kumar@traffic.gov.in', 'ACTIVE');
INSERT INTO OFFICER (officer_id, badge_number, full_name, rank_title, zone_id, phone, email, status) VALUES (4, 'TR-1004', 'Constable Vikram Singh', 'Head Constable', 4, '9820044444', 'vikram.singh@traffic.gov.in', 'ACTIVE');
INSERT INTO OFFICER (officer_id, badge_number, full_name, rank_title, zone_id, phone, email, status) VALUES (5, 'TR-1005', 'Inspector Suresh Gowda', 'Senior Inspector', 5, '9820055555', 'suresh.gowda@traffic.gov.in', 'ACTIVE');
INSERT INTO OFFICER (officer_id, badge_number, full_name, rank_title, zone_id, phone, email, status) VALUES (6, 'TR-1006', 'Sub-Inspector Ananya Rao', 'Sub-Inspector', 6, '9820066666', 'ananya.rao@traffic.gov.in', 'ACTIVE');
INSERT INTO OFFICER (officer_id, badge_number, full_name, rank_title, zone_id, phone, email, status) VALUES (7, 'TR-1007', 'Constable Manoj Patil', 'Constable', 1, '9820077777', 'manoj.patil@traffic.gov.in', 'ACTIVE');
INSERT INTO OFFICER (officer_id, badge_number, full_name, rank_title, zone_id, phone, email, status) VALUES (8, 'TR-1008', 'Sub-Inspector Deepa Gupta', 'Sub-Inspector', 3, '9820088888', 'deepa.gupta@traffic.gov.in', 'ACTIVE');
INSERT INTO OFFICER (officer_id, badge_number, full_name, rank_title, zone_id, phone, email, status) VALUES (9, 'TR-1009', 'Inspector Sunil Kulkarni', 'Senior Inspector', 2, '9820099999', 'sunil.kulkarni@traffic.gov.in', 'ACTIVE');
INSERT INTO OFFICER (officer_id, badge_number, full_name, rank_title, zone_id, phone, email, status) VALUES (10, 'TR-1010', 'Head Constable Ramesh Nair', 'Head Constable', 6, '9820100000', 'ramesh.nair@traffic.gov.in', 'ACTIVE');

-- 7. Populate VIOLATION_TYPES (10 Core Violation Types)
INSERT INTO VIOLATION_TYPE (type_id, code, title, description, base_fine, demerit_points, severity) VALUES (1, 'SPEED_01', 'Overspeeding', 'Exceeding posted speed limit by 15-30 km/h', 1500.00, 2, 'MODERATE');
INSERT INTO VIOLATION_TYPE (type_id, code, title, description, base_fine, demerit_points, severity) VALUES (2, 'RED_01', 'Red Light Violation', 'Crossing stop line or intersection during red signal phase', 2000.00, 3, 'SEVERE');
INSERT INTO VIOLATION_TYPE (type_id, code, title, description, base_fine, demerit_points, severity) VALUES (3, 'WRONG_SIDE', 'Wrong-Side Driving', 'Driving against designated flow of traffic', 5000.00, 5, 'CRITICAL');
INSERT INTO VIOLATION_TYPE (type_id, code, title, description, base_fine, demerit_points, severity) VALUES (4, 'HELMET_01', 'No Helmet', 'Riding two-wheeler without approved protective helmet', 1000.00, 1, 'MINOR');
INSERT INTO VIOLATION_TYPE (type_id, code, title, description, base_fine, demerit_points, severity) VALUES (5, 'SEATBELT_01', 'No Seatbelt', 'Operating or occupying front seat without seatbelt fastened', 1000.00, 1, 'MINOR');
INSERT INTO VIOLATION_TYPE (type_id, code, title, description, base_fine, demerit_points, severity) VALUES (6, 'PARKING_01', 'Illegal Parking', 'Parking in no-parking zone or causing obstruction', 500.00, 0, 'MINOR');
INSERT INTO VIOLATION_TYPE (type_id, code, title, description, base_fine, demerit_points, severity) VALUES (7, 'MOBILE_01', 'Mobile Phone Usage', 'Holding or operating mobile phone while driving', 1500.00, 2, 'MODERATE');
INSERT INTO VIOLATION_TYPE (type_id, code, title, description, base_fine, demerit_points, severity) VALUES (8, 'LANE_01', 'Lane Violation', 'Failing to maintain designated lane or improper overtaking', 1000.00, 1, 'MINOR');
INSERT INTO VIOLATION_TYPE (type_id, code, title, description, base_fine, demerit_points, severity) VALUES (9, 'OVERLOAD_01', 'Vehicle Overloading', 'Carrying load beyond permissible gross vehicle weight rating', 10000.00, 4, 'CRITICAL');
INSERT INTO VIOLATION_TYPE (type_id, code, title, description, base_fine, demerit_points, severity) VALUES (10, 'PUC_EXPIRED', 'Expired PUC Certificate', 'Operating vehicle without valid pollution under control certificate', 2000.00, 2, 'MODERATE');

-- 8. Populate OWNERS (100 Owners)
DECLARE
BEGIN
    FOR i IN 1..100 LOOP
        INSERT INTO OWNER (owner_id, national_id, full_name, email, phone, address, owner_type)
        VALUES (
            i,
            'NATID' || LPAD(i, 8, '0'),
            'Owner ' || i || ' Sharma',
            'owner' || i || '@example.com',
            '98000' || LPAD(i, 5, '0'),
            'Flat ' || i || ', Traffic View Towers, Sector ' || MOD(i, 20),
            CASE WHEN MOD(i, 10) = 0 THEN 'CORPORATE' ELSE 'INDIVIDUAL' END
        );
    END LOOP;
END;
/

-- 9. Populate DRIVERS (75 Drivers) & LICENSES (75 Licenses)
DECLARE
BEGIN
    FOR i IN 1..75 LOOP
        INSERT INTO DRIVER (driver_id, owner_id, full_name, dob, blood_group, phone, email)
        VALUES (
            i,
            i,
            'Driver ' || i || ' Verma',
            TO_DATE('1985-05-15', 'YYYY-MM-DD') + (i * 30),
            'O+',
            '97000' || LPAD(i, 5, '0'),
            'driver' || i || '@example.com'
        );

        INSERT INTO LICENSE (license_id, license_number, driver_id, category, issue_date, expiry_date, demerit_points, status)
        VALUES (
            i,
            'DL-' || LPAD(i, 6, '0') || '-2020',
            i,
            'LMV',
            TO_DATE('2015-01-01', 'YYYY-MM-DD'),
            TO_DATE('2035-01-01', 'YYYY-MM-DD'),
            MOD(i, 5),
            'VALID'
        );
    END LOOP;
END;
/

-- 10. Populate VEHICLES (150 Vehicles)
DECLARE
    v_prefix VARCHAR2(5);
BEGIN
    FOR i IN 1..150 LOOP
        IF MOD(i, 3) = 0 THEN v_prefix := 'MH01';
        ELSIF MOD(i, 3) = 1 THEN v_prefix := 'DL02';
        ELSE v_prefix := 'KA03';
        END IF;

        INSERT INTO VEHICLE (vehicle_id, registration_no, owner_id, vehicle_class, make, model, fuel_type, mfg_year, reg_date, status)
        VALUES (
            i,
            v_prefix 'AB' || LPAD(i, 4, '0'),
            MOD(i, 100) + 1,
            CASE WHEN MOD(i, 5) = 0 THEN 'COMMERCIAL' ELSE 'PRIVATE' END,
            'Hyundai',
            'Creta',
            'PETROL',
            2020,
            TO_DATE('2020-06-15', 'YYYY-MM-DD'),
            'ACTIVE'
        );

        -- Add Insurance
        INSERT INTO VEHICLE_INSURANCE (insurance_id, vehicle_id, policy_number, provider_name, start_date, end_date, insured_amount)
        VALUES (
            i,
            i,
            'POL-' || LPAD(i, 7, '0'),
            'HDFC ERGO Traffic Guard',
            TO_DATE('2025-01-01', 'YYYY-MM-DD'),
            TO_DATE('2027-01-01', 'YYYY-MM-DD'),
            500000.00
        );

        -- Add PUC
        INSERT INTO POLLUTION_CERTIFICATE (puc_id, vehicle_id, certificate_no, issue_date, expiry_date, co2_reading, status)
        VALUES (
            i,
            i,
            'PUC-' || LPAD(i, 7, '0'),
            TO_DATE('2025-06-01', 'YYYY-MM-DD'),
            TO_DATE('2026-06-01', 'YYYY-MM-DD'),
            1.25,
            'PASS'
        );
    END LOOP;
END;
/

-- 11. Populate VEHICLE_EVENTS (500 Events), VIOLATIONS (300), FINES (300), PAYMENTS (150), APPEALS (25)
DECLARE
    v_event_id NUMBER;
    v_viol_id NUMBER;
    v_fine_id NUMBER;
    v_pay_id NUMBER;
    v_app_id NUMBER;
BEGIN
    FOR i IN 1..500 LOOP
        INSERT INTO VEHICLE_EVENT (event_id, camera_id, vehicle_id, license_plate_raw, event_timestamp, observed_speed, ai_confidence, event_status, mongo_doc_id)
        VALUES (
            i,
            MOD(i, 25) + 1,
            MOD(i, 150) + 1,
            'MH01AB' || LPAD(MOD(i, 150) + 1, 4, '0'),
            SYSDATE - (500 - i),
            75.5 + MOD(i, 30),
            95.50,
            CASE WHEN i <= 300 THEN 'VIOLATION_CONFIRMED' ELSE 'CLEARED' END,
            'mongo_evt_' || i
        );

        IF i <= 300 THEN
            v_viol_id := i;
            INSERT INTO VIOLATION (violation_id, event_id, vehicle_id, driver_id, type_id, camera_id, officer_id, violation_dt, status, remarks)
            VALUES (
                v_viol_id,
                i,
                MOD(i, 150) + 1,
                MOD(i, 75) + 1,
                MOD(i, 10) + 1,
                MOD(i, 25) + 1,
                MOD(i, 10) + 1,
                SYSDATE - (300 - i),
                CASE WHEN i <= 150 THEN 'PAID' WHEN i <= 275 THEN 'FINE_GENERATED' ELSE 'UNDER_APPEAL' END,
                'Automated camera detection confirmed by officer.'
            );

            INSERT INTO FINE (fine_id, violation_id, base_amount, penalty_amount, issue_date, due_date, status)
            VALUES (
                v_viol_id,
                v_viol_id,
                1500.00,
                CASE WHEN i > 200 THEN 200.00 ELSE 0.00 END,
                TRUNC(SYSDATE - (300 - i)),
                TRUNC(SYSDATE - (300 - i) + 30),
                CASE WHEN i <= 150 THEN 'PAID' WHEN i <= 200 THEN 'UNPAID' ELSE 'OVERDUE' END
            );

            IF i <= 150 THEN
                INSERT INTO PAYMENT (payment_id, fine_id, payment_amount, payment_date, payment_method, txn_ref_no, status)
                VALUES (
                    i,
                    v_viol_id,
                    1500.00,
                    SYSDATE - (150 - i),
                    'UPI',
                    'TXN_UPI_' || LPAD(i, 8, '0'),
                    'SUCCESS'
                );
            END IF;

            IF i > 275 THEN
                INSERT INTO APPEAL (appeal_id, violation_id, appellant_id, appeal_date, reason, status)
                VALUES (
                    i - 275,
                    v_viol_id,
                    MOD(i, 100) + 1,
                    SYSDATE - (300 - i),
                    'Vehicle was not present at the specified location during the given timestamp.',
                    'SUBMITTED'
                );
            END IF;
        END IF;
    END LOOP;
END;
/

COMMIT;
