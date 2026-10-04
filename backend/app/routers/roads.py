from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Road
from app.schemas.schemas import RoadCreate, RoadResponse, RoadUpdate

router = APIRouter(prefix="/roads", tags=["Road Network Operations"])

@router.get("", response_model=List[RoadResponse], summary="List Roads")
def list_roads(skip: int = 0, limit: int = 50, zone_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Road)
    if zone_id:
        query = query.filter(Road.zone_id == zone_id)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=RoadResponse, status_code=201, summary="Register Road")
def create_road(road: RoadCreate, db: Session = Depends(get_db)):
    db_road = Road(**road.model_dump())
    db.add(db_road)
    db.commit()
    db.refresh(db_road)
    return db_road

@router.get("/{road_id}", response_model=RoadResponse, summary="Get Road Details")
def get_road(road_id: int, db: Session = Depends(get_db)):
    road = db.query(Road).filter(Road.road_id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road not found")
    return road

@router.put("/{road_id}", response_model=RoadResponse, summary="Update Road")
def update_road(road_id: int, update_data: RoadUpdate, db: Session = Depends(get_db)):
    road = db.query(Road).filter(Road.road_id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road not found")
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(road, key, val)
    db.commit()
    db.refresh(road)
    return road
