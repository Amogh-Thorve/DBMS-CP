from typing import Optional, List
from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Vehicle, Violation, TrafficZone, Camera, ViolationType
from app.db.elasticsearch import get_es_client

router = APIRouter(prefix="/search", tags=["Elasticsearch & Fast Search Operations"])

@router.get("", summary="Fast Multidimensional Search Across Violations & Vehicles")
def search_violations(
    q: Optional[str] = Query(None, description="Registration number, type code, or keyword"),
    status: Optional[str] = Query(None),
    registration_no: Optional[str] = Query(None),
    zone_code: Optional[str] = Query(None),
    min_speed: Optional[float] = Query(None),
    max_speed: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    es = get_es_client()
    if es is not None:
        try:
            query_clause = {"bool": {"must": []}}
            if q:
                query_clause["bool"]["must"].append({"multi_match": {"query": q, "fields": ["registration_no", "remarks", "zone_code"]}})
            if status:
                query_clause["bool"]["must"].append({"term": {"status": status}})
            if registration_no:
                query_clause["bool"]["must"].append({"term": {"registration_no": registration_no.upper()}})
            
            search_body = {"query": query_clause if query_clause["bool"]["must"] else {"match_all": {}}}
            res = es.search(index="traffic_violations", body=search_body)
            hits = [hit["_source"] for hit in res["hits"]["hits"]]
            return {"source": "Elasticsearch", "total": len(hits), "results": hits}
        except Exception:
            pass

    # RDBMS fallback search execution with joins
    query = db.query(Violation)
    if q:
        query = query.filter(Violation.remarks.ilike(f"%{q}%"))
    if status:
        query = query.filter(Violation.status == status)
    if registration_no:
        query = query.join(Vehicle, Vehicle.vehicle_id == Violation.vehicle_id).filter(Vehicle.registration_no == registration_no.upper())

    results = query.limit(50).all()
    return {"source": "Oracle RDBMS Search Engine", "total": len(results), "results": results}

