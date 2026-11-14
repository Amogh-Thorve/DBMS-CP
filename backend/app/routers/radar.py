"""
STVAMS Speed Radar & ANPR Optical Enforcement Router
Exposes:
- Camera radar calibration telemetry
- Mathematical velocity calculation
- Real-time optical plate OCR processing
- Real-time speed radar citation & fine issuance
- Video feed file analysis
"""

import base64
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Camera, RoadSegment, Road, TrafficZone
from app.schemas.schemas import (
    RadarEventInput, RadarCitationResponse, FrameOCRInput, FrameOCRResponse
)
from app.services.radar_service import RadarService

router = APIRouter(prefix="/anpr", tags=["Speed Radar & ANPR Optical Enforcement"])


@router.get("/cameras", summary="List Cameras with Road Speed Limits & Radar Calibration")
def list_radar_cameras(db: Session = Depends(get_db)):
    """
    Returns surveillance camera nodes with linked road, zone, and statutory speed limits.
    """
    cameras = db.query(Camera).all()
    results = []
    for c in cameras:
        road = c.segment.road if c.segment else None
        zone = road.zone if road else None
        results.append({
            "camera_id": c.camera_id,
            "camera_code": c.camera_code,
            "camera_type": c.camera_type,
            "status": c.status,
            "ip_address": c.ip_address,
            "road_name": road.road_name if road else "Smart City Arterial Corridor",
            "speed_limit_kmh": road.speed_limit_kmh if road else 60,
            "zone_name": zone.zone_name if zone else "Municipal Traffic Grid",
            "zone_code": zone.zone_code if zone else "Z-MUM-01",
            "calibrated_distance_meters": 15.0,
            "entry_line_pct": 35,
            "exit_line_pct": 70
        })
    return results


@router.post("/calculate-speed", summary="Kinematic Speed Math Calculation")
def calculate_speed_math(
    delta_meters: float = 15.0,
    delta_time_sec: float = 0.55,
    fps: float = 30.0
):
    """
    Computes velocity from spatial displacement and elapsed time using kinematic physics:
    v (km/h) = (delta_distance / delta_time) * 3.6
    """
    return RadarService.calculate_speed_math(
        delta_meters=delta_meters,
        delta_time_sec=delta_time_sec,
        fps=fps
    )


@router.post("/speed-radar-event", response_model=RadarCitationResponse, status_code=201, summary="Ingest Speed Radar Detection & Issue Citation")
def ingest_radar_event(
    event_in: RadarEventInput,
    db: Session = Depends(get_db)
):
    """
    Ingests live speed radar telemetry event.
    Verifies speed against corridor speed limit.
    If overspeeding, automatically generates:
    1. VehicleEvent (event_status='VIOLATION_CONFIRMED')
    2. Relational Violation record (VIO_SPEEDING)
    3. Statutory Fine record with 30-day settlement due date
    4. Demerit points on Driver License
    5. MongoDB Evidence Snapshot
    """
    try:
        citation = RadarService.process_radar_event(db, event_in)
        return citation
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to process radar citation: {str(e)}")


@router.post("/process-frame", response_model=FrameOCRResponse, summary="OpenCV Plate Enhancement & Optical Character Recognition")
async def process_frame_ocr(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts an uploaded image frame or plate snapshot.
    Executes OpenCV image enhancement (grayscale, bilateral filter, Otsu thresholding, contour detection)
    and extracts alphanumeric plate characters with database verification.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty frame uploaded.")

    return RadarService.extract_license_plate_text(contents, db)


@router.post("/process-frame-base64", response_model=FrameOCRResponse, summary="OpenCV Plate OCR via Base64 Webcam Frame")
def process_frame_base64_ocr(
    input_data: FrameOCRInput,
    db: Session = Depends(get_db)
):
    """
    Accepts base64-encoded webcam frame.
    Executes OpenCV image enhancement (grayscale, bilateral filter, Otsu thresholding, contour detection)
    and extracts alphanumeric plate characters with database verification.
    """
    try:
        raw_b64 = input_data.image_b64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",")[1]
        image_bytes = base64.b64decode(raw_b64)
        return RadarService.extract_license_plate_text(image_bytes, db)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to decode webcam frame: {str(e)}")


@router.post("/process-video", summary="Process Video File for Vehicle Velocity & Automatic Fining")
async def process_video_feed(
    file: UploadFile = File(...),
    camera_id: int = Form(1),
    db: Session = Depends(get_db)
):
    """
    Accepts an uploaded traffic video clip (.mp4, .webm, .avi).
    Performs dual-gate background subtraction and centroid tracking across frames.
    Calculates velocity for each tracked vehicle and automatically generates citations in the database for speeding vehicles.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty video file uploaded.")

    try:
        report = RadarService.process_video_file(contents, camera_id, db)
        return report
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
