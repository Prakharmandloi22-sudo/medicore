"""
MediCore FastAPI Clinical Analytics & Data Processing Microservice
Assessment 05 & Assessment 06 Implementation
Provides operational metrics: appointment utilization, wait times, lab turnaround,
and synthetic population reporting.
Strict guardrail: NO medical diagnoses or treatment recommendations.
"""

from fastapi import FastAPI, HTTPException, status, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
from datetime import datetime

from .models import (
    LabProcessingReport, UtilizationMetricsResponse, WaitTimeMetricsResponse,
    LabTurnaroundResponse, PopulationDemographicsResponse
)
from .processing import process_lab_batch, process_appointment_batch
from .analytics import (
    compute_utilization, compute_wait_times, compute_lab_turnaround,
    compute_population_demographics
)

app = FastAPI(
    title="MediCore Clinical Analytics & Processing API",
    description="Operational microservice for synthetic healthcare data validation, metrics aggregation, and workflow analytics.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Cross-Origin Resource Sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory synthetic stores for demonstration & integration caching
CACHED_LAB_RESULTS = []
CACHED_APPOINTMENTS = []

# Preload synthetic operational baseline dataset
SYNTHETIC_PATIENTS_SAMPLE = [
    {"patient_id": "P-101", "age": 34, "gender": "F", "primary_department": "Cardiology", "visit_count": 3},
    {"patient_id": "P-102", "age": 58, "gender": "M", "primary_department": "Orthopedics", "visit_count": 5},
    {"patient_id": "P-103", "age": 22, "gender": "M", "primary_department": "General Medicine", "visit_count": 1},
    {"patient_id": "P-104", "age": 67, "gender": "F", "primary_department": "Oncology", "visit_count": 8},
    {"patient_id": "P-105", "age": 45, "gender": "F", "primary_department": "General Medicine", "visit_count": 2},
    {"patient_id": "P-106", "age": 72, "gender": "M", "primary_department": "Cardiology", "visit_count": 6},
    {"patient_id": "P-107", "age": 14, "gender": "M", "primary_department": "Pediatrics", "visit_count": 2},
    {"patient_id": "P-108", "age": 29, "gender": "F", "primary_department": "Dermatology", "visit_count": 1},
]

SYNTHETIC_APPOINTMENTS_SAMPLE = [
    {
        "appointment_id": "A-001",
        "patient_id": "P-101",
        "provider_id": "DR-CARTER",
        "department": "Cardiology",
        "scheduled_start": "2026-11-20T09:00:00Z",
        "duration_minutes": 30,
        "status": "COMPLETED",
        "arrival_time": "2026-11-20T08:50:00Z",
        "encounter_start": "2026-11-20T09:05:00Z",
        "encounter_end": "2026-11-20T09:32:00Z",
    },
    {
        "appointment_id": "A-002",
        "patient_id": "P-102",
        "provider_id": "DR-PATEL",
        "department": "Orthopedics",
        "scheduled_start": "2026-11-20T09:30:00Z",
        "duration_minutes": 30,
        "status": "COMPLETED",
        "arrival_time": "2026-11-20T09:20:00Z",
        "encounter_start": "2026-11-20T09:42:00Z",
        "encounter_end": "2026-11-20T10:10:00Z",
    },
    {
        "appointment_id": "A-003",
        "patient_id": "P-103",
        "provider_id": "DR-CARTER",
        "department": "Cardiology",
        "scheduled_start": "2026-11-20T10:00:00Z",
        "duration_minutes": 30,
        "status": "NO_SHOW",
    },
    {
        "appointment_id": "A-004",
        "patient_id": "P-104",
        "provider_id": "DR-CHEN",
        "department": "General Medicine",
        "scheduled_start": "2026-11-20T10:30:00Z",
        "duration_minutes": 30,
        "status": "COMPLETED",
        "arrival_time": "2026-11-20T10:25:00Z",
        "encounter_start": "2026-11-20T10:35:00Z",
        "encounter_end": "2026-11-20T10:58:00Z",
    },
    {
        "appointment_id": "A-005",
        "patient_id": "P-105",
        "provider_id": "DR-CHEN",
        "department": "General Medicine",
        "scheduled_start": "2026-11-20T11:00:00Z",
        "duration_minutes": 30,
        "status": "CANCELLED",
    },
]

SYNTHETIC_LABS_SAMPLE = [
    {"order_id": "LO-501", "patient_id": "P-101", "test_code": "GLU", "test_name": "Glucose", "value": 92.0, "unit": "mg/dL"},
    {"order_id": "LO-502", "patient_id": "P-102", "test_code": "CHOL", "test_name": "Cholesterol", "value": 240.0, "unit": "mg/dL"},
    {"order_id": "LO-503", "patient_id": "P-103", "test_code": "K", "test_name": "Potassium", "value": 6.8, "unit": "mmol/L"}, # Critical high
    {"order_id": "LO-504", "patient_id": "P-104", "test_code": "HGB", "test_name": "Hemoglobin", "value": 14.1, "unit": "g/dL"},
    {"order_id": "LO-505", "patient_id": "P-105", "test_code": "CREAT", "test_name": "Creatinine", "value": 0.9, "unit": "mg/dL"},
]


@app.get("/health", tags=["System"])
def health_check():
    """Health & Readiness probe endpoint."""
    return {
        "status": "healthy",
        "service": "medicore-analytics",
        "version": "1.0.0",
        "guardrail": "Operational analytics only; no clinical diagnostic recommendations",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/api/v1/analytics/process-labs", response_model=LabProcessingReport, tags=["Assessment 05 - Lab Data Processing"])
def process_labs_endpoint(records: List[Dict[str, Any]] = Body(...)):
    """
    Ingests and processes raw lab test results.
    Validates units, evaluates against standard reference ranges, and categorizes flags.
    Gracefully captures and isolates malformed records.
    """
    if not records:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Batch records list cannot be empty")
    
    report = process_lab_batch(records)
    global CACHED_LAB_RESULTS
    CACHED_LAB_RESULTS = report.processed_results
    return report


@app.post("/api/v1/analytics/process-appointments", tags=["Assessment 05 - Appointments Data Processing"])
def process_appointments_endpoint(records: List[Dict[str, Any]] = Body(...)):
    """
    Ingests and cleans synthetic appointment logs, computing arrival-to-start wait times.
    """
    if not records:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Appointment records list cannot be empty")
    
    processed = process_appointment_batch(records)
    global CACHED_APPOINTMENTS
    CACHED_APPOINTMENTS = processed
    return {
        "total_received": len(records),
        "valid_processed": len([a for a in processed if a.is_valid]),
        "records": processed,
    }


@app.get("/api/v1/analytics/utilization", response_model=UtilizationMetricsResponse, tags=["Assessment 06 - Clinical Analytics"])
def get_utilization_metrics():
    """
    Calculates provider and department scheduling utilization rates.
    """
    records = CACHED_APPOINTMENTS if CACHED_APPOINTMENTS else process_appointment_batch(SYNTHETIC_APPOINTMENTS_SAMPLE)
    return compute_utilization(records)


@app.get("/api/v1/analytics/wait-times", response_model=WaitTimeMetricsResponse, tags=["Assessment 06 - Clinical Analytics"])
def get_wait_time_metrics():
    """
    Calculates patient wait times (arrival to consult start) and average service durations.
    """
    records = CACHED_APPOINTMENTS if CACHED_APPOINTMENTS else process_appointment_batch(SYNTHETIC_APPOINTMENTS_SAMPLE)
    return compute_wait_times(records)


@app.get("/api/v1/analytics/lab-turnaround", response_model=LabTurnaroundResponse, tags=["Assessment 06 - Clinical Analytics"])
def get_lab_turnaround_metrics():
    """
    Provides turnaround time statistics and abnormal/critical result percentages.
    """
    results = CACHED_LAB_RESULTS if CACHED_LAB_RESULTS else process_lab_batch(SYNTHETIC_LABS_SAMPLE).processed_results
    return compute_lab_turnaround(results)


@app.get("/api/v1/analytics/demographics", response_model=PopulationDemographicsResponse, tags=["Assessment 06 - Clinical Analytics"])
def get_population_demographics():
    """
    Aggregates synthetic cohort age, gender, and operational department distributions.
    """
    return compute_population_demographics(SYNTHETIC_PATIENTS_SAMPLE)


@app.get("/api/v1/analytics/summary", tags=["Assessment 06 - Clinical Analytics"])
def get_executive_summary():
    """Aggregated operational hospital executive dashboard."""
    apps = CACHED_APPOINTMENTS if CACHED_APPOINTMENTS else process_appointment_batch(SYNTHETIC_APPOINTMENTS_SAMPLE)
    labs = CACHED_LAB_RESULTS if CACHED_LAB_RESULTS else process_lab_batch(SYNTHETIC_LABS_SAMPLE).processed_results

    util = compute_utilization(apps)
    waits = compute_wait_times(apps)
    lab_turn = compute_lab_turnaround(labs)
    pop = compute_population_demographics(SYNTHETIC_PATIENTS_SAMPLE)

    return {
        "status": "OPERATIONAL",
        "total_active_patients": pop.total_patients,
        "scheduled_appointments": util.total_appointments,
        "overall_utilization_rate": util.overall_utilization_rate,
        "average_wait_time_minutes": waits.average_wait_time_minutes,
        "average_service_time_minutes": waits.average_service_time_minutes,
        "processed_lab_orders": lab_turn.total_tests_processed,
        "abnormal_lab_percentage": lab_turn.abnormal_rate_percentage,
        "critical_alerts_count": lab_turn.flag_breakdown.get("CRITICAL", 0),
        "generated_at": datetime.utcnow().isoformat(),
        "disclaimer": "Strictly operational reporting. No clinical diagnoses generated.",
    }
