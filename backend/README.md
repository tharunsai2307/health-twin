# MedTwin Digital Twin Health Platform

An advanced, end-to-end interactive 3D digital twin platform for healthcare. This platform allows patients to centralize their medical records, uses OCR to parse documents, runs a safety engine for conflict checks, and provides an interactive 3D anatomy visualization derived from real clinical data. 

Doctors can access the digital twin (subject to granular patient consent) to evaluate the clinical snapshot in an intuitive, organ-centric UI.

## Features & Capabilities

- **Role-Based Workflows**: Dedicated dashboards for Patients, Doctors, and System Administrators.
- **Granular Consent**: Patients have fine-grained control over which categories (Medical History, Lab Reports, etc.) a specific doctor can view.
- **Interactive 3D Digital Twin**: A React Three Fiber 3D anatomy viewer where organs are dynamically connected to patient vitals and lab trends.
- **Document OCR Pipeline**: Automated extraction of prescriptions, labs, and diagnoses from uploaded PDFs and images.
- **Clinical Safety Engine**: Automated checks for duplicate medications and severe allergy conflicts.
- **Hardened Security**: Strict JWT authentication, comprehensive backend authorization constraints, file upload MIME validation, and CORS restrictions.

---

## Tech Stack

### Frontend (../frontend)
- **Framework**: React 18 with TypeScript and Vite
- **Styling**: Tailwind CSS
- **3D Engine**: Three.js, React Three Fiber, `@react-three/drei`
- **Routing**: React Router DOM
- **Icons**: Lucide React

### Backend (./)
- **Framework**: FastAPI (Python 3)
- **Database**: SQLite (SQLAlchemy ORM)
- **Authentication**: JWT & BCrypt Password Hashing
- **AI/OCR Integration**: Google Gemini API (Deprecated `google.generativeai` migrating to `google.genai`)
- **Testing**: `unittest`, `pytest`

---

## Environment Variables

### Backend (`.env`)
Create a `.env` file in the `backend` directory based on `.env.example`:

```env
ENVIRONMENT=development
DATABASE_URL=sqlite:///./healthtwin.db
JWT_SECRET=your_super_secret_jwt_key
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CREATE_DEMO_ADMIN=true
GEMINI_API_KEY=your_gemini_api_key
```

*Note: Set `CREATE_DEMO_ADMIN=false` in production to prevent seeding default admin credentials.*

---

## Local Development Setup

### 1. Start the Backend

```bash
cd backend
python -m venv .venv
# Activate virtual environment
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

pip install -r requirements.txt
pip install httpx # Required for running test suites

# Optional: Seed the database with demo users, patients, and doctors
python -m app.seed

# Start the FastAPI server
python -m uvicorn app.main:app --reload
```

The backend API will be available at `http://localhost:8000`.
You can view the auto-generated Swagger UI docs at `http://localhost:8000/docs`.

### 2. Start the Frontend

```bash
cd ../frontend
npm install
npm run dev
```

The frontend application will be available at `http://localhost:5173`.

### 3. Demo Credentials (if seeded)
If `CREATE_DEMO_ADMIN=true` and `app.seed` was run, you can log in with:
- **Patient**: `alex.johnson@demo.healthtwin` / `demo1234`
- **Doctor**: `arun.mehta@demo.healthtwin` / `doctor1234`
- **Admin**: `admin@demo.healthtwin` / `admin1234`

---

## Testing

The backend includes a comprehensive suite of security and unit tests covering RBAC, consent boundaries, document security, and API integrity.

To run the backend test suite:

```bash
cd backend
python -m unittest tests/test_security.py -v
python -m unittest tests/test_backend.py -v
```
*(Ensure `httpx` is installed in your python environment before running tests)*

---

## Production Deployment Guidelines

When deploying MedTwin to a production environment:

1. **Environment Variables**: Use strong cryptographic keys for `JWT_SECRET`.
2. **CORS**: Set `CORS_ORIGINS` strictly to your production frontend URL (e.g., `https://app.medtwin.com`).
3. **Database**: Migrate from SQLite to a robust PostgreSQL cluster using Alembic.
4. **Admin Seeding**: Ensure `CREATE_DEMO_ADMIN` is `false` or entirely removed.
5. **Reverse Proxy**: Serve the API behind Nginx/HAProxy with SSL/TLS enabled to protect auth tokens in transit.
6. **Frontend**: Build using `npm run build` and serve the `/dist` directory via a CDN or static file server.

## License

All rights reserved to the MedTwin development team.
