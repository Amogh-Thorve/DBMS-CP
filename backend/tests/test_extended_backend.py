import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_me_endpoint():
    # Login to get JWT
    response = client.post("/api/v1/auth/token", data={"username": "officer", "password": "password123"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "officer"
    assert me_resp.json()["role"] == "TRAFFIC_OFFICER"

def test_city_zone_road_camera_officer_hierarchy():
    # 1. City
    c_resp = client.post("/api/v1/cities", json={"city_name": "Test City Metro", "state_name": "Test State"})
    assert c_resp.status_code == 201
    city_id = c_resp.json()["city_id"]

    # 2. Zone
    z_resp = client.post("/api/v1/zones", json={"zone_code": "Z-TST-01", "zone_name": "Test Zone Alpha", "city_id": city_id, "risk_level": "HIGH"})
    assert z_resp.status_code == 201
    zone_id = z_resp.json()["zone_id"]

    # 3. Road
    r_resp = client.post("/api/v1/roads", json={"road_name": "Test Highway 1", "road_type": "EXPRESSWAY", "speed_limit_kmh": 100, "zone_id": zone_id})
    assert r_resp.status_code == 201
    road_id = r_resp.json()["road_id"]

    # 4. Officer
    off_resp = client.post("/api/v1/officers", json={"badge_number": "BADGE_99", "full_name": "Officer Inspector", "rank_title": "INSPECTOR", "zone_id": zone_id})
    assert off_resp.status_code == 201
    assert off_resp.json()["badge_number"] == "BADGE_99"

def test_driver_and_license_crud():
    # Create Owner first
    owner_resp = client.post("/api/v1/owners", json={
        "national_id": "NATID_DRV_01",
        "full_name": "Driver Parent Owner",
        "email": "drvowner@example.com",
        "phone": "9876543210",
        "address": "Driver Street 1",
        "owner_type": "INDIVIDUAL"
    })
    owner_id = owner_resp.json()["owner_id"]

    # Create Driver
    driver_resp = client.post("/api/v1/drivers", json={
        "owner_id": owner_id,
        "full_name": "Driver Test Person",
        "dob": "1995-05-15",
        "blood_group": "O+",
        "phone": "9876543211",
        "email": "drivertest@example.com"
    })
    assert driver_resp.status_code == 201
    driver_id = driver_resp.json()["driver_id"]

    # Issue License
    lic_resp = client.post("/api/v1/licenses", json={
        "license_number": "LIC_TEST_9999",
        "driver_id": driver_id,
        "category": "LMV",
        "issue_date": "2020-01-01",
        "expiry_date": "2040-01-01",
        "demerit_points": 0,
        "status": "VALID"
    })
    assert lic_resp.status_code == 201
    assert lic_resp.json()["license_number"] == "LIC_TEST_9999"

def test_appeal_submission_and_review_workflow():
    # 1. Owner & Vehicle
    o_resp = client.post("/api/v1/owners", json={
        "national_id": "NATID_APL_01",
        "full_name": "Appellant Owner",
        "email": "appellant@example.com",
        "phone": "9123456780",
        "address": "Appeal Road 5",
        "owner_type": "INDIVIDUAL"
    })
    owner_id = o_resp.json()["owner_id"]

    v_resp = client.post("/api/v1/vehicles", json={
        "registration_no": "KA01APL100",
        "owner_id": owner_id,
        "vehicle_class": "PRIVATE",
        "make": "Hyundai",
        "model": "Creta",
        "fuel_type": "PETROL",
        "mfg_year": 2024
    })
    vehicle_id = v_resp.json()["vehicle_id"]

    # 2. Register Violation & Fine
    viol_resp = client.post("/api/v1/violations", json={
        "vehicle_id": vehicle_id,
        "type_id": 1,
        "camera_id": 1,
        "remarks": "Wrong turn signal appeal test"
    })
    violation_id = viol_resp.json()["violation_id"]

    # 3. File Appeal
    apl_resp = client.post("/api/v1/appeals", json={
        "violation_id": violation_id,
        "appellant_id": owner_id,
        "reason": "Signal light was damaged by weather."
    })
    assert apl_resp.status_code == 201
    appeal_id = apl_resp.json()["appeal_id"]

    # 4. Review Appeal (APPROVE -> Should WAIVE Fine)
    review_resp = client.put(f"/api/v1/appeals/{appeal_id}/review", json={
        "status": "APPROVED",
        "reviewer_remarks": "Camera obstruction verified."
    })
    assert review_resp.status_code == 200
    assert review_resp.json()["status"] == "APPROVED"

    # 5. Check Fine Status is WAIVED
    fine = client.get(f"/api/v1/fines/{violation_id}").json()
    assert fine["status"] == "WAIVED"

def test_duplicate_payment_prevention():
    # 1. Owner & Vehicle & Violation
    o_resp = client.post("/api/v1/owners", json={
        "national_id": "NATID_DUP_01",
        "full_name": "Dup Payment Owner",
        "email": "dup@example.com",
        "phone": "9991112220",
        "address": "Dup Street 10",
        "owner_type": "INDIVIDUAL"
    })
    v_resp = client.post("/api/v1/vehicles", json={
        "registration_no": "MH04DUP111",
        "owner_id": o_resp.json()["owner_id"],
        "vehicle_class": "PRIVATE",
        "make": "Kia",
        "model": "Seltos",
        "fuel_type": "PETROL",
        "mfg_year": 2023
    })
    viol_resp = client.post("/api/v1/violations", json={
        "vehicle_id": v_resp.json()["vehicle_id"],
        "type_id": 1,
        "camera_id": 1
    })
    fine_id = viol_resp.json()["violation_id"]
    fine_amt = client.get(f"/api/v1/fines/{fine_id}").json()["total_amount"]

    # First Payment SUCCESS
    pay_payload = {
        "fine_id": fine_id,
        "payment_amount": fine_amt,
        "payment_method": "NET_BANKING",
        "txn_ref_no": "TXN_UNIQUE_REF_001"
    }
    r1 = client.post("/api/v1/payments", json=pay_payload)
    assert r1.status_code == 201

    # Second Payment with same Txn Ref -> 409 Conflict
    r2 = client.post("/api/v1/payments", json=pay_payload)
    assert r2.status_code == 409

def test_evidence_and_reports_endpoints():
    # Ingest Evidence
    ev_resp = client.post("/api/v1/evidence", json={
        "event_id": 101,
        "camera_code": "CAM-MUM-01",
        "image_url": "https://stvams.internal/ev_101.jpg",
        "confidence_score": 0.99
    })
    assert ev_resp.status_code == 201

    # Trigger Parquet Export
    rep_resp = client.post("/api/v1/reports/export-parquet")
    assert rep_resp.status_code == 200
    assert rep_resp.json()["status"] == "QUEUED"
