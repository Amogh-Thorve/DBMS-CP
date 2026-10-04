from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.mongo import get_mongo_db
from app.db.elasticsearch import get_es_client

router = APIRouter(prefix="/health", tags=["Health & Diagnostics"])

@router.get("", summary="General Health Check")
def get_health():
    return {"status": "HEALTHY", "system": "STVAMS Core API", "version": "1.0.0"}

@router.get("/db", summary="Oracle DB Diagnostics")
def get_db_health(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1 FROM DUAL")
        return {"status": "CONNECTED", "database": "Oracle RDBMS"}
    except Exception as e:
        return {"status": "FALLBACK/OFFLINE", "details": str(e)}

@router.get("/mongodb", summary="MongoDB Diagnostics")
def get_mongo_health():
    m_db = get_mongo_db()
    if m_db is not None:
        return {"status": "CONNECTED", "database": "MongoDB Event Store"}
    return {"status": "OFFLINE", "database": "MongoDB"}

@router.get("/elasticsearch", summary="Elasticsearch Diagnostics")
def get_es_health():
    es = get_es_client()
    if es is not None:
        return {"status": "CONNECTED", "engine": "Elasticsearch"}
    return {"status": "OFFLINE", "engine": "Elasticsearch"}
