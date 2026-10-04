from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Driver
from app.schemas.schemas import DriverCreate, DriverResponse, DriverUpdate
from app.dependencies.deps import get_current_user

router = APIRouter(prefix="/drivers", tags=["Driver Management Operations"])

@router.get("", response_model=List[DriverResponse], summary="List Drivers")
def list_drivers(skip: int = 0, limit: int = 50, owner_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Driver)
    if owner_id:
        query = query.filter(Driver.owner_id == owner_id)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=DriverResponse, status_code=201, summary="Register Driver")
def create_driver(driver: DriverCreate, db: Session = Depends(get_db)):
    db_driver = Driver(**driver.model_dump())
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver

@router.get("/{driver_id}", response_model=DriverResponse, summary="Get Driver Details")
def get_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

@router.put("/{driver_id}", response_model=DriverResponse, summary="Update Driver")
def update_driver(driver_id: int, update_data: DriverUpdate, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(driver, key, val)
    db.commit()
    db.refresh(driver)
    return driver

@router.delete("/{driver_id}", status_code=204, summary="Delete Driver")
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    db.delete(driver)
    db.commit()
    return None
