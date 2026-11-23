"""
Performance Benchmark for MediCore Clinical Data Processing
Assessment 05 Deliverable: Demonstrates sub-second throughput and correctness
on 10,000 synthetic laboratory records.
"""

import time
import random
from typing import List, Dict, Any
from .processing import process_lab_batch


def generate_synthetic_benchmark_dataset(n: int = 10000) -> List[Dict[str, Any]]:
    test_codes = ["GLU", "CHOL", "HGB", "WBC", "PLT", "CREAT", "K", "NA"]
    units = {
        "GLU": "mg/dL", "CHOL": "mg/dL", "HGB": "g/dL",
        "WBC": "cells/mcL", "PLT": "cells/mcL", "CREAT": "mg/dL",
        "K": "mmol/L", "NA": "mmol/L"
    }
    dataset = []

    for i in range(n):
        code = random.choice(test_codes)
        # Introduce 2% intentional malformed or edge values
        r_type = random.random()
        if r_type < 0.01:
            val = "MALFORMED_VALUE"
        elif r_type < 0.02:
            val = None
        else:
            val = round(random.uniform(10.0, 300.0), 2)

        dataset.append({
            "order_id": f"ORD-BENCH-{i:06d}",
            "patient_id": f"PAT-{(i % 500):04d}",
            "test_code": code,
            "test_name": f"Test {code}",
            "value": val,
            "unit": units[code],
            "recorded_at": "2026-11-20T12:00:00Z"
        })

    return dataset


def run_benchmark():
    count = 10000
    print(f"Generating {count} synthetic clinical lab records for benchmark...")
    dataset = generate_synthetic_benchmark_dataset(count)

    print("Executing batch ingestion, unit normalization, reference checking, and anomaly flagging...")
    start_time = time.perf_counter()
    report = process_lab_batch(dataset)
    elapsed = time.perf_counter() - start_time

    throughput = count / elapsed if elapsed > 0 else 0

    print("\n--- BENCHMARK RESULTS ---")
    print(f"Total Records: {report.total_records}")
    print(f"Valid Processed: {report.valid_records}")
    print(f"Malformed / Handled: {report.malformed_records}")
    print(f"Abnormal Flags: {report.abnormal_count}")
    print(f"Critical Alerts: {report.critical_count}")
    print(f"Elapsed Time: {elapsed:.4f} seconds")
    print(f"Throughput: {throughput:.0f} records/second")
    print("-------------------------\n")
    return {
        "total_records": count,
        "elapsed_seconds": round(elapsed, 4),
        "throughput_rps": round(throughput, 1),
        "valid_records": report.valid_records,
        "malformed_records": report.malformed_records
    }


if __name__ == "__main__":
    run_benchmark()
