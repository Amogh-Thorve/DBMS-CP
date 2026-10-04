from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import City
from app.schemas.schemas import CityCreate, CityResponse, CityUpdate

router = APIRouter(prefix="/cities", tags=["City Management Operations"])

@router.get("", response_model=List[CityResponse], summary="List Cities")
def list_cities(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(City).offset(skip).limit(limit).all()

@router.post("", response_model=CityResponse, status_code=201, summary="Add City")
def create_city(city: CityCreate, db: Session = Depends(get_db)):
    existing = db.query(City).filter(City.city_name == city.city_name).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"City '{city.city_name}' already exists.")
    db_city = City(**city.model_dump())
    db.add(db_city)
    db.commit()
    db.refresh(db_city)
    return db_city

@router.get("/{city_id}", response_model=CityResponse, summary="Get City Details")
def get_city(city_id: int, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.city_id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city

@router.put("/{city_id}", response_model=CityResponse, summary="Update City")
def update_city(city_id: int, update_data: CityUpdate, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.city_id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(city, key, val)
    db.commit()
    db.refresh(city)
    return city
