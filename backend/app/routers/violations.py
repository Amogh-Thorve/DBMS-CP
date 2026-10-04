from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Violation
from app.schemas.schemas import ViolationCreate, ViolationResponse, ViolationUpdate
from app.services.business_service import STVAMService

router = APIRouter(prefix="/violations", tags=["Violation Processing Operations"])

@router.get("", response_model=List[ViolationResponse], summary="List Violations")
def list_violations(
    skip: int = 0,
    limit: int = 50,
    vehicle_id: Optional[int] = None,
    camera_id: Optional[int] = None,
    type_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Violation)
    if vehicle_id:
        query = query.filter(Violation.vehicle_id == vehicle_id)
    if camera_id:
        query = query.filter(Violation.camera_id == camera_id)
    if type_id:
        query = query.filter(Violation.type_id == type_id)
    if status:
        query = query.filter(Violation.status == status)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=ViolationResponse, status_code=201, summary="Register Violation & Issue Fine")
def register_violation(viol: ViolationCreate, db: Session = Depends(get_db)):
    try:
        res = STVAMService.create_violation_with_fine(db, viol)
        return res["violation"]
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{violation_id}", response_model=ViolationResponse, summary="Get Violation Details")
def get_violation(violation_id: int, db: Session = Depends(get_db)):
    viol = db.query(Violation).filter(Violation.violation_id == violation_id).first()
    if not viol:
        raise HTTPException(status_code=404, detail="Violation not found")
    return viol

@router.put("/{violation_id}", response_model=ViolationResponse, summary="Update Violation Record")
def update_violation(violation_id: int, update_data: ViolationUpdate, db: Session = Depends(get_db)):
    viol = db.query(Violation).filter(Violation.violation_id == violation_id).first()
    if not viol:
        raise HTTPException(status_code=404, detail="Violation not found")
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(viol, key, val)
    db.commit()
    db.refresh(viol)
    return viol

@router.delete("/{violation_id}", status_code=204, summary="Dismiss/Delete Violation")
def delete_violation(violation_id: int, db: Session = Depends(get_db)):
    viol = db.query(Violation).filter(Violation.violation_id == violation_id).first()
    if not viol:
        raise HTTPException(status_code=404, detail="Violation not found")
    db.delete(viol)
    db.commit()
    return None

