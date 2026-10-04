#!/usr/bin/env python3
"""
STVAMS MapReduce Reducer
Aggregates intermediate mapped pairs for analytical jobs:
  1. zone: Aggregates zone violation counts & average speed
  2. hourly: Aggregates hourly vehicle traffic volume
  3. segment: Computes average speed per road segment
Usage:
  cat mapped_sorted.txt | python reducer.py [--job zone|hourly|segment]
"""

import sys

def reducer(job_type: str = "zone"):
    current_key = None
    current_count = 0
    total_speed = 0.0

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        parts = line.split("\t")
        if len(parts) != 2:
            continue

        key, val_str = parts

        if job_type == "hourly":
            try:
                cnt = int(val_str)
            except ValueError:
                cnt = 1
            
            if current_key == key:
                current_count += cnt
            else:
                if current_key is not None:
                    print(f"{current_key}\tTotalTrafficVolume: {current_count} vehicles")
                current_key = key
                current_count = cnt

        elif job_type == "segment":
            try:
                sp_str, cnt_str = val_str.split(",")
                speed = float(sp_str)
                cnt = int(cnt_str)
            except ValueError:
                continue

            if current_key == key:
                current_count += cnt
                total_speed += speed
            else:
                if current_key is not None:
                    avg_sp = round(total_speed / current_count, 2) if current_count > 0 else 0.0
                    print(f"{current_key}\tTotalEvents: {current_count}\tAvgSpeed: {avg_sp} km/h")
                current_key = key
                current_count = cnt
                total_speed = speed

        else: # "zone" default
            try:
                cnt_str, sp_str = val_str.split(",")
                cnt = int(cnt_str)
                speed = float(sp_str)
            except ValueError:
                continue

            if current_key == key:
                current_count += cnt
                total_speed += speed
            else:
                if current_key is not None:
                    avg_sp = round(total_speed / current_count, 2) if current_count > 0 else 0.0
                    print(f"{current_key}\tTotalViolations: {current_count}\tAvgSpeed: {avg_sp} km/h")
                current_key = key
                current_count = cnt
                total_speed = speed

    if current_key is not None:
        if job_type == "hourly":
            print(f"{current_key}\tTotalTrafficVolume: {current_count} vehicles")
        elif job_type == "segment":
            avg_sp = round(total_speed / current_count, 2) if current_count > 0 else 0.0
            print(f"{current_key}\tTotalEvents: {current_count}\tAvgSpeed: {avg_sp} km/h")
        else:
            avg_sp = round(total_speed / current_count, 2) if current_count > 0 else 0.0
            print(f"{current_key}\tTotalViolations: {current_count}\tAvgSpeed: {avg_sp} km/h")

if __name__ == "__main__":
    job = "zone"
    if len(sys.argv) > 1:
        for i, arg in enumerate(sys.argv):
            if arg in ["--job", "-j"] and i + 1 < len(sys.argv):
                job = sys.argv[i + 1]
            elif arg.startswith("--job="):
                job = arg.split("=")[1]
    reducer(job)
