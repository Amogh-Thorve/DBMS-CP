from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import VehicleEvent
from app.schemas.schemas import EventCreate, EventResponse, EventUpdate

router = APIRouter(prefix="/vehicle-events", tags=["Camera Detections & Event Ingestion"])

@router.get("", response_model=List[EventResponse], summary="List Detection Events")
def list_events(
    skip: int = 0,
    limit: int = 50,
    camera_id: Optional[int] = None,
    vehicle_id: Optional[int] = None,
    event_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(VehicleEvent)
    if camera_id:
        query = query.filter(VehicleEvent.camera_id == camera_id)
    if vehicle_id:
        query = query.filter(VehicleEvent.vehicle_id == vehicle_id)
    if event_status:
        query = query.filter(VehicleEvent.event_status == event_status)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=EventResponse, status_code=201, summary="Ingest Detection Event")
def ingest_event(evt: EventCreate, db: Session = Depends(get_db)):
    db_evt = VehicleEvent(**evt.model_dump())
    db.add(db_evt)
    db.commit()
    db.refresh(db_evt)
    return db_evt

@router.get("/{event_id}", response_model=EventResponse, summary="Get Detection Event Details")
def get_event(event_id: int, db: Session = Depends(get_db)):
    evt = db.query(VehicleEvent).filter(VehicleEvent.event_id == event_id).first()
    if not evt:
        raise HTTPException(status_code=404, detail="Vehicle Event not found")
    return evt

@router.put("/{event_id}", response_model=EventResponse, summary="Update Event Status")
def update_event(event_id: int, update_data: EventUpdate, db: Session = Depends(get_db)):
    evt = db.query(VehicleEvent).filter(VehicleEvent.event_id == event_id).first()
    if not evt:
        raise HTTPException(status_code=404, detail="Vehicle Event not found")
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(evt, key, val)
    db.commit()
    db.refresh(evt)
    return evt

