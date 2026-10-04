# STVAMS Enhanced Entity-Relationship (EER) Modeling

## Specialization and Generalization Rationale

In STVAMS, Specialization / Generalization hierarchies are implemented to model entity class hierarchies with unique attributes and distinct operational rules.

```mermaid
classDiagram
    class VEHICLE {
        +int vehicle_id
        +string registration_no
        +string make
        +string model
        +string vehicle_class
    }
    class PRIVATE_VEHICLE {
        +string personal_id_proof
        +boolean seating_capacity
    }
    class COMMERCIAL_VEHICLE {
        +string permit_number
        +float max_load_capacity_tons
        +date fitness_expiry
    }
    VEHICLE <|-- PRIVATE_VEHICLE : Specializes
    VEHICLE <|-- COMMERCIAL_VEHICLE : Specializes

    class CAMERA {
        +int camera_id
        +string camera_code
        +string camera_type
        +string status
    }
    class ANPR_CAMERA {
        +float optical_zoom_ratio
        +float night_vision_range
    }
    class SPEED_CAMERA {
        +float radar_frequency_ghz
        +float max_detection_range_m
    }
    class RED_LIGHT_CAMERA {
        +int signal_sync_port
        +float loop_induction_sensitivity
    }
    CAMERA <|-- ANPR_CAMERA : Specializes
    CAMERA <|-- SPEED_CAMERA : Specializes
    CAMERA <|-- RED_LIGHT_CAMERA : Specializes
```

### 1. VEHICLE Hierarchy (Disjoint & Total Specialization)
* **Supertype:** `VEHICLE`
* **Subtypes:** `PRIVATE_VEHICLE`, `COMMERCIAL_VEHICLE`
* **Rationale:** Commercial vehicles require distinct legal attributes (Commercial Permit Numbers, Gross Vehicle Weight Ratings, Fitness Certificates) and are subject to overloading violation checks (`OVERLOAD_01`), whereas Private Vehicles do not.

### 2. CAMERA Hierarchy (Disjoint Specialization)
* **Supertype:** `CAMERA`
* **Subtypes:** `ANPR_CAMERA`, `SPEED_CAMERA`, `RED_LIGHT_CAMERA`
* **Rationale:** Speed cameras incorporate Doppler Radar frequency attributes, Red-Light cameras interface with traffic signal controller ports, and ANPR cameras store optical OCR calibration parameters.
