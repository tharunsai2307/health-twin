import os
import unittest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models, auth
from app.database import Base
from app.services import safety, ocr, digital_twin

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

    def test_digital_twin_assembly_and_provenance(self):
        # Add a medication, allergy, diagnosis, and lab result
        rec = models.MedicalRecord(
            id="rec-twin-test",
            patient_id=self.patient.id,
            record_type="PRESCRIPTION",
            title="Twin Test Prescription",
            record_date="2026-08-16",
            processing_status="PROCESSED"
        )
        self.db.add(rec)
        self.db.commit()

        m1 = models.Medication(
            id="med-twin-1",
            patient_id=self.patient.id,
            name="Metformin",
            dosage="500 mg",
            frequency="Daily",
            status="active",
            source_record_id=rec.id
        )
        a1 = models.Allergy(
            id="all-twin-1",
            patient_id=self.patient.id,
            allergen="Penicillin",
            reaction="Rash",
            severity="high",
            source_record_id=rec.id
        )
        d1 = models.Diagnosis(
            id="dia-twin-1",
            patient_id=self.patient.id,
            condition="Type 2 Diabetes",
            status="active",
            diagnosed_date="2026-08-16",
            source_record_id=rec.id
        )
        l1 = models.LabResult(
            id="lab-twin-1",
            patient_id=self.patient.id,
            test_name="Heart Rate",
            value="72",
            unit="BPM",
            test_date="2026-08-16",
            source_record_id=rec.id
        )
        self.db.add_all([m1, a1, d1, l1])
        self.db.commit()

        # Assemble context
        ctx = digital_twin.assemble_digital_twin_context(self.patient, self.db)

        # 1. Patient Profile Info
        self.assertEqual(ctx["patient"]["name"], "Test Patient")
        self.assertEqual(ctx["patient"]["blood_group"], "O+")

        # 2. Vitals extraction from lab results
        self.assertEqual(len(ctx["vitals"]), 1)
        self.assertEqual(ctx["vitals"][0]["key"], "heart_rate")
        self.assertEqual(ctx["vitals"][0]["value"], "72")
        self.assertEqual(ctx["vitals"][0]["source_title"], "Twin Test Prescription")

        # 3. Medications integration
        self.assertEqual(len(ctx["medications"]), 1)
        self.assertEqual(ctx["medications"][0]["name"], "Metformin")
        self.assertEqual(ctx["medications"][0]["source_title"], "Twin Test Prescription")

        # 4. Allergies integration
        self.assertEqual(len(ctx["allergies"]), 1)
        self.assertEqual(ctx["allergies"][0]["allergen"], "Penicillin")

        # 5. Conditions integration
        self.assertEqual(len(ctx["conditions"]), 1)
        self.assertEqual(ctx["conditions"][0]["condition"], "Type 2 Diabetes")

        # 6. Organ data mapping for Heart
        heart_data = ctx["organs"]["heart"]
        self.assertEqual(len(heart_data["metrics"]), 1)
        self.assertEqual(heart_data["metrics"][0]["test_name"], "Heart Rate")
        self.assertEqual(heart_data["metrics"][0]["source_title"], "Twin Test Prescription")

        # 7. Organ data mapping for Brain (should be empty for our Heart Rate test)
        brain_data = ctx["organs"]["brain"]
        self.assertEqual(len(brain_data["metrics"]), 0)

    def test_doctor_access_with_consent(self):
        # 1. Doctor has no consent originally
        has_consent = auth.check_doctor_consent(self.doctor_user.id, self.patient.id, "Medical Records", self.db)
        self.assertFalse(has_consent)

        # 2. Add active consent
        c = models.Consent(
            patient_id=self.patient.id,
            grantee_id=self.doctor_user.id,
            data_category="Medical Records",
            permission="Clinical Access",
            status="active",
            expires_at="2099-12-31"
        )
        self.db.add(c)
        self.db.commit()

        # Doctor should be authorized now
        self.assertTrue(auth.check_doctor_consent(self.doctor_user.id, self.patient.id, "Medical Records", self.db))

    def test_admin_role_authorization_and_stats(self):
        # 1. Create an admin user
        admin = models.User(
            id="u-admin-test-01",
            name="Test Admin",
            email="admin.test@demo.healthtwin",
            hashed_password=auth.get_password_hash("admin1234"),
            role="ADMIN"
        )
        self.db.add(admin)
        self.db.commit()

        # 2. Verify get_current_admin dependency logic
        # Should raise 403 on standard patients/doctors
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as ctx:
            auth.get_current_admin(self.patient_user)
        self.assertEqual(ctx.exception.status_code, 403)

        # Should pass on administrators
        res_admin = auth.get_current_admin(admin)
        self.assertEqual(res_admin.role, "ADMIN")

if __name__ == "__main__":
    unittest.main()
