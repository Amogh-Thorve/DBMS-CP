import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.integrations.parquet.parquet_export import export_traffic_events_to_parquet

router = APIRouter(prefix="/reports", tags=["Analytical Reports & Data Export Pipelines"])

@router.post("/export-parquet", summary="Trigger Parquet Data Lake Export Pipeline")
def trigger_parquet_export(background_tasks: BackgroundTasks):
    out_file = "data/parquet/events.parquet"
    background_tasks.add_task(export_traffic_events_to_parquet, out_file)
    return {
        "status": "QUEUED",
        "message": "Parquet columnar data export pipeline triggered in background.",
        "target_filepath": out_file
    }

@router.get("/status", summary="Check Parquet Pipeline Export Status")
def check_export_status():
    parquet_path = "data/parquet/events.parquet"
    json_path = "data/parquet/events.json"
    
    if os.path.exists(parquet_path):
        size = os.path.getsize(parquet_path)
        return {"status": "COMPLETED", "file": parquet_path, "size_bytes": size, "format": "Apache Parquet Columnar"}
    elif os.path.exists(json_path):
        size = os.path.getsize(json_path)
        return {"status": "COMPLETED_FALLBACK", "file": json_path, "size_bytes": size, "format": "JSON Staging"}
    
    return {"status": "PENDING", "message": "No export generated yet. Call POST /reports/export-parquet."}
