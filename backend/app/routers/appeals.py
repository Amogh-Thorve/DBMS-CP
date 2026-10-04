from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Appeal
from app.schemas.schemas import AppealCreate, AppealResponse, AppealReview
from app.services.business_service import STVAMService
from app.dependencies.deps import get_current_user, TokenData

router = APIRouter(prefix="/appeals", tags=["Violation Appeals Operations"])

@router.get("", response_model=List[AppealResponse], summary="List Appeals")
def list_appeals(
    skip: int = 0,
    limit: int = 50,
    violation_id: Optional[int] = None,
    appellant_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Appeal)
    if violation_id:
        query = query.filter(Appeal.violation_id == violation_id)
    if appellant_id:
        query = query.filter(Appeal.appellant_id == appellant_id)
    if status:
        query = query.filter(Appeal.status == status)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=AppealResponse, status_code=201, summary="File Violation Appeal")
def file_appeal(appeal: AppealCreate, db: Session = Depends(get_db)):
    existing = db.query(Appeal).filter(Appeal.violation_id == appeal.violation_id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Appeal already submitted for violation ID {appeal.violation_id}.")
    db_appeal = Appeal(**appeal.model_dump())
    db.add(db_appeal)
    db.commit()
    db.refresh(db_appeal)
    return db_appeal

@router.get("/{appeal_id}", response_model=AppealResponse, summary="Get Appeal Details")
def get_appeal(appeal_id: int, db: Session = Depends(get_db)):
    appeal = db.query(Appeal).filter(Appeal.appeal_id == appeal_id).first()
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
    return appeal

@router.put("/{appeal_id}/review", response_model=AppealResponse, summary="Review & Adjudicate Appeal (Approve/Reject)")
def review_appeal(
    appeal_id: int,
    review: AppealReview,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    try:
        return STVAMService.review_appeal(db, appeal_id, review, reviewer_username=current_user.username)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

