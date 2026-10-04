#!/usr/bin/env python3
"""
STVAMS MapReduce Mapper
Supports analytical jobs:
  1. zone (default): Zone-wise violation count & speed
  2. hourly: Hourly traffic volume aggregation
  3. segment: Average observed speed by road segment
Usage:
  cat data.json | python mapper.py [--job zone|hourly|segment]
"""

import sys
import json
from datetime import datetime

def process_record(doc: dict, job_type: str):
    zones = ["Z-MUM-01", "Z-DEL-01", "Z-BLR-01", "Z-HYD-01", "Z-MAA-01"]
    
    event_id = doc.get("event_id", 1)
    camera_id = doc.get("camera_id", 1)
    zone_code = doc.get("zone_code") or zones[camera_id % len(zones)]
    speed = float(doc.get("observed_speed", 0.0))
    status = doc.get("event_status", "")
    ts_str = str(doc.get("event_timestamp", ""))
    segment_id = doc.get("segment_id") or ((camera_id % 10) + 1)

    if job_type == "hourly":
        try:
            clean_ts = ts_str.replace("Z", "").replace(" ", "T")
            dt = datetime.fromisoformat(clean_ts)
            hour_key = f"{dt.hour:02d}:00"
        except Exception:
            hour_key = f"{(event_id % 24):02d}:00"
        print(f"{hour_key}\t1")

    elif job_type == "segment":
        seg_key = f"Segment_{segment_id:02d}"
        print(f"{seg_key}\t{speed},1")

    else: # "zone" default
        if status == "VIOLATION_CONFIRMED" or not status:
            print(f"{zone_code}\t1,{speed}")

def mapper(job_type: str = "zone"):
    raw_input = sys.stdin.read().strip()
    if not raw_input:
        return

    # Attempt 1: Parse full JSON (List of Dicts)
    try:
        data = json.loads(raw_input)
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    process_record(item, job_type)
            return
        elif isinstance(data, dict):
            process_record(data, job_type)
            return
    except Exception:
        pass

    # Attempt 2: Parse Line-by-Line (CSV or NDJSON)
    for line in raw_input.split("\n"):
        line = line.strip()
        if not line or line.startswith("zone_code") or line in ["[", "]", "},", "}"]:
            continue
        try:
            clean_line = line.rstrip(",")
            doc = json.loads(clean_line)
            if isinstance(doc, dict):
                process_record(doc, job_type)
                continue
        except Exception:
            pass

        # CSV parsing
        parts = line.split(",")
        if len(parts) >= 3:
            try:
                zone_code = parts[0].strip()
                speed = float(parts[1].strip())
                status = parts[2].strip()
                ts_str = parts[3].strip() if len(parts) > 3 else ""
                segment_id = int(parts[4].strip()) if len(parts) > 4 else 1
                doc = {
                    "zone_code": zone_code,
                    "observed_speed": speed,
                    "event_status": status,
                    "event_timestamp": ts_str,
                    "segment_id": segment_id
                }
                process_record(doc, job_type)
            except ValueError:
                continue

if __name__ == "__main__":
    job = "zone"
    if len(sys.argv) > 1:
        for i, arg in enumerate(sys.argv):
            if arg in ["--job", "-j"] and i + 1 < len(sys.argv):
                job = sys.argv[i + 1]
            elif arg.startswith("--job="):
                job = arg.split("=")[1]
    mapper(job)
