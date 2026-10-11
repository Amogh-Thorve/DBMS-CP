from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# City Schemas
class CityBase(BaseModel):
    city_name: str
    state_name: str
    country: str = "India"

class CityCreate(CityBase):
    pass

class CityResponse(CityBase):
    city_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Traffic Zone Schemas
class TrafficZoneBase(BaseModel):
    zone_code: str
    zone_name: str
    city_id: int
    risk_level: str = "MEDIUM"

class TrafficZoneCreate(TrafficZoneBase):
    pass

class TrafficZoneResponse(TrafficZoneBase):
    zone_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Road & Segment Schemas
class RoadBase(BaseModel):
    road_name: str
    road_type: str
    speed_limit_kmh: int
    zone_id: int

class RoadCreate(RoadBase):
    pass

class RoadResponse(RoadBase):
    road_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Owner Schemas
class OwnerBase(BaseModel):
    national_id: str
    full_name: str
    email: EmailStr
    phone: str
    address: str
    owner_type: str = "INDIVIDUAL"

class OwnerCreate(OwnerBase):
    pass

class OwnerResponse(OwnerBase):
    owner_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Vehicle Schemas
class VehicleBase(BaseModel):
    registration_no: str
    owner_id: int
    vehicle_class: str
    make: str
    model: str
    fuel_type: str
    mfg_year: int

class VehicleCreate(VehicleBase):
    pass

class VehicleResponse(VehicleBase):
    vehicle_id: int
    reg_date: date
    status: str
    model_config = ConfigDict(from_attributes=True)

# Vehicle Event Schemas
class EventBase(BaseModel):
    camera_id: int
    vehicle_id: Optional[int] = None
    license_plate_raw: Optional[str] = None
    observed_speed: Optional[float] = None
    ai_confidence: Optional[float] = None

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    event_id: int
    event_timestamp: datetime
    event_status: str
    mongo_doc_id: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Violation Schemas
class ViolationCreate(BaseModel):
    event_id: Optional[int] = None
    vehicle_id: int
    driver_id: Optional[int] = None
    type_id: int
    camera_id: int
    officer_id: Optional[int] = None
    remarks: Optional[str] = None

class ViolationResponse(BaseModel):
    violation_id: int
    vehicle_id: int
    type_id: int
    camera_id: int
    violation_dt: datetime
    status: str
    remarks: Optional[str] = None
    vehicle_reg_no: Optional[str] = None
    type_title: Optional[str] = None
    camera_code: Optional[str] = None
    zone_name: Optional[str] = None
    fine_amount: Optional[float] = None
    payment_status: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Fine Schemas
class FineResponse(BaseModel):
    fine_id: int
    violation_id: int
    base_amount: float
    penalty_amount: float
    total_amount: float
    issue_date: date
    due_date: date
    status: str
    model_config = ConfigDict(from_attributes=True)

# Payment Schemas
class PaymentCreate(BaseModel):
    fine_id: int
    payment_amount: float
    payment_method: str
    txn_ref_no: str

class PaymentResponse(BaseModel):
    payment_id: int
    fine_id: int
    payment_amount: float
    payment_date: datetime
    payment_method: str
    txn_ref_no: str
    status: str
    model_config = ConfigDict(from_attributes=True)

# Appeal Schemas
class AppealCreate(BaseModel):
    violation_id: int
    appellant_id: int
    reason: str

class AppealResponse(BaseModel):
    appeal_id: int
    violation_id: int
    appellant_id: int
    appeal_date: datetime
    reason: str
    status: str
    model_config = ConfigDict(from_attributes=True)

# Driver & License Schemas
class DriverBase(BaseModel):
    owner_id: Optional[int] = None
    full_name: str
    dob: date
    blood_group: Optional[str] = "O+"
    phone: str
    email: Optional[EmailStr] = None

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class DriverResponse(DriverBase):
    driver_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class LicenseBase(BaseModel):
    license_number: str
    driver_id: int
    category: str
    issue_date: date
    expiry_date: date
    demerit_points: int = 0
    status: str = "VALID"

class LicenseCreate(LicenseBase):
    pass

class LicenseUpdate(BaseModel):
    category: Optional[str] = None
    expiry_date: Optional[date] = None
    demerit_points: Optional[int] = None
    status: Optional[str] = None

class LicenseResponse(LicenseBase):
    license_id: int
    model_config = ConfigDict(from_attributes=True)

# City & Zone Update Schemas
class CityUpdate(BaseModel):
    city_name: Optional[str] = None
    state_name: Optional[str] = None
    country: Optional[str] = None

class TrafficZoneUpdate(BaseModel):
    zone_name: Optional[str] = None
    risk_level: Optional[str] = None

class RoadUpdate(BaseModel):
    road_name: Optional[str] = None
    road_type: Optional[str] = None
    speed_limit_kmh: Optional[int] = None

# Camera Schemas
class CameraBase(BaseModel):
    camera_code: str
    camera_type: str
    segment_id: int
    direction: Optional[str] = "NORTH"
    status: str = "ACTIVE"
    ip_address: Optional[str] = None

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    camera_type: Optional[str] = None
    direction: Optional[str] = None
    status: Optional[str] = None
    ip_address: Optional[str] = None

class CameraResponse(CameraBase):
    camera_id: int
    installation_dt: date
    model_config = ConfigDict(from_attributes=True)

# Officer Schemas
class OfficerBase(BaseModel):
    badge_number: str
    full_name: str
    rank_title: str
    zone_id: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    status: str = "ACTIVE"

class OfficerCreate(OfficerBase):
    pass

class OfficerUpdate(BaseModel):
    full_name: Optional[str] = None
    rank_title: Optional[str] = None
    zone_id: Optional[int] = None
    phone: Optional[str] = None
    status: Optional[str] = None

class OfficerResponse(OfficerBase):
    officer_id: int
    model_config = ConfigDict(from_attributes=True)

# Violation Type Schemas
class ViolationTypeBase(BaseModel):
    code: str
    title: str
    description: Optional[str] = None
    base_fine: float
    demerit_points: int = 0
    severity: str = "MINOR"

class ViolationTypeCreate(ViolationTypeBase):
    pass

class ViolationTypeResponse(ViolationTypeBase):
    type_id: int
    model_config = ConfigDict(from_attributes=True)

# Owner & Vehicle Updates
class OwnerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    owner_type: Optional[str] = None

class VehicleUpdate(BaseModel):
    vehicle_class: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    fuel_type: Optional[str] = None
    status: Optional[str] = None

# Event & Violation Updates
class EventUpdate(BaseModel):
    event_status: Optional[str] = None
    mongo_doc_id: Optional[str] = None

class ViolationUpdate(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None
    driver_id: Optional[int] = None
    officer_id: Optional[int] = None

# Fine & Appeal Updates
class FineUpdate(BaseModel):
    penalty_amount: Optional[float] = None
    status: Optional[str] = None
    due_date: Optional[date] = None

class AppealReview(BaseModel):
    status: str  # APPROVED or REJECTED
    reviewer_remarks: Optional[str] = None

# Evidence & MongoDB Document Schemas
class EvidenceCreate(BaseModel):
    event_id: int
    camera_code: str
    image_url: str
    bounding_box: Optional[dict] = None
    confidence_score: float = 0.95
    metadata: Optional[dict] = None

class EvidenceResponse(BaseModel):
    evidence_id: str
    event_id: int
    camera_code: str
    image_url: str
    confidence_score: float
    timestamp: datetime

# Analytics Response Schemas
class AnalyticsZoneResponse(BaseModel):
    zone_code: str
    zone_name: str
    violations: int
    revenue: float

class AnalyticsTypeResponse(BaseModel):
    type: str
    count: int

class AnalyticsCollectionResponse(BaseModel):
    total_levied: float
    total_collected: float
    collection_rate: str

class AnalyticsRepeatOffenderResponse(BaseModel):
    registration_no: str
    owner_name: str
    violation_count: int
    risk_score: float

class ViolationTrendResponse(BaseModel):
    date: str
    violations: int
    fines: float

# Analytics Summary Schema
class DashboardSummary(BaseModel):
    total_vehicles: int
    total_drivers: int
    total_violations: int
    total_fines_levied: float
    total_fines_collected: float
    unpaid_fines_count: int
    active_cameras: int
    top_violation_zone: str
    violations_today: Optional[int] = 0
    violations_yesterday: Optional[int] = 0
    pending_fines_amount: Optional[float] = 0.0


