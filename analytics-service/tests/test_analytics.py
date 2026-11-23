"""
Tests for MediCore Operational Analytics (Assessment 06)
Verifies utilization, wait times, lab turnaround, and demographics.
"""

from datetime import datetime
from app.analytics import (
    compute_utilization, compute_wait_times, compute_lab_turnaround,
    compute_population_demographics
)
from app.models import ProcessedAppointment, ProcessedLabResult, LabStatus


def test_compute_utilization():
    apps = [
        ProcessedAppointment(
            appointment_id="A1", patient_id="P1", provider_id="DR-1", department="Cardio",
            scheduled_start=datetime.utcnow(), duration_minutes=30, status="COMPLETED", is_valid=True
        ),
        ProcessedAppointment(
            appointment_id="A2", patient_id="P2", provider_id="DR-1", department="Cardio",
            scheduled_start=datetime.utcnow(), duration_minutes=30, status="COMPLETED", is_valid=True
        ),
        ProcessedAppointment(
            appointment_id="A3", patient_id="P3", provider_id="DR-2", department="Neuro",
            scheduled_start=datetime.utcnow(), duration_minutes=30, status="CANCELLED", is_valid=True
        ),
    ]
    res = compute_utilization(apps, total_expected_slots=10)
    assert res.total_appointments == 3
    assert res.overall_utilization_rate == 0.3
    assert "Cardio" in res.department_utilization
    assert len(res.provider_metrics) == 2


def test_compute_wait_times():
    apps = [
        ProcessedAppointment(
            appointment_id="A1", patient_id="P1", provider_id="DR-1", department="Cardio",
            scheduled_start=datetime.utcnow(), duration_minutes=30, status="COMPLETED",
            wait_time_minutes=15.0, service_time_minutes=25.0, is_valid=True
        ),
        ProcessedAppointment(
            appointment_id="A2", patient_id="P2", provider_id="DR-1", department="Cardio",
            scheduled_start=datetime.utcnow(), duration_minutes=30, status="COMPLETED",
            wait_time_minutes=25.0, service_time_minutes=35.0, is_valid=True
        ),
    ]
    res = compute_wait_times(apps)
    assert res.average_wait_time_minutes == 20.0
    assert res.median_wait_time_minutes == 20.0
    assert res.average_service_time_minutes == 30.0
    assert res.department_wait_times["Cardio"] == 20.0


def test_compute_lab_turnaround():
    labs = [
        ProcessedLabResult(
            order_id="O1", patient_id="P1", test_code="GLU", test_name="Glucose",
            numeric_value=90.0, unit="mg/dL", reference_min=70.0, reference_max=100.0,
            flag=LabStatus.NORMAL, is_valid=True, recorded_at="2026-11-20T10:00:00Z"
        ),
        ProcessedLabResult(
            order_id="O2", patient_id="P2", test_code="CHOL", test_name="Cholesterol",
            numeric_value=250.0, unit="mg/dL", reference_min=125.0, reference_max=200.0,
            flag=LabStatus.ABNORMAL_HIGH, is_valid=True, recorded_at="2026-11-20T10:00:00Z"
        ),
    ]
    res = compute_lab_turnaround(labs)
    assert res.total_tests_processed == 2
    assert res.abnormal_rate_percentage == 50.0
    assert res.flag_breakdown["NORMAL"] == 1
    assert res.flag_breakdown["ABNORMAL_HIGH"] == 1


def test_compute_population_demographics():
    cohort = [
        {"patient_id": "P1", "age": 25, "gender": "F", "primary_department": "Pediatrics", "visit_count": 1},
        {"patient_id": "P2", "age": 68, "gender": "M", "primary_department": "Cardio", "visit_count": 5},
    ]
    res = compute_population_demographics(cohort)
    assert res.total_patients == 2
    assert res.age_distribution["18-35"] == 1
    assert res.age_distribution["65+"] == 1
    assert res.gender_distribution["F"] == 1
    assert res.gender_distribution["M"] == 1
    assert res.frequent_visit_rate == 0.5
    assert "NOT FOR CLINICAL DIAGNOSIS" in res.disclaimer
