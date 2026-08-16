import os
import unittest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models, auth
from app.database import Base
from app.services import safety, ocr

class TestHealthTwinBackend(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = TestingSessionLocal()
        
        # Create Patient User
        self.patient_user = models.User(
            id="u-pat-test",
            name="Test Patient",
            email="patient@test.com",
            hashed_password=auth.get_password_hash("testpass"),
            role="PATIENT"
        )
        self.db.add(self.patient_user)
        
        # Create Doctor User
        self.doctor_user = models.User(
            id="u-doc-test",
            name="Test Doctor",
            email="doctor@test.com",
            hashed_password=auth.get_password_hash("testpass"),
            role="DOCTOR"
        )
        self.db.add(self.doctor_user)
        self.db.commit()
        
        # Create Profiles
        self.patient = models.Patient(
            id="p-test",
            user_id=self.patient_user.id,
            date_of_birth="1990-01-01",
            blood_group="O+",
            emergency_contact={"name": "Emergency Contact", "relation": "Spouse", "phone": "12345"}
        )
        self.db.add(self.patient)
        
        self.doctor = models.Doctor(
            id="d-test",
            user_id=self.doctor_user.id,
            specialization="General"
        )
        self.db.add(self.doctor)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_password_hashing(self):
        password = "secretpassword"
        hashed = auth.get_password_hash(password)
        self.assertTrue(auth.verify_password(password, hashed))
        self.assertFalse(auth.verify_password("wrongpassword", hashed))

    def test_consent_enforcement_and_expiration(self):
        # 1. Initially no consent
        has_consent = auth.check_doctor_consent(self.doctor_user.id, self.patient.id, "Medical Records", self.db)
        self.assertFalse(has_consent)
        
        # 2. Add active valid consent
        c1 = models.Consent(
            patient_id=self.patient.id,
            grantee_id=self.doctor_user.id,
            data_category="Medical Records",
            permission="Clinical Access",
            status="active",
            expires_at="2099-12-31"
        )
        self.db.add(c1)
        self.db.commit()
        self.assertTrue(auth.check_doctor_consent(self.doctor_user.id, self.patient.id, "Medical Records", self.db))
        
        # 3. Test expired consent
        c1.expires_at = "2020-01-01"
        self.db.commit()
        self.assertFalse(auth.check_doctor_consent(self.doctor_user.id, self.patient.id, "Medical Records", self.db))

    def test_consent_category_restriction(self):
        c2 = models.Consent(
            patient_id=self.patient.id,
            grantee_id=self.doctor_user.id,
            data_category="Lab Reports",
            permission="Read Only",
            status="active",
            expires_at="2099-12-31"
        )
        self.db.add(c2)
        self.db.commit()
        
        # Allowed for Lab Reports, blocked for Medications
        self.assertTrue(auth.check_doctor_consent(self.doctor_user.id, self.patient.id, "Lab Reports", self.db))
        self.assertFalse(auth.check_doctor_consent(self.doctor_user.id, self.patient.id, "Medications", self.db))

    def test_safety_duplicate_medication(self):
        rec = models.MedicalRecord(
            id="rec-1",
            patient_id=self.patient.id,
            record_type="PRESCRIPTION",
            title="Prescription",
            record_date="2026-08-16",
            processing_status="PROCESSED"
        )
        self.db.add(rec)
        self.db.commit()
        
        m1 = models.Medication(
            id="med-1",
            patient_id=self.patient.id,
            name="Metformin",
            dosage="500 mg",
            status="active",
            source_record_id=rec.id
        )
        m2 = models.Medication(
            id="med-2",
            patient_id=self.patient.id,
            name="Metformin",
            dosage="1000 mg",
            status="active",
            source_record_id=rec.id
        )
        self.db.add_all([m1, m2])
        self.db.commit()
        
        alerts = safety.analyze_safety_and_trends(self.patient.id, self.db)
        duplicate_alerts = [a for a in alerts if a["category"] == "DUPLICATE_MEDICATION"]
        self.assertEqual(len(duplicate_alerts), 1)
        self.assertIn("Therapeutic Duplication", duplicate_alerts[0]["title"])

    def test_safety_allergy_class_normalization(self):
        rec = models.MedicalRecord(
            id="rec-2",
            patient_id=self.patient.id,
            record_type="PRESCRIPTION",
            title="Prescription",
            record_date="2026-08-16",
            processing_status="PROCESSED"
        )
        self.db.add(rec)
        self.db.commit()
        
        # Add Penicillin allergy
        allergy = models.Allergy(
            id="allergy-1",
            patient_id=self.patient.id,
            allergen="Penicillin",
            reaction="Anaphylaxis",
            severity="high",
            source_record_id=rec.id
        )
        # Add Amoxicillin prescription (beta-lactam cross-reactivity)
        med = models.Medication(
            id="med-3",
            patient_id=self.patient.id,
            name="Amoxicillin-Clavulanate",
            dosage="625 mg",
            status="active",
            source_record_id=rec.id
        )
        self.db.add_all([allergy, med])
        self.db.commit()
        
        alerts = safety.analyze_safety_and_trends(self.patient.id, self.db)
        allergy_alerts = [a for a in alerts if a["category"] == "ALLERGY_CONFLICT"]
        self.assertEqual(len(allergy_alerts), 1)
        self.assertIn("Critical Allergy Conflict", allergy_alerts[0]["title"])

    def test_lab_trends_calculation(self):
        rec = models.MedicalRecord(
            id="rec-3",
            patient_id=self.patient.id,
            record_type="LAB_REPORT",
            title="Labs",
            record_date="2026-08-16",
            processing_status="PROCESSED"
        )
        self.db.add(rec)
        self.db.commit()
        
        l1 = models.LabResult(
            patient_id=self.patient.id, test_name="HbA1c", value="6.0", unit="%", test_date="2025-01-01", source_record_id=rec.id
        )
        l2 = models.LabResult(
            patient_id=self.patient.id, test_name="HbA1c", value="7.5", unit="%", test_date="2026-01-01", source_record_id=rec.id
        )
        self.db.add_all([l1, l2])
        self.db.commit()
        
        trends = safety.get_lab_trend_statistics(self.patient.id, self.db)
        hba1c_trend = next(t for t in trends if t["name"] == "HbA1c")
        self.assertEqual(hba1c_trend["trend"], "increasing")
        self.assertEqual(hba1c_trend["current"], "7.5")

if __name__ == "__main__":
    unittest.main()
