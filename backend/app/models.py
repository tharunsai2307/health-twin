import datetime
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(50), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), nullable=False) # PATIENT or DOCTOR
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    patient_profile = relationship("Patient", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String(50), primary_key=True, default=generate_uuid)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False, unique=True)
    date_of_birth = Column(String(30), nullable=True)
    blood_group = Column(String(10), nullable=True)
    gender = Column(String(20), nullable=True)  # 'male', 'female', or None
    emergency_contact = Column(JSON, nullable=True) # JSON containing: name, relation, phone
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="patient_profile")
    medical_records = relationship("MedicalRecord", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="patient", cascade="all, delete-orphan")
    allergies = relationship("Allergy", back_populates="patient", cascade="all, delete-orphan")
    diagnoses = relationship("Diagnosis", back_populates="patient", cascade="all, delete-orphan")
    lab_results = relationship("LabResult", back_populates="patient", cascade="all, delete-orphan")
    medical_events = relationship("MedicalEvent", back_populates="patient", cascade="all, delete-orphan")
    digital_twin = relationship("DigitalTwin", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    safety_alerts = relationship("SafetyAlert", back_populates="patient", cascade="all, delete-orphan")
    consents = relationship("Consent", foreign_keys="[Consent.patient_id]", back_populates="patient", cascade="all, delete-orphan")
    access_logs = relationship("AccessLog", back_populates="patient", cascade="all, delete-orphan")

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(String(50), primary_key=True, default=generate_uuid)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False, unique=True)
    specialization = Column(String(100), nullable=True)
    license_identifier = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="doctor_profile")

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    
    id = Column(String(50), primary_key=True, default=generate_uuid)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    record_type = Column(String(30), nullable=False) # PRESCRIPTION, LAB_REPORT, DIAGNOSIS, DISCHARGE_SUMMARY, IMAGING, CONSULTATION, OTHER
    title = Column(String(100), nullable=False)
    source = Column(String(100), nullable=True)
    record_date = Column(String(30), nullable=False)
    file_path = Column(String(200), nullable=True)
    processing_status = Column(String(20), nullable=False) # PROCESSING, REVIEW, PROCESSED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="medical_records")
    medications = relationship("Medication", back_populates="source_record")
    allergies = relationship("Allergy", back_populates="source_record")
    diagnoses = relationship("Diagnosis", back_populates="source_record")
    lab_results = relationship("LabResult", back_populates="source_record")
    medical_events = relationship("MedicalEvent", back_populates="source_record")

class Medication(Base):
    __tablename__ = "medications"
    
    id = Column(String(50), primary_key=True, default=generate_uuid)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    name = Column(String(100), nullable=False)
    generic_name = Column(String(100), nullable=True)
    dosage = Column(String(50), nullable=True)
    frequency = Column(String(50), nullable=True)
    start_date = Column(String(30), nullable=True)
    end_date = Column(String(30), nullable=True)
    status = Column(String(20), nullable=False) # active, stopped, changed
    source_record_id = Column(String(50), ForeignKey("medical_records.id"), nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="medications")
    source_record = relationship("MedicalRecord", back_populates="medications")

class Allergy(Base):
    __tablename__ = "allergies"
    
    id = Column(String(50), primary_key=True, default=generate_uuid)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    allergen = Column(String(100), nullable=False)
    reaction = Column(String(200), nullable=True)
    severity = Column(String(20), nullable=False) # high, medium, low
    source_record_id = Column(String(50), ForeignKey("medical_records.id"), nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="allergies")
    source_record = relationship("MedicalRecord", back_populates="allergies")

class Diagnosis(Base):
    __tablename__ = "diagnoses"
    
    id = Column(String(50), primary_key=True, default=generate_uuid)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    condition = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False) # active, monitoring, resolved
    diagnosed_date = Column(String(30), nullable=True)
    source_record_id = Column(String(50), ForeignKey("medical_records.id"), nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="diagnoses")
    source_record = relationship("MedicalRecord", back_populates="diagnoses")

class LabResult(Base):
    __tablename__ = "lab_results"
    
    id = Column(String(50), primary_key=True, default=generate_uuid)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    test_name = Column(String(100), nullable=False)
    value = Column(String(50), nullable=False)
    unit = Column(String(30), nullable=True)
    reference_range = Column(String(50), nullable=True)
    test_date = Column(String(30), nullable=False)
    source_record_id = Column(String(50), ForeignKey("medical_records.id"), nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="lab_results")
    source_record = relationship("MedicalRecord", back_populates="lab_results")

class MedicalEvent(Base):
    __tablename__ = "medical_events"
    
    id = Column(String(50), primary_key=True, default=generate_uuid)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    event_type = Column(String(30), nullable=False) # prescription, lab, consultation, medication, diagnosis, general
    title = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    source = Column(String(100), nullable=True)
    event_date = Column(String(30), nullable=False)
    source_record_id = Column(String(50), ForeignKey("medical_records.id"), nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="medical_events")
    source_record = relationship("MedicalRecord", back_populates="medical_events")

class DigitalTwin(Base):
    __tablename__ = "digital_twins"
    
    id = Column(String(50), primary_key=True, default=generate_uuid)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False, unique=True)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    summary = Column(JSON, nullable=True) # JSON summary representing current state
    
    # Relationships
    patient = relationship("Patient", back_populates="digital_twin")

class SafetyAlert(Base):
    __tablename__ = "safety_alerts"
    
    id = Column(String(50), primary_key=True, default=generate_uuid)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    severity = Column(String(20), nullable=False) # high, review, info
    category = Column(String(50), nullable=False) # MEDICATION_INTERACTION, ALLERGY_CONFLICT, DUPLICATE_MEDICATION, etc.
    title = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    status = Column(String(20), default="active") # active, resolved, dismissed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="safety_alerts")
    evidence = relationship("SafetyEvidence", back_populates="alert", cascade="all, delete-orphan")

class SafetyEvidence(Base):
    __tablename__ = "safety_evidence"
    
    id = Column(String(50), primary_key=True, default=generate_uuid)
    alert_id = Column(String(50), ForeignKey("safety_alerts.id"), nullable=False)
    source_record_id = Column(String(50), ForeignKey("medical_records.id"), nullable=True)
    reason = Column(String(300), nullable=False)
    
    # Relationships
    alert = relationship("SafetyAlert", back_populates="evidence")

class Consent(Base):
    __tablename__ = "consents"
    
    id = Column(String(50), primary_key=True, default=generate_uuid)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    grantee_id = Column(String(50), ForeignKey("users.id"), nullable=False) # user id of the grantee (doctor)
    data_category = Column(String(50), nullable=False) # Medical Records, Lab Reports, Medical History, All Authorized Records
    permission = Column(String(50), nullable=True) # e.g. Clinical Access, Read & Upload
    status = Column(String(20), nullable=False) # active, restricted, denied
    expires_at = Column(String(30), nullable=True) # or null for indefinite
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", foreign_keys=[patient_id], back_populates="consents")
    grantee = relationship("User", foreign_keys=[grantee_id])

class AccessLog(Base):
    __tablename__ = "access_logs"
    
    id = Column(String(50), primary_key=True, default=generate_uuid)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    actor_id = Column(String(50), ForeignKey("users.id"), nullable=False) # user id of who accessed
    action = Column(String(100), nullable=False)
    data_category = Column(String(100), nullable=True)
    record_id = Column(String(50), ForeignKey("medical_records.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="access_logs")
    actor = relationship("User", foreign_keys=[actor_id])
    record = relationship("MedicalRecord")
