# NoSQL Subsystem & MongoDB Architecture

## 1. Why NoSQL in STVAMS?

Traffic cameras capture semi-structured metadata (varying camera sensor formats, AI confidence scores, bounding boxes, helmet/seatbelt flags) that vary per vendor model. Modeling this in rigid relational schemas leads to sparse tables with hundreds of null columns.

MongoDB provides a dynamic JSON/BSON document store ideally suited for semi-structured traffic evidence.

---

## 2. Sample Detection Document Schema

```json
{
  "event_id": "mongo_evt_101",
  "vehicle_number": "MH01AB1234",
  "timestamp": "2026-09-28T10:15:30Z",
  "camera": {
    "id": 5,
    "code": "CAM-SYS-005",
    "location": "BKC Main Avenue",
    "type": "ANPR"
  },
  "detection": {
    "vehicle_type": "SEDAN",
    "speed": 82.5,
    "speed_limit": 60.0,
    "helmet_detected": null,
    "seatbelt_detected": false,
    "plate_confidence": 98.4
  },
  "evidence": {
    "image_path": "/storage/evidence/evt_101.jpg",
    "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  "tags": ["overspeeding", "no_seatbelt"],
  "processed": false
}
```
