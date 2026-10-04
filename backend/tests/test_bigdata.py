import os
import io
import sys
import pytest
from app.integrations.parquet.parquet_export import export_traffic_events_to_parquet
from bigdata.verify_parquet import verify_parquet_file
from bigdata.mapreduce.mapper import mapper
from bigdata.mapreduce.reducer import reducer
from bigdata.mapreduce.driver import run_mapreduce_pipeline


def test_parquet_export_and_verification(tmp_path):
    output_file = os.path.join(tmp_path, "test_events.parquet")
    result_path = export_traffic_events_to_parquet(output_filepath=output_file)
    assert os.path.exists(result_path)

    # Verify Parquet / JSON verification function
    success = verify_parquet_file(result_path)
    assert success is True

def test_mapreduce_mapper_zone_job():
    sample_json = '[{"zone_code": "Z-MUM-01", "observed_speed": 90.0, "event_status": "VIOLATION_CONFIRMED"}]'
    old_stdin = sys.stdin
    old_stdout = sys.stdout

    sys.stdin = io.StringIO(sample_json)
    sys.stdout = out_buf = io.StringIO()

    try:
        mapper(job_type="zone")
    finally:
        sys.stdin = old_stdin
        sys.stdout = old_stdout

    output = out_buf.getvalue().strip()
    assert "Z-MUM-01\t1,90.0" in output

def test_mapreduce_reducer_zone_job():
    sample_intermediate = "Z-MUM-01\t1,90.0\nZ-MUM-01\t1,100.0\n"
    old_stdin = sys.stdin
    old_stdout = sys.stdout

    sys.stdin = io.StringIO(sample_intermediate)
    sys.stdout = out_buf = io.StringIO()

    try:
        reducer(job_type="zone")
    finally:
        sys.stdin = old_stdin
        sys.stdout = old_stdout

    output = out_buf.getvalue().strip()
    assert "Z-MUM-01" in output
    assert "TotalViolations: 2" in output
    assert "AvgSpeed: 95.0 km/h" in output

def test_mapreduce_driver_pipeline():
    sample_input = """zone_code,observed_speed,event_status,event_timestamp,segment_id
Z-MUM-01,80.0,VIOLATION_CONFIRMED,2026-09-15T08:00:00,1
Z-MUM-01,100.0,VIOLATION_CONFIRMED,2026-09-15T08:30:00,1
Z-DEL-01,90.0,VIOLATION_CONFIRMED,2026-09-15T09:00:00,2
"""
    # Zone job
    zone_res = run_mapreduce_pipeline(sample_input, job_type="zone")
    assert "Z-MUM-01" in zone_res
    assert "TotalViolations: 2" in zone_res

    # Hourly job
    hourly_res = run_mapreduce_pipeline(sample_input, job_type="hourly")
    assert "08:00" in hourly_res

    # Segment job
    segment_res = run_mapreduce_pipeline(sample_input, job_type="segment")
    assert "Segment_01" in segment_res
