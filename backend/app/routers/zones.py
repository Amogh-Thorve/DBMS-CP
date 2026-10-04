from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import TrafficZone
from app.schemas.schemas import TrafficZoneCreate, TrafficZoneResponse, TrafficZoneUpdate

router = APIRouter(prefix="/zones", tags=["Traffic Zone Operations"])

@router.get("", response_model=List[TrafficZoneResponse], summary="List Traffic Zones")
def list_zones(skip: int = 0, limit: int = 50, city_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(TrafficZone)
    if city_id:
        query = query.filter(TrafficZone.city_id == city_id)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=TrafficZoneResponse, status_code=201, summary="Create Traffic Zone")
def create_zone(zone: TrafficZoneCreate, db: Session = Depends(get_db)):
    existing = db.query(TrafficZone).filter(TrafficZone.zone_code == zone.zone_code).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Zone code '{zone.zone_code}' already exists.")
    db_zone = TrafficZone(**zone.model_dump())
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone

@router.get("/{zone_id}", response_model=TrafficZoneResponse, summary="Get Zone Details")
def get_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(TrafficZone).filter(TrafficZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Traffic Zone not found")
    return zone

@router.put("/{zone_id}", response_model=TrafficZoneResponse, summary="Update Traffic Zone")
def update_zone(zone_id: int, update_data: TrafficZoneUpdate, db: Session = Depends(get_db)):
    zone = db.query(TrafficZone).filter(TrafficZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Traffic Zone not found")
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(zone, key, val)
    db.commit()
    db.refresh(zone)
    return zone
