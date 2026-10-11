"""
==============================================================================
STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
File: database/seed/demo_seed.py
Description: Safe, Idempotent Demonstration Dataset Seeder & Pinned Live-Demo Records
==============================================================================
"""

import sys
import os
import argparse
import datetime
from sqlalchemy.orm import Session

# Ensure repo root and backend are in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from app.db.database import SessionLocal, engine
from app.models.models import (
    Vehicle, Owner, Driver, License, Camera, Violation, Fine, Payment,
    ViolationType, TrafficZone, VehicleInsurance, PollutionCertificate
)

DEMO_PLATE = "MH02DM2026"

def ensure_live_demo_vehicle(db: Session):
    """
    Idempotently seeds a dedicated Faculty Evaluation Vehicle:
    - Plate: MH02DM2026
    - Owner: Prof. Rajiv Sharma (Academic Evaluation Officer)
    - Valid insurance, valid PUC, clean violation slate ready for live citation.
    """
    print(f"[*] Ensuring dedicated live demo vehicle '{DEMO_PLATE}' exists...")
    existing = db.query(Vehicle).filter(Vehicle.registration_no == DEMO_PLATE).first()
    if existing:
        print(f"  [+] Demo vehicle '{DEMO_PLATE}' already exists (ID: {existing.vehicle_id}).")
        return existing

    # Find or create dedicated demo owner
    owner = db.query(Owner).filter(Owner.email == "demo.faculty@stvams.gov.in").first()
    if not owner:
        owner = Owner(
            national_id="IND-FACULTY-2026-99",
            full_name="Prof. Rajiv Sharma",
            phone="9820099999",
            email="demo.faculty@stvams.gov.in",
            address="Department of Computer Science & Engineering, IIT Bombay, Powai, Mumbai",
            owner_type="INDIVIDUAL"
        )
        db.add(owner)
        db.flush()
        print(f"  [+] Created demo owner: {owner.full_name} (ID: {owner.owner_id})")

    # Create demo driver
    driver = db.query(Driver).filter(Driver.owner_id == owner.owner_id).first()
    if not driver:
        driver = Driver(
            owner_id=owner.owner_id,
            full_name="Rajiv Sharma",
            dob=datetime.date(1982, 5, 14),
            blood_group="O+",
            phone="9820099999",
            email="rajiv.sharma@iitb.ac.in"
        )
        db.add(driver)
        db.flush()
        print(f"  [+] Created demo driver: {driver.full_name}")

    # Create demo vehicle
    demo_veh = Vehicle(
        registration_no=DEMO_PLATE,
        owner_id=owner.owner_id,
        vehicle_class="PRIVATE",
        make="Hyundai",
        model="Creta 1.5 SX",
        fuel_type="PETROL",
        mfg_year=2024,
        reg_date=datetime.date(2024, 3, 15),
        status="ACTIVE"
    )
    db.add(demo_veh)
    db.flush()

    # Add active insurance
    ins = VehicleInsurance(
        vehicle_id=demo_veh.vehicle_id,
        policy_number="POL-2026-DEMO-9999",
        provider_name="HDFC ERGO General Insurance",
        start_date=datetime.date(2026, 1, 1),
        end_date=datetime.date(2027, 1, 1),
        insured_amount=1500000.00
    )
    db.add(ins)

    # Add valid PUC
    puc = PollutionCertificate(
        vehicle_id=demo_veh.vehicle_id,
        certificate_no="PUC-2026-DEMO-8888",
        issue_date=datetime.date(2026, 6, 1),
        expiry_date=datetime.date(2026, 12, 1),
        co2_reading=1.12,
        status="PASS"
    )
    db.add(puc)

    db.commit()
    print(f"  [SUCCESS] Demo vehicle '{DEMO_PLATE}' successfully created and primed for live demo!")
    return demo_veh

def main():
    parser = argparse.ArgumentParser(description="STVAMS Demo Seed & Verification Tool")
    parser.add_argument("--prime", action="store_true", default=True, help="Prime dedicated live demo records without resetting database")
    parser.add_argument("--reset", action="store_true", help="Perform full reset and master re-seed (DESTRUCTIVE - requires explicit prompt)")
    args = parser.parse_args()

    if args.reset:
        confirm = input("WARNING: Full reset will drop and recreate all tables in stvams_dev.db! Type 'CONFIRM' to proceed: ")
        if confirm.strip() != "CONFIRM":
            print("[ABORTED] Reset cancelled by user.")
            sys.exit(0)
        from database.seed.master_seed import seed_relational_database, seed_mongodb, seed_data_warehouse, seed_parquet, run_mapreduce_simulation
        print("[*] Running full master seed pipeline...")
        seed_relational_database()
        seed_mongodb()
        seed_data_warehouse()
        seed_parquet()
        run_mapreduce_simulation()

    db = SessionLocal()
    try:
        ensure_live_demo_vehicle(db)
    finally:
        db.close()

    # Also run seed validation to print clean summary
    from database.seed.validate_seed import run_seed_validation
    print("\n[*] Running Seed Validation Check...")
    run_seed_validation()

if __name__ == "__main__":
    main()
