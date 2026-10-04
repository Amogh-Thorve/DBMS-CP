#!/usr/bin/env python3
"""
STVAMS MapReduce Local Execution Driver
Executes Hadoop Streaming MapReduce pipeline locally using python subprocess piping or stream buffer execution.
Supports job types: 'zone' (default), 'hourly', 'segment'.

Usage:
  python bigdata/mapreduce/driver.py [--job zone|hourly|segment] [--input file_path]
"""

import io
import os
import sys
import argparse
import subprocess

sys.path.insert(0, os.path.dirname(__file__))
from mapper import mapper
from reducer import reducer

def run_mapreduce_pipeline(input_data: str, job_type: str = "zone") -> str:
    """
    Simulates Hadoop Streaming pipe: input_data | mapper.py --job {job} | sort | reducer.py --job {job}
    """
    print("==================================================")
    print(f"STVAMS MAPREDUCE STREAMING JOB STARTED [Job Type: {job_type.upper()}]")
    print("==================================================")

    # 1. MAP PHASE
    old_stdin = sys.stdin
    old_stdout = sys.stdout

    sys.stdin = io.StringIO(input_data)
    sys.stdout = map_out_buffer = io.StringIO()

    try:
        mapper(job_type=job_type)
    except Exception as e:
        sys.stdin = old_stdin
        sys.stdout = old_stdout
        print(f"[MAPPER ERROR]: Execution failed: {e}")
        return ""

    sys.stdin = old_stdin
    sys.stdout = old_stdout

    mapped_raw = map_out_buffer.getvalue().strip()
    if not mapped_raw:
        print("[MAP PHASE WARNING]: No mapped pairs generated.")
        return ""

    mapped_lines = [line for line in mapped_raw.split("\n") if line.strip()]
    print(f"[MAP PHASE SUCCESS]: Generated {len(mapped_lines)} intermediate key-value pairs.")

    # 2. SHUFFLE & SORT PHASE
    mapped_lines.sort()
    sorted_intermediate = "\n".join(mapped_lines)

    # 3. REDUCE PHASE
    sys.stdin = io.StringIO(sorted_intermediate)
    sys.stdout = reduce_out_buffer = io.StringIO()

    try:
        reducer(job_type=job_type)
    except Exception as e:
        sys.stdin = old_stdin
        sys.stdout = old_stdout
        print(f"[REDUCER ERROR]: Execution failed: {e}")
        return ""

    sys.stdin = old_stdin
    sys.stdout = old_stdout

    results = reduce_out_buffer.getvalue().strip()
    print("\n==================================================")
    print(f"STVAMS MAPREDUCE AGGREGATED OUTPUT [{job_type.upper()}]")
    print("==================================================")
    print(results)
    print("==================================================")

    # Save output to disk
    out_dir = os.path.join(os.path.dirname(__file__), "output")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, f"{job_type}_output.txt")
    with open(out_file, "w") as f:
        f.write(results + "\n")
    print(f"[DRIVER SUCCESS]: Output written to: {out_file}\n")

    return results

def locate_input_data(custom_path: str = None) -> str:
    """
    Locates available input data from data/parquet/events.json or sample stream.
    """
    if custom_path and os.path.exists(custom_path):
        with open(custom_path, "r") as f:
            return f.read()

    default_paths = [
        "data/parquet/events.json",
        "../data/parquet/events.json",
        "../../data/parquet/events.json"
    ]
    for p in default_paths:
        if os.path.exists(p):
            print(f"[DRIVER INPUT]: Reading data from: {p}")
            with open(p, "r") as f:
                return f.read()

    # Fallback inline dataset
    print("[DRIVER INPUT]: Staging file not found. Generating live test stream.")
    return """zone_code,observed_speed,event_status,event_timestamp,segment_id
Z-MUM-01,85.5,VIOLATION_CONFIRMED,2026-09-15T08:15:00,1
Z-MUM-01,92.0,VIOLATION_CONFIRMED,2026-09-15T08:45:00,1
Z-DEL-01,75.0,VIOLATION_CONFIRMED,2026-09-15T09:10:00,2
Z-MUM-01,55.0,CLEARED,2026-09-15T09:30:00,1
Z-BLR-01,88.4,VIOLATION_CONFIRMED,2026-09-15T10:05:00,3
Z-DEL-01,95.0,VIOLATION_CONFIRMED,2026-09-15T10:20:00,2
"""

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="STVAMS MapReduce Local Streaming Driver")
    parser.add_argument("--job", "-j", choices=["zone", "hourly", "segment"], default="zone", help="Job type")
    parser.add_argument("--input", "-i", type=str, default=None, help="Input data file path")
    args = parser.parse_args()

    input_text = locate_input_data(args.input)
    run_mapreduce_pipeline(input_text, job_type=args.job)
