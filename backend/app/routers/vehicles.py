from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Vehicle
from app.schemas.schemas import VehicleCreate, VehicleResponse, VehicleUpdate
from app.services.business_service import STVAMService

router = APIRouter(prefix="/vehicles", tags=["Vehicle Management Operations"])

@router.get("", response_model=List[VehicleResponse], summary="List Vehicles")
def list_vehicles(
    skip: int = 0,
    limit: int = 50,
    owner_id: Optional[int] = None,
    registration_no: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle)
    if owner_id:
        query = query.filter(Vehicle.owner_id == owner_id)
    if registration_no:
        query = query.filter(Vehicle.registration_no == registration_no.upper())
    if status:
        query = query.filter(Vehicle.status == status)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=VehicleResponse, status_code=201, summary="Register Vehicle")
def register_vehicle(veh: VehicleCreate, db: Session = Depends(get_db)):
    try:
        return STVAMService.create_vehicle(db, veh)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{vehicle_id}", response_model=VehicleResponse, summary="Get Vehicle Details")
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    veh = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return veh

@router.put("/{vehicle_id}", response_model=VehicleResponse, summary="Update Vehicle Details")
def update_vehicle(vehicle_id: int, update_data: VehicleUpdate, db: Session = Depends(get_db)):
    veh = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(veh, key, val)
    db.commit()
    db.refresh(veh)
    return veh

@router.delete("/{vehicle_id}", status_code=204, summary="Deregister Vehicle")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    veh = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(veh)
    db.commit()
    return None

