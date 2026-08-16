import os
import uuid
import shutil
import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from .database import get_db, engine, Base
from . import models, auth
from .services import ocr, safety

# Ensure upload storage folder exists
UPLOAD_DIR = "./storage"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="HealthTwin Backend", version="1.0.0")

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Schemas ---

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    userId: str
    name: str

class ConsentCreate(BaseModel):
    grantee_email: str
    data_category: str
    permission: str
    expires_at: Optional[str] = None

class LabResultConfirm(BaseModel):
    test_name: str
    value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None

class MedicationConfirm(BaseModel):
    name: str
    dosage: str
    frequency: str
    start_date: str
    end_date: Optional[str] = None

class AllergyConfirm(BaseModel):
    allergen: str
    reaction: str
    severity: str

class DiagnosisConfirm(BaseModel):
    condition: str
    status: str

class RecordConfirmRequest(BaseModel):
    title: str
    record_type: str
    source: str
    record_date: str
    medications: List[MedicationConfirm] = []
    allergies: List[AllergyConfirm] = []
    diagnoses: List[DiagnosisConfirm] = []
    lab_results: List[LabResultConfirm] = []


# --- Auth Endpoints ---

@app.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not auth.verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "userId": user.id,
        "name": user.name
    }


# --- Patient: Health Vault & Records Endpoints ---

@app.get("/patients/me/records")
def get_patient_records(current_patient: models.Patient = Depends(auth.get_current_patient), db: Session = Depends(get_db)):
    records = db.query(models.MedicalRecord).filter(
        models.MedicalRecord.patient_id == current_patient.id
    ).order_by(models.MedicalRecord.record_date.desc()).all()
    # Audit log for patient accessing own records list
    log = models.AccessLog(
        patient_id=current_patient.id,
        actor_id=current_patient.user_id,
        action="Viewed own medical records list",
        data_category="Medical Records"
    )
    db.add(log)
    db.commit()
    return records

@app.get("/records/{record_id}/file")
def download_record_file(
    record_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(models.MedicalRecord).filter(models.MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
        
    is_authorized = False
    
    if current_user.role == "PATIENT":
        if current_user.patient_profile and record.patient_id == current_user.patient_profile.id:
            is_authorized = True
    elif current_user.role == "DOCTOR":
        if current_user.doctor_profile:
            is_authorized = auth.check_doctor_consent(
                current_user.user_id,
                record.patient_id,
                record.record_type or "Medical Records",
                db
            )
            
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view or download this document."
        )
        
    file_rel = record.file_path.replace("/storage/", "") if record.file_path else ""
    full_path = os.path.join(UPLOAD_DIR, os.path.basename(file_rel))
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Physical document file missing on server")
        
    log = models.AccessLog(
        patient_id=record.patient_id,
        actor_id=current_user.id,
        action="Downloaded/Viewed Document File",
        data_category="Medical Records",
        record_id=record.id
    )
    db.add(log)
    db.commit()
    
    return FileResponse(full_path, media_type="application/pdf", filename=f"{record.title}.pdf")

@app.post("/patients/me/records")
def upload_medical_record(
    file: UploadFile = File(...),
    current_patient: models.Patient = Depends(auth.get_current_patient),
    db: Session = Depends(get_db)
):
    # Validate extension
    allowed_exts = {".pdf", ".png", ".jpg", ".jpeg"}
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Allowed extensions: {', '.join(allowed_exts)}"
        )
        
    # Validate size (max 5MB)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds maximum permitted limit of 10MB."
        )

    stored_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, stored_filename)
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
    record = models.MedicalRecord(
        patient_id=current_patient.id,
        record_type="OTHER",
        title=file.filename,
        source="Uploaded Document",
        record_date=datetime.date.today().isoformat(),
        file_path=f"/storage/{stored_filename}",
        processing_status="PROCESSING"
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    extracted = ocr.parse_medical_document(file_path, file.filename)
    
    record.processing_status = "REVIEW"
    record.record_type = extracted.get("record_type", "OTHER")
    record.title = extracted.get("title", file.filename)
    record.source = extracted.get("source", "Uploaded Document")
    if extracted.get("record_date"):
        record.record_date = extracted.get("record_date")
    db.commit()
    
    log = models.AccessLog(
        patient_id=current_patient.id,
        actor_id=current_patient.user_id,
        action="Uploaded Health Record",
        data_category="Medical Records",
        record_id=record.id
    )
    db.add(log)
    db.commit()
    
    return {
        "record_id": record.id,
        "title": record.title,
        "record_type": record.record_type,
        "source": record.source,
        "record_date": record.record_date,
        "file_path": record.file_path,
        "extracted_data": extracted
    }

@app.post("/patients/me/records/{record_id}/confirm")
def confirm_medical_record(
    record_id: str,
    confirm_data: RecordConfirmRequest,
    current_patient: models.Patient = Depends(auth.get_current_patient),
    db: Session = Depends(get_db)
):
    record = db.query(models.MedicalRecord).filter(
        models.MedicalRecord.id == record_id,
        models.MedicalRecord.patient_id == current_patient.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
        
    # Update metadata
    record.title = confirm_data.title
    record.record_type = confirm_data.record_type
    record.source = confirm_data.source
    record.record_date = confirm_data.record_date
    record.processing_status = "PROCESSED"
    db.commit()
    
    # Insert structured medications
    for m in confirm_data.medications:
        med = models.Medication(
            patient_id=current_patient.id,
            name=m.name,
            dosage=m.dosage,
            frequency=m.frequency,
            start_date=m.start_date,
            end_date=m.end_date,
            status="active",
            source_record_id=record.id
        )
        db.add(med)
        
    # Insert allergies
    for a in confirm_data.allergies:
        alg = models.Allergy(
            patient_id=current_patient.id,
            allergen=a.allergen,
            reaction=a.reaction,
            severity=a.severity,
            source_record_id=record.id
        )
        db.add(alg)
        
    # Insert diagnoses
    for d in confirm_data.diagnoses:
        diag = models.Diagnosis(
            patient_id=current_patient.id,
            condition=d.condition,
            status=d.status,
            diagnosed_date=record.record_date,
            source_record_id=record.id
        )
        db.add(diag)
        
    # Insert lab results
    for l in confirm_data.lab_results:
        lab = models.LabResult(
            patient_id=current_patient.id,
            test_name=l.test_name,
            value=l.value,
            unit=l.unit,
            reference_range=l.reference_range,
            test_date=record.record_date,
            source_record_id=record.id
        )
        db.add(lab)
        
    # Add timeline medical event
    event = models.MedicalEvent(
        patient_id=current_patient.id,
        event_type=record.record_type.lower() if record.record_type in ["PRESCRIPTION", "LAB_REPORT"] else "general",
        title=record.title,
        description=f"Record confirmed and details reconciled.",
        event_date=record.record_date,
        source_record_id=record.id
    )
    db.add(event)
    db.commit()
    
    # Re-calculate Digital Twin summary representation
    recalculate_digital_twin(current_patient.id, db)
    
    # Recheck safety engine and recreate safety alerts
    # First delete current safety alerts for this patient
    old_alerts = db.query(models.SafetyAlert).filter(models.SafetyAlert.patient_id == current_patient.id).all()
    for o_alert in old_alerts:
        db.delete(o_alert)
    db.commit()
    
    new_alerts = safety.analyze_safety_and_trends(current_patient.id, db)
    for alert_data in new_alerts:
        alert = models.SafetyAlert(
            patient_id=current_patient.id,
            severity=alert_data["severity"],
            category=alert_data["category"],
            title=alert_data["title"],
            description=alert_data["description"]
        )
        db.add(alert)
        db.commit()
        for ev in alert_data["evidence"]:
            evidence = models.SafetyEvidence(
                alert_id=alert.id,
                source_record_id=ev["source_record_id"],
                reason=ev["reason"]
            )
            db.add(evidence)
        db.commit()
        
    # Log access audit
    log = models.AccessLog(
        patient_id=current_patient.id,
        actor_id=current_patient.user_id,
        action="Confirmed Health Record Details",
        data_category="Medical Records",
        record_id=record.id
    )
    db.add(log)
    db.commit()
    
    return {"status": "success", "record_id": record.id}

def recalculate_digital_twin(patient_id: str, db: Session):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        return
        
    active_meds = [m.name for m in patient.medications if m.status == "active"]
    allergies = [a.allergen for a in patient.allergies]
    diagnoses = [d.condition for d in patient.diagnoses if d.status == "active"]
    
    # Get latest procedure or checkup
    recent_check = "No recent procedure documented"
    latest_rec = db.query(models.MedicalRecord).filter(
        models.MedicalRecord.patient_id == patient_id,
        models.MedicalRecord.record_type != "PRESCRIPTION"
    ).order_by(models.MedicalRecord.record_date.desc()).first()
    if latest_rec:
        recent_check = f"{latest_rec.title} — {latest_rec.record_date}"
        
    twin_summary = {
        "conditions": diagnoses,
        "medications": active_meds,
        "allergies": allergies,
        "recent_procedure": recent_check
    }
    
    twin = db.query(models.DigitalTwin).filter(models.DigitalTwin.patient_id == patient_id).first()
    if not twin:
        twin = models.DigitalTwin(patient_id=patient_id, summary=twin_summary)
        db.add(twin)
    else:
        twin.summary = twin_summary
    db.commit()


# --- Patient: Digital Twin Endpoint ---

@app.get("/patients/me/digital-twin")
def get_digital_twin(current_patient: models.Patient = Depends(auth.get_current_patient), db: Session = Depends(get_db)):
    twin = db.query(models.DigitalTwin).filter(models.DigitalTwin.patient_id == current_patient.id).first()
    
    active_meds = [m for m in current_patient.medications if m.status == "active"]
    allergies = current_patient.allergies
    diagnoses = current_patient.diagnoses
    
    signals = [
        {"id": "hs1", "label": "Blood Glucose Control", "status": "stable"},
        {"id": "hs2", "label": "Blood Pressure", "status": "stable"},
        {"id": "hs3", "label": "Lipid Profile", "status": "stable"},
        {"id": "hs4", "label": "Medication Adherence", "status": "stable"},
    ]
    
    # Check glucose control signal based on latest HbA1c value
    latest_hba1c = db.query(models.LabResult).filter(
        models.LabResult.patient_id == current_patient.id,
        models.LabResult.test_name.ilike("hba1c")
    ).order_by(models.LabResult.test_date.desc()).first()
    if latest_hba1c:
        try:
            val = float(latest_hba1c.value)
            if val > 7.0:
                signals[0]["status"] = "needs_review"
            elif val > 6.5:
                signals[0]["status"] = "trending"
        except ValueError:
            pass
            
    # Check BP status
    latest_bp = db.query(models.LabResult).filter(
        models.LabResult.patient_id == current_patient.id,
        models.LabResult.test_name.ilike("blood pressure")
    ).order_by(models.LabResult.test_date.desc()).first()
    if latest_bp and "/" in latest_bp.value:
        try:
            systolic = int(latest_bp.value.split("/")[0])
            if systolic > 130:
                signals[1]["status"] = "needs_review"
        except:
            pass
            
    # Recent changes mapping
    recent_changes = []
    latest_results = db.query(models.LabResult).filter(
        models.LabResult.patient_id == current_patient.id
    ).order_by(models.LabResult.test_date.desc()).limit(3).all()
    for r in latest_results:
        # Avoid duplicate tests
        recent_changes.append({
            "id": r.id,
            "change": f"{r.test_name} is {r.value} {r.unit or ''}",
            "date": r.test_date,
            "type": "lab"
        })
        
    return {
        "twin_summary": twin.summary if twin else {},
        "bloodGroup": current_patient.blood_group,
        "age": 34, # mock age or calculate from DOB
        "signals": signals,
        "recent_changes": recent_changes[:3]
    }


# --- Patient: Medications Endpoint ---

@app.get("/patients/me/medications")
def get_medications(current_patient: models.Patient = Depends(auth.get_current_patient), db: Session = Depends(get_db)):
    meds = db.query(models.Medication).filter(
        models.Medication.patient_id == current_patient.id,
        models.Medication.status == "active"
    ).all()
    
    history = db.query(models.Medication).filter(
        models.Medication.patient_id == current_patient.id,
        models.Medication.status != "active"
    ).all()
    
    return {
        "active": meds,
        "history": [{
            "id": h.id,
            "name": h.name,
            "change": "Stopped" if h.status == "stopped" else "Changed",
            "date": h.end_date or h.start_date,
            "reason": "Course completed" if h.status == "stopped" else "Reconciled/Updated"
        } for h in history]
    }


# --- Patient: Allergies & Conditions Endpoint ---

@app.get("/patients/me/allergies-conditions")
def get_allergies_conditions(current_patient: models.Patient = Depends(auth.get_current_patient), db: Session = Depends(get_db)):
    return {
        "allergies": current_patient.allergies,
        "conditions": current_patient.diagnoses
    }


# --- Patient: Lab Trends Endpoint ---

@app.get("/patients/me/labs")
def get_labs_trends(current_patient: models.Patient = Depends(auth.get_current_patient), db: Session = Depends(get_db)):
    trends = safety.get_lab_trend_statistics(current_patient.id, db)
    return trends


# --- Patient: Timeline Endpoint ---

@app.get("/patients/me/timeline")
def get_timeline(current_patient: models.Patient = Depends(auth.get_current_patient), db: Session = Depends(get_db)):
    events = db.query(models.MedicalEvent).filter(
        models.MedicalEvent.patient_id == current_patient.id
    ).order_by(models.MedicalEvent.event_date.desc()).all()
    
    # Format with years and icons
    formatted = []
    icon_map = {"prescription": "💊", "lab": "🧪", "consultation": "🩺", "medication": "💊", "diagnosis": "📋", "general": "📄"}
    for ev in events:
        try:
            year = datetime.datetime.strptime(ev.event_date, "%Y-%m-%d").year
        except:
            year = 2026
        formatted.append({
            "id": ev.id,
            "date": ev.event_date,
            "type": ev.event_type,
            "title": ev.title,
            "description": ev.description,
            "source": ev.source or "Unknown",
            "status": "verified",
            "icon": icon_map.get(ev.event_type, "📄"),
            "year": year
        })
    return formatted


# --- Patient: Safety Alerts & Evidence Endpoints ---

@app.get("/patients/me/safety-alerts")
def get_safety_alerts(current_patient: models.Patient = Depends(auth.get_current_patient), db: Session = Depends(get_db)):
    alerts = db.query(models.SafetyAlert).filter(
        models.SafetyAlert.patient_id == current_patient.id
    ).all()
    
    formatted = []
    for a in alerts:
        # Check source records mapping
        evidence_sources = [{"name": "Medical Record", "date": "Reconciled"} for ev in a.evidence]
        evidence_items = [{"label": ev.reason, "detail": ev.reason} for ev in a.evidence]
        
        formatted.append({
            "id": a.id,
            "priority": a.severity,
            "title": a.title,
            "detected": a.description,
            "why": a.description,
            "records": [ev.reason for ev in a.evidence],
            "date": a.created_at.date().isoformat(),
            "evidence": {
                "items": evidence_items,
                "sources": evidence_sources
            }
        })
    return formatted


# --- Patient: Consents Endpoints ---

@app.get("/patients/me/consents")
def get_consents(current_patient: models.Patient = Depends(auth.get_current_patient), db: Session = Depends(get_db)):
    consents = db.query(models.Consent).filter(models.Consent.patient_id == current_patient.id).all()
    formatted = []
    for c in consents:
        formatted.append({
            "id": c.id,
            "who": c.grantee.name,
            "data": c.data_category,
            "permission": c.permission,
            "expiry": c.expires_at or "—",
            "status": c.status
        })
    return formatted

@app.post("/patients/me/consents")
def create_consent(consent_in: ConsentCreate, current_patient: models.Patient = Depends(auth.get_current_patient), db: Session = Depends(get_db)):
    # Find doctor user by email
    doctor_user = db.query(models.User).filter(
        models.User.email == consent_in.grantee_email,
        models.User.role == "DOCTOR"
    ).first()
    
    if not doctor_user:
        raise HTTPException(status_code=404, detail="Doctor not found with this email")
        
    consent = models.Consent(
        patient_id=current_patient.id,
        grantee_id=doctor_user.id,
        data_category=consent_in.data_category,
        permission=consent_in.permission,
        status="active",
        expires_at=consent_in.expires_at
    )
    db.add(consent)
    db.commit()
    
    # Log audit
    log = models.AccessLog(
        patient_id=current_patient.id,
        actor_id=current_patient.user_id,
        action=f"Granted access to {doctor_user.name}",
        data_category=consent_in.data_category
    )
    db.add(log)
    db.commit()
    
    return {"status": "success", "consent_id": consent.id}

@app.delete("/patients/me/consents/{consent_id}")
def revoke_consent(consent_id: str, current_patient: models.Patient = Depends(auth.get_current_patient), db: Session = Depends(get_db)):
    consent = db.query(models.Consent).filter(
        models.Consent.id == consent_id,
        models.Consent.patient_id == current_patient.id
    ).first()
    
    if not consent:
        raise HTTPException(status_code=404, detail="Consent entry not found")
        
    db.delete(consent)
    db.commit()
    
    # Log audit
    log = models.AccessLog(
        patient_id=current_patient.id,
        actor_id=current_patient.user_id,
        action=f"Revoked access for {consent.grantee.name}",
        data_category=consent.data_category
    )
    db.add(log)
    db.commit()
    
    return {"status": "success"}


# --- Patient: Access History / Audit Logs ---

@app.get("/patients/me/access-log")
def get_access_log(current_patient: models.Patient = Depends(auth.get_current_patient), db: Session = Depends(get_db)):
    logs = db.query(models.AccessLog).filter(
        models.AccessLog.patient_id == current_patient.id
    ).order_by(models.AccessLog.timestamp.desc()).all()
    
    formatted = []
    for l in logs:
        formatted.append({
            "id": l.id,
            "timestamp": l.timestamp.isoformat(),
            "actor": l.actor.name,
            "action": l.action,
            "dataAccessed": l.data_category or "All Profile Details"
        })
    return formatted


# --- Patient: Emergency Profile Endpoint ---

@app.get("/patients/me/emergency")
def get_emergency_profile(current_patient: models.Patient = Depends(auth.get_current_patient), db: Session = Depends(get_db)):
    active_meds = [m for m in current_patient.medications if m.status == "active"]
    allergies = current_patient.allergies
    diagnoses = current_patient.diagnoses
    
    critical_allergies = [f"{a.allergen} ({a.severity.capitalize()} — {a.reaction})" for a in allergies]
    critical_meds = [f"{m.name} {m.dosage or ''} — {m.frequency or ''}" for m in active_meds]
    major_conditions = [d.condition for d in diagnoses if d.status == "active"]
    
    return {
        "bloodGroup": current_patient.blood_group,
        "criticalAllergies": critical_allergies,
        "criticalMedications": critical_meds,
        "majorConditions": major_conditions,
        "emergencyContact": current_patient.emergency_contact,
        "name": current_patient.user.name
    }


# --- Doctor Endpoints ---

@app.get("/doctor/patients")
def get_doctor_patients(current_doctor: models.Doctor = Depends(auth.get_current_doctor), db: Session = Depends(get_db)):
    # Find patients who have granted active consent to this doctor
    consents = db.query(models.Consent).filter(
        models.Consent.grantee_id == current_doctor.user_id,
        models.Consent.status == "active"
    ).all()
    
    patient_ids = list(set([c.patient_id for c in consents]))
    
    patient_list = []
    for p_id in patient_ids:
        patient = db.query(models.Patient).filter(models.Patient.id == p_id).first()
        if patient:
            # Audit log doctor viewing patient list
            log = models.AccessLog(
                patient_id=patient.id,
                actor_id=current_doctor.user_id,
                action="Doctor viewed patient summary in patients list",
                data_category="Clinical Overview"
            )
            db.add(log)
            db.commit()
            
            patient_list.append({
                "id": patient.id,
                "name": patient.user.name,
                "email": patient.user.email,
                "bloodGroup": patient.blood_group,
                "date_of_birth": patient.date_of_birth
            })
            
    return patient_list

@app.get("/doctor/patients/{patient_id}")
def get_doctor_patient_snapshot(
    patient_id: str,
    current_doctor: models.Doctor = Depends(auth.get_current_doctor),
    db: Session = Depends(get_db)
):
    # Check specific category consents
    has_clinical_overview = auth.check_doctor_consent(current_doctor.user_id, patient_id, "Clinical Overview", db)
    has_labs = auth.check_doctor_consent(current_doctor.user_id, patient_id, "Labs", db)
    has_medications = auth.check_doctor_consent(current_doctor.user_id, patient_id, "Medications", db)
    
    if not (has_clinical_overview or has_labs or has_medications):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have active consent to access this patient's records."
        )
        
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
        
    # Log access audit
    log = models.AccessLog(
        patient_id=patient.id,
        actor_id=current_doctor.user_id,
        action="Accessed Clinical Snapshot Dashboard",
        data_category="All Authorized Records"
    )
    db.add(log)
    db.commit()
    
    active_meds = [m for m in patient.medications if m.status == "active"] if (has_clinical_overview or has_medications) else []
    allergies = patient.allergies if has_clinical_overview else []
    diagnoses = patient.diagnoses if has_clinical_overview else []
    
    # Format lab trends
    trends = safety.get_lab_trend_statistics(patient.id, db) if (has_clinical_overview or has_labs) else []
    
    # Format timeline
    events = []
    if has_clinical_overview:
        events = db.query(models.MedicalEvent).filter(
            models.MedicalEvent.patient_id == patient.id
        ).order_by(models.MedicalEvent.event_date.desc()).limit(3).all()

    formatted_timeline = []
    icon_map = {"prescription": "💊", "lab": "🧪", "consultation": "🩺", "medication": "💊", "diagnosis": "📋", "general": "📄"}
    for ev in events:
        formatted_timeline.append({
            "id": ev.id,
            "date": ev.event_date,
            "type": ev.event_type,
            "title": ev.title,
            "description": ev.description,
            "source": ev.source or "Unknown",
            "status": "verified",
            "icon": icon_map.get(ev.event_type, "📄"),
        })
        
    # Format alerts
    alerts = db.query(models.SafetyAlert).filter(models.SafetyAlert.patient_id == patient.id).all() if has_clinical_overview else []
    formatted_alerts = []
    for a in alerts:
        formatted_alerts.append({
            "id": a.id,
            "priority": a.severity,
            "title": a.title,
            "description": a.description
        })
        
    return {
        "patient": {
            "id": patient.id,
            "name": patient.user.name,
            "email": patient.user.email,
            "bloodGroup": patient.blood_group,
            "dob": patient.date_of_birth
        },
        "conditions": [{"id": d.id, "name": d.condition, "status": d.status, "firstRecorded": d.diagnosed_date, "lastUpdated": d.diagnosed_date} for d in diagnoses],
        "medications": active_meds,
        "allergies": [{"id": a.id, "allergen": a.allergen, "reaction": a.reaction, "severity": a.severity} for a in allergies],
        "labs": trends,
        "alerts": formatted_alerts,
        "timeline": formatted_timeline
    }
