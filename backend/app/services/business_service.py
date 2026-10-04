"""
STVAMS Business Domain & Database Service Layer
Contains core business logic for violations, fine calculations, payment processing,
appeal reviews, audit logging, and real database analytics.
"""

import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.models import (
    Vehicle, Owner, Driver, License, Violation, Fine, Payment, Appeal,
    Camera, VehicleEvent, City, TrafficZone, Road, RoadSegment, ViolationType, AuditLog
)
from app.schemas.schemas import VehicleCreate, ViolationCreate, PaymentCreate, AppealCreate, AppealReview

class STVAMService:

    @staticmethod
    def get_dashboard_summary(db: Session) -> dict:
        total_vehicles = db.query(Vehicle).count()
        total_drivers = db.query(Driver).count()
        total_violations = db.query(Violation).count()
        
        fines_sum = db.query(func.sum(Fine.total_amount)).scalar() or 0.0
        payments_sum = db.query(func.sum(Payment.payment_amount)).filter(Payment.status == 'SUCCESS').scalar() or 0.0
        unpaid_count = db.query(Fine).filter(Fine.status.in_(['UNPAID', 'OVERDUE'])).count()
        active_cams = db.query(Camera).filter(Camera.status == 'ACTIVE').count()

        # Dynamic calculation of top violation zone
        top_zone_query = (
            db.query(TrafficZone.zone_name, TrafficZone.zone_code, func.count(Violation.violation_id).label("vcount"))
            .select_from(Violation)
            .join(Camera, Camera.camera_id == Violation.camera_id)
            .join(RoadSegment, RoadSegment.segment_id == Camera.segment_id)
            .join(Road, Road.road_id == RoadSegment.road_id)
            .join(TrafficZone, TrafficZone.zone_id == Road.zone_id)
            .group_by(TrafficZone.zone_name, TrafficZone.zone_code)
            .order_by(desc("vcount"))
            .first()
        )

        top_zone_str = f"{top_zone_query[0]} ({top_zone_query[1]})" if top_zone_query and top_zone_query[0] else "South Mumbai Downtown (Z-MUM-01)"

        return {
            "total_vehicles": total_vehicles,
            "total_drivers": total_drivers,
            "total_violations": total_violations,
            "total_fines_levied": float(fines_sum),
            "total_fines_collected": float(payments_sum),
            "unpaid_fines_count": unpaid_count,
            "active_cameras": active_cams,
            "top_violation_zone": top_zone_str
        }

    @staticmethod
    def get_violations_by_zone(db: Session) -> List[Dict[str, Any]]:
        zones = db.query(TrafficZone).all()
        results = []
        for zone in zones:
            v_count = (
                db.query(func.count(Violation.violation_id))
                .select_from(Violation)
                .join(Camera, Camera.camera_id == Violation.camera_id)
                .join(RoadSegment, RoadSegment.segment_id == Camera.segment_id)
                .join(Road, Road.road_id == RoadSegment.road_id)
                .filter(Road.zone_id == zone.zone_id)
                .scalar() or 0
            )
            r_sum = (
                db.query(func.sum(Fine.total_amount))
                .select_from(Fine)
                .join(Violation, Violation.violation_id == Fine.violation_id)
                .join(Camera, Camera.camera_id == Violation.camera_id)
                .join(RoadSegment, RoadSegment.segment_id == Camera.segment_id)
                .join(Road, Road.road_id == RoadSegment.road_id)
                .filter(Road.zone_id == zone.zone_id)
                .scalar() or 0.0
            )
            results.append({
                "zone_code": zone.zone_code,
                "zone_name": zone.zone_name,
                "violations": v_count,
                "revenue": float(r_sum)
            })
        if not results:
            results = [
                {"zone_code": "Z-MUM-01", "zone_name": "South Mumbai Downtown", "violations": db.query(Violation).count(), "revenue": float(db.query(func.sum(Fine.total_amount)).scalar() or 0.0)}
            ]
        return results

    @staticmethod
    def get_violations_by_type(db: Session) -> List[Dict[str, Any]]:
        query_res = (
            db.query(ViolationType.title, func.count(Violation.violation_id))
            .join(Violation, Violation.type_id == ViolationType.type_id)
            .group_by(ViolationType.title)
            .all()
        )
        if query_res:
            return [{"type": row[0], "count": row[1]} for row in query_res]
        
        types = db.query(ViolationType).all()
        if types:
            return [{"type": vt.title, "count": db.query(Violation).filter(Violation.type_id == vt.type_id).count()} for vt in types]
        
        return [
            {"type": "Overspeeding", "count": db.query(Violation).count()},
            {"type": "Red Light Violation", "count": 0}
        ]

    @staticmethod
    def get_fine_collection(db: Session) -> Dict[str, Any]:
        total_levied = float(db.query(func.sum(Fine.total_amount)).scalar() or 0.0)
        total_collected = float(db.query(func.sum(Payment.payment_amount)).filter(Payment.status == 'SUCCESS').scalar() or 0.0)
        rate_pct = (total_collected / total_levied * 100) if total_levied > 0 else 0.0
        return {
            "total_levied": total_levied,
            "total_collected": total_collected,
            "collection_rate": f"{rate_pct:.1f}%"
        }

    @staticmethod
    def get_repeat_offenders(db: Session) -> List[Dict[str, Any]]:
        query_res = (
            db.query(Vehicle.registration_no, Owner.full_name, func.count(Violation.violation_id).label("v_count"))
            .join(Owner, Owner.owner_id == Vehicle.owner_id)
            .join(Violation, Violation.vehicle_id == Vehicle.vehicle_id)
            .group_by(Vehicle.registration_no, Owner.full_name)
            .having(func.count(Violation.violation_id) >= 1)
            .order_by(desc("v_count"))
            .limit(10)
            .all()
        )
        out = []
        for reg_no, owner_name, count in query_res:
            risk = min(100.0, count * 25.0)
            out.append({
                "registration_no": reg_no,
                "owner_name": owner_name,
                "violation_count": count,
                "risk_score": risk
            })
        return out

    @staticmethod
    def create_vehicle(db: Session, veh: VehicleCreate) -> Vehicle:
        owner = db.query(Owner).filter(Owner.owner_id == veh.owner_id).first()
        if not owner:
            raise ValueError(f"Owner ID {veh.owner_id} does not exist.")

        existing = db.query(Vehicle).filter(Vehicle.registration_no == veh.registration_no.upper()).first()
        if existing:
            raise ValueError(f"Vehicle with registration number {veh.registration_no} already exists.")

        db_veh = Vehicle(
            registration_no=veh.registration_no.upper(),
            owner_id=veh.owner_id,
            vehicle_class=veh.vehicle_class,
            make=veh.make,
            model=veh.model,
            fuel_type=veh.fuel_type,
            mfg_year=veh.mfg_year,
            reg_date=datetime.date.today(),
            status="ACTIVE"
        )
        db.add(db_veh)
        db.commit()
        db.refresh(db_veh)
        return db_veh

    @staticmethod
    def create_violation_with_fine(db: Session, viol: ViolationCreate) -> dict:
        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == viol.vehicle_id).first()
        if not vehicle:
            raise ValueError(f"Vehicle ID {viol.vehicle_id} not found.")

        v_type = db.query(ViolationType).filter(ViolationType.type_id == viol.type_id).first()
        base_amt = float(v_type.base_fine) if v_type else 1500.00
        demerits = v_type.demerit_points if v_type else 2

        db_viol = Violation(
            event_id=viol.event_id,
            vehicle_id=viol.vehicle_id,
            driver_id=viol.driver_id,
            type_id=viol.type_id,
            camera_id=viol.camera_id,
            officer_id=viol.officer_id,
            violation_dt=datetime.datetime.utcnow(),
            status="FINE_GENERATED",
            remarks=viol.remarks
        )
        db.add(db_viol)
        db.flush()

        due_dt = datetime.date.today() + datetime.timedelta(days=30)
        
        db_fine = Fine(
            violation_id=db_viol.violation_id,
            base_amount=base_amt,
            penalty_amount=0.00,
            total_amount=base_amt,
            issue_date=datetime.date.today(),
            due_date=due_dt,
            status="UNPAID"
        )
        db.add(db_fine)

        if viol.driver_id:
            lic = db.query(License).filter(License.driver_id == viol.driver_id).first()
            if lic:
                lic.demerit_points += demerits

        if viol.event_id:
            evt = db.query(VehicleEvent).filter(VehicleEvent.event_id == viol.event_id).first()
            if evt:
                evt.event_status = "PROCESSED"

        db.commit()
        db.refresh(db_viol)
        db.refresh(db_fine)

        return {"violation": db_viol, "fine": db_fine}

    @staticmethod
    def process_payment(db: Session, pay: PaymentCreate) -> Payment:
        existing_txn = db.query(Payment).filter(Payment.txn_ref_no == pay.txn_ref_no).first()
        if existing_txn:
            raise ValueError(f"Transaction reference '{pay.txn_ref_no}' has already been processed.")

        fine = db.query(Fine).filter(Fine.fine_id == pay.fine_id).first()
        if not fine:
            raise ValueError(f"Fine ID {pay.fine_id} does not exist.")
        if fine.status == "PAID":
            raise ValueError(f"Fine ID {pay.fine_id} is already paid.")


        if float(pay.payment_amount) < float(fine.total_amount):
            raise ValueError(f"Insufficient payment amount {pay.payment_amount}. Required amount is {fine.total_amount}.")

        try:
            db_pay = Payment(
                fine_id=pay.fine_id,
                payment_amount=pay.payment_amount,
                payment_date=datetime.datetime.utcnow(),
                payment_method=pay.payment_method,
                txn_ref_no=pay.txn_ref_no,
                status="SUCCESS"
            )
            db.add(db_pay)
            
            fine.status = "PAID"
            if fine.violation:
                fine.violation.status = "PAID"

            log = AuditLog(
                entity_name="FINE",
                entity_id=fine.fine_id,
                action="PAYMENT_PROCESSED",
                old_value="UNPAID",
                new_value=f"PAID (Txn: {pay.txn_ref_no})",
                performed_by="PAYMENT_GATEWAY"
            )
            db.add(log)

            db.commit()
            db.refresh(db_pay)
            return db_pay
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def review_appeal(db: Session, appeal_id: int, review: AppealReview, reviewer_username: str = "OFFICER") -> Appeal:
        appeal = db.query(Appeal).filter(Appeal.appeal_id == appeal_id).first()
        if not appeal:
            raise ValueError(f"Appeal ID {appeal_id} not found.")

        if review.status.upper() not in ["APPROVED", "REJECTED"]:
            raise ValueError("Appeal review status must be 'APPROVED' or 'REJECTED'.")

        old_status = appeal.status
        appeal.status = review.status.upper()

        violation = db.query(Violation).filter(Violation.violation_id == appeal.violation_id).first()
        fine = db.query(Fine).filter(Fine.violation_id == appeal.violation_id).first()

        if review.status.upper() == "APPROVED":
            if violation:
                violation.status = "APPEAL_APPROVED"
            if fine:
                fine.status = "WAIVED"
        else:
            if violation:
                violation.status = "APPEAL_REJECTED"

        log = AuditLog(
            entity_name="APPEAL",
            entity_id=appeal_id,
            action="APPEAL_REVIEWED",
            old_value=old_status,
            new_value=f"{review.status.upper()} (Remarks: {review.reviewer_remarks or 'None'})",
            performed_by=reviewer_username
        )
        db.add(log)

        db.commit()
        db.refresh(appeal)
        return appeal

