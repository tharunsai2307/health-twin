from sqlalchemy.orm import Session
from .database import Base, engine, SessionLocal
from . import models, auth
from .services import safety

def seed_db():
    # Recreate all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding database...")
        
        # 1. Create Patient User
        patient_user = models.User(
            id="u-patient-001",
            name="Alex Johnson",
            email="alex.johnson@demo.healthtwin",
            hashed_password=auth.get_password_hash("demo1234"),
            role="PATIENT"
        )
        db.add(patient_user)
        
        # 2. Create Doctor User
        doctor_user = models.User(
            id="u-doctor-001",
            name="Dr. Arun Mehta",
            email="arun.mehta@demo.healthtwin",
            hashed_password=auth.get_password_hash("doctor1234"),
            role="DOCTOR"
        )
        db.add(doctor_user)
        
        # Create second doctor for demo purposes
        doctor_user2 = models.User(
            id="u-doctor-002",
            name="Dr. Priya Sharma",
            email="priya.sharma@demo.healthtwin",
            hashed_password=auth.get_password_hash("doctor1234"),
            role="DOCTOR"
        )
        db.add(doctor_user2)
        
        db.commit()
        
        # 3. Create Patient Profile
        patient = models.Patient(
            id="demo-001",
            user_id=patient_user.id,
            date_of_birth="1992-05-14",
            blood_group="O+",
            emergency_contact={
                "name": "Sarah Johnson",
                "relation": "Spouse",
                "phone": "+91 98765 43210"
            }
        )
        db.add(patient)
        
        # 4. Create Doctor Profile
        doctor = models.Doctor(
            id="doc-001",
            user_id=doctor_user.id,
            specialization="Endocrinology",
            license_identifier="MC-98765"
        )
        db.add(doctor)
        
        doctor2 = models.Doctor(
            id="doc-002",
            user_id=doctor_user2.id,
            specialization="Cardiology",
            license_identifier="MC-43210"
        )
        db.add(doctor2)
        
        db.commit()
        
        # 5. Create Medical Records
        r1 = models.MedicalRecord(
            id="r1",
            patient_id=patient.id,
            record_type="PRESCRIPTION",
            title="Prescription — Metformin Review",
            source="City Hospital",
            record_date="2026-08-12",
            processing_status="PROCESSED"
        )
        r2 = models.MedicalRecord(
            id="r2",
            patient_id=patient.id,
            record_type="LAB_REPORT",
            title="HbA1c Lab Report",
            source="Apollo Diagnostics",
            record_date="2026-08-05",
            processing_status="PROCESSED"
        )
        r3 = models.MedicalRecord(
            id="r3",
            patient_id=patient.id,
            record_type="IMAGING",
            title="Chest X-Ray Report",
            source="City Hospital",
            record_date="2026-06-18",
            processing_status="PROCESSED"
        )
        r4 = models.MedicalRecord(
            id="r4",
            patient_id=patient.id,
            record_type="DISCHARGE_SUMMARY",
            title="Discharge Summary",
            source="City Hospital",
            record_date="2026-07-01",
            processing_status="PROCESSED"
        )
        r5 = models.MedicalRecord(
            id="r5",
            patient_id=patient.id,
            record_type="OTHER",
            title="Annual Health Checkup",
            source="Apollo Diagnostics",
            record_date="2026-06-12",
            processing_status="PROCESSED"
        )
        r6 = models.MedicalRecord(
            id="r6",
            patient_id=patient.id,
            record_type="IMAGING",
            title="ECG Report",
            source="City Hospital",
            record_date="2026-05-22",
            processing_status="PROCESSING"
        )
        r7 = models.MedicalRecord(
            id="r7",
            patient_id=patient.id,
            record_type="PRESCRIPTION",
            title="Prescription — Lisinopril",
            source="Dr. Priya Sharma",
            record_date="2024-11-02",
            processing_status="PROCESSED"
        )
        r8 = models.MedicalRecord(
            id="r8",
            patient_id=patient.id,
            record_type="LAB_REPORT",
            title="Lipid Panel",
            source="Apollo Diagnostics",
            record_date="2026-06-12",
            processing_status="PROCESSED"
        )
        db.add_all([r1, r2, r3, r4, r5, r6, r7, r8])
        db.commit()
        
        # 6. Create Allergies
        a1 = models.Allergy(
            id="a1",
            patient_id=patient.id,
            allergen="Penicillin",
            reaction="Skin rash, hives, and potential anaphylaxis risk",
            severity="high",
            source_record_id=r5.id
        )
        a2 = models.Allergy(
            id="a2",
            patient_id=patient.id,
            allergen="Sulfa drugs",
            reaction="Nausea, dizziness, mild itching",
            severity="medium",
            source_record_id=r5.id
        )
        db.add_all([a1, a2])
        
        # 7. Create Conditions (Diagnoses)
        c1 = models.Diagnosis(
            id="c1",
            patient_id=patient.id,
            condition="Type 2 Diabetes",
            status="active",
            diagnosed_date="2023-04-12",
            source_record_id=r2.id
        )
        c2 = models.Diagnosis(
            id="c2",
            patient_id=patient.id,
            condition="Hypertension",
            status="active",
            diagnosed_date="2022-08-30",
            source_record_id=r7.id
        )
        c3 = models.Diagnosis(
            id="c3",
            patient_id=patient.id,
            condition="Hyperlipidemia",
            status="monitoring",
            diagnosed_date="2024-01-15",
            source_record_id=r8.id
        )
        db.add_all([c1, c2, c3])
        
        # 8. Create Medications
        m1 = models.Medication(
            id="m1",
            patient_id=patient.id,
            name="Metformin",
            generic_name="Metformin Hydrochloride",
            dosage="500 mg",
            frequency="Twice daily",
            start_date="2025-03-15",
            status="active",
            source_record_id=r1.id
        )
        m2 = models.Medication(
            id="m2",
            patient_id=patient.id,
            name="Lisinopril",
            generic_name="Lisinopril",
            dosage="10 mg",
            frequency="Once daily",
            start_date="2024-11-02",
            status="active",
            source_record_id=r7.id
        )
        m3 = models.Medication(
            id="m3",
            patient_id=patient.id,
            name="Atorvastatin",
            generic_name="Atorvastatin Calcium",
            dosage="20 mg",
            frequency="Once daily at bedtime",
            start_date="2025-01-20",
            status="active",
            source_record_id=r8.id
        )
        m4 = models.Medication(
            id="m4",
            patient_id=patient.id,
            name="Aspirin",
            generic_name="Acetylsalicylic Acid",
            dosage="81 mg",
            frequency="Once daily",
            start_date="2023-06-10",
            status="active",
            source_record_id=r7.id
        )
        m5 = models.Medication(
            id="m5",
            patient_id=patient.id,
            name="Omeprazole",
            generic_name="Omeprazole",
            dosage="20 mg",
            frequency="Once daily before breakfast",
            start_date="2025-07-01",
            status="active",
            source_record_id=r4.id
        )
        db.add_all([m1, m2, m3, m4, m5])
        db.commit()
        
        # Add stopped medication to Medication History
        mh1 = models.Medication(
            id="mh1",
            patient_id=patient.id,
            name="Ibuprofen",
            generic_name="Ibuprofen",
            dosage="400 mg",
            frequency="As needed for pain",
            start_date="2025-01-10",
            end_date="2025-02-14",
            status="stopped",
            source_record_id=r5.id
        )
        db.add(mh1)
        db.commit()
        
        # 9. Create Lab Results (supporting multiple points for trends)
        l1_1 = models.LabResult(
            id="l1_1", patient_id=patient.id, test_name="HbA1c", value="6.1", unit="%",
            reference_range="4.0 - 5.6", test_date="2024-03-12", source_record_id=r5.id
        )
        l1_2 = models.LabResult(
            id="l1_2", patient_id=patient.id, test_name="HbA1c", value="6.7", unit="%",
            reference_range="4.0 - 5.6", test_date="2025-01-15", source_record_id=r5.id
        )
        l1_3 = models.LabResult(
            id="l1_3", patient_id=patient.id, test_name="HbA1c", value="7.4", unit="%",
            reference_range="4.0 - 5.6", test_date="2026-08-05", source_record_id=r2.id
        )
        
        l2_1 = models.LabResult(
            id="l2_1", patient_id=patient.id, test_name="Blood Pressure", value="130/85", unit="mmHg",
            reference_range="< 120/80", test_date="2025-01-15", source_record_id=r5.id
        )
        l2_2 = models.LabResult(
            id="l2_2", patient_id=patient.id, test_name="Blood Pressure", value="126/80", unit="mmHg",
            reference_range="< 120/80", test_date="2025-04-15", source_record_id=r5.id
        )
        l2_3 = models.LabResult(
            id="l2_3", patient_id=patient.id, test_name="Blood Pressure", value="128/82", unit="mmHg",
            reference_range="< 120/80", test_date="2026-07-20", source_record_id=r7.id
        )
        
        l3_1 = models.LabResult(
            id="l3_1", patient_id=patient.id, test_name="Hemoglobin", value="14.2", unit="g/dL",
            reference_range="13.5 - 17.5", test_date="2024-03-12", source_record_id=r5.id
        )
        l3_2 = models.LabResult(
            id="l3_2", patient_id=patient.id, test_name="Hemoglobin", value="13.9", unit="g/dL",
            reference_range="13.5 - 17.5", test_date="2025-01-15", source_record_id=r5.id
        )
        l3_3 = models.LabResult(
            id="l3_3", patient_id=patient.id, test_name="Hemoglobin", value="13.8", unit="g/dL",
            reference_range="13.5 - 17.5", test_date="2026-08-05", source_record_id=r2.id
        )
        
        l4_1 = models.LabResult(
            id="l4_1", patient_id=patient.id, test_name="Cholesterol", value="245", unit="mg/dL",
            reference_range="< 200", test_date="2024-01-15", source_record_id=r5.id
        )
        l4_2 = models.LabResult(
            id="l4_2", patient_id=patient.id, test_name="Cholesterol", value="210", unit="mg/dL",
            reference_range="< 200", test_date="2025-08-15", source_record_id=r5.id
        )
        l4_3 = models.LabResult(
            id="l4_3", patient_id=patient.id, test_name="Cholesterol", value="198", unit="mg/dL",
            reference_range="< 200", test_date="2026-06-12", source_record_id=r8.id
        )
        
        l5_1 = models.LabResult(
            id="l5_1", patient_id=patient.id, test_name="Weight", value="80.2", unit="kg",
            reference_range=None, test_date="2025-01-15", source_record_id=r5.id
        )
        l5_2 = models.LabResult(
            id="l5_2", patient_id=patient.id, test_name="Weight", value="79.1", unit="kg",
            reference_range=None, test_date="2025-04-15", source_record_id=r5.id
        )
        l5_3 = models.LabResult(
            id="l5_3", patient_id=patient.id, test_name="Weight", value="78.5", unit="kg",
            reference_range=None, test_date="2026-07-20", source_record_id=r7.id
        )
        db.add_all([
            l1_1, l1_2, l1_3,
            l2_1, l2_2, l2_3,
            l3_1, l3_2, l3_3,
            l4_1, l4_2, l4_3,
            l5_1, l5_2, l5_3
        ])
        db.commit()
        
        # 10. Create Medical Events (Timeline)
        t1 = models.MedicalEvent(
            id="t1", patient_id=patient.id, event_type="prescription",
            title="Prescription Added", description="Metformin dosage review — continued at 500mg twice daily.",
            source="City Hospital", event_date="2026-08-12", source_record_id=r1.id
        )
        t2 = models.MedicalEvent(
            id="t2", patient_id=patient.id, event_type="lab",
            title="Lab Report", description="HbA1c result: 7.4% — flagged for trend review.",
            source="Apollo Diagnostics", event_date="2026-08-05", source_record_id=r2.id
        )
        t3 = models.MedicalEvent(
            id="t3", patient_id=patient.id, event_type="consultation",
            title="Doctor Consultation", description="Routine follow-up for hypertension management.",
            source="Dr. Arun Mehta", event_date="2026-07-20", source_record_id=r7.id
        )
        t4 = models.MedicalEvent(
            id="t4", patient_id=patient.id, event_type="medication",
            title="Medication Started", description="Metformin 500mg prescribed for diabetes management.",
            source="Dr. Arun Mehta", event_date="2025-03-15", source_record_id=r1.id
        )
        t5 = models.MedicalEvent(
            id="t5", patient_id=patient.id, event_type="diagnosis",
            title="Diagnosis Recorded", description="Hyperlipidemia identified during annual health screening.",
            source="City Hospital", event_date="2024-01-15", source_record_id=r8.id
        )
        t6 = models.MedicalEvent(
            id="t6", patient_id=patient.id, event_type="diagnosis",
            title="Diagnosis Recorded", description="Type 2 Diabetes Mellitus confirmed via fasting glucose test.",
            source="Apollo Diagnostics", event_date="2023-04-12", source_record_id=r2.id
        )
        db.add_all([t1, t2, t3, t4, t5, t6])
        db.commit()
        
        # 11. Create Consents
        cs1 = models.Consent(
            id="cs1", patient_id=patient.id, grantee_id=doctor_user.id,
            data_category="Medical Records", permission="Clinical Access",
            expires_at="2027-08-12", status="active"
        )
        cs2 = models.Consent(
            id="cs2", patient_id=patient.id, grantee_id=doctor_user.id,
            data_category="Lab Reports", permission="Read & Upload",
            expires_at="2026-12-31", status="active"
        )
        cs3 = models.Consent(
            id="cs3", patient_id=patient.id, grantee_id=doctor_user2.id,
            data_category="Medical History", permission="Emergency Only",
            expires_at=None, status="restricted"
        )
        db.add_all([cs1, cs2, cs3])
        db.commit()
        
        # 12. Create Access Logs
        al1 = models.AccessLog(
            id="al1", patient_id=patient.id, actor_id=doctor_user.id,
            action="Viewed Medication History", data_category="Medications, Allergies",
            record_id=r1.id
        )
        al2 = models.AccessLog(
            id="al2", patient_id=patient.id, actor_id=doctor_user.id,
            action="Viewed Lab Reports", data_category="Lab Reports (3 documents)",
            record_id=r2.id
        )
        al3 = models.AccessLog(
            id="al3", patient_id=patient.id, actor_id=patient_user.id,
            action="Updated Consent Settings", data_category="Consent & Sharing"
        )
        db.add_all([al1, al2, al3])
        db.commit()
        
        # 13. Create Digital Twin derived representation
        twin_summary = {
            "conditions": ["Type 2 Diabetes", "Hypertension", "Hyperlipidemia"],
            "medications": ["Metformin", "Lisinopril", "Atorvastatin", "Aspirin", "Omeprazole"],
            "allergies": ["Penicillin", "Sulfa drugs"],
            "recent_procedure": "Annual health checkup — Jun 2026"
        }
        twin = models.DigitalTwin(
            id="dt-001",
            patient_id=patient.id,
            summary=twin_summary
        )
        db.add(twin)
        db.commit()
        
        # 14. Run Safety Engine to generate Safety Alerts & Evidence
        safety_alerts = safety.analyze_safety_and_trends(patient.id, db)
        for alert_data in safety_alerts:
            alert = models.SafetyAlert(
                patient_id=patient.id,
                severity=alert_data["severity"],
                category=alert_data["category"],
                title=alert_data["title"],
                description=alert_data["description"]
            )
            db.add(alert)
            db.commit()
            
            # Add evidence
            for ev in alert_data["evidence"]:
                evidence = models.SafetyEvidence(
                    alert_id=alert.id,
                    source_record_id=ev["source_record_id"],
                    reason=ev["reason"]
                )
                db.add(evidence)
            db.commit()
            
        print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
