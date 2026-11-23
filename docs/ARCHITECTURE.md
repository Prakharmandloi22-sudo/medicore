# MediCore Architecture & Engineering Specification

## 1. System Overview
MediCore is a modular, role-based hospital operations platform designed for synthetic patient care workflows. The platform enforces clinical data security, least-privilege authorization, active patient consent verification, appointment concurrency scheduling, and FHIR R4 interoperability.

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Port 3000)"]
        UI["Next.js App Router Frontend\n(Tailwind CSS, TanStack Query)"]
        Switcher["1-Click Role Switcher Demo Bar\n(Patient, Doctor, Nurse, Front Desk, Lab, Billing, Admin)"]
    end

    subgraph Gateway ["Reverse Proxy Gateway (Port 80/443)"]
        Nginx["Nginx Reverse Proxy & SSL\n(Rate Limiting, Security Headers)"]
    end

    subgraph BackendLayer ["Backend Services"]
        API["Node.js / Express Core Business API (Port 5000)\n- RBAC & IDOR Defense\n- Scheduling Engine\n- Encounter Lifecycle\n- Consent & Audit Logs\n- FHIR R4 Translation"]
        Analytics["Python FastAPI Microservice (Port 8000)\n- Unit Normalization\n- Reference Range Evaluation\n- Operational Utilization & Wait-Times\n- Synthetic Population Statistics"]
    end

    subgraph DataStore ["System of Record & Cache"]
        Postgres[("PostgreSQL 16 Relational DB\n(Temporal Exclusion Constraints, DDL Migrations)")]
        Redis[("Redis 7 In-Memory Cache\n(Jobs, Sessions)")]
    end

    UI --> Nginx
    Nginx --> API
    Nginx --> Analytics
    Nginx --> UI
    API --> Postgres
    API --> Redis
    Analytics --> Postgres
    API -.-> Analytics
```

## 2. Service Boundaries & Data Ownership

| Service | Responsibility | Authoritative Entities Owned |
|---|---|---|
| **Core Express API** | Primary clinical business rules, identity, security, transactions | `users`, `departments`, `providers`, `patients`, `appointments`, `encounters`, `vitals`, `diagnoses`, `prescriptions`, `lab_orders`, `lab_results`, `invoices`, `consents`, `audit_logs` |
| **FastAPI Analytics** | Operational metrics computation, batch data ingestion & validation | Ingests raw lab/appointment batches, computes utilization rates, wait times, lab turnaround, cohort statistics. *(Explicitly does not output clinical diagnoses)* |
| **Next.js Frontend** | Responsive user interface, role-specific views | Client-side role experiences, form validation, TanStack Query caching |

## 3. Concurrency Control: Preventing Overlapping Doctor Appointments
- **Capstone Challenge:** Prevent doctor scheduling collisions across concurrent bookings.
- **Database Level:** PostgreSQL `btree_gist` temporal exclusion constraint:
  ```sql
  ALTER TABLE appointments ADD CONSTRAINT exclude_provider_overlapping_appointments
  EXCLUDE USING gist (provider_id WITH =, tstzrange(scheduled_start, scheduled_end) WITH &&)
  WHERE (status NOT IN ('CANCELLED', 'NO_SHOW'));
  ```
- **Application Level:** Atomic lock in `appointmentService.ts`: checks slot collisions and returns `409 Conflict` with `SCHEDULE_COLLISION` before state mutation.

## 4. Privacy, Record-Level Authorization & IDOR Defense
- **Patient Isolation:** `authorizePatientAccess` middleware verifies `req.user.patientId === requestedId`. Cross-patient requests are blocked with `403 Forbidden` (`ACCESS_DENIED_IDOR`) and recorded as security alerts.
- **Receptionist Boundaries:** Receptionists are blocked from reading medical encounter notes, diagnoses, or lab results.
- **Consent Checks:** `requireActiveConsent('TREATMENT')` verifies active patient consent prior to initiating clinical encounters, prescribing medication, or ordering tests.
