import os
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app, UPLOAD_DIR
from app.database import Base, get_db
from app import models, auth

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

class TestSecurityEndpoints(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = TestingSessionLocal()
        
        # Ensure upload dir exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        # Setup Patients and Doctors
        self.setup_users()
        
    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=engine)

    def setup_users(self):
        # Patient A
        self.pA_user = models.User(
            id="u-pat-A",
            name="Patient A",
            email="pata@test.com",
            hashed_password=auth.get_password_hash("pass"),
            role="PATIENT"
        )
        # Patient B
        self.pB_user = models.User(
            id="u-pat-B",
            name="Patient B",
            email="patb@test.com",
            hashed_password=auth.get_password_hash("pass"),
            role="PATIENT"
        )
        # Doctor
        self.doc_user = models.User(
            id="u-doc",
            name="Doctor",
            email="doc@test.com",
            hashed_password=auth.get_password_hash("pass"),
            role="DOCTOR"
        )
        
        self.db.add_all([self.pA_user, self.pB_user, self.doc_user])
        self.db.commit()
        
        self.pA = models.Patient(id="p-A", user_id="u-pat-A", date_of_birth="1990-01-01", blood_group="O+")
        self.pB = models.Patient(id="p-B", user_id="u-pat-B", date_of_birth="1990-01-01", blood_group="A+")
        self.doc = models.Doctor(id="d-1", user_id="u-doc", specialization="General")
        
        self.db.add_all([self.pA, self.pB, self.doc])
        self.db.commit()
        
        # Create tokens
        self.tokenA = auth.create_access_token(data={"sub": self.pA_user.email})
        self.tokenB = auth.create_access_token(data={"sub": self.pB_user.email})
        self.tokenDoc = auth.create_access_token(data={"sub": self.doc_user.email})
        
        # Add a record for Patient A
        self.recA = models.MedicalRecord(
            id="rec-A",
            patient_id="p-A",
            record_type="LAB_REPORT",
            title="Lab A",
            record_date="2026-08-16",
            processing_status="PROCESSED",
            file_path="/storage/test.pdf"
        )
        # Create a dummy physical file
        with open(os.path.join(UPLOAD_DIR, "test.pdf"), "w") as f:
            f.write("dummy")
            
        self.db.add(self.recA)
        self.db.commit()

    def test_patient_cross_access_denied(self):
        # Patient B tries to download Patient A's file
        response = client.get(
            f"/records/rec-A/file",
            headers={"Authorization": f"Bearer {self.tokenB}"}
        )
        self.assertEqual(response.status_code, 403)

    def test_doctor_without_consent_denied(self):
        # Doctor tries to access Patient A snapshot without consent
        response = client.get(
            f"/doctor/patients/p-A",
            headers={"Authorization": f"Bearer {self.tokenDoc}"}
        )
        self.assertEqual(response.status_code, 403)

    def test_invalid_jwt_rejected(self):
        response = client.get(
            f"/patients/me/records",
            headers={"Authorization": f"Bearer invalid.token.here"}
        )
        self.assertEqual(response.status_code, 401)
        
    def test_expired_jwt_rejected(self):
        from datetime import timedelta
        # Create token that expired 1 min ago
        expired = auth.create_access_token(data={"sub": self.pA_user.email}, expires_delta=timedelta(minutes=-1))
        response = client.get(
            f"/patients/me/records",
            headers={"Authorization": f"Bearer {expired}"}
        )
        self.assertEqual(response.status_code, 401)
        
    def test_file_upload_validation(self):
        # Try uploading an invalid file type (.txt)
        with open("test.txt", "w") as f:
            f.write("dummy")
        with open("test.txt", "rb") as f:
            response = client.post(
                "/patients/me/records",
                headers={"Authorization": f"Bearer {self.tokenA}"},
                files={"file": ("test.txt", f, "text/plain")}
            )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid file type", response.json()["detail"])
        os.remove("test.txt")

if __name__ == "__main__":
    unittest.main()
