from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Payment
from app.schemas.schemas import PaymentCreate, PaymentResponse
from app.services.business_service import STVAMService

router = APIRouter(prefix="/payments", tags=["Payment Transaction Operations"])

@router.get("", response_model=List[PaymentResponse], summary="List Payments")
def list_payments(
    skip: int = 0,
    limit: int = 50,
    fine_id: Optional[int] = None,
    txn_ref_no: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Payment)
    if fine_id:
        query = query.filter(Payment.fine_id == fine_id)
    if txn_ref_no:
        query = query.filter(Payment.txn_ref_no == txn_ref_no)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=PaymentResponse, status_code=201, summary="Process Fine Payment (ACID Transaction)")
def process_payment(pay: PaymentCreate, db: Session = Depends(get_db)):
    try:
        return STVAMService.process_payment(db, pay)
    except ValueError as e:
        if "already been processed" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{payment_id}", response_model=PaymentResponse, summary="Get Payment Details")
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    pay = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    if not pay:
        raise HTTPException(status_code=404, detail="Payment transaction record not found")
    return pay

