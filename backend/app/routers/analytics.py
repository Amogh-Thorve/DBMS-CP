from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import (
    DashboardSummary, AnalyticsZoneResponse, AnalyticsTypeResponse,
    AnalyticsCollectionResponse, AnalyticsRepeatOffenderResponse, ViolationTrendResponse
)
from app.services.business_service import STVAMService

router = APIRouter(prefix="/analytics", tags=["OLAP Analytics & Dashboard APIs"])

@router.get("/dashboard-summary", response_model=DashboardSummary, summary="Dashboard Overview Metrics")
def get_dashboard_summary(db: Session = Depends(get_db)):
    return STVAMService.get_dashboard_summary(db)

@router.get("/violation-trends", response_model=List[ViolationTrendResponse], summary="Violation Trends Over Time")
def get_violation_trends(days: int = Query(default=7, ge=1, le=90), db: Session = Depends(get_db)):
    return STVAMService.get_violation_trends(db, days=days)

@router.get("/violations-by-zone", response_model=List[AnalyticsZoneResponse], summary="Zone-wise Violation Distribution")
def get_violations_by_zone(db: Session = Depends(get_db)):
    return STVAMService.get_violations_by_zone(db)

@router.get("/violations-by-type", response_model=List[AnalyticsTypeResponse], summary="Violation Category Analytics")
def get_violations_by_type(db: Session = Depends(get_db)):
    return STVAMService.get_violations_by_type(db)

@router.get("/fine-collection", response_model=AnalyticsCollectionResponse, summary="Revenue Collection Trend Analytics")
def get_fine_collection(db: Session = Depends(get_db)):
    return STVAMService.get_fine_collection(db)

@router.get("/repeat-offenders", response_model=List[AnalyticsRepeatOffenderResponse], summary="Repeat Offender Analytics")
def get_repeat_offenders(db: Session = Depends(get_db)):
    return STVAMService.get_repeat_offenders(db)


