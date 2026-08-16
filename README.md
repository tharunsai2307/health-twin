# HealthTwin - AI-Powered Personal Digital Twin

HealthTwin is a full-stack, AI-powered Personal Digital Twin and Health Vault application. It compiles fragmented patient records, processes them via OCR & NLP, updates an interactive Digital Health Twin model, checks clinical safety bounds, and allows granular patient data consent control with full audit logs.

---

## 📐 Architecture Overview

```
            PATIENT
               │
               ▼
      ┌─────────────────┐
      │ HEALTH RECORDS  │
      └────────┬────────┘
               │
               ▼
      DOCUMENT PROCESSING
         OCR + NLP
               │
               ▼
    UNIVERSAL HEALTH VAULT
               │
               ▼
      🧬 DIGITAL HEALTH TWIN
               │
      ┌────────┼─────────┐
      ▼        ▼         ▼
   SAFETY    TRENDS    CONTEXT
   ENGINE     ENGINE    ENGINE
      │        │         │
      └────────┼─────────┘
               ▼
      EXPLAINABLE AI
               │
      ┌────────┴────────┐
      ▼                 ▼
   PATIENT           DOCTOR
      │                 │
      └────────┬────────┘
               ▼
      CONSENT + AUDIT
```

---

## 🛠️ Project Structure

```
HealthTwin/
├── frontend/                 # React + TypeScript + Vite Frontend application
│   ├── src/
│   │   ├── components/      # UI, layout, and Digital Twin visualization graph
│   │   ├── pages/           # Dashboard, Vault, Consent, Doctor Dashboard, etc.
│   │   └── lib/api.ts       # API Client communicating with FastAPI
│   └── package.json
└── backend/                  # Python + FastAPI Backend application
    ├── app/
    │   ├── database.py      # SQLAlchemy engine and session setup
    │   ├── models.py        # SQLAlchemy schema declarations (14 tables)
    │   ├── auth.py          # Password hashing, user session security
    │   ├── services/
    │   │   ├── ocr.py       # PyPDF OCR & AI entity extraction
    │   │   └── safety.py    # Duplicate med, allergy conflict, and trend engines
    │   ├── seed.py          # Database migration and seeder script
    │   └── main.py          # FastAPI application routes
    └── requirements.txt     # Python backend dependencies
```

---

## 🚀 Setup & Execution Guide

### 1. Backend Setup

1. **Navigate to backend and create virtual environment:**
   ```bash
   cd backend
   python -m venv .venv
   ```
2. **Activate environment & install dependencies:**
   * **Windows (PowerShell):**
     ```powershell
     .venv\Scripts\Activate.ps1
     pip install -r requirements.txt
     ```
   * **Linux/macOS:**
     ```bash
     source .venv/bin/activate
     pip install -r requirements.txt
     ```
3. **Seed the database:**
   ```bash
   python -m app.seed
   ```
4. **Start the server:**
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The backend will run at http://127.0.0.1:8000. API docs are available at http://127.0.0.1:8000/docs.*

---

### 2. Frontend Setup

1. **Navigate to frontend and install packages:**
   ```bash
   cd frontend
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
   *The React UI will run at http://localhost:5173.*

---

## 🔑 Demo Credentials

To test the end-to-end flows, you can sign in with the following seeded users:

* **Patient Account:**
  * **Email:** `alex.johnson@demo.healthtwin`
  * **Password:** `demo1234`
* **Doctor Account:**
  * **Email:** `arun.mehta@demo.healthtwin`
  * **Password:** `doctor1234`
