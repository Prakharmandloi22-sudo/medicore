"""
MediCore Clinical Data Processing Engine
Assessment 05: Data validation, unit standardisation, reference range evaluation,
and safe handling of malformed or missing values.
"""

from typing import List, Dict, Any, Tuple
from datetime import datetime
from .models import (
    RawLabRecord, ProcessedLabResult, LabProcessingReport, LabStatus,
    RawAppointmentRecord, ProcessedAppointment
)

# Standard reference range definitions for synthetic tests
STANDARD_REFERENCE_RANGES: Dict[str, Dict[str, Any]] = {
    "GLU": {"name": "Fasting Blood Glucose", "unit": "mg/dL", "min": 70.0, "max": 99.0, "critical_low": 45.0, "critical_high": 350.0},
    "CHOL": {"name": "Total Cholesterol", "unit": "mg/dL", "min": 125.0, "max": 200.0, "critical_low": 50.0, "critical_high": 400.0},
    "HGB": {"name": "Hemoglobin", "unit": "g/dL", "min": 12.0, "max": 17.5, "critical_low": 7.0, "critical_high": 20.0},
    "WBC": {"name": "White Blood Cell Count", "unit": "cells/mcL", "min": 4500.0, "max": 11000.0, "critical_low": 2000.0, "critical_high": 30000.0},
    "PLT": {"name": "Platelet Count", "unit": "cells/mcL", "min": 150000.0, "max": 450000.0, "critical_low": 50000.0, "critical_high": 1000000.0},
    "CREAT": {"name": "Serum Creatinine", "unit": "mg/dL", "min": 0.6, "max": 1.2, "critical_low": 0.3, "critical_high": 5.0},
    "K": {"name": "Potassium", "unit": "mmol/L", "min": 3.5, "max": 5.0, "critical_low": 2.8, "critical_high": 6.5},
    "NA": {"name": "Sodium", "unit": "mmol/L", "min": 135.0, "max": 145.0, "critical_low": 120.0, "critical_high": 160.0},
}


def normalize_unit(test_code: str, value: float, unit: str) -> Tuple[float, str]:
    """
    Normalizes known unit variations.
    E.g. mmol/L glucose to mg/dL (1 mmol/L glucose = 18.0182 mg/dL)
    """
    u = unit.strip().lower()
    code = test_code.upper()
    
    if code == "GLU" and "mmol" in u:
        return round(value * 18.0182, 2), "mg/dL"
    if code == "CHOL" and "mmol" in u:
        return round(value * 38.67, 2), "mg/dL"
        
    return value, unit


def evaluate_lab_result(record: Dict[str, Any]) -> ProcessedLabResult:
    """
    Safely parses, validates, and tags a lab test result.
    Handles malformed values, missing keys, and invalid numbers.
    """
    order_id = str(record.get("order_id", "UNKNOWN"))
    patient_id = str(record.get("patient_id", "UNKNOWN"))
    test_code = str(record.get("test_code", "")).strip().upper()
    test_name = str(record.get("test_name", test_code))
    raw_unit = str(record.get("unit", ""))
    raw_value = record.get("value")
    recorded_at = str(record.get("recorded_at", datetime.utcnow().isoformat()))

    # Basic validations
    if not test_code:
        return ProcessedLabResult(
            order_id=order_id,
            patient_id=patient_id,
            test_code="UNKNOWN",
            test_name=test_name,
            numeric_value=None,
            unit=raw_unit,
            reference_min=None,
            reference_max=None,
            flag=LabStatus.INVALID,
            is_valid=False,
            validation_error="Missing test_code",
            recorded_at=recorded_at,
        )

    # Attempt numeric parsing
    if raw_value is None or raw_value == "":
        return ProcessedLabResult(
            order_id=order_id,
            patient_id=patient_id,
            test_code=test_code,
            test_name=test_name,
            numeric_value=None,
            unit=raw_unit,
            reference_min=None,
            reference_max=None,
            flag=LabStatus.INVALID,
            is_valid=False,
            validation_error="Value is empty or None",
            recorded_at=recorded_at,
        )

    try:
        val = float(str(raw_value).replace(",", ".").strip())
    except (ValueError, TypeError):
        return ProcessedLabResult(
            order_id=order_id,
            patient_id=patient_id,
            test_code=test_code,
            test_name=test_name,
            numeric_value=None,
            unit=raw_unit,
            reference_min=None,
            reference_max=None,
            flag=LabStatus.INVALID,
            is_valid=False,
            validation_error=f"Unparseable numeric value: {raw_value}",
            recorded_at=recorded_at,
        )

    # Negative check for physical counts
    if val < 0 and test_code in ["GLU", "CHOL", "HGB", "WBC", "PLT", "CREAT"]:
        return ProcessedLabResult(
            order_id=order_id,
            patient_id=patient_id,
            test_code=test_code,
            test_name=test_name,
            numeric_value=val,
            unit=raw_unit,
            reference_min=None,
            reference_max=None,
            flag=LabStatus.INVALID,
            is_valid=False,
            validation_error=f"Negative value impossible for test {test_code}: {val}",
            recorded_at=recorded_at,
        )

    # Normalize unit if recognized
    val, unit = normalize_unit(test_code, val, raw_unit)

    # Resolve reference ranges
    ref_info = STANDARD_REFERENCE_RANGES.get(test_code, {})
    ref_min = float(record.get("reference_min")) if record.get("reference_min") is not None else ref_info.get("min")
    ref_max = float(record.get("reference_max")) if record.get("reference_max") is not None else ref_info.get("max")
    crit_low = ref_info.get("critical_low")
    crit_high = ref_info.get("critical_high")

    # Flag assignment
    flag = LabStatus.NORMAL
    if crit_low is not None and val <= crit_low:
        flag = LabStatus.CRITICAL
    elif crit_high is not None and val >= crit_high:
        flag = LabStatus.CRITICAL
    elif ref_min is not None and val < ref_min:
        flag = LabStatus.ABNORMAL_LOW
    elif ref_max is not None and val > ref_max:
        flag = LabStatus.ABNORMAL_HIGH

    return ProcessedLabResult(
        order_id=order_id,
        patient_id=patient_id,
        test_code=test_code,
        test_name=ref_info.get("name", test_name),
        numeric_value=val,
        unit=unit,
        reference_min=ref_min,
        reference_max=ref_max,
        flag=flag,
        is_valid=True,
        validation_error=None,
        recorded_at=recorded_at,
    )


def process_lab_batch(records: List[Dict[str, Any]]) -> LabProcessingReport:
    """Processes a batch of lab records and produces an operational report."""
    results: List[ProcessedLabResult] = []
    errors: List[Dict[str, Any]] = []
    valid_count = 0
    malformed_count = 0
    abnormal_count = 0
    critical_count = 0

    for idx, r in enumerate(records):
        try:
            res = evaluate_lab_result(r)
            results.append(res)
            if res.is_valid:
                valid_count += 1
                if res.flag in [LabStatus.ABNORMAL_LOW, LabStatus.ABNORMAL_HIGH]:
                    abnormal_count += 1
                elif res.flag == LabStatus.CRITICAL:
                    critical_count += 1
            else:
                malformed_count += 1
                errors.append({"index": idx, "order_id": r.get("order_id"), "error": res.validation_error})
        except Exception as e:
            malformed_count += 1
            errors.append({"index": idx, "order_id": r.get("order_id"), "error": str(e)})

    return LabProcessingReport(
        total_records=len(records),
        valid_records=valid_count,
        malformed_records=malformed_count,
        abnormal_count=abnormal_count,
        critical_count=critical_count,
        processed_results=results,
        errors=errors,
    )


def process_appointment_batch(records: List[Dict[str, Any]]) -> List[ProcessedAppointment]:
    """Validates and processes synthetic appointment logs for operational metrics."""
    processed = []
    for r in records:
        try:
            start_str = r.get("scheduled_start")
            if not start_str:
                continue
            start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
            
            wait_time = None
            if r.get("arrival_time") and r.get("encounter_start"):
                arr_dt = datetime.fromisoformat(r["arrival_time"].replace("Z", "+00:00"))
                enc_dt = datetime.fromisoformat(r["encounter_start"].replace("Z", "+00:00"))
                wait_time = max(0.0, (enc_dt - arr_dt).total_seconds() / 60.0)

            service_time = None
            if r.get("encounter_start") and r.get("encounter_end"):
                s_dt = datetime.fromisoformat(r["encounter_start"].replace("Z", "+00:00"))
                e_dt = datetime.fromisoformat(r["encounter_end"].replace("Z", "+00:00"))
                service_time = max(0.0, (e_dt - s_dt).total_seconds() / 60.0)

            processed.append(
                ProcessedAppointment(
                    appointment_id=str(r.get("appointment_id", "")),
                    patient_id=str(r.get("patient_id", "")),
                    provider_id=str(r.get("provider_id", "")),
                    department=str(r.get("department", "General")),
                    scheduled_start=start_dt,
                    duration_minutes=int(r.get("duration_minutes", 30)),
                    status=str(r.get("status", "SCHEDULED")).upper(),
                    wait_time_minutes=wait_time,
                    service_time_minutes=service_time,
                    is_valid=True,
                    validation_error=None,
                )
            )
        except Exception as e:
            processed.append(
                ProcessedAppointment(
                    appointment_id=str(r.get("appointment_id", "UNKNOWN")),
                    patient_id=str(r.get("patient_id", "UNKNOWN")),
                    provider_id=str(r.get("provider_id", "UNKNOWN")),
                    department="Unknown",
                    scheduled_start=datetime.utcnow(),
                    duration_minutes=30,
                    status="INVALID",
                    is_valid=False,
                    validation_error=str(e),
                )
            )
    return processed
