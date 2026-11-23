"""
MediCore Operational Clinical Analytics Engine
Assessment 06: Aggregates operational performance, appointment utilization,
wait-time statistics, lab turnaround metrics, and synthetic population demographics.
Strict boundary: Does NOT produce medical diagnoses or clinical recommendations.
"""

from typing import List, Dict, Any
from datetime import datetime
import statistics
from .models import (
    ProcessedAppointment, ProviderUtilization, UtilizationMetricsResponse,
    WaitTimeMetricsResponse, LabTurnaroundResponse, PopulationDemographicsResponse,
    ProcessedLabResult, LabStatus
)


def compute_utilization(appointments: List[ProcessedAppointment], total_expected_slots: int = 160) -> UtilizationMetricsResponse:
    """Calculates provider and department scheduling utilization rates."""
    valid_apps = [a for a in appointments if a.is_valid]
    if not valid_apps:
        return UtilizationMetricsResponse(
            total_appointments=0,
            overall_utilization_rate=0.0,
            department_utilization={},
            provider_metrics=[],
            generated_at=datetime.utcnow().isoformat(),
        )

    # Group by provider
    providers: Dict[str, Dict[str, Any]] = {}
    dept_counts: Dict[str, int] = {}

    for a in valid_apps:
        p_id = a.provider_id
        d = a.department
        dept_counts[d] = dept_counts.get(d, 0) + 1

        if p_id not in providers:
            providers[p_id] = {
                "department": d,
                "booked": 0,
                "completed": 0,
                "cancelled": 0,
                "no_show": 0,
            }
        providers[p_id]["booked"] += 1
        st = a.status.upper()
        if st in ["COMPLETED", "IN_PROGRESS"]:
            providers[p_id]["completed"] += 1
        elif st in ["CANCELLED"]:
            providers[p_id]["cancelled"] += 1
        elif st in ["NO_SHOW"]:
            providers[p_id]["no_show"] += 1

    prov_metrics: List[ProviderUtilization] = []
    # Assume 40 nominal slots per provider cycle for baseline calculation
    nominal_slots = 40
    for p_id, stats in providers.items():
        booked = stats["booked"]
        completed = stats["completed"]
        util = round(min(1.0, booked / nominal_slots), 3)
        comp = round(completed / max(1, booked), 3)
        prov_metrics.append(
            ProviderUtilization(
                provider_id=p_id,
                department=stats["department"],
                total_slots=nominal_slots,
                booked_slots=booked,
                completed_slots=completed,
                cancelled_slots=stats["cancelled"],
                no_show_slots=stats["no_show"],
                utilization_rate=util,
                completion_rate=comp,
            )
        )

    total_booked = len(valid_apps)
    overall_util = round(min(1.0, total_booked / max(1, total_expected_slots)), 3)
    dept_util = {dept: round(cnt / total_booked, 3) for dept, cnt in dept_counts.items()}

    return UtilizationMetricsResponse(
        total_appointments=total_booked,
        overall_utilization_rate=overall_util,
        department_utilization=dept_util,
        provider_metrics=prov_metrics,
        generated_at=datetime.utcnow().isoformat(),
    )


def compute_wait_times(appointments: List[ProcessedAppointment]) -> WaitTimeMetricsResponse:
    """Calculates patient arrival-to-encounter wait times and consultation service durations."""
    valid_waits = [a.wait_time_minutes for a in appointments if a.is_valid and a.wait_time_minutes is not None]
    valid_services = [a.service_time_minutes for a in appointments if a.is_valid and a.service_time_minutes is not None]

    if not valid_waits:
        return WaitTimeMetricsResponse(
            average_wait_time_minutes=0.0,
            median_wait_time_minutes=0.0,
            p90_wait_time_minutes=0.0,
            department_wait_times={},
            average_service_time_minutes=round(statistics.mean(valid_services), 1) if valid_services else 0.0,
            sample_size=0,
            generated_at=datetime.utcnow().isoformat(),
        )

    sorted_waits = sorted(valid_waits)
    avg_wait = round(statistics.mean(valid_waits), 1)
    median_wait = round(statistics.median(valid_waits), 1)
    p90_index = int(len(sorted_waits) * 0.9)
    p90_wait = round(sorted_waits[min(p90_index, len(sorted_waits) - 1)], 1)

    # Department breakdown
    dept_waits: Dict[str, List[float]] = {}
    for a in appointments:
        if a.is_valid and a.wait_time_minutes is not None:
            dept_waits.setdefault(a.department, []).append(a.wait_time_minutes)

    dept_averages = {d: round(statistics.mean(w), 1) for d, w in dept_waits.items()}

    avg_service = round(statistics.mean(valid_services), 1) if valid_services else 0.0

    return WaitTimeMetricsResponse(
        average_wait_time_minutes=avg_wait,
        median_wait_time_minutes=median_wait,
        p90_wait_time_minutes=p90_wait,
        department_wait_times=dept_averages,
        average_service_time_minutes=avg_service,
        sample_size=len(valid_waits),
        generated_at=datetime.utcnow().isoformat(),
    )


def compute_lab_turnaround(results: List[ProcessedLabResult], default_turnaround_hours: float = 3.4) -> LabTurnaroundResponse:
    """Analyzes laboratory result turnaround and abnormal rate statistics."""
    valid_results = [r for r in results if r.is_valid]
    if not valid_results:
        return LabTurnaroundResponse(
            total_tests_processed=0,
            average_turnaround_hours=0.0,
            flag_breakdown={},
            abnormal_rate_percentage=0.0,
            critical_rate_percentage=0.0,
            generated_at=datetime.utcnow().isoformat(),
        )

    flags: Dict[str, int] = {}
    abnormal_count = 0
    critical_count = 0

    for r in valid_results:
        f = r.flag.value
        flags[f] = flags.get(f, 0) + 1
        if r.flag in [LabStatus.ABNORMAL_LOW, LabStatus.ABNORMAL_HIGH]:
            abnormal_count += 1
        elif r.flag == LabStatus.CRITICAL:
            critical_count += 1

    total = len(valid_results)
    abnormal_rate = round((abnormal_count / total) * 100, 2)
    critical_rate = round((critical_count / total) * 100, 2)

    return LabTurnaroundResponse(
        total_tests_processed=total,
        average_turnaround_hours=default_turnaround_hours,
        flag_breakdown=flags,
        abnormal_rate_percentage=abnormal_rate,
        critical_rate_percentage=critical_rate,
        generated_at=datetime.utcnow().isoformat(),
    )


def compute_population_demographics(patients_data: List[Dict[str, Any]]) -> PopulationDemographicsResponse:
    """Aggregates synthetic cohort age, gender, and operational department distributions."""
    total = len(patients_data)
    if total == 0:
        return PopulationDemographicsResponse(
            total_patients=0,
            age_distribution={"<18": 0, "18-35": 0, "36-50": 0, "51-65": 0, "65+": 0},
            gender_distribution={},
            department_distribution={},
            frequent_visit_rate=0.0,
        )

    age_bins = {"<18": 0, "18-35": 0, "36-50": 0, "51-65": 0, "65+": 0}
    genders: Dict[str, int] = {}
    dept_dist: Dict[str, int] = {}
    frequent_count = 0

    for p in patients_data:
        # Age
        age = p.get("age", 40)
        if age < 18:
            age_bins["<18"] += 1
        elif age <= 35:
            age_bins["18-35"] += 1
        elif age <= 50:
            age_bins["36-50"] += 1
        elif age <= 65:
            age_bins["51-65"] += 1
        else:
            age_bins["65+"] += 1

        # Gender
        g = p.get("gender", "UNKNOWN").upper()
        genders[g] = genders.get(g, 0) + 1

        # Department
        dep = p.get("primary_department", "General Medicine")
        dept_dist[dep] = dept_dist.get(dep, 0) + 1

        if p.get("visit_count", 1) >= 4:
            frequent_count += 1

    return PopulationDemographicsResponse(
        total_patients=total,
        age_distribution=age_bins,
        gender_distribution=genders,
        department_distribution=dept_dist,
        frequent_visit_rate=round(frequent_count / total, 3),
    )
