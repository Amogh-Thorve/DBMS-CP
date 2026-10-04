"""
============================================================================
STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
File: database/warehouse/etl.py
Description: Python Data Warehouse ETL Pipeline (Extract, Transform, Load)
Extracts operational SQLite/Oracle DB records and populates Star Schema tables.
Author: STVAMS Core Architecture Team
============================================================================
"""

import datetime
import os
import sys

# Ensure backend directory is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from sqlalchemy.orm import Session
from app.db.database import engine, SessionLocal
from app.models.models import (
    Vehicle, Camera, TrafficZone, ViolationType, Violation, Fine, Payment, VehicleEvent
)
from database.warehouse.models import (
    BaseDW, DimDate, DimTime, DimVehicle, DimCamera, DimZone, DimViolationType,
    FactViolation, FactPayment
)

def run_etl():
    """
    Executes ETL processing from Operational DB to Data Warehouse Star Schema.
    """
    print("==================================================")
    print("STVAMS ETL PIPELINE EXECUTION STARTED")
    print(f"Timestamp: {datetime.datetime.now().isoformat()}")
    print("==================================================")

    # Initialize Star Schema tables
    BaseDW.metadata.create_all(bind=engine)

    op_db = SessionLocal()
    dw_db = SessionLocal()

    try:
        # 1. EXTRACT OPERATIONAL RECORDS
        print("[ETL Phase 1/3]: Extracting Operational Data...")
        vehicles = op_db.query(Vehicle).all()
        cameras = op_db.query(Camera).all()
        zones = op_db.query(TrafficZone).all()
        v_types = op_db.query(ViolationType).all()
        violations = op_db.query(Violation).all()
        payments = op_db.query(Payment).all()

        print(f" - Extracted {len(vehicles)} Vehicles")
        print(f" - Extracted {len(cameras)} Cameras")
        print(f" - Extracted {len(zones)} Zones")
        print(f" - Extracted {len(v_types)} Violation Types")
        print(f" - Extracted {len(violations)} Violations")
        print(f" - Extracted {len(payments)} Payments")

        # Clear existing DW rows for fresh execution
        dw_db.query(FactPayment).delete()
        dw_db.query(FactViolation).delete()
        dw_db.query(DimViolationType).delete()
        dw_db.query(DimZone).delete()
        dw_db.query(DimCamera).delete()
        dw_db.query(DimVehicle).delete()
        dw_db.query(DimTime).delete()
        dw_db.query(DimDate).delete()
        dw_db.commit()

        # 2. TRANSFORM & LOAD DIMENSIONS
        print("[ETL Phase 2/3]: Transforming & Loading Dimensions...")

        # DIM_DATE (Load dates across 2026)
        start_dt = datetime.date(2026, 1, 1)
        dim_dates = []
        for d in range(365):
            curr = start_dt + datetime.timedelta(days=d)
            d_key = int(curr.strftime("%Y%m%d"))
            dim_dates.append(DimDate(
                date_key=d_key,
                full_date=curr,
                day_of_week=curr.strftime("%A"),
                day_of_month=curr.day,
                month_name=curr.strftime("%B"),
                quarter=f"Q{(curr.month - 1) // 3 + 1}",
                year=curr.year,
                is_weekend=1 if curr.weekday() in [5, 6] else 0
            ))
        dw_db.add_all(dim_dates)

        # DIM_TIME (24 Hours)
        dim_times = []
        for h in range(24):
            t_key = h * 10000
            tod = "MORNING_PEAK" if 7 <= h <= 10 else ("EVENING_PEAK" if 17 <= h <= 21 else ("NIGHT" if h >= 22 or h <= 5 else "DAY_NORMAL"))
            dim_times.append(DimTime(
                time_key=t_key,
                hour_24=h,
                minute=0,
                time_of_day=tod
            ))
        dw_db.add_all(dim_times)

        # DIM_VEHICLE
        veh_sk_map = {}
        for v in vehicles:
            d_v = DimVehicle(
                vehicle_id=v.vehicle_id,
                registration_no=v.registration_no,
                vehicle_class=v.vehicle_class,
                make=v.make,
                model=v.model,
                fuel_type=v.fuel_type,
                owner_type=v.owner.owner_type if v.owner else "INDIVIDUAL"
            )
            dw_db.add(d_v)
            dw_db.flush()
            veh_sk_map[v.vehicle_id] = d_v.vehicle_sk

        # DIM_CAMERA
        cam_sk_map = {}
        for c in cameras:
            d_c = DimCamera(
                camera_id=c.camera_id,
                camera_code=c.camera_code,
                camera_type=c.camera_type,
                direction=c.direction or "NORTHBOUND"
            )
            dw_db.add(d_c)
            dw_db.flush()
            cam_sk_map[c.camera_id] = d_c.camera_sk

        # DIM_ZONE
        zone_sk_map = {}
        for z in zones:
            d_z = DimZone(
                zone_id=z.zone_id,
                zone_code=z.zone_code,
                zone_name=z.zone_name,
                city_name=z.city.city_name if z.city else "Mumbai",
                risk_level=z.risk_level
            )
            dw_db.add(d_z)
            dw_db.flush()
            zone_sk_map[z.zone_id] = d_z.zone_sk

        # DIM_VIOLATION_TYPE
        type_sk_map = {}
        for vt in v_types:
            d_vt = DimViolationType(
                type_id=vt.type_id,
                code=vt.code,
                title=vt.title,
                severity=vt.severity
            )
            dw_db.add(d_vt)
            dw_db.flush()
            type_sk_map[vt.type_id] = d_vt.type_sk

        dw_db.commit()
        print(" - Loaded Dimensions (DIM_DATE, DIM_TIME, DIM_VEHICLE, DIM_CAMERA, DIM_ZONE, DIM_VIOLATION_TYPE)")

        # 3. TRANSFORM & LOAD FACTS
        print("[ETL Phase 3/3]: Loading Fact Tables...")

        # Build events lookup map
        events = op_db.query(VehicleEvent).all()
        evt_map = {e.event_id: e for e in events if e.event_id}

        # FACT_VIOLATION
        for viol in violations:
            dt = viol.violation_dt
            d_key = int(dt.strftime("%Y%m%d"))
            t_key = dt.hour * 10000
            v_sk = veh_sk_map.get(viol.vehicle_id)
            c_sk = cam_sk_map.get(viol.camera_id)
            z_id = viol.camera.segment.road.zone_id if viol.camera and viol.camera.segment and viol.camera.segment.road else 1
            z_sk = zone_sk_map.get(z_id)
            t_sk = type_sk_map.get(viol.type_id)

            fine_amt = float(viol.fine.base_amount) if viol.fine else 1500.00
            pen_amt = float(viol.fine.penalty_amount) if viol.fine else 0.00
            tot_amt = float(viol.fine.total_amount) if viol.fine else fine_amt

            evt_obj = evt_map.get(viol.event_id)
            obs_speed = float(evt_obj.observed_speed) if evt_obj and evt_obj.observed_speed else 75.0

            dw_db.add(FactViolation(
                date_key=d_key,
                time_key=t_key,
                vehicle_sk=v_sk,
                camera_sk=c_sk,
                zone_sk=z_sk,
                type_sk=t_sk,
                violation_count=1,
                base_fine_amt=fine_amt,
                penalty_amt=pen_amt,
                total_fine_amt=tot_amt,
                observed_speed=obs_speed
            ))

        # FACT_PAYMENT
        for pay in payments:
            dt = pay.payment_date
            d_key = int(dt.strftime("%Y%m%d"))
            viol = pay.fine.violation if pay.fine else None
            z_id = viol.camera.segment.road.zone_id if viol and viol.camera and viol.camera.segment and viol.camera.segment.road else 1
            z_sk = zone_sk_map.get(z_id)
            t_sk = type_sk_map.get(viol.type_id) if viol else list(type_sk_map.values())[0]

            dw_db.add(FactPayment(
                date_key=d_key,
                zone_sk=z_sk,
                type_sk=t_sk,
                payment_count=1,
                amount_collected=float(pay.payment_amount)
            ))

        dw_db.commit()
        print(f" - Loaded {len(violations)} FACT_VIOLATION records")
        print(f" - Loaded {len(payments)} FACT_PAYMENT records")

        print("==================================================")
        print("STVAMS ETL PIPELINE COMPLETED SUCCESSFULLY!")
        print("==================================================")

    except Exception as e:
        dw_db.rollback()
        print(f"[ETL ERROR]: Execution failed: {e}")
        raise e
    finally:
        op_db.close()
        dw_db.close()

if __name__ == "__main__":
    run_etl()
