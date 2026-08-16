import datetime
from sqlalchemy.orm import Session
from app import models
from typing import Dict, Any, List, Optional

# Vitals test name mapping
VITAL_MAPPINGS = {
    "heart_rate": ["heart rate", "pulse", "pulse rate", "hr", "bpm"],
    "blood_pressure": ["blood pressure", "bp", "systolic", "diastolic", "bp systolic", "bp diastolic"],
    "spo2": ["spo2", "oxygen saturation", "o2 saturation", "oxygen"],
    "temperature": ["temperature", "temp", "body temperature"],
    "respiratory_rate": ["respiratory rate", "rr", "breathing rate"],
    "weight": ["weight", "body weight", "wt"]
}

def _compute_age(dob_str: Optional[str]) -> Optional[int]:
    if not dob_str:
        return None
    try:
        dob = datetime.datetime.strptime(dob_str, "%Y-%m-%d").date()
        today = datetime.date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except Exception:
        return None

def is_vital_result(test_name: str) -> Optional[str]:
    test_name_lower = test_name.lower()
    for vital_key, keywords in VITAL_MAPPINGS.items():
        if any(kw in test_name_lower for kw in keywords):
            return vital_key
    return None

def get_latest_vitals(patient_id: str, db: Session) -> List[Dict[str, Any]]:
    # Get all lab results sorted by date desc
    results = db.query(models.LabResult).filter(
        models.LabResult.patient_id == patient_id
    ).order_by(models.LabResult.test_date.desc()).all()
    
    latest = {}
    for r in results:
        vital_key = is_vital_result(r.test_name)
        if vital_key and vital_key not in latest:
            source_title = None
            if r.source_record_id:
                src = db.query(models.MedicalRecord).filter(models.MedicalRecord.id == r.source_record_id).first()
                if src:
                    source_title = src.title
            
            # Format display label
            label = vital_key.replace("_", " ").title()
            if vital_key == "spo2":
                label = "SpO2"
            
            latest[vital_key] = {
                "key": vital_key,
                "label": label,
                "value": r.value,
                "unit": r.unit,
                "test_date": r.test_date,
                "source_title": source_title,
                "source_record_id": r.source_record_id
            }
            
    return list(latest.values())

def get_lab_results_summary(patient_id: str, db: Session) -> List[Dict[str, Any]]:
    # Filter out vitals, return non-vital lab results
    results = db.query(models.LabResult).filter(
        models.LabResult.patient_id == patient_id
    ).order_by(models.LabResult.test_date.desc()).all()
    
    summary_labs = []
    seen_tests = set()
    for r in results:
        if is_vital_result(r.test_name):
            continue
        test_name_lower = r.test_name.lower()
        # Keep latest per test name
        if test_name_lower not in seen_tests:
            seen_tests.add(test_name_lower)
            # Find previous value for trend if exists
            prev = db.query(models.LabResult).filter(
                models.LabResult.patient_id == patient_id,
                models.LabResult.test_name.ilike(r.test_name),
                models.LabResult.test_date < r.test_date
            ).order_by(models.LabResult.test_date.desc()).first()
            
            trend = "stable"
            if prev:
                try:
                    val_curr = float(r.value)
                    val_prev = float(prev.value)
                    if val_curr > val_prev:
                        trend = "increasing"
                    elif val_curr < val_prev:
                        trend = "decreasing"
                except ValueError:
                    pass
            
            source_title = None
            if r.source_record_id:
                src = db.query(models.MedicalRecord).filter(models.MedicalRecord.id == r.source_record_id).first()
                if src:
                    source_title = src.title

            summary_labs.append({
                "id": r.id,
                "test_name": r.test_name,
                "value": r.value,
                "unit": r.unit,
                "reference_range": r.reference_range,
                "test_date": r.test_date,
                "previous_value": prev.value if prev else None,
                "trend": trend if prev else "insufficient_data",
                "source_title": source_title,
                "source_record_id": r.source_record_id
            })
            
    return summary_labs

def assemble_digital_twin_context(patient: models.Patient, db: Session) -> Dict[str, Any]:
    from app.main import _build_organ_data # Circular safety check / import
    
    # 1. Base profile
    patient_profile = {
        "id": patient.id,
        "name": patient.user.name,
        "email": patient.user.email,
        "age": _compute_age(patient.date_of_birth),
        "gender": patient.gender,
        "blood_group": patient.blood_group,
        "emergency_contact": patient.emergency_contact
    }
    
    # 2. Vitals
    vitals = get_latest_vitals(patient.id, db)
    
    # 3. Medications
    medications = []
    for m in patient.medications:
        source_title = None
        if m.source_record_id:
            src = db.query(models.MedicalRecord).filter(models.MedicalRecord.id == m.source_record_id).first()
            if src:
                source_title = src.title
        
        # Check safety alerts for this medication
        has_alert = False
        alert_desc = None
        for alert in patient.safety_alerts:
            if alert.status == "active" and m.name.lower() in (alert.description or "").lower():
                has_alert = True
                alert_desc = alert.title
                
        medications.append({
            "id": m.id,
            "name": m.name,
            "generic_name": m.generic_name,
            "dosage": m.dosage,
            "frequency": m.frequency,
            "start_date": m.start_date,
            "end_date": m.end_date,
            "status": m.status,
            "source_title": source_title,
            "source_record_id": m.source_record_id,
            "has_safety_alert": has_alert,
            "safety_alert_description": alert_desc
        })
        
    # 4. Allergies
    allergies = []
    for a in patient.allergies:
        source_title = None
        if a.source_record_id:
            src = db.query(models.MedicalRecord).filter(models.MedicalRecord.id == a.source_record_id).first()
            if src:
                source_title = src.title
        allergies.append({
            "id": a.id,
            "allergen": a.allergen,
            "reaction": a.reaction,
            "severity": a.severity,
            "source_title": source_title,
            "source_record_id": a.source_record_id
        })
        
    # 5. Diagnoses
    diagnoses = []
    for d in patient.diagnoses:
        source_title = None
        if d.source_record_id:
            src = db.query(models.MedicalRecord).filter(models.MedicalRecord.id == d.source_record_id).first()
            if src:
                source_title = src.title
        diagnoses.append({
            "id": d.id,
            "condition": d.condition,
            "status": d.status,
            "diagnosed_date": d.diagnosed_date,
            "source_title": source_title,
            "source_record_id": d.source_record_id
        })
        
    # 6. Safety Alerts
    safety_alerts = []
    for alert in patient.safety_alerts:
        if alert.status == "active":
            safety_alerts.append({
                "id": alert.id,
                "severity": alert.severity,
                "category": alert.category,
                "title": alert.title,
                "description": alert.description,
                "created_at": alert.created_at.isoformat()
            })
            
    # 7. Timeline events (Chronological order, latest first)
    timeline = []
    
    # Add manual medical events
    for ev in patient.medical_events:
        timeline.append({
            "date": ev.event_date,
            "type": "event",
            "title": ev.title,
            "description": ev.description,
            "source": ev.source,
            "source_record_id": ev.source_record_id
        })
        
    # Add uploaded records
    for rec in patient.medical_records:
        timeline.append({
            "date": rec.record_date,
            "type": "record",
            "title": f"Document Uploaded: {rec.title}",
            "description": f"Record Type: {rec.record_type} from {rec.source or 'Unknown Source'}",
            "source": rec.source,
            "source_record_id": rec.id
        })
        
    # Sort timeline latest date first
    timeline = sorted(timeline, key=lambda x: x["date"], reverse=True)
    
    # 8. Last updated calculation (max date from records, twin last_updated)
    last_updated_str = datetime.date.today().isoformat()
    if patient.digital_twin:
        last_updated_str = patient.digital_twin.last_updated.strftime("%Y-%m-%d")
        
    # 9. Organ specific details
    organs = {}
    for organ in ["heart", "brain", "lungs", "kidneys", "liver"]:
        organs[organ] = _build_organ_data(patient, organ, db)
        
    # 10. Non-vital lab results
    labs = get_lab_results_summary(patient.id, db)
    
    # 11. Recent records list
    records = []
    for rec in sorted(patient.medical_records, key=lambda x: x.record_date, reverse=True)[:5]:
        records.append({
            "id": rec.id,
            "title": rec.title,
            "record_type": rec.record_type,
            "source": rec.source,
            "record_date": rec.record_date,
            "processing_status": rec.processing_status
        })

    return {
        "patient": patient_profile,
        "vitals": vitals,
        "medications": medications,
        "allergies": allergies,
        "conditions": diagnoses,
        "safety_alerts": safety_alerts,
        "timeline": timeline,
        "labs": labs,
        "records": records,
        "organs": organs,
        "last_updated": last_updated_str
    }
