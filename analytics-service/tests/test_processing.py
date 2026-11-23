"""
Tests for MediCore Clinical Data Processing (Assessment 05)
Covers success paths, unit conversions, reference range checks,
malformed data handling, and negative values.
"""

import pytest
from app.processing import evaluate_lab_result, process_lab_batch, process_appointment_batch
from app.models import LabStatus


def test_evaluate_normal_glucose():
    rec = {
        "order_id": "ORD-001",
        "patient_id": "PAT-001",
        "test_code": "GLU",
        "test_name": "Fasting Glucose",
        "value": 85.0,
        "unit": "mg/dL",
    }
    res = evaluate_lab_result(rec)
    assert res.is_valid is True
    assert res.flag == LabStatus.NORMAL
    assert res.numeric_value == 85.0
    assert res.unit == "mg/dL"


def test_unit_normalization_glucose_mmol():
    # 5.0 mmol/L should convert to ~90.09 mg/dL
    rec = {
        "order_id": "ORD-002",
        "patient_id": "PAT-001",
        "test_code": "GLU",
        "value": 5.0,
        "unit": "mmol/L",
    }
    res = evaluate_lab_result(rec)
    assert res.is_valid is True
    assert res.unit == "mg/dL"
    assert 89.0 <= res.numeric_value <= 91.0
    assert res.flag == LabStatus.NORMAL


def test_abnormal_and_critical_flags():
    # Critical high potassium
    crit_rec = {
        "order_id": "ORD-003",
        "patient_id": "PAT-002",
        "test_code": "K",
        "value": 7.2,
        "unit": "mmol/L",
    }
    res = evaluate_lab_result(crit_rec)
    assert res.is_valid is True
    assert res.flag == LabStatus.CRITICAL

    # High cholesterol
    high_rec = {
        "order_id": "ORD-004",
        "patient_id": "PAT-002",
        "test_code": "CHOL",
        "value": 240.0,
        "unit": "mg/dL",
    }
    res_high = evaluate_lab_result(high_rec)
    assert res_high.is_valid is True
    assert res_high.flag == LabStatus.ABNORMAL_HIGH


def test_malformed_and_missing_values():
    # Missing test_code
    bad_code = {"order_id": "ORD-005", "value": 100}
    res1 = evaluate_lab_result(bad_code)
    assert res1.is_valid is False
    assert "Missing test_code" in res1.validation_error

    # String value that cannot be converted to float
    bad_val = {"order_id": "ORD-006", "test_code": "GLU", "value": "NOT_A_NUMBER"}
    res2 = evaluate_lab_result(bad_val)
    assert res2.is_valid is False
    assert "Unparseable" in res2.validation_error

    # Negative value for physical test
    neg_val = {"order_id": "ORD-007", "test_code": "HGB", "value": -14.0}
    res3 = evaluate_lab_result(neg_val)
    assert res3.is_valid is False
    assert "Negative value impossible" in res3.validation_error


def test_batch_processing_and_error_isolation():
    batch = [
        {"order_id": "O1", "patient_id": "P1", "test_code": "GLU", "value": 90, "unit": "mg/dL"},
        {"order_id": "O2", "patient_id": "P2", "test_code": "CHOL", "value": 250, "unit": "mg/dL"},
        {"order_id": "O3", "patient_id": "P3", "test_code": "K", "value": 7.5, "unit": "mmol/L"},
        {"order_id": "O4", "patient_id": "P4", "test_code": "CREAT", "value": "CORRUPTED", "unit": "mg/dL"},
    ]
    report = process_lab_batch(batch)
    assert report.total_records == 4
    assert report.valid_records == 3
    assert report.malformed_records == 1
    assert report.abnormal_count == 1
    assert report.critical_count == 1
    assert len(report.errors) == 1
