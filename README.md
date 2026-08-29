# Brondby Enterprises Limited — Job Tracking & Invoicing System

Full-stack investigative case management, job tracking, and invoicing platform built for **Brondby Enterprises Limited**, a premier corporate investigations and enhanced due diligence firm operating across Africa.

---

## 1. System Features & Architecture

### Core Investigation Services (Job Types)
The platform is pre-seeded with the 5 core corporate investigation service lines:
1. **Certified Official Company Documents** — Corporate registry retrieval, CR12s, certified incorporation files, shareholder registers.
2. **Enhanced Due Diligence (EDD)** — PEP checks, UBO tracing, source of wealth investigation, adverse intelligence.
3. **Legal & Litigation Checks** — Commercial court searches, bankruptcy registries, appellate cases, arbitration records.
4. **Background Checks & Screening Services** — Executive vetting, credential confirmation, sanctions screening.
5. **Citizenship & Residency Programs** — High-net-worth immigration audits, permit verification, residency authenticity.

### Role-Based Access Control (RBAC)
- **Administrator**:
  - Full CRUD on jobs, clients, service types, and invoices.
  - Can assign and reassign investigators to jobs.
  - Can transition jobs to any status (`incoming`, `assigned`, `pending`, `completed`, `cancelled`).
  - Access to financial dashboard, invoices, revenue metrics, client records, and user management.
- **Worker (Investigator)**:
  - Scoped strictly to their own assigned jobs at both API level (`get_queryset()` in DRF) and UI level.
  - Can only transition status along the active workflow: `assigned` → `pending` → `completed` with progress notes.
  - Cannot access invoices, financial metrics, client management, or other workers' cases (strictly enforced with HTTP 403 Forbidden).

### Immutable Audit Trail (`JobStatusLog`)
Every status transition triggers a Django audit signal capturing:
- Active actor (`changed_by`)
- Transition (`old_status` → `new_status`)
- Timestamp
- Investigator progress notes / reasoning

### Invoicing & Financial Settlement
- Automatic generation of unique invoice identifiers (e.g. `INV-202608-XXXX`).
- Link invoices to completed investigation jobs with referential integrity (`PROTECT`).
- One-click "Mark as Paid" action with paid date recording.
- Official printable receipt preview.

---

## 2. Tech Stack

- **Backend:**
  - Python 3.11+ / Django 5.1 & Django REST Framework (DRF)
  - SimpleJWT for JWT access & refresh token authentication
  - `django-environ` with dual support: **SQLite** for zero-dependency local running & **PostgreSQL** for containerized/production setups
  - `django-cors-headers` & `django-filter`
- **Frontend:**
  - React 18 with Vite
  - TanStack Query v5 (`@tanstack/react-query`) for server state, mutations, and caching
  - React Router v6 with `ProtectedRoute` and `AdminRoute`
  - Tailwind CSS with bespoke corporate dark palette
  - Lucide React icons

---

## 3. Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### A. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables (a pre-configured `.env` is included):
   ```bash
   # If .env does not exist, copy from .env.example
   cp .env.example .env
   ```
5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
6. Seed default users, clients, services, jobs, and invoices:
   ```bash
   python manage.py seed_data
   ```
   *(To seed only the 5 official service types: `python manage.py seed_services`)*
7. Start the Django development server:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```

Backend API will be live at: **`http://localhost:8000/api/`**  
Django Admin: **`http://localhost:8000/admin/`**

---

### B. Frontend Setup
1. In a separate terminal, navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

Frontend application will be live at: **`http://localhost:5173/`**

---

## 4. Demo Login Credentials

The system includes pre-seeded accounts and one-click quick login buttons on the login screen:

| Role | Username / Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` / `admin@brondby.com` | `AdminPass123!` | Full CRUD, Invoices, Clients, Reassignment, All Dashboards |
| **Worker 1** | `worker1` / `worker1@brondby.com` | `WorkerPass123!` | Investigator (James Mwangi) — sees only assigned jobs |
| **Worker 2** | `worker2` / `worker2@brondby.com` | `WorkerPass123!` | Investigator (Amina Diallo) — sees only assigned jobs |

---

## 5. Docker Compose Setup (PostgreSQL + Backend + Frontend)

To launch the complete stack with a dedicated PostgreSQL database container:

```bash
docker-compose up --build
```

This starts:
- **`brondby_postgres`** on port `5432`
- **`brondby_backend`** on port `8000` (auto-runs migrations and seed data)
- **`brondby_frontend`** on port `5173`

---

## 6. Running Automated Tests

A comprehensive test suite verifies RBAC permissions, scoped querysets, status transitions, and audit logging:

```bash
cd backend
python manage.py test
```

Tests cover:
- `test_models.py`: Status transitions, automatic `JobStatusLog` signal audit trail, invoice generation, mark-as-paid.
- `test_permissions.py`:
  - Workers blocked from `/api/clients/` (403 Forbidden).
  - Workers blocked from `/api/invoices/` (403 Forbidden).
  - Workers blocked from creating/deleting jobs (403 Forbidden).
  - Workers scoped strictly to their assigned jobs (other workers' jobs 404/excluded).
  - Worker status progression enforcement (`assigned` → `pending` → `completed`).
  - Worker invalid transitions blocked (400 Bad Request).
  - Admin full access.
- `test_dashboard.py`: Admin vs Worker dashboard isolation and financial security.

---

## 7. Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `DEBUG` | Enable debug mode | `True` |
| `SECRET_KEY` | Django secret key | Pre-set dev key |
| `DATABASE_URL` | DB Connection String | `sqlite:///db.sqlite3` (or `postgres://...`) |
| `ALLOWED_HOSTS` | Allowed hostnames | `localhost,127.0.0.1,0.0.0.0` |
| `CORS_ALLOWED_ORIGINS` | Permitted frontend origins | `http://localhost:5173,http://127.0.0.1:5173` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend REST API URL | `http://localhost:8000/api` |

---

## 8. API Endpoint Overview

- **Auth:**
  - `POST /api/auth/token/` — SimpleJWT login
  - `POST /api/auth/token/refresh/` — Refresh access token
  - `GET /api/auth/me/` — Active user profile and permissions
- **Dashboard:**
  - `GET /api/dashboard/stats/` — Role-aware aggregated KPI metrics
- **Jobs:**
  - `GET /api/jobs/` — List jobs (Admin sees all; Worker sees assigned)
  - `POST /api/jobs/` — Create new job (Admin only)
  - `GET /api/jobs/{id}/` — Job detail (scoped)
  - `PATCH /api/jobs/{id}/` — Update status & progress note
  - `DELETE /api/jobs/{id}/` — Delete job (Admin only)
- **Clients (Admin only):**
  - `GET, POST /api/clients/`
  - `GET, PUT, PATCH, DELETE /api/clients/{id}/`
- **Invoices (Admin only):**
  - `GET, POST /api/invoices/`
  - `POST /api/invoices/{id}/mark_paid/` — Mark invoice paid
  - `GET /api/invoices/unbilled_jobs/` — Fetch completed unbilled jobs
