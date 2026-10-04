"""
============================================================================
STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
File: database/warehouse/models.py
Description: SQLAlchemy Data Warehouse Star Schema ORM Models
============================================================================
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Numeric
from sqlalchemy.orm import declarative_base, relationship

BaseDW = declarative_base()

class DimDate(BaseDW):
    __tablename__ = "dim_date"

    date_key = Column(Integer, primary_key=True)  # YYYYMMDD
    full_date = Column(Date, nullable=False)
    day_of_week = Column(String(15), nullable=False)
    day_of_month = Column(Integer, nullable=False)
    month_name = Column(String(15), nullable=False)
    quarter = Column(String(2), nullable=False)
    year = Column(Integer, nullable=False)
    is_weekend = Column(Integer)

class DimTime(BaseDW):
    __tablename__ = "dim_time"

    time_key = Column(Integer, primary_key=True)  # HHMMSS
    hour_24 = Column(Integer, nullable=False)
    minute = Column(Integer, nullable=False)
    time_of_day = Column(String(20))

class DimVehicle(BaseDW):
    __tablename__ = "dim_vehicle"

    vehicle_sk = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, nullable=False)
    registration_no = Column(String(20), nullable=False)
    vehicle_class = Column(String(20), nullable=False)
    make = Column(String(50))
    model = Column(String(50))
    fuel_type = Column(String(20))
    owner_type = Column(String(20))

class DimCamera(BaseDW):
    __tablename__ = "dim_camera"

    camera_sk = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(Integer, nullable=False)
    camera_code = Column(String(50), nullable=False)
    camera_type = Column(String(30), nullable=False)
    direction = Column(String(20))

class DimZone(BaseDW):
    __tablename__ = "dim_zone"

    zone_sk = Column(Integer, primary_key=True, autoincrement=True)
    zone_id = Column(Integer, nullable=False)
    zone_code = Column(String(20), nullable=False)
    zone_name = Column(String(100), nullable=False)
    city_name = Column(String(100), nullable=False)
    risk_level = Column(String(20), nullable=False)

class DimViolationType(BaseDW):
    __tablename__ = "dim_violation_type"

    type_sk = Column(Integer, primary_key=True, autoincrement=True)
    type_id = Column(Integer, nullable=False)
    code = Column(String(30), nullable=False)
    title = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)

class FactViolation(BaseDW):
    __tablename__ = "fact_violation"

    fact_id = Column(Integer, primary_key=True, autoincrement=True)
    date_key = Column(Integer, ForeignKey("dim_date.date_key"))
    time_key = Column(Integer, ForeignKey("dim_time.time_key"))
    vehicle_sk = Column(Integer, ForeignKey("dim_vehicle.vehicle_sk"))
    camera_sk = Column(Integer, ForeignKey("dim_camera.camera_sk"))
    zone_sk = Column(Integer, ForeignKey("dim_zone.zone_sk"))
    type_sk = Column(Integer, ForeignKey("dim_violation_type.type_sk"))

    violation_count = Column(Integer, default=1, nullable=False)
    base_fine_amt = Column(Numeric(10, 2), nullable=False)
    penalty_amt = Column(Numeric(10, 2), default=0.00)
    total_fine_amt = Column(Numeric(10, 2), nullable=False)
    observed_speed = Column(Float)

class FactPayment(BaseDW):
    __tablename__ = "fact_payment"

    payment_fact_id = Column(Integer, primary_key=True, autoincrement=True)
    date_key = Column(Integer, ForeignKey("dim_date.date_key"))
    zone_sk = Column(Integer, ForeignKey("dim_zone.zone_sk"))
    type_sk = Column(Integer, ForeignKey("dim_violation_type.type_sk"))

    payment_count = Column(Integer, default=1, nullable=False)
    amount_collected = Column(Numeric(12, 2), nullable=False)
