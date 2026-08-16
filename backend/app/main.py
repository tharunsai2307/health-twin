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
from .services.digital_twin import assemble_digital_twin_context

# Ensure upload storage folder exists
UPLOAD_DIR = "./storage"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Safe migration: add gender column to patients table if missing
from sqlalchemy import text, inspect as sa_inspect
def _run_migrations():
    """Add new columns safely to existing SQLite DB without dropping data."""
    insp = sa_inspect(engine)
    if "patients" in insp.get_table_names():
        existing = [c["name"] for c in insp.get_columns("patients")]
        with engine.connect() as conn:
            if "gender" not in existing:
                conn.execute(text("ALTER TABLE patients ADD COLUMN gender VARCHAR(20)"))
                conn.commit()

_run_migrations()

app = FastAPI(title="HealthTwin Backend", version="1.0.0")

# CORS middleware for frontend connection
# Load CORS from env
cors_origins_str = os.getenv("CORS_ORIGINS", "*")
if cors_origins_str == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in cors_origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# --- Health Check ---
@app.get("/health")
def health_check():
    return {"status": "healthy"}

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

class PatientProfileUpdate(BaseModel):
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = None
    gender: Optional[str] = None
    emergency_contact: Optional[dict] = None

class LoginRequest(BaseModel):
    email: str
    password: str


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


# --- Patient: Profile Endpoints ---

def _compute_age(dob_str: Optional[str]) -> Optional[int]:
    if not dob_str:
        return None
    try:
        dob = datetime.datetime.strptime(dob_str, "%Y-%m-%d").date()
        today = datetime.date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except Exception:
        return None

@app.get("/patients/me/profile")
def get_patient_profile(
    current_patient: models.Patient = Depends(auth.get_current_patient),
    db: Session = Depends(get_db)
):
    return {
        "id": current_patient.id,
        "name": current_patient.user.name,
        "email": current_patient.user.email,
        "date_of_birth": current_patient.date_of_birth,
        "age": _compute_age(current_patient.date_of_birth),
        "blood_group": current_patient.blood_group,
        "gender": current_patient.gender,
        "emergency_contact": current_patient.emergency_contact,
    }

@app.put("/patients/me/profile")
def update_patient_profile(
    profile: PatientProfileUpdate,
    current_patient: models.Patient = Depends(auth.get_current_patient),
    db: Session = Depends(get_db)
):
    if profile.date_of_birth is not None:
        current_patient.date_of_birth = profile.date_of_birth
    if profile.blood_group is not None:
        current_patient.blood_group = profile.blood_group
    if profile.gender is not None:
        current_patient.gender = profile.gender
    if profile.emergency_contact is not None:
        current_patient.emergency_contact = profile.emergency_contact
    db.commit()
    log = models.AccessLog(
        patient_id=current_patient.id,
        actor_id=current_patient.user_id,
        action="Updated Profile",
        data_category="Profile"
    )
    db.add(log)
    db.commit()
    return {"status": "success"}


# --- Patient: Health Vault & Records Endpoints ---

@app.get("/patients/me/records")
def get_patient_records(current_patient: models.Patient = Depends(auth.get_current_patient), db: Session = Depends(get_db)):
    records = db.query(models.MedicalRecord).filter(
        models.MedicalRecord.patient_id == current_patient.id
    ).order_by(models.MedicalRecord.record_date.desc()).all()
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
    # Validate MIME type and extension
    allowed_exts = {".pdf", ".png", ".jpg", ".jpeg"}
    allowed_mimes = {"application/pdf", "image/png", "image/jpeg"}
    
    import mimetypes
    _, ext = os.path.splitext(file.filename.lower())
    mime_type = file.content_type
    
    if ext not in allowed_exts or mime_type not in allowed_mimes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type or format."
        )
        
    # Validate size (max 10MB)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 10 * 1024 * 1024 or file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="File size must be between 1 byte and 10MB."
        )

    # Prevent path traversal by generating secure UUID filename and omitting user input
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
    return assemble_digital_twin_context(current_patient, db)

@app.get("/doctor/patients/{patient_id}/digital-twin")
def get_doctor_patient_digital_twin(
    patient_id: str,
    current_doctor: models.Doctor = Depends(auth.get_current_doctor),
    db: Session = Depends(get_db)
):
    has_consent = auth.check_doctor_consent(current_doctor.user_id, patient_id, "Medical Records", db)
    if not has_consent:
        raise HTTPException(status_code=403, detail="No active consent to access this patient's records.")
        
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Log access audit
    log = models.AccessLog(
        patient_id=patient_id,
        actor_id=current_doctor.user_id,
        action="Doctor viewed patient Digital Twin",
        data_category="Medical Records"
    )
    db.add(log)
    db.commit()
    
    return assemble_digital_twin_context(patient, db)


# --- Patient: Digital Twin Organ-Level Endpoint ---

_ORGAN_KEYWORDS: Dict[str, Dict[str, List[str]]] = {
    "heart": {
        "labs": ["heart rate", "blood pressure", "ecg", "cardiac", "troponin", "pulse",
                 "cholesterol", "ldl", "hdl", "triglycerides", "bpm"],
        "records": ["ecg", "cardiac", "heart", "cardiology", "echo", "electrocardiogram",
                    "echocardiogram", "tmt", "stress test"],
        "events": ["cardiac", "heart", "cardiovascular", "coronary", "ecg"]
    },
    "brain": {
        "labs": ["eeg", "brain", "neuro", "cognitive", "moca", "mmse", "cortisol"],
        "records": ["brain", "mri", "ct scan", "neuro", "cognitive", "neurological",
                    "electroencephalogram", "cranial"],
        "events": ["neurological", "brain", "neuro", "cognitive", "seizure", "migraine"]
    },
    "lungs": {
        "labs": ["oxygen", "spo2", "o2 saturation", "respiratory rate", "spirometry",
                 "fev", "fvc", "co2", "pco2", "po2", "peak flow"],
        "records": ["lung", "chest", "pulmonary", "respiratory", "x-ray", "xray",
                    "ct chest", "spirometry", "bronchoscopy"],
        "events": ["respiratory", "lung", "pulmonary", "breathing", "asthma", "copd",
                   "pneumonia", "chest"]
    },
    "kidneys": {
        "labs": ["creatinine", "bun", "blood urea nitrogen", "egfr", "gfr", "urea",
                 "uric acid", "urine", "microalbumin", "kidney", "renal", "potassium",
                 "sodium", "phosphorus"],
        "records": ["kidney", "renal", "nephrology", "urine", "ultrasound kidney",
                    "dialysis", "cystoscopy"],
        "events": ["renal", "kidney", "dialysis", "uti", "urinary"]
    },
    "liver": {
        "labs": ["alt", "ast", "bilirubin", "liver", "sgpt", "sgot",
                 "alkaline phosphatase", "alp", "ggt", "albumin", "total protein",
                 "prothrombin", "inr"],
        "records": ["liver", "hepatic", "hepatology", "bilirubin", "fibroscan",
                    "ultrasound abdomen", "endoscopy"],
        "events": ["liver", "hepatic", "hepatitis", "jaundice", "cirrhosis", "fatty liver"]
    }
}

def _build_organ_data(patient: models.Patient, organ: str, db: Session) -> Dict[str, Any]:
    keywords = _ORGAN_KEYWORDS.get(organ, {})
    lab_kws = keywords.get("labs", [])
    rec_kws = keywords.get("records", [])
    ev_kws = keywords.get("events", [])

    # Relevant lab results
    metrics = []
    for lab in patient.lab_results:
        t = (lab.test_name or "").lower()
        if any(kw in t for kw in lab_kws):
            source_title = None
            if lab.source_record_id:
                src = db.query(models.MedicalRecord).filter(
                    models.MedicalRecord.id == lab.source_record_id
                ).first()
                if src:
                    source_title = src.title
            metrics.append({
                "id": lab.id,
                "test_name": lab.test_name,
                "value": lab.value,
                "unit": lab.unit,
                "reference_range": lab.reference_range,
                "test_date": lab.test_date,
                "source_record_id": lab.source_record_id,
                "source_title": source_title
            })

    # Relevant medical records
    records = []
    for rec in patient.medical_records:
        title_l = (rec.title or "").lower()
        source_l = (rec.source or "").lower()
        if any(kw in title_l or kw in source_l for kw in rec_kws):
            records.append({
                "id": rec.id,
                "title": rec.title,
                "record_type": rec.record_type,
                "source": rec.source,
                "record_date": rec.record_date,
                "processing_status": rec.processing_status
            })

    # Relevant events
    events = []
    for ev in patient.medical_events:
        title_l = (ev.title or "").lower()
        desc_l = (ev.description or "").lower()
        if any(kw in title_l or kw in desc_l for kw in ev_kws):
            events.append({
                "id": ev.id,
                "event_type": ev.event_type,
                "title": ev.title,
                "description": ev.description,
                "event_date": ev.event_date,
                "source": ev.source
            })

    return {
        "organ": organ,
        "metrics": sorted(metrics, key=lambda x: x["test_date"], reverse=True),
        "records": sorted(records, key=lambda x: x["record_date"], reverse=True),
        "events": sorted(events, key=lambda x: x["event_date"], reverse=True),
        "last_updated": datetime.date.today().isoformat()
    }

@app.get("/patients/me/digital-twin/organ/{organ}")
def get_patient_organ_data(
    organ: str,
    current_patient: models.Patient = Depends(auth.get_current_patient),
    db: Session = Depends(get_db)
):
    if organ not in _ORGAN_KEYWORDS:
        raise HTTPException(status_code=404, detail=f"Unknown organ '{organ}'. Valid: {list(_ORGAN_KEYWORDS.keys())}")

    log = models.AccessLog(
        patient_id=current_patient.id,
        actor_id=current_patient.user_id,
        action=f"Viewed Digital Twin Organ: {organ.capitalize()}",
        data_category="Medical Records"
    )
    db.add(log)
    db.commit()

    return _build_organ_data(current_patient, organ, db)

@app.get("/doctor/patients/{patient_id}/digital-twin/organ/{organ}")
def get_doctor_organ_data(
    patient_id: str,
    organ: str,
    current_doctor: models.Doctor = Depends(auth.get_current_doctor),
    db: Session = Depends(get_db)
):
    if organ not in _ORGAN_KEYWORDS:
        raise HTTPException(status_code=404, detail=f"Unknown organ '{organ}'.")

    consents = db.query(models.Consent).filter(
        models.Consent.patient_id == patient_id,
        models.Consent.grantee_id == current_doctor.user_id,
        models.Consent.status == "active"
    ).all()
    
    from datetime import datetime
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    active_consents = [c for c in consents if not (c.expires_at and c.expires_at not in ["—", "None", ""] and c.expires_at < today_str)]
    
    if not active_consents:
        raise HTTPException(status_code=403, detail="No active consent to access this patient's records.")

    permitted_categories = [c.data_category.lower() for c in active_consents]
    has_all = any(cat in ["all authorized records", "medical records", "clinical overview", "medical history"] for cat in permitted_categories)
    has_labs = has_all or "lab reports" in permitted_categories
    has_meds = has_all or "medications" in permitted_categories

    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    log = models.AccessLog(
        patient_id=patient_id,
        actor_id=current_doctor.user_id,
        action=f"Doctor viewed Digital Twin Organ: {organ.capitalize()}",
        data_category="Medical Records"
    )
    db.add(log)
    db.commit()

    organ_data = _build_organ_data(patient, organ, db)
    
    # Filter clinical values based on authorized categories
    if not has_labs:
        organ_data["metrics"] = []
    if not has_meds and not has_all:
        organ_data["records"] = []
        organ_data["events"] = [e for e in organ_data["events"] if e["event_type"] == "lab"]
        
    return organ_data


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
    consents = db.query(models.Consent).filter(
        models.Consent.patient_id == patient_id,
        models.Consent.grantee_id == current_doctor.user_id,
        models.Consent.status == "active"
    ).all()
    
    from datetime import datetime
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    active_consents = []
    for c in consents:
        if c.expires_at and c.expires_at not in ["—", "None", ""]:
            if c.expires_at < today_str:
                continue
        active_consents.append(c)
        
    if not active_consents:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have active consent to access this patient's records."
        )
        
    permitted_categories = [c.data_category.lower() for c in active_consents]
    has_all = any(cat in ["all authorized records", "medical records", "clinical overview", "medical history"] for cat in permitted_categories)
    has_labs = has_all or "lab reports" in permitted_categories
    has_meds = has_all or "medications" in permitted_categories
    
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
        
    # Log access audit
    log = models.AccessLog(
        patient_id=patient.id,
        actor_id=current_doctor.user_id,
        action="Accessed Clinical Snapshot Dashboard",
        data_category="Clinical Overview"
    )
    db.add(log)
    db.commit()
    
    active_meds = []
    allergies = []
    diagnoses = []
    trends = []
    formatted_timeline = []
    formatted_alerts = []
    
    if has_meds:
        active_meds = [m for m in patient.medications if m.status == "active"]
        allergies = patient.allergies
        diagnoses = patient.diagnoses
        
        # Format alerts
        alerts = db.query(models.SafetyAlert).filter(models.SafetyAlert.patient_id == patient.id).all()
        for a in alerts:
            formatted_alerts.append({
                "id": a.id,
                "priority": a.severity,
                "title": a.title,
                "description": a.description
            })
            
    if has_labs:
        trends = safety.get_lab_trend_statistics(patient.id, db)
        
    events_query = db.query(models.MedicalEvent).filter(models.MedicalEvent.patient_id == patient.id)
    if not has_all:
        allowed_types = []
        if has_labs:
            allowed_types.append("lab")
        if has_meds:
            allowed_types.extend(["prescription", "medication", "diagnosis"])
        events_query = events_query.filter(models.MedicalEvent.event_type.in_(allowed_types))
        
    events = events_query.order_by(models.MedicalEvent.event_date.desc()).limit(5).all()
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
        "timeline": formatted_timeline,
        "authorized_categories": permitted_categories
    }



# --- Admin Endpoints ---

from app.auth import get_current_admin

class DoctorCreate(BaseModel):
    name: str
    email: str
    password: str
    specialization: Optional[str] = None
    license_identifier: Optional[str] = None

@app.get("/admin/stats")
def get_admin_stats(current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_patients = db.query(models.Patient).count()
    total_doctors = db.query(models.Doctor).count()
    active_users = db.query(models.User).count() # All registered users in system
    
    # Consents
    active_consents = db.query(models.Consent).filter(models.Consent.status == "active").count()
    revoked_consents = db.query(models.Consent).filter(models.Consent.status == "revoked").count()
    expired_consents = db.query(models.Consent).filter(models.Consent.status == "expired").count()
    
    # Documents
    docs_processed = db.query(models.MedicalRecord).filter(models.MedicalRecord.processing_status == "PROCESSED").count()
    docs_pending = db.query(models.MedicalRecord).filter(models.MedicalRecord.processing_status != "PROCESSED").count()
    
    # Safety Alerts
    safety_alerts = db.query(models.SafetyAlert).filter(models.SafetyAlert.status == "active").count()
    
    # Access events
    recent_access = db.query(models.AccessLog).count()
    
    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "active_users": active_users,
        "active_consents": active_consents,
        "revoked_consents": revoked_consents,
        "expired_consents": expired_consents,
        "documents_processed": docs_processed,
        "pending_reviews": docs_pending,
        "safety_alerts": safety_alerts,
        "recent_access_events": recent_access
    }

@app.get("/admin/users")
def get_admin_users(current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    user_list = []
    for u in users:
        patient_id = u.patient_profile.id if u.patient_profile else None
        doctor_id = u.doctor_profile.id if u.doctor_profile else None
        
        user_list.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at.isoformat(),
            "patient_id": patient_id,
            "doctor_id": doctor_id
        })
    return user_list

@app.post("/admin/doctors")
def create_doctor(doc_data: DoctorCreate, current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(models.User).filter(models.User.email == doc_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
        
    # Create user record
    new_user = models.User(
        name=doc_data.name,
        email=doc_data.email,
        hashed_password=auth.get_password_hash(doc_data.password),
        role="DOCTOR"
    )
    db.add(new_user)
    db.commit()
    
    # Create doctor profile
    new_doc = models.Doctor(
        user_id=new_user.id,
        specialization=doc_data.specialization,
        license_identifier=doc_data.license_identifier
    )
    db.add(new_doc)
    db.commit()
    
    return {"status": "success", "doctor_id": new_doc.id, "user_id": new_user.id}

@app.get("/admin/consents")
def get_admin_consents(current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    consents = db.query(models.Consent).all()
    consent_list = []
    for c in consents:
        patient_name = c.patient.user.name if c.patient else "Unknown"
        doctor_name = c.grantee.name if c.grantee else "Unknown"
        
        consent_list.append({
            "id": c.id,
            "patient_id": c.patient_id,
            "patient_name": patient_name,
            "doctor_id": c.grantee_id,
            "doctor_name": doctor_name,
            "data_category": c.data_category,
            "permission": c.permission,
            "status": c.status,
            "expires_at": c.expires_at,
            "created_at": c.created_at.isoformat()
        })
    return consent_list

@app.get("/admin/audit-logs")
def get_admin_audit_logs(current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    logs = db.query(models.AccessLog).order_by(models.AccessLog.timestamp.desc()).all()
    log_list = []
    for l in logs:
        actor_name = l.actor.name if l.actor else "Unknown"
        actor_role = l.actor.role if l.actor else "Unknown"
        patient_name = l.patient.user.name if l.patient else "Unknown"
        
        log_list.append({
            "id": l.id,
            "timestamp": l.timestamp.isoformat(),
            "actor_id": l.actor_id,
            "actor_name": actor_name,
            "actor_role": actor_role,
            "patient_id": l.patient_id,
            "patient_name": patient_name,
            "action": l.action,
            "data_category": l.data_category,
            "record_id": l.record_id
        })
    return log_list

@app.get("/admin/documents")
def get_admin_documents(current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    records = db.query(models.MedicalRecord).order_by(models.MedicalRecord.created_at.desc()).all()
    doc_list = []
    for r in records:
        patient_name = r.patient.user.name if r.patient else "Unknown"
        doc_list.append({
            "id": r.id,
            "title": r.title,
            "record_type": r.record_type,
            "source": r.source,
            "record_date": r.record_date,
            "processing_status": r.processing_status,
            "patient_name": patient_name,
            "created_at": r.created_at.isoformat()
        })
    return doc_list
