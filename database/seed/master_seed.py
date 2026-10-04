"""
============================================================================
STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
File: database/seed/master_seed.py
Description: Master Deterministic Production-Scale Seed Pipeline Generator
Author: STVAMS Core Architecture Team
============================================================================
"""

import os
import sys
import math
import random
import hashlib
import datetime
from typing import List, Dict, Any

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from app.db.database import Base, engine, SessionLocal
from app.models.models import (
    City, TrafficZone, Road, RoadSegment, Camera, CameraMaintenance,
    Owner, Driver, License, Vehicle, VehicleInsurance, PollutionCertificate,
    VehicleEvent, ViolationType, Officer, Violation, Fine, Payment,
    Appeal, AppealReview, Evidence, AuditLog
)

# Set deterministic random seeds
RANDOM_SEED = 42
random.seed(RANDOM_SEED)

def generate_sha256(val: str) -> str:
    return hashlib.sha256(val.encode('utf-8')).hexdigest()

def seed_relational_database():
    """
    Seeds the operational database with production-scale synthetic data.
    """
    print("==================================================")
    print("1. SEEDING OPERATIONAL RELATIONAL DATABASE")
    print("==================================================")

    db = SessionLocal()
    try:
        # Clear existing tables
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        # ----------------------------------------------------
        # 1. CITIES (3 Cities)
        # ----------------------------------------------------
        cities_data = [
            ("Mumbai", "Maharashtra"),
            ("New Delhi", "Delhi"),
            ("Bengaluru", "Karnataka")
        ]
        cities = [City(city_name=name, state_name=state, country="India") for name, state in cities_data]
        db.add_all(cities)
        db.flush()
        print(f" - Created {len(cities)} Cities")

        # ----------------------------------------------------
        # 2. TRAFFIC ZONES (10 Zones)
        # ----------------------------------------------------
        zones_info = [
            ("Z-MUM-01", "South Mumbai Downtown", cities[0].city_id, "HIGH"),
            ("Z-MUM-02", "Bandra-Kurla Complex (BKC)", cities[0].city_id, "MEDIUM"),
            ("Z-MUM-03", "Andheri East Expressway Corridor", cities[0].city_id, "CRITICAL"),
            ("Z-MUM-04", "Thane Highway Junction", cities[0].city_id, "HIGH"),
            ("Z-DEL-01", "Connaught Place Circle", cities[1].city_id, "CRITICAL"),
            ("Z-DEL-02", "South Delhi Ring Road", cities[1].city_id, "HIGH"),
            ("Z-DEL-03", "Aerocity Highway Zone", cities[1].city_id, "MEDIUM"),
            ("Z-BLR-01", "MG Road Commercial Corridor", cities[2].city_id, "MEDIUM"),
            ("Z-BLR-02", "Outer Ring Road Silk Board", cities[2].city_id, "CRITICAL"),
            ("Z-BLR-03", "Whitefield Tech Corridor", cities[2].city_id, "HIGH")
        ]
        zones = [TrafficZone(zone_code=code, zone_name=name, city_id=cid, risk_level=risk) for code, name, cid, risk in zones_info]
        db.add_all(zones)
        db.flush()
        print(f" - Created {len(zones)} Traffic Zones")

        # ----------------------------------------------------
        # 3. ROADS (30 Roads)
        # ----------------------------------------------------
        roads_list = []
        road_names_templates = [
            ("Marine Drive Expressway", "ARTERIAL", 60),
            ("Pedder Avenue", "ARTERIAL", 50),
            ("BKC Main Boulevard", "ARTERIAL", 60),
            ("Western Express Highway", "EXPRESSWAY", 80),
            ("SV Road Corridor", "ARTERIAL", 50),
            ("Thane Belapur Flyover", "NATIONAL_HIGHWAY", 70),
            ("Eastern Freeway", "EXPRESSWAY", 80),
            ("Connaught Inner Circle", "RESIDENTIAL", 40),
            ("Connaught Outer Circle", "ARTERIAL", 40),
            ("AIIMS Flyover Stretch", "EXPRESSWAY", 70),
            ("Mathura Highway Road", "NATIONAL_HIGHWAY", 70),
            ("Barapullah Elevated Expressway", "EXPRESSWAY", 80),
            ("MG Road Central Avenue", "ARTERIAL", 50),
            ("Brigade Road Service Lane", "SERVICE", 30),
            ("Silk Board Junction Flyover", "EXPRESSWAY", 60),
            ("Bellandur Outer Ring Road", "NATIONAL_HIGHWAY", 80),
            ("Marathahalli Bridge Way", "NATIONAL_HIGHWAY", 80),
            ("Whitefield Main Road", "ARTERIAL", 50),
            ("Electronic City Elevated Tollway", "EXPRESSWAY", 90),
            ("Sarjapur Road Stretch", "ARTERIAL", 50),
            ("Koramangala 80 Feet Road", "ARTERIAL", 50),
            ("Indiranagar 100 Feet Road", "ARTERIAL", 50),
            ("Worli Sea Link Link Road", "EXPRESSWAY", 80),
            ("Dadar TT Circle Corridor", "ARTERIAL", 40),
            ("Powai Lake Boulevard", "RESIDENTIAL", 50),
            ("Vashi Creek Bridge Road", "NATIONAL_HIGHWAY", 70),
            ("Golf Course Extension Road", "EXPRESSWAY", 80),
            ("Noida Greater Expressway", "EXPRESSWAY", 100),
            ("DND Flyway Corridor", "EXPRESSWAY", 80),
            ("Hebbal Flyover Expressway", "EXPRESSWAY", 80)
        ]
        for i, (r_name, r_type, s_limit) in enumerate(road_names_templates):
            z_id = zones[i % len(zones)].zone_id
            roads_list.append(Road(road_name=r_name, road_type=r_type, speed_limit_kmh=s_limit, zone_id=z_id))
        db.add_all(roads_list)
        db.flush()
        print(f" - Created {len(roads_list)} Roads")

        # ----------------------------------------------------
        # 4. ROAD SEGMENTS (50 Segments)
        # ----------------------------------------------------
        segments_list = []
        base_coords = [
            (18.9438, 72.8232), (18.9667, 72.8083), (19.0657, 72.8687), (19.1197, 72.8464),
            (28.6315, 77.2167), (28.5672, 77.2100), (28.5562, 77.1200), (12.9716, 77.5946),
            (12.9172, 77.6228), (12.9698, 77.7500)
        ]
        for i in range(1, 51):
            road = roads_list[i % len(roads_list)]
            base_lat, base_lng = base_coords[i % len(base_coords)]
            s_lat = base_lat + (i * 0.002)
            s_lng = base_lng + (i * 0.002)
            e_lat = s_lat + 0.015
            e_lng = s_lng + 0.015
            length = round(1.2 + (i % 5) * 0.7, 2)
            segments_list.append(RoadSegment(
                segment_code=f"SEG-SYS-{i:03d}",
                road_id=road.road_id,
                start_latitude=s_lat,
                start_longitude=s_lng,
                end_latitude=e_lat,
                end_longitude=e_lng,
                length_km=length,
                is_active=1
            ))
        db.add_all(segments_list)
        db.flush()
        print(f" - Created {len(segments_list)} Road Segments")

        # ----------------------------------------------------
        # 5. CAMERAS (40 Cameras)
        # ----------------------------------------------------
        cameras_list = []
        cam_types = ["ANPR", "SPEED", "RED_LIGHT", "CCTV", "AI_TRAFFIC"]
        directions = ["NORTHBOUND", "SOUTHBOUND", "EASTBOUND", "WESTBOUND", "BI_DIRECTIONAL"]
        statuses = ["ACTIVE"] * 34 + ["MAINTENANCE"] * 4 + ["OFFLINE"] * 2

        for i in range(1, 41):
            seg = segments_list[i % len(segments_list)]
            cam_type = cam_types[(i - 1) % len(cam_types)]
            direction = directions[(i - 1) % len(directions)]
            status = statuses[i - 1]
            inst_date = datetime.date(2023, 1, 1) + datetime.timedelta(days=i * 15)
            cameras_list.append(Camera(
                camera_code=f"CAM-SYS-{i:03d}",
                camera_type=cam_type,
                segment_id=seg.segment_id,
                installation_dt=inst_date,
                direction=direction,
                status=status,
                ip_address=f"192.168.10.{100 + i}"
            ))
        db.add_all(cameras_list)
        db.flush()
        print(f" - Created {len(cameras_list)} Cameras")

        # ----------------------------------------------------
        # 6. CAMERA MAINTENANCE LOGS (20 Logs)
        # ----------------------------------------------------
        maint_list = []
        tech_names = ["Ramesh Kumar", "Suresh Nair", "Vikram Sen", "Anil Deshmukh", "Deepak Verma"]
        for i in range(1, 21):
            cam = cameras_list[i % len(cameras_list)]
            m_date = datetime.date(2025, 6, 1) + datetime.timedelta(days=i * 18)
            tech = tech_names[i % len(tech_names)]
            maint_list.append(CameraMaintenance(
                camera_id=cam.camera_id,
                maintenance_date=m_date,
                technician_name=tech,
                issue_description=f"Routine optical sensor calibration and firmware patch {i}.0",
                resolution_details="Cleaned lens assembly, re-aligned LIDAR sensor, verified telemetry.",
                cost=round(1500.00 + (i * 350.00), 2)
            ))
        db.add_all(maint_list)
        db.flush()
        print(f" - Created {len(maint_list)} Camera Maintenance Records")

        # ----------------------------------------------------
        # 7. OFFICERS (30 Officers)
        # ----------------------------------------------------
        officers_list = []
        ranks = ["Senior Inspector", "Sub-Inspector", "Assistant Inspector", "Head Constable", "Constable"]
        first_names = ["Rajesh", "Priya", "Amit", "Vikram", "Suresh", "Ananya", "Manoj", "Kavita", "Rohan", "Sunita", "Deepak", "Pooja", "Arjun", "Neha", "Rahul"]
        last_names = ["Sharma", "Verma", "Kumar", "Singh", "Gowda", "Rao", "Patil", "Deshmukh", "Iyer", "Joshi", "Mehta", "Chawla", "Kulkarni", "Banerjee", "Reddy"]

        for i in range(1, 31):
            fname = first_names[(i - 1) % len(first_names)]
            lname = last_names[(i - 1) % len(last_names)]
            full_name = f"{fname} {lname}"
            rank = ranks[(i - 1) % len(ranks)]
            z_id = zones[i % len(zones)].zone_id
            officers_list.append(Officer(
                badge_number=f"TR-{1000 + i}",
                full_name=f"{rank} {full_name}",
                rank_title=rank,
                zone_id=z_id,
                phone=f"98200{i:05d}",
                email=f"{fname.lower()}.{lname.lower()}{i}@traffic.gov.in",
                status="ACTIVE"
            ))
        db.add_all(officers_list)
        db.flush()
        print(f" - Created {len(officers_list)} Traffic Officers")

        # ----------------------------------------------------
        # 8. VIOLATION TYPES (8 Standard Violation Categories)
        # ----------------------------------------------------
        vio_types_info = [
            ("VIO_SPEEDING", "Over Speeding", "Vehicle exceeded prescribed segment speed limit", 2000.00, 3, "MAJOR"),
            ("VIO_RED_LIGHT", "Red Light Violation", "Vehicle crossed signal stop line during red signal phase", 1500.00, 2, "MAJOR"),
            ("VIO_NO_HELMET", "Riding Without Helmet", "Rider or pillion observed without protective helmet", 1000.00, 1, "MINOR"),
            ("VIO_NO_SEATBELT", "Driving Without Seatbelt", "Driver or front passenger not wearing seatbelt", 1000.00, 1, "MINOR"),
            ("VIO_USE_PHONE", "Mobile Phone Usage", "Handheld mobile usage detected while driving", 2500.00, 4, "MAJOR"),
            ("VIO_WRONG_SIDE", "Wrong-Side Driving", "Vehicle driven against designated lane direction", 3000.00, 5, "SEVERE"),
            ("VIO_OVERLOADING", "Commercial Vehicle Overloading", "Axle load exceeded authorized GVW rating", 5000.00, 6, "CRITICAL"),
            ("VIO_PARKING", "Illegal No-Parking Zone", "Vehicle parked in designated emergency or clearway zone", 500.00, 0, "MINOR")
        ]
        vio_types = [ViolationType(code=c, title=t, description=d, base_fine=bf, demerit_points=dp, severity=sev)
                     for c, t, d, bf, dp, sev in vio_types_info]
        db.add_all(vio_types)
        db.flush()
        print(f" - Created {len(vio_types)} Violation Types")

        # ----------------------------------------------------
        # 9. OWNERS (200 Owners)
        # ----------------------------------------------------
        owners_list = []
        owner_types = ["INDIVIDUAL"] * 170 + ["CORPORATE"] * 25 + ["GOVERNMENT"] * 5
        city_names = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad"]

        for i in range(1, 201):
            o_type = owner_types[i - 1]
            if o_type == "INDIVIDUAL":
                fname = first_names[(i * 3) % len(first_names)]
                lname = last_names[(i * 7) % len(last_names)]
                name = f"{fname} {lname}"
                email = f"{fname.lower()}.{lname.lower()}{i}@example.com"
            elif o_type == "CORPORATE":
                company_prefixes = ["Apex", "Reliance", "Infosys", "Tata", "Mahindra", "VRL", "BlueDart", "SwiftLogix"]
                name = f"{company_prefixes[i % len(company_prefixes)]} Fleet Services Ltd {i}"
                email = f"fleet{i}@{company_prefixes[i % len(company_prefixes)].lower()}logistics.com"
            else:
                dept = ["State Transport Dept", "Municipal Corp Fleet", "Public Works Dept"]
                name = f"{dept[i % len(dept)]} Unit {i}"
                email = f"govt.fleet{i}@state.gov.in"

            c_name = city_names[i % len(city_names)]
            owners_list.append(Owner(
                national_id=f"IND-NAT-{90000 + i}",
                full_name=name,
                email=email,
                phone=f"98765{i:05d}",
                address=f"{10 + i} Central Avenue, Sector {i % 20 + 1}, {c_name}",
                owner_type=o_type,
                created_at=datetime.datetime(2024, 1, 1) + datetime.timedelta(days=i)
            ))
        db.add_all(owners_list)
        db.flush()
        print(f" - Created {len(owners_list)} Owners")

        # ----------------------------------------------------
        # 10. DRIVERS & LICENSES (150 Drivers & Licenses)
        # ----------------------------------------------------
        drivers_list = []
        licenses_list = []
        blood_groups = ["A+", "B+", "O+", "AB+", "A-", "O-"]
        lic_categories = ["LMV", "MCWG", "HMV", "TRANS", "COMMERCIAL"]
        state_codes = ["MH-01", "MH-12", "DL-01", "DL-07", "KA-03", "KA-05"]

        for i in range(1, 151):
            fname = first_names[(i * 2) % len(first_names)]
            lname = last_names[(i * 5) % len(last_names)]
            dob = datetime.date(1975, 1, 1) + datetime.timedelta(days=i * 70)
            owner_ref = owners_list[i - 1].owner_id if i <= 150 else None

            driver = Driver(
                owner_id=owner_ref,
                full_name=f"{fname} {lname}",
                dob=dob,
                blood_group=blood_groups[i % len(blood_groups)],
                phone=f"98111{i:05d}",
                email=f"driver.{fname.lower()}{i}@example.com",
                created_at=datetime.datetime(2024, 2, 1) + datetime.timedelta(days=i)
            )
            drivers_list.append(driver)
        db.add_all(drivers_list)
        db.flush()

        for i, driver in enumerate(drivers_list, 1):
            scode = state_codes[i % len(state_codes)]
            cat = lic_categories[i % len(lic_categories)]
            i_date = datetime.date(2012, 1, 1) + datetime.timedelta(days=i * 20)
            e_date = i_date + datetime.timedelta(days=365 * 20)
            demerits = (i * 3) % 13
            status = "SUSPENDED" if demerits >= 12 else ("EXPIRED" if i % 15 == 0 else "VALID")

            lic = License(
                license_number=f"{scode}-2012{i:05d}",
                driver_id=driver.driver_id,
                category=cat,
                issue_date=i_date,
                expiry_date=e_date,
                demerit_points=demerits,
                status=status
            )
            licenses_list.append(lic)
        db.add_all(licenses_list)
        db.flush()
        print(f" - Created {len(drivers_list)} Drivers & {len(licenses_list)} Licenses")

        # ----------------------------------------------------
        # 11. VEHICLES (300 Vehicles)
        # ----------------------------------------------------
        vehicles_list = []
        makes_models = [
            ("Honda", "City", "CAR", "PETROL"),
            ("Maruti", "Swift", "CAR", "PETROL"),
            ("Hyundai", "Creta", "SUV", "DIESEL"),
            ("Tata", "Nexon", "SUV", "ELECTRIC"),
            ("Toyota", "Fortuner", "SUV", "DIESEL"),
            ("Mahindra", "Thar", "SUV", "DIESEL"),
            ("Royal Enfield", "Classic 350", "TWO_WHEELER", "PETROL"),
            ("Honda", "Activa 6G", "TWO_WHEELER", "PETROL"),
            ("TVS", "Jupiter", "TWO_WHEELER", "PETROL"),
            ("Tata", "Ace Gold", "TRUCK", "DIESEL"),
            ("Ashok Leyland", "Dost", "TRUCK", "DIESEL"),
            ("Volvo", "9600 Multi-Axle", "BUS", "DIESEL"),
            ("Bajaj", "RE Compact", "AUTO_RICKSHAW", "CNG")
        ]
        series_codes = ["MH01", "MH02", "MH04", "MH12", "MH14", "DL01", "DL03", "DL07", "KA01", "KA03", "KA05"]

        for i in range(1, 301):
            owner = owners_list[i % len(owners_list)]
            make, model, v_class_raw, fuel = makes_models[i % len(makes_models)]
            v_class = "COMMERCIAL" if v_class_raw in ["TRUCK", "BUS", "AUTO_RICKSHAW"] else "PRIVATE"
            series = series_codes[i % len(series_codes)]
            chars = chr(65 + (i % 26)) + chr(65 + ((i + 3) % 26))
            reg_no = f"{series}{chars}{1000 + i}"
            mfg_year = 2016 + (i % 9)
            reg_dt = datetime.date(mfg_year, (i % 12) + 1, (i % 28) + 1)
            v_status = "STOLEN" if i == 50 else ("SCRAPPED" if i == 100 else "ACTIVE")

            vehicles_list.append(Vehicle(
                registration_no=reg_no,
                owner_id=owner.owner_id,
                vehicle_class=v_class,
                make=make,
                model=model,
                fuel_type=fuel,
                mfg_year=mfg_year,
                reg_date=reg_dt,
                status=v_status
            ))
        db.add_all(vehicles_list)
        db.flush()
        print(f" - Created {len(vehicles_list)} Vehicles")

        # ----------------------------------------------------
        # 12. VEHICLE INSURANCE & POLLUTION CERTIFICATES (300 Each)
        # ----------------------------------------------------
        ins_list = []
        puc_list = []
        providers = ["HDFC ERGO", "ICICI Lombard", "Bajaj Allianz", "Tata AIG", "Star Health"]

        for i, veh in enumerate(vehicles_list, 1):
            # Insurance
            s_date = datetime.date(2025, 1, 1) + datetime.timedelta(days=i)
            e_date = s_date + datetime.timedelta(days=365)
            ins_list.append(VehicleInsurance(
                vehicle_id=veh.vehicle_id,
                policy_number=f"POL-2026-{80000 + i}",
                provider_name=providers[i % len(providers)],
                start_date=s_date,
                end_date=e_date,
                insured_amount=round(300000.00 + (i * 2500.00), 2)
            ))

            # PUC
            p_issue = datetime.date(2025, 6, 1) + datetime.timedelta(days=i)
            p_exp = p_issue + datetime.timedelta(days=180)
            p_status = "EXPIRED" if i % 10 == 0 else ("FAIL" if i % 25 == 0 else "PASS")
            puc_list.append(PollutionCertificate(
                vehicle_id=veh.vehicle_id,
                certificate_no=f"PUC-2026-{70000 + i}",
                issue_date=p_issue,
                expiry_date=p_exp,
                co2_reading=round(1.5 + (i % 30) * 0.1, 2),
                status=p_status
            ))

        db.add_all(ins_list)
        db.add_all(puc_list)
        db.flush()
        print(f" - Created {len(ins_list)} Insurance Policies & {len(puc_list)} PUC Certificates")

        # ----------------------------------------------------
        # 13. VEHICLE DETECTION EVENTS (2,500 Events with Peak Traffic Curves)
        # ----------------------------------------------------
        events_list = []
        base_time = datetime.datetime(2026, 7, 1, 0, 0, 0)
        statuses_evt = ["PROCESSED", "VIOLATION_CONFIRMED", "CLEARED", "UNPROCESSED"]

        # Skew time distribution for peak traffic (07:00-10:00 & 17:00-21:00)
        hours_distribution = [
            0, 1, 2, 3, 4, 5, 6,
            7, 7, 8, 8, 8, 9, 9, 10,
            11, 12, 13, 14, 15, 16,
            17, 17, 18, 18, 18, 19, 19, 20, 20, 21,
            22, 23
        ]

        for i in range(1, 2501):
            cam = cameras_list[i % len(cameras_list)]
            veh = vehicles_list[i % len(vehicles_list)]
            day_offset = i % 90
            hour_val = hours_distribution[i % len(hours_distribution)]
            minute_val = (i * 13) % 60
            sec_val = (i * 29) % 60
            evt_time = base_time + datetime.timedelta(days=day_offset, hours=hour_val, minutes=minute_val, seconds=sec_val)

            # Observed speed simulation
            road_id = cam.segment.road_id
            limit = [r for r in roads_list if r.road_id == road_id][0].speed_limit_kmh
            is_overspeed = (i % 3 == 0)
            speed = round(limit + random.uniform(12.0, 45.0), 1) if is_overspeed else round(limit - random.uniform(5.0, 15.0), 1)
            ai_conf = round(85.0 + random.uniform(0.0, 14.5), 2)
            e_status = "VIOLATION_CONFIRMED" if is_overspeed else statuses_evt[i % len(statuses_evt)]

            events_list.append(VehicleEvent(
                camera_id=cam.camera_id,
                vehicle_id=veh.vehicle_id,
                license_plate_raw=veh.registration_no,
                event_timestamp=evt_time,
                observed_speed=speed,
                ai_confidence=ai_conf,
                event_status=e_status,
                mongo_doc_id=f"mongo_evt_{i}"
            ))
        db.add_all(events_list)
        db.flush()
        print(f" - Created {len(events_list)} Vehicle Detection Events")

        # ----------------------------------------------------
        # 14. VIOLATIONS (900 Violations with Repeat Offender Hotspots)
        # ----------------------------------------------------
        violations_list = []
        fines_list = []
        confirmed_events = [e for e in events_list if e.event_status == "VIOLATION_CONFIRMED"]

        # Create repeat offenders pool (e.g. top 10 repeat vehicles get multiple violations)
        repeat_vehicles = vehicles_list[:10]
        normal_vehicles = vehicles_list[10:180]

        for i in range(1, 901):
            if i <= len(confirmed_events):
                evt = confirmed_events[i - 1]
                v_veh = [v for v in vehicles_list if v.vehicle_id == evt.vehicle_id][0]
                cam = evt.camera
                evt_id = evt.event_id
                v_dt = evt.event_timestamp
            else:
                evt_id = None
                cam = cameras_list[i % len(cameras_list)]
                v_dt = base_time + datetime.timedelta(days=i % 90, hours=(i * 3) % 24)
                # Assign 35% of remaining violations to top repeat vehicles
                v_veh = repeat_vehicles[i % len(repeat_vehicles)] if i % 3 == 0 else normal_vehicles[i % len(normal_vehicles)]

            # Pick driver if available
            drv_match = [d for d in drivers_list if d.owner_id == v_veh.owner_id]
            drv_id = drv_match[0].driver_id if drv_match else drivers_list[i % len(drivers_list)].driver_id
            v_type = vio_types[i % len(vio_types)]
            officer = officers_list[i % len(officers_list)]

            v_status = "PAID" if i <= 480 else ("UNPAID" if i <= 800 else ("UNDER_APPEAL" if i <= 875 else "DISMISSED"))

            viol = Violation(
                event_id=evt_id,
                vehicle_id=v_veh.vehicle_id,
                driver_id=drv_id,
                type_id=v_type.type_id,
                camera_id=cam.camera_id,
                officer_id=officer.officer_id,
                violation_dt=v_dt,
                status=v_status,
                remarks=f"Automated sensor detection: {v_type.title} logged at camera {cam.camera_code}"
            )
            violations_list.append(viol)
        db.add_all(violations_list)
        db.flush()

        # ----------------------------------------------------
        # 15. FINES (900 Fines)
        # ----------------------------------------------------
        for i, viol in enumerate(violations_list, 1):
            v_type = [vt for vt in vio_types if vt.type_id == viol.type_id][0]
            base_amt = float(v_type.base_fine)
            penalty_amt = 200.00 if i % 7 == 0 else 0.00
            total_amt = base_amt + penalty_amt
            iss_date = viol.violation_dt.date()
            due_date = iss_date + datetime.timedelta(days=30)
            f_status = "PAID" if viol.status == "PAID" else ("WAIVED" if viol.status == "DISMISSED" else ("OVERDUE" if penalty_amt > 0 else "UNPAID"))

            fine = Fine(
                violation_id=viol.violation_id,
                base_amount=base_amt,
                penalty_amount=penalty_amt,
                total_amount=total_amt,
                issue_date=iss_date,
                due_date=due_date,
                status=f_status
            )
            fines_list.append(fine)
        db.add_all(fines_list)
        db.flush()
        print(f" - Created {len(violations_list)} Violations & {len(fines_list)} Fines")

        # ----------------------------------------------------
        # 16. PAYMENTS (500 Payments)
        # ----------------------------------------------------
        payments_list = []
        methods = ["CREDIT_CARD", "UPI", "NET_BANKING", "DEBIT_CARD", "CASH_COUNTER"]
        paid_fines = [f for f in fines_list if f.status == "PAID"]

        for i, fine in enumerate(paid_fines, 1):
            pay_date = datetime.datetime.combine(fine.issue_date, datetime.time(10, 0)) + datetime.timedelta(days=(i % 14) + 1)
            method = methods[i % len(methods)]
            payments_list.append(Payment(
                fine_id=fine.fine_id,
                payment_amount=float(fine.total_amount),
                payment_date=pay_date,
                payment_method=method,
                txn_ref_no=f"TXN-2026-{90000 + i}",
                status="SUCCESS"
            ))
        db.add_all(payments_list)
        db.flush()
        print(f" - Created {len(payments_list)} Financial Payments")

        # ----------------------------------------------------
        # 17. APPEALS & REVIEWS (75 Appeals & 50 Reviews)
        # ----------------------------------------------------
        appeals_list = []
        reviews_list = []
        appeal_reasons = [
            "Emergency medical transit to Ruby Hall Clinic during traffic light transition.",
            "ANPR camera glare misread license plate digit 8 as 3.",
            "Vehicle was towed by municipal traffic authority at time of event.",
            "Traffic signal timer malfunctioned during amber phase.",
            "Obstruction on highway required momentary speed acceleration for safety."
        ]
        appeal_violations = [v for v in violations_list if v.status in ["UNPAID", "UNDER_APPEAL", "DISMISSED"]][:75]

        for i, viol in enumerate(appeal_violations, 1):
            app_date = viol.violation_dt + datetime.timedelta(days=2)
            reason = appeal_reasons[i % len(appeal_reasons)]
            a_status = "APPROVED" if i <= 25 else ("REJECTED" if i <= 50 else ("UNDER_REVIEW" if i <= 65 else "SUBMITTED"))

            appeal = Appeal(
                violation_id=viol.violation_id,
                appellant_id=viol.vehicle.owner_id,
                appeal_date=app_date,
                reason=reason,
                status=a_status
            )
            appeals_list.append(appeal)
        db.add_all(appeals_list)
        db.flush()

        for i, appeal in enumerate(appeals_list[:50], 1):
            officer = officers_list[i % len(officers_list)]
            rev_date = appeal.appeal_date + datetime.timedelta(days=3)
            decision = "APPROVED" if appeal.status == "APPROVED" else "REJECTED"
            comments = f"Adjudicated by {officer.full_name}: Evidence verified. Appeal decision set to {decision}."

            reviews_list.append(AppealReview(
                appeal_id=appeal.appeal_id,
                officer_id=officer.officer_id,
                review_date=rev_date,
                decision=decision,
                comments=comments
            ))
        db.add_all(reviews_list)
        db.flush()
        print(f" - Created {len(appeals_list)} Appeals & {len(reviews_list)} Appeal Reviews")

        # ----------------------------------------------------
        # 18. EVIDENCE (750 Evidence Files Metadata)
        # ----------------------------------------------------
        evidence_list = []
        ev_types = ["IMAGE_SNAPSHOT", "VIDEO_CLIP", "ANPR_CROP", "LIDAR_DATA"]
        for i, viol in enumerate(violations_list[:750], 1):
            ev_type = ev_types[i % len(ev_types)]
            ext = "mp4" if ev_type == "VIDEO_CLIP" else "jpg"
            f_path = f"/storage/evidence/2026/09/CAM-{viol.camera_id:03d}/V-{viol.violation_id:05d}.{ext}"
            h_val = generate_sha256(f"STVAMS_EVID_{viol.violation_id}_{i}")

            evidence_list.append(Evidence(
                violation_id=viol.violation_id,
                evidence_type=ev_type,
                file_path=f_path,
                captured_at=viol.violation_dt,
                file_hash_sha256=h_val,
                confidence_score=round(88.0 + (i % 12) * 0.9, 2)
            ))
        db.add_all(evidence_list)
        db.flush()
        print(f" - Created {len(evidence_list)} Evidence Metadata Records")

        # Commit all operational seed data
        db.commit()
        print("\n[OPERATIONAL DB SEED COMPLETE]: All 22 relational entities populated successfully!")

    except Exception as e:
        db.rollback()
        print(f"[FATAL SEED ERROR]: Relational DB seed failed: {e}")
        raise e
    finally:
        db.close()

def seed_mongodb_data():
    """
    Seeds MongoDB semi-structured collection stvams_events.detection_events.
    """
    print("\n==================================================")
    print("2. SEEDING MONGODB SEMI-STRUCTURED EVENTS")
    print("==================================================")

    docs = []
    cam_codes = ["CAM-SYS-001", "CAM-SYS-002", "CAM-SYS-003", "CAM-SYS-004", "CAM-SYS-005"]
    tags_pool = ["overspeeding", "red_light", "no_helmet", "no_seatbelt", "high_risk", "processed"]

    for i in range(1, 1501):
        docs.append({
            "event_id": f"mongo_evt_{i}",
            "vehicle_number": f"MH01AB{1000 + (i % 300)}",
            "timestamp": (datetime.datetime(2026, 7, 1) + datetime.timedelta(hours=i)).isoformat(),
            "camera": {
                "id": (i % 40) + 1,
                "code": cam_codes[i % len(cam_codes)],
                "location": f"Zone {i % 10 + 1} Corridor",
                "type": "ANPR" if i % 2 == 0 else "SPEED"
            },
            "detection": {
                "vehicle_type": "SEDAN" if i % 3 == 0 else "SUV",
                "speed": round(50.0 + (i % 45), 1),
                "speed_limit": 60.0,
                "helmet_detected": None if i % 2 == 0 else (True if i % 3 == 0 else False),
                "seatbelt_detected": True if i % 2 == 0 else False,
                "plate_confidence": round(90.0 + (i % 10), 2)
            },
            "evidence": {
                "image_path": f"/storage/evidence/2026/09/evt_{i}_full.jpg",
                "video_path": f"/storage/evidence/2026/09/evt_{i}_clip.mp4" if i % 4 == 0 else None,
                "hash": generate_sha256(f"MONGO_EVT_{i}")
            },
            "tags": [tags_pool[i % len(tags_pool)], tags_pool[(i + 2) % len(tags_pool)]],
            "processed": True if i % 2 == 0 else False
        })

    # Save local json backup
    out_dir = "data/mongodb"
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "seed_events.json")
    import json
    with open(out_file, "w") as f:
        json.dump(docs, f, indent=2)

    print(f" - Exported {len(docs)} MongoDB documents to: {out_file}")

    try:
        import pymongo
        client = pymongo.MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
        mongo_db = client["stvams_events"]
        mongo_db.detection_events.drop()
        mongo_db.detection_events.insert_many(docs)
        print(f" [MONGODB SUCCESS]: Seeded {len(docs)} documents into stvams_events.detection_events!")
    except Exception as e:
        print(f" [MONGODB LOCAL FALLBACK]: MongoDB server offline ({e}). Used JSON fallback file.")

def run_warehouse_etl_pipeline():
    """
    Runs full Star Schema ETL populating Data Warehouse tables from Operational DB.
    """
    print("\n==================================================")
    print("3. EXECUTING DATA WAREHOUSE OLAP ETL PIPELINE")
    print("==================================================")

    from database.warehouse.etl import run_etl
    run_etl()

def run_parquet_export_pipeline():
    """
    Exports operational events to Apache Parquet columnar format.
    """
    print("\n==================================================")
    print("4. EXECUTING PARQUET COLUMNAR EXPORT PIPELINE")
    print("==================================================")

    from backend.app.integrations.parquet.parquet_export import export_traffic_events_to_parquet
    db = SessionLocal()
    try:
        path = export_traffic_events_to_parquet(db=db, output_filepath="data/parquet/events.parquet")
        print(f" [PARQUET SUCCESS]: Parquet pipeline generated dataset at: {path}")
    finally:
        db.close()

def run_mapreduce_pipeline_driver():
    """
    Executes local MapReduce streaming jobs on the exported Parquet/JSON event dataset.
    """
    print("\n==================================================")
    print("5. EXECUTING LOCAL HADOOP MAPREDUCE STREAMING JOBS")
    print("==================================================")

    from bigdata.mapreduce.driver import run_mapreduce_pipeline, locate_input_data
    input_json = locate_input_data("data/parquet/events.json")

    for job in ["zone", "hourly", "segment"]:
        print(f" -> Running MapReduce Job: {job.upper()}")
        run_mapreduce_pipeline(input_data=input_json, job_type=job)

if __name__ == "__main__":
    seed_relational_database()
    seed_mongodb_data()
    run_warehouse_etl_pipeline()
    run_parquet_export_pipeline()
    run_mapreduce_pipeline_driver()
    print("\n==================================================")
    print(" MASTER SEED PIPELINE EXECUTED SUCCESSFULLY!")
    print("==================================================")
