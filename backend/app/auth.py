import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from . import models

SECRET_KEY = os.getenv("SECRET_KEY", "healthtwin-super-secret-key-1234567890abcdef")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60 # 30 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_patient(current_user: models.User = Depends(get_current_user)) -> models.Patient:
    if current_user.role != "PATIENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not registered as a patient"
        )
    if not current_user.patient_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )
    return current_user.patient_profile

def get_current_doctor(current_user: models.User = Depends(get_current_user)) -> models.Doctor:
    if current_user.role != "DOCTOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not registered as a doctor"
        )
    if not current_user.doctor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    return current_user.doctor_profile

def get_current_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not authorized as an administrator."
        )
    return current_user

def check_doctor_consent(doctor_user_id: str, patient_id: str, required_category: str, db: Session) -> bool:
    consents = db.query(models.Consent).filter(
        models.Consent.patient_id == patient_id,
        models.Consent.grantee_id == doctor_user_id,
        models.Consent.status == "active"
    ).all()
    
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    
    for consent in consents:
        if consent.expires_at and consent.expires_at not in ["—", "None", ""]:
            if consent.expires_at < today_str:
                continue # expired consent
                
        cat = (consent.data_category or "").lower()
        req = required_category.lower()
        
        if cat in ["all authorized records", "medical records", "clinical overview"]:
            return True
        if cat == req:
            return True
            
    return False
