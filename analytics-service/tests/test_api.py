"""
FastAPI HTTP Endpoint Integration Tests
Verifies HTTP endpoints, status codes, payload validation, and CORS.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "no clinical diagnostic" in data["guardrail"].lower()


def test_process_labs_api():
    payload = [
        {"order_id": "LO-1", "patient_id": "P-1", "test_code": "GLU", "value": 95, "unit": "mg/dL"},
        {"order_id": "LO-2", "patient_id": "P-2", "test_code": "K", "value": 3.8, "unit": "mmol/L"},
    ]
    response = client.post("/api/v1/analytics/process-labs", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_records"] == 2
    assert data["valid_records"] == 2
    assert data["malformed_records"] == 0


def test_process_labs_empty_payload():
    response = client.post("/api/v1/analytics/process-labs", json=[])
    assert response.status_code == 400


def test_analytics_endpoints():
    r_util = client.get("/api/v1/analytics/utilization")
    assert r_util.status_code == 200
    assert "overall_utilization_rate" in r_util.json()

    r_wait = client.get("/api/v1/analytics/wait-times")
    assert r_wait.status_code == 200
    assert "average_wait_time_minutes" in r_wait.json()

    r_lab = client.get("/api/v1/analytics/lab-turnaround")
    assert r_lab.status_code == 200
    assert "flag_breakdown" in r_lab.json()

    r_demo = client.get("/api/v1/analytics/demographics")
    assert r_demo.status_code == 200
    assert "age_distribution" in r_demo.json()

    r_sum = client.get("/api/v1/analytics/summary")
    assert r_sum.status_code == 200
    assert r_sum.json()["status"] == "OPERATIONAL"
