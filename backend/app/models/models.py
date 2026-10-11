from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class City(Base):
    __tablename__ = "city"

    city_id = Column(Integer, primary_key=True, index=True)
    city_name = Column(String(100), nullable=False, unique=True)
    state_name = Column(String(100), nullable=False)
    country = Column(String(100), default="India")
    created_at = Column(DateTime, default=datetime.utcnow)

    zones = relationship("TrafficZone", back_populates="city")

class TrafficZone(Base):
    __tablename__ = "traffic_zone"

    zone_id = Column(Integer, primary_key=True, index=True)
    zone_code = Column(String(20), nullable=False, unique=True)
    zone_name = Column(String(100), nullable=False)
    city_id = Column(Integer, ForeignKey("city.city_id"), nullable=False)
    risk_level = Column(String(20), default="MEDIUM")
    created_at = Column(DateTime, default=datetime.utcnow)

    city = relationship("City", back_populates="zones")
    roads = relationship("Road", back_populates="zone")
    officers = relationship("Officer", back_populates="zone")

class Road(Base):
    __tablename__ = "road"

    road_id = Column(Integer, primary_key=True, index=True)
    road_name = Column(String(150), nullable=False)
    road_type = Column(String(50))
    speed_limit_kmh = Column(Integer, nullable=False)
    zone_id = Column(Integer, ForeignKey("traffic_zone.zone_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("TrafficZone", back_populates="roads")
    segments = relationship("RoadSegment", back_populates="road")

class RoadSegment(Base):
    __tablename__ = "road_segment"

    segment_id = Column(Integer, primary_key=True, index=True)
    segment_code = Column(String(30), nullable=False, unique=True)
    road_id = Column(Integer, ForeignKey("road.road_id"), nullable=False)
    start_latitude = Column(Float, nullable=False)
    start_longitude = Column(Float, nullable=False)
    end_latitude = Column(Float, nullable=False)
    end_longitude = Column(Float, nullable=False)
    length_km = Column(Float)
    is_active = Column(Integer, default=1)

    road = relationship("Road", back_populates="segments")
    cameras = relationship("Camera", back_populates="segment")

class Camera(Base):
    __tablename__ = "camera"

    camera_id = Column(Integer, primary_key=True, index=True)
    camera_code = Column(String(50), nullable=False, unique=True)
    camera_type = Column(String(30), nullable=False)
    segment_id = Column(Integer, ForeignKey("road_segment.segment_id"), nullable=False)
    installation_dt = Column(Date, default=datetime.utcnow)
    direction = Column(String(20))
    status = Column(String(20), default="ACTIVE")
    ip_address = Column(String(45))

    segment = relationship("RoadSegment", back_populates="cameras")
    events = relationship("VehicleEvent", back_populates="camera")
    violations = relationship("Violation", back_populates="camera")

class Owner(Base):
    __tablename__ = "owner"

    owner_id = Column(Integer, primary_key=True, index=True)
    national_id = Column(String(30), nullable=False, unique=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    phone = Column(String(20), nullable=False)
    address = Column(String(300), nullable=False)
    owner_type = Column(String(20), default="INDIVIDUAL")
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicles = relationship("Vehicle", back_populates="owner")
    drivers = relationship("Driver", back_populates="owner")

class Driver(Base):
    __tablename__ = "driver"

    driver_id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("owner.owner_id"), nullable=True)
    full_name = Column(String(150), nullable=False)
    dob = Column(Date, nullable=False)
    blood_group = Column(String(5))
    phone = Column(String(20), nullable=False)
    email = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("Owner", back_populates="drivers")
    license = relationship("License", back_populates="driver", uselist=False)

class License(Base):
    __tablename__ = "license"

    license_id = Column(Integer, primary_key=True, index=True)
    license_number = Column(String(30), nullable=False, unique=True)
    driver_id = Column(Integer, ForeignKey("driver.driver_id"), nullable=False, unique=True)
    category = Column(String(20), nullable=False)
    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    demerit_points = Column(Integer, default=0)
    status = Column(String(20), default="VALID")

    driver = relationship("Driver", back_populates="license")

class Vehicle(Base):
    __tablename__ = "vehicle"

    vehicle_id = Column(Integer, primary_key=True, index=True)
    registration_no = Column(String(20), nullable=False, unique=True)
    owner_id = Column(Integer, ForeignKey("owner.owner_id"), nullable=False)
    vehicle_class = Column(String(20), nullable=False)
    make = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    fuel_type = Column(String(20))
    mfg_year = Column(Integer)
    reg_date = Column(Date, default=datetime.utcnow)
    status = Column(String(20), default="ACTIVE")

    owner = relationship("Owner", back_populates="vehicles")
    violations = relationship("Violation", back_populates="vehicle")

class VehicleEvent(Base):
    __tablename__ = "vehicle_event"

    event_id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("camera.camera_id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicle.vehicle_id"), nullable=True)
    license_plate_raw = Column(String(30))
    event_timestamp = Column(DateTime, default=datetime.utcnow)
    observed_speed = Column(Float)
    ai_confidence = Column(Float)
    event_status = Column(String(20), default="UNPROCESSED")
    mongo_doc_id = Column(String(50))

    camera = relationship("Camera", back_populates="events")

class ViolationType(Base):
    __tablename__ = "violation_type"

    type_id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), nullable=False, unique=True)
    title = Column(String(100), nullable=False)
    description = Column(String(300))
    base_fine = Column(Numeric(10, 2), nullable=False)
    demerit_points = Column(Integer, default=0)
    severity = Column(String(20), default="MINOR")

class Officer(Base):
    __tablename__ = "officer"

    officer_id = Column(Integer, primary_key=True, index=True)
    badge_number = Column(String(30), nullable=False, unique=True)
    full_name = Column(String(150), nullable=False)
    rank_title = Column(String(50), nullable=False)
    zone_id = Column(Integer, ForeignKey("traffic_zone.zone_id"), nullable=True)
    phone = Column(String(20))
    email = Column(String(100), unique=True)
    status = Column(String(20), default="ACTIVE")

    zone = relationship("TrafficZone", back_populates="officers")

class Violation(Base):
    __tablename__ = "violation"

    violation_id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("vehicle_event.event_id"), nullable=True, unique=True)
    vehicle_id = Column(Integer, ForeignKey("vehicle.vehicle_id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("driver.driver_id"), nullable=True)
    type_id = Column(Integer, ForeignKey("violation_type.type_id"), nullable=False)
    camera_id = Column(Integer, ForeignKey("camera.camera_id"), nullable=False)
    officer_id = Column(Integer, ForeignKey("officer.officer_id"), nullable=True)
    violation_dt = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="ISSUED")
    remarks = Column(String(500))

    vehicle = relationship("Vehicle", back_populates="violations")
    camera = relationship("Camera", back_populates="violations")
    violation_type = relationship("ViolationType")
    fine = relationship("Fine", back_populates="violation", uselist=False)
    appeal = relationship("Appeal", back_populates="violation", uselist=False)

class Fine(Base):
    __tablename__ = "fine"

    fine_id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violation.violation_id"), nullable=False, unique=True)
    base_amount = Column(Numeric(10, 2), nullable=False)
    penalty_amount = Column(Numeric(10, 2), default=0.00)
    total_amount = Column(Numeric(10, 2), nullable=False)
    issue_date = Column(Date, default=datetime.utcnow)
    due_date = Column(Date, nullable=False)
    status = Column(String(20), default="UNPAID")

    violation = relationship("Violation", back_populates="fine")
    payments = relationship("Payment", back_populates="fine")

class Payment(Base):
    __tablename__ = "payment"

    payment_id = Column(Integer, primary_key=True, index=True)
    fine_id = Column(Integer, ForeignKey("fine.fine_id"), nullable=False)
    payment_amount = Column(Numeric(10, 2), nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)
    payment_method = Column(String(30))
    txn_ref_no = Column(String(100), nullable=False, unique=True)
    status = Column(String(20), default="SUCCESS")

    fine = relationship("Fine", back_populates="payments")

class Appeal(Base):
    __tablename__ = "appeal"

    appeal_id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violation.violation_id"), nullable=False, unique=True)
    appellant_id = Column(Integer, ForeignKey("owner.owner_id"), nullable=False)
    appeal_date = Column(DateTime, default=datetime.utcnow)
    reason = Column(String(1000), nullable=False)
    status = Column(String(20), default="SUBMITTED")

    violation = relationship("Violation", back_populates="appeal")

class CameraMaintenance(Base):
    __tablename__ = "camera_maintenance"

    maint_id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("camera.camera_id"), nullable=False)
    maintenance_date = Column(Date, nullable=False)
    technician_name = Column(String(100), nullable=False)
    issue_description = Column(String(500))
    resolution_details = Column(String(500))
    cost = Column(Numeric(10, 2), default=0.00)

class VehicleInsurance(Base):
    __tablename__ = "vehicle_insurance"

    insurance_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicle.vehicle_id"), nullable=False)
    policy_number = Column(String(50), nullable=False, unique=True)
    provider_name = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    insured_amount = Column(Numeric(12, 2))

class PollutionCertificate(Base):
    __tablename__ = "pollution_certificate"

    puc_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicle.vehicle_id"), nullable=False)
    certificate_no = Column(String(50), nullable=False, unique=True)
    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    co2_reading = Column(Float)
    status = Column(String(20), default="PASS")

class AppealReview(Base):
    __tablename__ = "appeal_review"

    review_id = Column(Integer, primary_key=True, index=True)
    appeal_id = Column(Integer, ForeignKey("appeal.appeal_id"), nullable=False, unique=True)
    officer_id = Column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    review_date = Column(DateTime, default=datetime.utcnow)
    decision = Column(String(20), nullable=False)
    comments = Column(String(1000), nullable=False)

class Evidence(Base):
    __tablename__ = "evidence"

    evidence_id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violation.violation_id"), nullable=False)
    evidence_type = Column(String(30))
    file_path = Column(String(500), nullable=False)
    captured_at = Column(DateTime, nullable=False)
    file_hash_sha256 = Column(String(64), nullable=False)
    confidence_score = Column(Float)

class AuditLog(Base):
    __tablename__ = "audit_log"

    log_id = Column(Integer, primary_key=True, index=True)
    entity_name = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    action = Column(String(20), nullable=False)
    old_value = Column(String(2000))
    new_value = Column(String(2000))
    performed_by = Column(String(100), default="SYSTEM")
    timestamp = Column(DateTime, default=datetime.utcnow)
