from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Owner
from app.schemas.schemas import OwnerCreate, OwnerResponse, OwnerUpdate

router = APIRouter(prefix="/owners", tags=["Owner Entity Operations"])

@router.get("", response_model=List[OwnerResponse], summary="List Owners")
def list_owners(skip: int = 0, limit: int = 50, national_id: Optional[str] = None, email: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Owner)
    if national_id:
        query = query.filter(Owner.national_id == national_id)
    if email:
        query = query.filter(Owner.email == email)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=OwnerResponse, status_code=201, summary="Register New Owner")
def create_owner(owner: OwnerCreate, db: Session = Depends(get_db)):
    existing = db.query(Owner).filter(
        (Owner.national_id == owner.national_id) | (Owner.email == owner.email)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Owner with given National ID or Email already exists.")
    db_owner = Owner(**owner.model_dump())
    db.add(db_owner)
    db.commit()
    db.refresh(db_owner)
    return db_owner

@router.get("/{owner_id}", response_model=OwnerResponse, summary="Get Owner Details")
def get_owner(owner_id: int, db: Session = Depends(get_db)):
    owner = db.query(Owner).filter(Owner.owner_id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    return owner

@router.put("/{owner_id}", response_model=OwnerResponse, summary="Update Owner Details")
def update_owner(owner_id: int, update_data: OwnerUpdate, db: Session = Depends(get_db)):
    owner = db.query(Owner).filter(Owner.owner_id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(owner, key, val)
    db.commit()
    db.refresh(owner)
    return owner

@router.delete("/{owner_id}", status_code=204, summary="Delete Owner Record")
def delete_owner(owner_id: int, db: Session = Depends(get_db)):
    owner = db.query(Owner).filter(Owner.owner_id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    db.delete(owner)
    db.commit()
    return None

