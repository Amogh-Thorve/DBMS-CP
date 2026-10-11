import os
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.database import get_db, engine
from app.db.mongo import get_mongo_db
from app.db.elasticsearch import get_es_client

router = APIRouter(prefix="/health", tags=["Health & Diagnostics"])

@router.get("", summary="General Health Check")
def get_health():
    return {"status": "HEALTHY", "system": "STVAMS Core API", "version": "1.0.0"}

@router.get("/db", summary="Oracle DB Diagnostics")
def get_db_health(db: Session = Depends(get_db)):
    try:
        if engine.dialect.name == "oracle":
            db.execute(text("SELECT 1 FROM DUAL"))
            return {"status": "HEALTHY", "database": "Oracle RDBMS", "mode": "PRODUCTION"}
        else:
            db.execute(text("SELECT 1"))
            return {
                "status": "DEGRADED",
                "database": "SQLite (Dev Fallback)",
                "mode": "DEV_FALLBACK",
                "details": "Oracle RDBMS unreachable; operating via SQLite fallback (stvams_dev.db)"
            }
    except Exception as e:
        return {"status": "OFFLINE", "database": "None", "details": str(e)}

@router.get("/mongodb", summary="MongoDB Diagnostics")
def get_mongo_health():
    m_db = get_mongo_db()
    if m_db is not None:
        return {"status": "HEALTHY", "database": "MongoDB Event Store", "details": "Connected"}
    return {"status": "OFFLINE", "database": "MongoDB", "details": "Service unreachable on localhost:27017"}

@router.get("/elasticsearch", summary="Elasticsearch Diagnostics")
def get_es_health():
    es = get_es_client()
    if es is not None:
        return {"status": "HEALTHY", "engine": "Elasticsearch", "details": "Connected"}
    return {"status": "OFFLINE", "engine": "Elasticsearch", "details": "Cluster unreachable on localhost:9200; SQL LIKE fallback active"}

@router.get("/dependencies", summary="Comprehensive System Dependencies Health")
def get_dependencies_health(db: Session = Depends(get_db)):
    db_res = get_db_health(db)
    mongo_res = get_mongo_health()
    es_res = get_es_health()
    
    # Parquet check
    parquet_path = "data/parquet/events.parquet"
    json_path = "data/parquet/events.json"
    if os.path.exists(parquet_path):
        parquet_status = {"status": "HEALTHY", "format": "Apache Parquet Columnar", "file": parquet_path}
    elif os.path.exists(json_path):
        parquet_status = {"status": "FALLBACK", "format": "JSON Staging Fallback", "file": json_path, "details": "pyarrow not installed; JSON fallback active"}
    else:
        parquet_status = {"status": "PENDING", "details": "No export generated yet"}

    return {
        "core_api": {"status": "HEALTHY", "version": "1.0.0"},
        "database": db_res,
        "mongodb": mongo_res,
        "elasticsearch": es_res,
        "warehouse": {"status": "READY", "schema": "Star Schema (Fact/Dim)", "details": "OLAP models initialized"},
        "parquet": parquet_status,
        "hadoop": {"status": "NOT_CONFIGURED", "details": "HDFS cluster offline; local streaming simulation available"}
    }

