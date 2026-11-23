"""
Pydantic Models for MediCore Clinical Data Processing & Analytics Service
Enforces strict operational boundaries: NO diagnostic or treatment recommendations.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from enum import Enum


class TestUnit(str, Enum):
    MG_DL = "mg/dL"
    MMOL_L = "mmol/L"
    G_DL = "g/dL"
    CELLS_MCL = "cells/mcL"
    U_L = "U/L"
    PERCENT = "%"
    FL = "fL"
    PG = "pg"


class LabStatus(str, Enum):
    NORMAL = "NORMAL"
    ABNORMAL_LOW = "ABNORMAL_LOW"
    ABNORMAL_HIGH = "ABNORMAL_HIGH"
    CRITICAL = "CRITICAL"
    INVALID = "INVALID"


class RawLabRecord(BaseModel):
    order_id: str
    patient_id: str
    test_code: str
    test_name: str
    value: Any
    unit: str
    reference_min: Optional[float] = None
    reference_max: Optional[float] = None
    recorded_at: Optional[str] = None


class ProcessedLabResult(BaseModel):
    order_id: str
    patient_id: str
    test_code: str
    test_name: str
    numeric_value: Optional[float]
    unit: str
    reference_min: Optional[float]
    reference_max: Optional[float]
    flag: LabStatus
    is_valid: bool
    validation_error: Optional[str] = None
    recorded_at: str


class LabProcessingReport(BaseModel):
    total_records: int
    valid_records: int
    malformed_records: int
    abnormal_count: int
    critical_count: int
    processed_results: List[ProcessedLabResult]
    errors: List[Dict[str, Any]]


class RawAppointmentRecord(BaseModel):
    appointment_id: str
    patient_id: str
    provider_id: str
    department: str
    scheduled_start: str
    duration_minutes: int = 30
    status: str
    arrival_time: Optional[str] = None
    encounter_start: Optional[str] = None
    encounter_end: Optional[str] = None


class ProcessedAppointment(BaseModel):
    appointment_id: str
    patient_id: str
    provider_id: str
    department: str
    scheduled_start: datetime
    duration_minutes: int
    status: str
    wait_time_minutes: Optional[float] = None
    service_time_minutes: Optional[float] = None
    is_valid: bool
    validation_error: Optional[str] = None


class ProviderUtilization(BaseModel):
    provider_id: str
    department: str
    total_slots: int
    booked_slots: int
    completed_slots: int
    cancelled_slots: int
    no_show_slots: int
    utilization_rate: float
    completion_rate: float


class UtilizationMetricsResponse(BaseModel):
    total_appointments: int
    overall_utilization_rate: float
    department_utilization: Dict[str, float]
    provider_metrics: List[ProviderUtilization]
    generated_at: str


class WaitTimeMetricsResponse(BaseModel):
    average_wait_time_minutes: float
    median_wait_time_minutes: float
    p90_wait_time_minutes: float
    department_wait_times: Dict[str, float]
    average_service_time_minutes: float
    sample_size: int
    generated_at: str


class LabTurnaroundResponse(BaseModel):
    total_tests_processed: int
    average_turnaround_hours: float
    flag_breakdown: Dict[str, int]
    abnormal_rate_percentage: float
    critical_rate_percentage: float
    generated_at: str


class PopulationDemographicsResponse(BaseModel):
    total_patients: int
    age_distribution: Dict[str, int]
    gender_distribution: Dict[str, int]
    department_distribution: Dict[str, int]
    frequent_visit_rate: float
    disclaimer: str = "SYNTHETIC OPERATIONAL AGGREGATION ONLY. NOT FOR CLINICAL DIAGNOSIS."
