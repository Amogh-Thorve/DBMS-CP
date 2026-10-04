from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Fine
from app.schemas.schemas import FineResponse, FineUpdate

router = APIRouter(prefix="/fines", tags=["Fine Billing Operations"])

@router.get("", response_model=List[FineResponse], summary="List Fines")
def list_fines(
    skip: int = 0,
    limit: int = 50,
    violation_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Fine)
    if violation_id:
        query = query.filter(Fine.violation_id == violation_id)
    if status:
        query = query.filter(Fine.status == status)
    return query.offset(skip).limit(limit).all()

@router.get("/{fine_id}", response_model=FineResponse, summary="Get Fine Details")
def get_fine(fine_id: int, db: Session = Depends(get_db)):
    fine = db.query(Fine).filter(Fine.fine_id == fine_id).first()
    if not fine:
        raise HTTPException(status_code=404, detail="Fine not found")
    return fine

@router.put("/{fine_id}", response_model=FineResponse, summary="Update Fine Record")
def update_fine(fine_id: int, update_data: FineUpdate, db: Session = Depends(get_db)):
    fine = db.query(Fine).filter(Fine.fine_id == fine_id).first()
    if not fine:
        raise HTTPException(status_code=404, detail="Fine not found")
    
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(fine, key, val)
    
    # Recalculate total fine amount
    fine.total_amount = float(fine.base_amount) + float(fine.penalty_amount or 0.0)
    db.commit()
    db.refresh(fine)
    return fine

