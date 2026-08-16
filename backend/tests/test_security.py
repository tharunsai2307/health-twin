import unittest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app, get_db
from app.database import Base, engine, SessionLocal
from app import models, auth
import os
import io

class TestHealthTwinSecurity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    def setUp(self):
        self.db = SessionLocal()
        # Clean up database for isolated tests
        for table in reversed(Base.metadata.sorted_tables):
            self.db.execute(table.delete())
        self.db.commit()

        # Seed minimal required users
        self.patient_user = models.User(id="u-pat-sec", name="Sec Patient", email="sec.pat@test.com", hashed_password=auth.get_password_hash("pass"), role="PATIENT")
        self.patient = models.Patient(id="pat-sec", user_id="u-pat-sec", blood_group="O+")
        
        self.patient2_user = models.User(id="u-pat2-sec", name="Sec Patient 2", email="sec.pat2@test.com", hashed_password=auth.get_password_hash("pass"), role="PATIENT")
        self.patient2 = models.Patient(id="pat2-sec", user_id="u-pat2-sec", blood_group="A+")
        
        self.doc_user = models.User(id="u-doc-sec", name="Sec Doc", email="sec.doc@test.com", hashed_password=auth.get_password_hash("pass"), role="DOCTOR")
        self.doctor = models.Doctor(id="doc-sec", user_id="u-doc-sec", specialization="Cardio")
        
        self.admin_user = models.User(id="u-adm-sec", name="Sec Admin", email="sec.admin@test.com", hashed_password=auth.get_password_hash("pass"), role="ADMIN")
        
        self.db.add_all([self.patient_user, self.patient2_user, self.doc_user, self.admin_user])
        self.db.add_all([self.patient, self.patient2, self.doctor])
        self.db.commit()

        self.pat_token = auth.create_access_token({"sub": self.patient_user.email})
        self.pat2_token = auth.create_access_token({"sub": self.patient2_user.email})
        self.doc_token = auth.create_access_token({"sub": self.doc_user.email})
        self.adm_token = auth.create_access_token({"sub": self.admin_user.email})

    def tearDown(self):
        self.db.close()

    # 1-3. Login tests
    def test_01_patient_login(self):
        res = self.client.post("/auth/login", json={"email": "sec.pat@test.com", "password": "pass"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["role"], "PATIENT")

    def test_02_doctor_login(self):
        res = self.client.post("/auth/login", json={"email": "sec.doc@test.com", "password": "pass"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["role"], "DOCTOR")

    def test_03_admin_login(self):
        res = self.client.post("/auth/login", json={"email": "sec.admin@test.com", "password": "pass"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["role"], "ADMIN")

    # 4. Invalid credentials
    def test_04_invalid_credentials(self):
        res = self.client.post("/auth/login", json={"email": "sec.pat@test.com", "password": "wrong"})
        self.assertEqual(res.status_code, 401)

    # 5. Invalid JWT
    def test_05_invalid_jwt(self):
        res = self.client.get("/patients/me/profile", headers={"Authorization": "Bearer invalid.token.here"})
        self.assertEqual(res.status_code, 401)

    # 6. Patient isolation
    def test_06_patient_isolation(self):
        # Patient 1 requesting their profile should return pat1's ID
        res = self.client.get("/patients/me/profile", headers={"Authorization": f"Bearer {self.pat_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["id"], self.patient.id)

    # 7-9. Admin endpoint isolation
    def test_07_patient_accessing_admin(self):
        res = self.client.get("/admin/stats", headers={"Authorization": f"Bearer {self.pat_token}"})
        self.assertEqual(res.status_code, 403)

    def test_08_doctor_accessing_admin(self):
        res = self.client.get("/admin/stats", headers={"Authorization": f"Bearer {self.doc_token}"})
        self.assertEqual(res.status_code, 403)

    def test_09_admin_accessing_admin(self):
        res = self.client.get("/admin/stats", headers={"Authorization": f"Bearer {self.adm_token}"})
        self.assertEqual(res.status_code, 200)

    # 10. Doctor with full consent
    def test_10_doctor_full_consent(self):
        c = models.Consent(patient_id=self.patient.id, grantee_id=self.doc_user.id, data_category="Medical Records", status="active")
        self.db.add(c)
        self.db.commit()
        res = self.client.get(f"/doctor/patients/{self.patient.id}", headers={"Authorization": f"Bearer {self.doc_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("medical records", res.json()["authorized_categories"])

    # 11. Doctor with partial consent (Labs only)
    def test_11_doctor_partial_consent(self):
        c = models.Consent(patient_id=self.patient.id, grantee_id=self.doc_user.id, data_category="Lab Reports", status="active")
        self.db.add(c)
        self.db.commit()
        res = self.client.get(f"/doctor/patients/{self.patient.id}", headers={"Authorization": f"Bearer {self.doc_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertNotIn("medical records", res.json()["authorized_categories"])
        self.assertEqual(res.json()["medications"], []) # meds should be empty

    # 12. Doctor with no consent
    def test_12_doctor_no_consent(self):
        res = self.client.get(f"/doctor/patients/{self.patient.id}", headers={"Authorization": f"Bearer {self.doc_token}"})
        self.assertEqual(res.status_code, 403)

    # 13. Expired consent
    def test_13_doctor_expired_consent(self):
        c = models.Consent(patient_id=self.patient.id, grantee_id=self.doc_user.id, data_category="Medical Records", status="active", expires_at="2000-01-01")
        self.db.add(c)
        self.db.commit()
        res = self.client.get(f"/doctor/patients/{self.patient.id}", headers={"Authorization": f"Bearer {self.doc_token}"})
        self.assertEqual(res.status_code, 403)

    # 14. Revoked consent
    def test_14_doctor_revoked_consent(self):
        c = models.Consent(patient_id=self.patient.id, grantee_id=self.doc_user.id, data_category="Medical Records", status="revoked")
        self.db.add(c)
        self.db.commit()
        res = self.client.get(f"/doctor/patients/{self.patient.id}", headers={"Authorization": f"Bearer {self.doc_token}"})
        self.assertEqual(res.status_code, 403)

    # 15-18. Restricted category testing
    def test_15_restricted_medication_access(self):
        c = models.Consent(patient_id=self.patient.id, grantee_id=self.doc_user.id, data_category="Lab Reports", status="active")
        m = models.Medication(patient_id=self.patient.id, name="Test Med", status="active")
        self.db.add_all([c, m])
        self.db.commit()
        res = self.client.get(f"/doctor/patients/{self.patient.id}", headers={"Authorization": f"Bearer {self.doc_token}"})
        self.assertEqual(len(res.json()["medications"]), 0)

    def test_16_restricted_allergy_access(self):
        c = models.Consent(patient_id=self.patient.id, grantee_id=self.doc_user.id, data_category="Lab Reports", status="active")
        a = models.Allergy(patient_id=self.patient.id, allergen="Peanuts", severity="high")
        self.db.add_all([c, a])
        self.db.commit()
        res = self.client.get(f"/doctor/patients/{self.patient.id}", headers={"Authorization": f"Bearer {self.doc_token}"})
        self.assertEqual(len(res.json()["allergies"]), 0)

    # 20. Unauthorized patient snapshot
    def test_20_unauthorized_snapshot(self):
        res = self.client.get(f"/doctor/patients/{self.patient2.id}", headers={"Authorization": f"Bearer {self.doc_token}"})
        self.assertEqual(res.status_code, 403)

    # 21. Unauthorized organ endpoint
    def test_21_unauthorized_organ_endpoint(self):
        res = self.client.get(f"/doctor/patients/{self.patient.id}/digital-twin/organ/heart", headers={"Authorization": f"Bearer {self.doc_token}"})
        self.assertEqual(res.status_code, 403)

    # 22. Admin Doctor creation validation
    def test_22_doctor_creation(self):
        res = self.client.post("/admin/doctors", json={
            "name": "Dr. New", "email": "newdoc@test.com", "password": "pass", "specialization": "Derm"
        }, headers={"Authorization": f"Bearer {self.adm_token}"})
        self.assertEqual(res.status_code, 200)

    # 23. Duplicate doctor email
    def test_23_duplicate_doctor_email(self):
        self.client.post("/admin/doctors", json={
            "name": "Dr. New", "email": "newdoc2@test.com", "password": "pass"
        }, headers={"Authorization": f"Bearer {self.adm_token}"})
        res = self.client.post("/admin/doctors", json={
            "name": "Dr. New", "email": "newdoc2@test.com", "password": "pass"
        }, headers={"Authorization": f"Bearer {self.adm_token}"})
        self.assertEqual(res.status_code, 400)

    # 24. Document Upload Validation
    def test_24_document_upload_invalid_extension(self):
        file_content = b"fake file content"
        file = io.BytesIO(file_content)
        file.name = "malicious.exe"
        res = self.client.post(
            "/patients/me/records",
            files={"file": (file.name, file, "application/x-msdownload")},
            headers={"Authorization": f"Bearer {self.pat_token}"}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid file type", res.json()["detail"])
        
    def test_25_document_upload_empty_file(self):
        file = io.BytesIO(b"")
        file.name = "empty.pdf"
        res = self.client.post(
            "/patients/me/records",
            files={"file": (file.name, file, "application/pdf")},
            headers={"Authorization": f"Bearer {self.pat_token}"}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("must be between 1 byte and 10MB", res.json()["detail"])
        
    def test_26_health_endpoint(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

if __name__ == "__main__":
    unittest.main()
