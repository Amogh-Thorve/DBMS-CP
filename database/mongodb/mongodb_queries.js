// ============================================================================
// STVAMS: Smart Traffic Violation & Vehicle Analytics Management System
// File: mongodb_queries.js
// Description: 15+ Comprehensive MongoDB Queries Demonstrating NoSQL CRUD, Nested Documents, Arrays & Aggregations
// Author: STVAMS Core Architecture Team
// ============================================================================

db = db.getSiblingDB("stvams_events");

// 1. insertOne Example
db.detection_events.insertOne({
  event_id: "mongo_evt_99",
  vehicle_number: "MH01AB9999",
  timestamp: new Date(),
  camera: { id: 5, code: "CAM-SYS-005", location: "BKC Main Avenue", type: "SPEED" },
  detection: { vehicle_type: "SEDAN", speed: 95.0, speed_limit: 60.0, plate_confidence: 99.1 },
  evidence: { image_path: "/storage/evidence/evt_99.jpg", hash: "abc123hash" },
  tags: ["overspeeding", "severe"],
  processed: false
});

// 2. findOne Example (Fetch by Event ID)
db.detection_events.findOne({ event_id: "mongo_evt_1" });

// 3. find with Simple Comparison Operator ($gt)
db.detection_events.find({ "detection.speed": { $gt: 70.0 } });

// 4. Nested Document Query ("camera.type")
db.detection_events.find({ "camera.type": "ANPR" });

// 5. Logical $and and $or Query
db.detection_events.find({
  $or: [
    { "detection.helmet_detected": false },
    { "detection.seatbelt_detected": false }
  ],
  processed: true
});

// 6. Array Query using $in
db.detection_events.find({ tags: { $in: ["overspeeding", "no_seatbelt"] } });

// 7. Existence Query ($exists)
db.detection_events.find({ "evidence.video_path": { $exists: true, $ne: null } });

// 8. Projection (Include specific fields, exclude _id)
db.detection_events.find(
  { processed: true },
  { event_id: 1, vehicle_number: 1, "detection.speed": 1, _id: 0 }
);

// 9. Sorting & Limiting (Get top 3 highest detected speeds)
db.detection_events.find()
  .sort({ "detection.speed": -1 })
  .limit(3);

// 10. Date Range Query
db.detection_events.find({
  timestamp: {
    $gte: ISODate("2026-09-01T00:00:00Z"),
    $lte: ISODate("2026-09-30T23:59:59Z")
  }
});

// 11. updateOne Example (Mark event as processed)
db.detection_events.updateOne(
  { event_id: "mongo_evt_3" },
  { $set: { processed: true, "detection.reviewed_by": "Officer TR-1001" } }
);

// 12. updateMany Example (Add tag to all overspeeding events)
db.detection_events.updateMany(
  { "detection.speed": { $gt: 80.0 } },
  { $addToSet: { tags: "CRITICAL_SPEED" } }
);

// 13. deleteOne Example
db.detection_events.deleteOne({ event_id: "mongo_evt_99" });

// 14. deleteMany Example (Clean up test events)
db.detection_events.deleteMany({ vehicle_number: "TEST_PLATE" });

// 15. Aggregation Pipeline ($match, $group, $sort - Camera wise Average Speed)
db.detection_events.aggregate([
  { $match: { "detection.speed": { $ne: null } } },
  {
    $group: {
      _id: "$camera.code",
      avg_speed: { $avg: "$detection.speed" },
      max_speed: { $max: "$detection.speed" },
      total_events: { $sum: 1 }
    }
  },
  { $sort: { avg_speed: -1 } }
]);
