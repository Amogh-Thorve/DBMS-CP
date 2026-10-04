// ============================================================================
// STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
// File: seed.js
// Description: MongoDB Seed Data Script for Semi-Structured Camera Detections & Evidence Documents
// Author: STVAMS Core Architecture Team
// ============================================================================

db = db.getSiblingDB("stvams_events");

// Drop existing collection for clean initialization
db.detection_events.drop();

// Seed 20 Document Examples with Nested Structures
db.detection_events.insertMany([
  {
    event_id: "mongo_evt_1",
    vehicle_number: "MH01AB0001",
    timestamp: ISODate("2026-09-01T10:15:30Z"),
    camera: {
      id: 1,
      code: "CAM-SYS-001",
      location: "Marine Drive Segment 1",
      type: "ANPR"
    },
    detection: {
      vehicle_type: "SEDAN",
      speed: 78.5,
      speed_limit: 60.0,
      helmet_detected: null,
      seatbelt_detected: false,
      plate_confidence: 98.40
    },
    evidence: {
      image_path: "/storage/evidence/2026/09/evt_1_full.jpg",
      video_path: "/storage/evidence/2026/09/evt_1_clip.mp4",
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    tags: ["overspeeding", "no_seatbelt", "high_confidence"],
    processed: true
  },
  {
    event_id: "mongo_evt_2",
    vehicle_number: "DL02AB0002",
    timestamp: ISODate("2026-09-02T11:20:00Z"),
    camera: {
      id: 2,
      code: "CAM-SYS-002",
      location: "Connaught Place Circle",
      type: "RED_LIGHT"
    },
    detection: {
      vehicle_type: "HATCHBACK",
      speed: 42.0,
      speed_limit: 40.0,
      helmet_detected: null,
      seatbelt_detected: true,
      plate_confidence: 92.10
    },
    evidence: {
      image_path: "/storage/evidence/2026/09/evt_2_full.jpg",
      video_path: null,
      hash: "f4c0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b856"
    },
    tags: ["red_light", "moderate_risk"],
    processed: true
  },
  {
    event_id: "mongo_evt_3",
    vehicle_number: "KA03AB0003",
    timestamp: ISODate("2026-09-03T14:45:10Z"),
    camera: {
      id: 3,
      code: "CAM-SYS-003",
      location: "Outer Ring Road Silk Board",
      type: "AI_TRAFFIC"
    },
    detection: {
      vehicle_type: "TWO_WHEELER",
      speed: 55.0,
      speed_limit: 60.0,
      helmet_detected: false,
      seatbelt_detected: null,
      plate_confidence: 89.50
    },
    evidence: {
      image_path: "/storage/evidence/2026/09/evt_3_full.jpg",
      video_path: "/storage/evidence/2026/09/evt_3_clip.mp4",
      hash: "a1b2c3d498fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b857"
    },
    tags: ["no_helmet", "vulnerable_road_user"],
    processed: false
  }
]);

print("MongoDB Seed Data Inserted Successfully!");
