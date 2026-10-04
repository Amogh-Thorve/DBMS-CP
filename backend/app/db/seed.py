import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.models import (
    City, TrafficZone, Road, RoadSegment, Camera, Owner, Driver, License,
    Vehicle, ViolationType, Officer, VehicleEvent, Violation, Fine, Payment, Appeal
)

logger = logging.getLogger("stvams.seed")

def seed_initial_data(db: Session):
    """
    Populates comprehensive realistic seed data if the database is currently unpopulated.
    """
    if db.query(City).count() > 0:
        return  # Database already seeded

    logger.info("Seeding database with initial Smart City STVAMS operational data...")

    try:
        # 1. Cities
        mumbai = City(city_name="Mumbai", state_name="Maharashtra", country="India")
        delhi = City(city_name="New Delhi", state_name="Delhi", country="India")
        bengaluru = City(city_name="Bengaluru", state_name="Karnataka", country="India")
        db.add_all([mumbai, delhi, bengaluru])
        db.flush()

        # 2. Traffic Zones
        z1 = TrafficZone(zone_code="Z-MUM-01", zone_name="South Mumbai Downtown", city_id=mumbai.city_id, risk_level="HIGH")
        z2 = TrafficZone(zone_code="Z-MUM-02", zone_name="Bandra-Kurla Complex (BKC)", city_id=mumbai.city_id, risk_level="MEDIUM")
        z3 = TrafficZone(zone_code="Z-DEL-01", zone_name="Connaught Place Circle", city_id=delhi.city_id, risk_level="CRITICAL")
        z4 = TrafficZone(zone_code="Z-DEL-02", zone_name="South Delhi Ring Road", city_id=delhi.city_id, risk_level="HIGH")
        z5 = TrafficZone(zone_code="Z-BLR-01", zone_name="MG Road Corridor", city_id=bengaluru.city_id, risk_level="MEDIUM")
        z6 = TrafficZone(zone_code="Z-BLR-02", zone_name="Outer Ring Road Silk Board", city_id=bengaluru.city_id, risk_level="CRITICAL")
        db.add_all([z1, z2, z3, z4, z5, z6])
        db.flush()

        # 3. Roads
        r1 = Road(road_name="Marine Drive Expressway", road_type="ARTERIAL", speed_limit_kmh=60, zone_id=z1.zone_id)
        r2 = Road(road_name="Pedder Road", road_type="ARTERIAL", speed_limit_kmh=50, zone_id=z1.zone_id)
        r3 = Road(road_name="BKC Main Avenue", road_type="ARTERIAL", speed_limit_kmh=60, zone_id=z2.zone_id)
        r4 = Road(road_name="Western Express Highway", road_type="EXPRESSWAY", speed_limit_kmh=80, zone_id=z2.zone_id)
        r5 = Road(road_name="Ring Road AIIMS Flyover", road_type="EXPRESSWAY", speed_limit_kmh=70, zone_id=z4.zone_id)
        r6 = Road(road_name="Outer Ring Road Silk Board", road_type="NATIONAL_HIGHWAY", speed_limit_kmh=80, zone_id=z6.zone_id)
        db.add_all([r1, r2, r3, r4, r5, r6])
        db.flush()

        # 4. Road Segments
        seg1 = RoadSegment(segment_code="SEG-MUM-01", road_id=r1.road_id, start_latitude=18.9438, start_longitude=72.8232, end_latitude=18.9550, end_longitude=72.8200, length_km=2.5, is_active=1)
        seg2 = RoadSegment(segment_code="SEG-MUM-02", road_id=r2.road_id, start_latitude=18.9667, start_longitude=72.8083, end_latitude=18.9750, end_longitude=72.8120, length_km=1.8, is_active=1)
        seg3 = RoadSegment(segment_code="SEG-BKC-01", road_id=r3.road_id, start_latitude=19.0657, start_longitude=72.8687, end_latitude=19.0720, end_longitude=72.8750, length_km=3.1, is_active=1)
        seg4 = RoadSegment(segment_code="SEG-DEL-01", road_id=r5.road_id, start_latitude=28.5672, start_longitude=77.2100, end_latitude=28.5800, end_longitude=77.2250, length_km=4.0, is_active=1)
        seg5 = RoadSegment(segment_code="SEG-BLR-01", road_id=r6.road_id, start_latitude=12.9172, start_longitude=77.6228, end_latitude=12.9250, end_longitude=77.6350, length_km=3.5, is_active=1)
        db.add_all([seg1, seg2, seg3, seg4, seg5])
        db.flush()

        # 5. Cameras
        cam1 = Camera(camera_code="CAM-ANPR-MUM-01", camera_type="ANPR", segment_id=seg1.segment_id, direction="NORTHBOUND", status="ACTIVE", ip_address="192.168.1.101")
        cam2 = Camera(camera_code="CAM-SPD-MUM-02", camera_type="SPEED", segment_id=seg2.segment_id, direction="SOUTHBOUND", status="ACTIVE", ip_address="192.168.1.102")
        cam3 = Camera(camera_code="CAM-RLD-BKC-01", camera_type="RED_LIGHT", segment_id=seg3.segment_id, direction="EASTBOUND", status="ACTIVE", ip_address="192.168.1.103")
        cam4 = Camera(camera_code="CAM-ANPR-DEL-01", camera_type="ANPR", segment_id=seg4.segment_id, direction="WESTBOUND", status="ACTIVE", ip_address="192.168.1.104")
        cam5 = Camera(camera_code="CAM-SPD-BLR-01", camera_type="SPEED", segment_id=seg5.segment_id, direction="NORTHBOUND", status="MAINTENANCE", ip_address="192.168.1.105")
        db.add_all([cam1, cam2, cam3, cam4, cam5])
        db.flush()

        # 6. Violation Types
        vt_speed = ViolationType(code="VIO_SPEEDING", title="Over Speeding", description="Vehicle exceeded prescribed segment speed limit", base_fine=2000.00, demerit_points=3, severity="MAJOR")
        vt_red = ViolationType(code="VIO_RED_LIGHT", title="Red Light Jumping", description="Vehicle crossed signal stop line during red signal phase", base_fine=1500.00, demerit_points=2, severity="MAJOR")
        vt_helmet = ViolationType(code="VIO_NO_HELMET", title="Riding Without Helmet", description="Rider or pillion observed without protective helmet", base_fine=1000.00, demerit_points=1, severity="MINOR")
        vt_phone = ViolationType(code="VIO_USE_PHONE", title="Mobile Phone Usage While Driving", description="Handheld mobile usage detected by AI sensor", base_fine=2500.00, demerit_points=4, severity="MAJOR")
        vt_belt = ViolationType(code="VIO_NO_SEATBELT", title="Driving Without Seatbelt", description="Driver or front passenger not wearing seatbelt", base_fine=1000.00, demerit_points=1, severity="MINOR")
        db.add_all([vt_speed, vt_red, vt_helmet, vt_phone, vt_belt])
        db.flush()

        # 7. Officers
        off1 = Officer(badge_number="TR-1001", full_name="Inspector Rajesh Sharma", rank_title="Senior Inspector", zone_id=z1.zone_id, phone="9820011111", email="rajesh.sharma@traffic.gov.in", status="ACTIVE")
        off2 = Officer(badge_number="TR-1002", full_name="Sub-Inspector Priya Verma", rank_title="Sub-Inspector", zone_id=z2.zone_id, phone="9820022222", email="priya.verma@traffic.gov.in", status="ACTIVE")
        off3 = Officer(badge_number="TR-1003", full_name="Assistant Inspector Amit Kumar", rank_title="Assistant Inspector", zone_id=z3.zone_id, phone="9820033333", email="amit.kumar@traffic.gov.in", status="ACTIVE")
        off4 = Officer(badge_number="TR-1004", full_name="Head Constable Vikram Singh", rank_title="Head Constable", zone_id=z4.zone_id, phone="9820044444", email="vikram.singh@traffic.gov.in", status="ACTIVE")
        db.add_all([off1, off2, off3, off4])
        db.flush()

        # 8. Owners
        o1 = Owner(national_id="IND-NAT-9011", full_name="Aarav Sharma", email="aarav.sharma@example.com", phone="9876543210", address="12 Marine Drive, Mumbai", owner_type="INDIVIDUAL")
        o2 = Owner(national_id="IND-NAT-9012", full_name="Priya Patel", email="priya.patel@example.com", phone="9876543211", address="45 BKC Avenue, Mumbai", owner_type="INDIVIDUAL")
        o3 = Owner(national_id="IND-NAT-9013", full_name="Rohan Verma", email="rohan.verma@example.com", phone="9876543212", address="88 Connaught Place, New Delhi", owner_type="INDIVIDUAL")
        o4 = Owner(national_id="IND-NAT-9014", full_name="Ananya Iyer", email="ananya.iyer@example.com", phone="9876543213", address="102 MG Road, Bengaluru", owner_type="INDIVIDUAL")
        o5 = Owner(national_id="IND-NAT-9015", full_name="Apex Logistics Ltd", email="fleet@apexlogistics.com", phone="9876543214", address="204 Ring Road Industrial Hub", owner_type="CORPORATE")
        db.add_all([o1, o2, o3, o4, o5])
        db.flush()

        # 9. Drivers & Licenses
        d1 = Driver(owner_id=o1.owner_id, full_name="Aarav Sharma", dob=datetime(1988, 5, 14).date(), blood_group="O+", phone="9876543210", email="aarav.sharma@example.com")
        d2 = Driver(owner_id=o2.owner_id, full_name="Priya Patel", dob=datetime(1992, 11, 22).date(), blood_group="A+", phone="9876543211", email="priya.patel@example.com")
        d3 = Driver(owner_id=o3.owner_id, full_name="Rohan Verma", dob=datetime(1985, 3, 9).date(), blood_group="B+", phone="9876543212", email="rohan.verma@example.com")
        d4 = Driver(owner_id=o4.owner_id, full_name="Ananya Iyer", dob=datetime(1995, 8, 30).date(), blood_group="AB+", phone="9876543213", email="ananya.iyer@example.com")
        db.add_all([d1, d2, d3, d4])
        db.flush()

        l1 = License(license_number="DL-04-20120011", driver_id=d1.driver_id, category="LMV", issue_date=datetime(2012, 1, 10).date(), expiry_date=datetime(2032, 1, 10).date(), demerit_points=5, status="VALID")
        l2 = License(license_number="DL-04-20150022", driver_id=d2.driver_id, category="LMV", issue_date=datetime(2015, 4, 15).date(), expiry_date=datetime(2035, 4, 15).date(), demerit_points=2, status="VALID")
        l3 = License(license_number="DL-07-20100033", driver_id=d3.driver_id, category="LMV", issue_date=datetime(2010, 8, 20).date(), expiry_date=datetime(2030, 8, 20).date(), demerit_points=8, status="SUSPENDED")
        l4 = License(license_number="DL-09-20180044", driver_id=d4.driver_id, category="MCWG", issue_date=datetime(2018, 12, 1).date(), expiry_date=datetime(2038, 12, 1).date(), demerit_points=0, status="VALID")
        db.add_all([l1, l2, l3, l4])
        db.flush()

        # 10. Vehicles
        v1 = Vehicle(registration_no="MH01AV1001", owner_id=o1.owner_id, vehicle_class="CAR", make="Honda", model="City", fuel_type="PETROL", mfg_year=2021, status="ACTIVE")
        v2 = Vehicle(registration_no="MH02BZ2002", owner_id=o2.owner_id, vehicle_class="SUV", make="Hyundai", model="Creta", fuel_type="DIESEL", mfg_year=2022, status="ACTIVE")
        v3 = Vehicle(registration_no="DL01CX3003", owner_id=o3.owner_id, vehicle_class="CAR", make="Toyota", model="Camry", fuel_type="HYBRID", mfg_year=2020, status="ACTIVE")
        v4 = Vehicle(registration_no="KA05DY4004", owner_id=o4.owner_id, vehicle_class="TWO_WHEELER", make="Royal Enfield", model="Classic 350", fuel_type="PETROL", mfg_year=2023, status="ACTIVE")
        v5 = Vehicle(registration_no="MH04EZ5005", owner_id=o5.owner_id, vehicle_class="TRUCK", make="Tata", model="Prima", fuel_type="DIESEL", mfg_year=2019, status="ACTIVE")
        v6 = Vehicle(registration_no="DL03FZ6006", owner_id=o3.owner_id, vehicle_class="CAR", make="BMW", model="3 Series", fuel_type="PETROL", mfg_year=2023, status="ACTIVE")
        db.add_all([v1, v2, v3, v4, v5, v6])
        db.flush()

        # 11. Vehicle Events
        now = datetime.utcnow()
        e1 = VehicleEvent(camera_id=cam1.camera_id, vehicle_id=v1.vehicle_id, license_plate_raw="MH01AV1001", event_timestamp=now - timedelta(hours=2), observed_speed=85.5, ai_confidence=0.98, event_status="PROCESSED")
        e2 = VehicleEvent(camera_id=cam2.camera_id, vehicle_id=v2.vehicle_id, license_plate_raw="MH02BZ2002", event_timestamp=now - timedelta(hours=5), observed_speed=52.0, ai_confidence=0.95, event_status="PROCESSED")
        e3 = VehicleEvent(camera_id=cam3.camera_id, vehicle_id=v3.vehicle_id, license_plate_raw="DL01CX3003", event_timestamp=now - timedelta(hours=12), observed_speed=72.0, ai_confidence=0.99, event_status="PROCESSED")
        e4 = VehicleEvent(camera_id=cam4.camera_id, vehicle_id=v4.vehicle_id, license_plate_raw="KA05DY4004", event_timestamp=now - timedelta(hours=1), observed_speed=45.0, ai_confidence=0.92, event_status="PROCESSED")
        e5 = VehicleEvent(camera_id=cam1.camera_id, vehicle_id=v6.vehicle_id, license_plate_raw="DL03FZ6006", event_timestamp=now - timedelta(minutes=30), observed_speed=95.0, ai_confidence=0.99, event_status="PROCESSED")
        db.add_all([e1, e2, e3, e4, e5])
        db.flush()

        # 12. Violations & Fines
        vio1 = Violation(event_id=e1.event_id, vehicle_id=v1.vehicle_id, driver_id=d1.driver_id, type_id=vt_speed.type_id, camera_id=cam1.camera_id, officer_id=off1.officer_id, violation_dt=now - timedelta(hours=2), status="ISSUED", remarks="Speed recorded 85.5 km/h in 60 km/h zone")
        vio2 = Violation(event_id=e3.event_id, vehicle_id=v3.vehicle_id, driver_id=d3.driver_id, type_id=vt_red.type_id, camera_id=cam3.camera_id, officer_id=off2.officer_id, violation_dt=now - timedelta(hours=12), status="ISSUED", remarks="Crossed red light signal phase")
        vio3 = Violation(event_id=e5.event_id, vehicle_id=v6.vehicle_id, driver_id=d3.driver_id, type_id=vt_speed.type_id, camera_id=cam1.camera_id, officer_id=off1.officer_id, violation_dt=now - timedelta(minutes=30), status="ISSUED", remarks="Extreme speed 95.0 km/h on Marine Drive")
        vio4 = Violation(vehicle_id=v4.vehicle_id, driver_id=d4.driver_id, type_id=vt_helmet.type_id, camera_id=cam4.camera_id, officer_id=off4.officer_id, violation_dt=now - timedelta(days=2), status="PAID", remarks="Pillion riding without helmet")
        vio5 = Violation(vehicle_id=v2.vehicle_id, driver_id=d2.driver_id, type_id=vt_belt.type_id, camera_id=cam2.camera_id, officer_id=off2.officer_id, violation_dt=now - timedelta(days=5), status="PAID", remarks="Driver seatbelt unfastened")
        db.add_all([vio1, vio2, vio3, vio4, vio5])
        db.flush()

        f1 = Fine(violation_id=vio1.violation_id, base_amount=2000.00, penalty_amount=200.00, total_amount=2200.00, issue_date=(now - timedelta(hours=2)).date(), due_date=(now + timedelta(days=14)).date(), status="UNPAID")
        f2 = Fine(violation_id=vio2.violation_id, base_amount=1500.00, penalty_amount=0.00, total_amount=1500.00, issue_date=(now - timedelta(hours=12)).date(), due_date=(now + timedelta(days=14)).date(), status="UNPAID")
        f3 = Fine(violation_id=vio3.violation_id, base_amount=2000.00, penalty_amount=0.00, total_amount=2000.00, issue_date=(now - timedelta(minutes=30)).date(), due_date=(now + timedelta(days=14)).date(), status="UNPAID")
        f4 = Fine(violation_id=vio4.violation_id, base_amount=1000.00, penalty_amount=0.00, total_amount=1000.00, issue_date=(now - timedelta(days=2)).date(), due_date=(now + timedelta(days=12)).date(), status="PAID")
        f5 = Fine(violation_id=vio5.violation_id, base_amount=1000.00, penalty_amount=0.00, total_amount=1000.00, issue_date=(now - timedelta(days=5)).date(), due_date=(now + timedelta(days=9)).date(), status="PAID")
        db.add_all([f1, f2, f3, f4, f5])
        db.flush()

        # 13. Payments
        p1 = Payment(fine_id=f4.fine_id, payment_amount=1000.00, payment_date=now - timedelta(days=1), payment_method="CREDIT_CARD", txn_ref_no="TXN-2026-90011", status="SUCCESS")
        p2 = Payment(fine_id=f5.fine_id, payment_amount=1000.00, payment_date=now - timedelta(days=4), payment_method="UPI", txn_ref_no="TXN-2026-90022", status="SUCCESS")
        db.add_all([p1, p2])
        db.flush()

        # 14. Appeals
        ap1 = Appeal(violation_id=vio2.violation_id, appellant_id=o3.owner_id, appeal_date=now - timedelta(hours=6), reason="Emergency medical transit to hospital during yellow-to-red signal transition.", status="SUBMITTED")
        db.add_all([ap1])

        db.commit()
        logger.info("Successfully seeded STVAMS database with initial operational records!")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed initial database records: {e}")
