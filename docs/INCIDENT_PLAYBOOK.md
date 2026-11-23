# MediCore Healthcare Incident Simulation Playbooks & Postmortems
**Assessment 15: Healthcare Incident Simulation & Incident Response**

---

### Incident 01: Unauthorized Record Access & IDOR Attack
- **Severity:** High (Security & Privacy Alert)
- **Symptom:** Audit logs recorded repeated `ACCESS_RECORD` violations with rationale `SECURITY_ALERT: Unauthorized cross-patient record access attempt blocked (IDOR)`.
- **Root Cause Analysis (RCA):** An authenticated portal user attempted to modify the URL path parameter (`/api/v1/patients/pat-emily-watson/chart`) to inspect another patient's clinical diagnoses.
- **Resolution & Mitigation:**
  1. The `authorizePatientAccess` middleware intercepted the request and cross-referenced `req.user.patientId` against `req.params.id`.
  2. The system responded with `403 Forbidden` (`ACCESS_DENIED_IDOR`).
  3. Security incident entry automatically logged in `audit_logs` table with offending user ID, IP address, and timestamp.
- **Regression Test:** `src/tests/rbac_security.test.ts` (`IDOR DEFENSE: Patient John CANNOT access another patient chart`).

---

### Incident 02: Doctor Appointment Overlap Race Condition
- **Severity:** High (Clinical Scheduling Conflict)
- **Symptom:** Two front desk receptionists simultaneously submitted bookings for Dr. Sarah Carter for the exact same time slot (14:00 - 14:30).
- **Root Cause Analysis (RCA):** In legacy systems, lack of database exclusion constraints or atomic transaction locks resulted in race conditions allowing concurrent inserts.
- **Resolution & Mitigation:**
  1. Implemented PostgreSQL `btree_gist` temporal exclusion constraint:
     ```sql
     ADD CONSTRAINT exclude_provider_overlapping_appointments 
     EXCLUDE USING gist (provider_id WITH =, tstzrange(scheduled_start, scheduled_end) WITH &&) 
     WHERE (status NOT IN ('CANCELLED', 'NO_SHOW'));
     ```
  2. Implemented application-level atomic collision check in `appointmentService.ts`, rejecting overlapping intervals with `409 Conflict` (`SCHEDULE_COLLISION`).
- **Regression Test:** `src/tests/appointments.test.ts` (`CAPSTONE CHALLENGE: should strictly REJECT overlapping doctor appointment booking`).

---

### Incident 03: Delayed Patient Email/SMS Notification Queue
- **Severity:** Medium (Operational Communication Delay)
- **Symptom:** Patient appointment confirmation notifications delayed during peak booking hours.
- **Root Cause Analysis (RCA):** External sandbox gateway experienced transient 504 timeouts; naive retries caused duplicated dispatch attempts.
- **Resolution & Mitigation:**
  1. Added `idempotency_key` tracking in `notification_logs` to prevent duplicate messaging.
  2. Implemented exponential backoff retry loop with dead-letter queue (DLQ) logging.
- **Regression Test:** `src/tests/billing_and_fhir.test.ts` (`should process payment and dispatch idempotently without duplicates`).

---

### Incident 04: Database Connection Pool Outage & Recovery
- **Severity:** Critical (System Availability)
- **Symptom:** Express API returning 500 errors during sudden surge in report generation queries.
- **Root Cause Analysis (RCA):** Database pool client leak occurred where a client was acquired without `finally { client.release() }`.
- **Resolution & Mitigation:**
  1. Refactored `pgAdapter.ts` to wrap all transactions and queries in strictly guaranteed `finally` release blocks.
  2. Configured maximum pool connection limits (`max: 20`) and idle connection timeouts (`idleTimeoutMillis: 30000`).
  3. Added `/ready` endpoint checking database pool responsiveness.

---

### Incident 05: Mismatched Laboratory Result Reference Metadata
- **Severity:** High (Diagnostic Data Integrity)
- **Symptom:** Serum Potassium (K) value was recorded as `7.2` but flag was erroneously marked as normal due to conflicting unit metadata (`mmol/L` vs `mg/dL`).
- **Root Cause Analysis (RCA):** Units were ingested without normalization against standard LOINC reference tables.
- **Resolution & Mitigation:**
  1. Integrated Python `analytics-service` clinical data ingestion module (`processing.py`).
  2. Automatically normalizes units (e.g. converting Glucose mmol/L to mg/dL) and cross-checks standard critical thresholds (`K > 6.2 mmol/L -> CRITICAL`).
  3. Enforced rejection of negative physical counts and unparseable numbers.
- **Regression Test:** `analytics-service/tests/test_processing.py` (`test_unit_normalization_glucose_mmol` and `test_abnormal_and_critical_flags`).
