import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_and_get_owner():
    payload = {
        "national_id": "NATID_TEST_99",
        "full_name": "Test Owner",
        "email": "testowner@example.com",
        "phone": "9998887770",
        "address": "Test Street 101",
        "owner_type": "INDIVIDUAL"
    }
    response = client.post("/api/v1/owners", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["national_id"] == "NATID_TEST_99"
    owner_id = data["owner_id"]

    get_resp = client.get(f"/api/v1/owners/{owner_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["email"] == "testowner@example.com"

def test_create_vehicle():
    # First create owner
    owner_resp = client.post("/api/v1/owners", json={
        "national_id": "NATID_TEST_88",
        "full_name": "Vehicle Owner",
        "email": "vehowner@example.com",
        "phone": "9998887771",
        "address": "Test Street 102",
        "owner_type": "INDIVIDUAL"
    })
    owner_id = owner_resp.json()["owner_id"]

    veh_payload = {
        "registration_no": "MH01XY9999",
        "owner_id": owner_id,
        "vehicle_class": "PRIVATE",
        "make": "Honda",
        "model": "City",
        "fuel_type": "PETROL",
        "mfg_year": 2022
    }
    response = client.post("/api/v1/vehicles", json=veh_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["registration_no"] == "MH01XY9999"
