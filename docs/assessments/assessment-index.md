# MediCore: 15 Mandatory Hands-on Assessments Compliance Matrix

| Assessment | Title | Objective & Deliverables | Verification Command & Proof |
|---|---|---|---|
| **01** | Healthcare role-based frontend | Role-specific views for Patient, Doctor, Receptionist, Nurse, Lab Tech, Billing, Admin | `npm run build` in `frontend/`, interactive RoleSwitcher bar in UI |
| **02** | Hospital backend APIs | REST endpoints for registration, appointments, encounters, prescriptions, lab, billing | `npm test` in `backend/` (20 passed tests) |
| **03** | Clinical relational database | PostgreSQL relational schema, DDL migrations, FK constraints, indexes | `database/migrations/001_initial_schema.sql` and `002_constraints_and_indexes.sql` |
| **04** | Clinical data security | Least-privilege RBAC, IDOR defense, active consent checks, immutable audit logging | `backend/src/tests/rbac_security.test.ts` |
| **05** | Python clinical data processing | Batch ingestion, unit normalization, reference ranges, 10,000-record benchmark | `python -m pytest` & `python -m app.benchmark` in `analytics-service/` |
| **06** | FastAPI clinical analytics | Utilization, wait times, lab turnaround, cohort demographics; no diagnosis guardrail | `analytics-service/app/main.py` endpoints `/api/v1/analytics/*` |
| **07** | Appointment & care workflow | Provider scheduling, booking conflicts, cancellations, waiting lists, care lifecycle | `backend/src/tests/appointments.test.ts` & `clinical_workflow.test.ts` |
| **08** | Healthcare interoperability | FHIR R4 Patient, Appointment, Encounter, Observation bundles & sandbox notifications | `backend/src/tests/billing_and_fhir.test.ts` |
| **09** | Docker healthcare environment | Multi-stage Dockerfiles, non-root users, isolated database network, persistent volumes | `docker-compose.yml`, `docker/Dockerfile.*` |
| **10** | Git & clinical change review | Protected branches, PR templates, clinical schema modification protocol | `.github/pull_request_template.md`, `docs/CLINICAL_CHANGE_REVIEW.md` |
| **11** | Healthcare CI/CD | GitHub Actions pipeline for linting, testing, security audits, container builds | `.github/workflows/ci-cd.yml` |
| **12** | Privacy & workflow testing | Test suites for IDOR, consent revocation, collision prevention, role boundaries | Automated Jest & pytest test suites |
| **13** | Healthcare API documentation | OpenAPI 3.0 specification & Postman collection with examples & error codes | `docs/openapi.json`, `docs/medicore.postman_collection.json` |
| **14** | Secure hospital deployment | TLSv1.3 reverse proxy, secrets isolation, automated backup & restore runbooks | `docker/nginx.conf`, `scripts/backup.sh`, `scripts/restore.sh`, `docs/DEPLOYMENT.md` |
| **15** | Healthcare incident simulation | 5 incident playbooks, root-cause analyses, timelines, and regression tests | `docs/INCIDENT_PLAYBOOK.md` |
