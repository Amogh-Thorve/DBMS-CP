from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Officer
from app.schemas.schemas import OfficerCreate, OfficerResponse, OfficerUpdate

router = APIRouter(prefix="/officers", tags=["Traffic Officer Operations"])

@router.get("", response_model=List[OfficerResponse], summary="List Officers")
def list_officers(skip: int = 0, limit: int = 50, zone_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Officer)
    if zone_id:
        query = query.filter(Officer.zone_id == zone_id)
    if status:
        query = query.filter(Officer.status == status)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=OfficerResponse, status_code=201, summary="Register Officer")
def create_officer(off: OfficerCreate, db: Session = Depends(get_db)):
    existing = db.query(Officer).filter(Officer.badge_number == off.badge_number).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Badge number '{off.badge_number}' already registered.")
    db_off = Officer(**off.model_dump())
    db.add(db_off)
    db.commit()
    db.refresh(db_off)
    return db_off

@router.get("/{officer_id}", response_model=OfficerResponse, summary="Get Officer Details")
def get_officer(officer_id: int, db: Session = Depends(get_db)):
    off = db.query(Officer).filter(Officer.officer_id == officer_id).first()
    if not off:
        raise HTTPException(status_code=404, detail="Officer not found")
    return off

@router.put("/{officer_id}", response_model=OfficerResponse, summary="Update Officer")
def update_officer(officer_id: int, update_data: OfficerUpdate, db: Session = Depends(get_db)):
    off = db.query(Officer).filter(Officer.officer_id == officer_id).first()
    if not off:
        raise HTTPException(status_code=404, detail="Officer not found")
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(off, key, val)
    db.commit()
    db.refresh(off)
    return off
