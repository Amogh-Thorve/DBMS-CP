import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dashboard_summary():
    response = client.get("/api/v1/analytics/dashboard-summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_vehicles" in data
    assert "total_violations" in data

def test_analytics_endpoints():
    r1 = client.get("/api/v1/analytics/violations-by-zone")
    assert r1.status_code == 200

    r2 = client.get("/api/v1/analytics/violations-by-type")
    assert r2.status_code == 200

    r3 = client.get("/api/v1/analytics/fine-collection")
    assert r3.status_code == 200
