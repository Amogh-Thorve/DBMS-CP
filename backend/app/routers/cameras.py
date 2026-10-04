from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Camera
from app.schemas.schemas import CameraCreate, CameraResponse, CameraUpdate

router = APIRouter(prefix="/cameras", tags=["Traffic Camera Operations"])

@router.get("", response_model=List[CameraResponse], summary="List Cameras")
def list_cameras(skip: int = 0, limit: int = 50, segment_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Camera)
    if segment_id:
        query = query.filter(Camera.segment_id == segment_id)
    if status:
        query = query.filter(Camera.status == status)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=CameraResponse, status_code=201, summary="Register Camera")
def create_camera(cam: CameraCreate, db: Session = Depends(get_db)):
    existing = db.query(Camera).filter(Camera.camera_code == cam.camera_code).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Camera code '{cam.camera_code}' already exists.")
    db_cam = Camera(**cam.model_dump())
    db.add(db_cam)
    db.commit()
    db.refresh(db_cam)
    return db_cam

@router.get("/{camera_id}", response_model=CameraResponse, summary="Get Camera Details")
def get_camera(camera_id: int, db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    return cam

@router.put("/{camera_id}", response_model=CameraResponse, summary="Update Camera")
def update_camera(camera_id: int, update_data: CameraUpdate, db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(cam, key, val)
    db.commit()
    db.refresh(cam)
    return cam
