from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import License
from app.schemas.schemas import LicenseCreate, LicenseResponse, LicenseUpdate

router = APIRouter(prefix="/licenses", tags=["Driver License Operations"])

@router.get("", response_model=List[LicenseResponse], summary="List Driver Licenses")
def list_licenses(skip: int = 0, limit: int = 50, driver_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(License)
    if driver_id:
        query = query.filter(License.driver_id == driver_id)
    if status:
        query = query.filter(License.status == status)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=LicenseResponse, status_code=201, summary="Issue Driver License")
def create_license(lic: LicenseCreate, db: Session = Depends(get_db)):
    existing = db.query(License).filter(License.license_number == lic.license_number).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"License number {lic.license_number} already exists.")
    db_lic = License(**lic.model_dump())
    db.add(db_lic)
    db.commit()
    db.refresh(db_lic)
    return db_lic

@router.get("/{license_id}", response_model=LicenseResponse, summary="Get License Details")
def get_license(license_id: int, db: Session = Depends(get_db)):
    lic = db.query(License).filter(License.license_id == license_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="License not found")
    return lic

@router.put("/{license_id}", response_model=LicenseResponse, summary="Update License")
def update_license(license_id: int, update_data: LicenseUpdate, db: Session = Depends(get_db)):
    lic = db.query(License).filter(License.license_id == license_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="License not found")
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(lic, key, val)
    db.commit()
    db.refresh(lic)
    return lic
