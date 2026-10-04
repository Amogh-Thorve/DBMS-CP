import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_violation_and_payment_workflow():
    # 1. Register Owner & Vehicle
    owner_resp = client.post("/api/v1/owners", json={
        "national_id": "NATID_TEST_77",
        "full_name": "Offender Owner",
        "email": "offender@example.com",
        "phone": "9998887772",
        "address": "Test Street 103",
        "owner_type": "INDIVIDUAL"
    })
    owner_id = owner_resp.json()["owner_id"]

    veh_resp = client.post("/api/v1/vehicles", json={
        "registration_no": "DL02AB5555",
        "owner_id": owner_id,
        "vehicle_class": "PRIVATE",
        "make": "Toyota",
        "model": "Fortuner",
        "fuel_type": "DIESEL",
        "mfg_year": 2023
    })
    vehicle_id = veh_resp.json()["vehicle_id"]

    # 2. Register Violation (triggers automatic fine generation)
    viol_payload = {
        "vehicle_id": vehicle_id,
        "type_id": 1,
        "camera_id": 1,
        "remarks": "Overspeeding test"
    }
    viol_resp = client.post("/api/v1/violations", json=viol_payload)
    assert viol_resp.status_code == 201
    violation_id = viol_resp.json()["violation_id"]

    # 3. Fetch Generated Fine
    fine_resp = client.get(f"/api/v1/fines/{violation_id}")
    assert fine_resp.status_code == 200
    fine_data = fine_resp.json()
    assert fine_data["status"] == "UNPAID"
    fine_id = fine_data["fine_id"]

    # 4. Process Payment
    pay_payload = {
        "fine_id": fine_id,
        "payment_amount": fine_data["total_amount"],
        "payment_method": "UPI",
        "txn_ref_no": "TXN_TEST_REF_9999"
    }
    pay_resp = client.post("/api/v1/payments", json=pay_payload)
    assert pay_resp.status_code == 201
    assert pay_resp.json()["status"] == "SUCCESS"

    # 5. Verify Fine and Violation marked PAID
    updated_fine = client.get(f"/api/v1/fines/{fine_id}").json()
    assert updated_fine["status"] == "PAID"
