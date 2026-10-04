import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"

def test_db_health():
    response = client.get("/api/v1/health/db")
    assert response.status_code == 200

def test_mongodb_health():
    response = client.get("/api/v1/health/mongodb")
    assert response.status_code == 200

def test_elasticsearch_health():
    response = client.get("/api/v1/health/elasticsearch")
    assert response.status_code == 200
