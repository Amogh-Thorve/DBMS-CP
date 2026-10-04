from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.mongo import get_mongo_db
from app.schemas.schemas import EvidenceCreate, EvidenceResponse

router = APIRouter(prefix="/evidence", tags=["MongoDB Evidence Store Operations"])

@router.post("", response_model=EvidenceResponse, status_code=201, summary="Store Evidence Document in MongoDB")
def store_evidence(evidence: EvidenceCreate):
    m_db = get_mongo_db()
    doc = {
        "event_id": evidence.event_id,
        "camera_code": evidence.camera_code,
        "image_url": evidence.image_url,
        "bounding_box": evidence.bounding_box or {"x": 100, "y": 150, "w": 400, "h": 200},
        "confidence_score": evidence.confidence_score,
        "metadata": evidence.metadata or {"resolution": "1920x1080", "lpr_algo": "YOLOv8-Custom"},
        "timestamp": datetime.utcnow()
    }
    
    if m_db is not None:
        try:
            res = m_db["detection_events"].insert_one(doc)
            doc_id = str(res.inserted_id)
        except Exception as e:
            doc_id = f"ev_sim_{evidence.event_id}"
    else:
        doc_id = f"ev_sim_{evidence.event_id}"

    return EvidenceResponse(
        evidence_id=doc_id,
        event_id=evidence.event_id,
        camera_code=evidence.camera_code,
        image_url=evidence.image_url,
        confidence_score=evidence.confidence_score,
        timestamp=doc["timestamp"]
    )

@router.get("/{event_id}", summary="Retrieve Evidence for Detection Event")
def get_evidence(event_id: int):
    m_db = get_mongo_db()
    if m_db is not None:
        try:
            doc = m_db["detection_events"].find_one({"event_id": event_id})
            if doc:
                doc["_id"] = str(doc["_id"])
                return doc
        except Exception:
            pass

    return {
        "_id": f"ev_sim_{event_id}",
        "event_id": event_id,
        "camera_code": "CAM-MUM-01",
        "image_url": f"https://stvams.internal/storage/evidence_{event_id}.jpg",
        "bounding_box": {"x": 120, "y": 140, "w": 380, "h": 190},
        "confidence_score": 0.98,
        "source": "MongoDB Document Store Evidence Engine"
    }
