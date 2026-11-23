-- ====================================================================
-- MediCore Indexing, Performance Optimization & Concurrency Constraints
-- Assessment 03 & Assessment 07 & Capstone Challenge
-- ====================================================================

-- 1. Indexing on Foreign Keys & Core Query Patterns
CREATE INDEX IF NOT EXISTS idx_users_role_email ON users(role, email);
CREATE INDEX IF NOT EXISTS idx_providers_dept ON providers(department_id, is_active);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn);
CREATE INDEX IF NOT EXISTS idx_patients_names ON patients(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);

-- 2. Appointment Filtering & Schedule Optimization
CREATE INDEX IF NOT EXISTS idx_appointments_provider_date 
    ON appointments(provider_id, scheduled_start, status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date 
    ON appointments(patient_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_appointments_status 
    ON appointments(status);

-- 3. Clinical & Workflow Indexes
CREATE INDEX IF NOT EXISTS idx_encounters_patient 
    ON encounters(patient_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient 
    ON prescriptions(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_status 
    ON lab_orders(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_lab_results_order 
    ON lab_results(lab_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_status 
    ON invoices(patient_id, status);

-- 4. Audit Log Indexing for Forensics (Assessment 04 & 15)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action 
    ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient 
    ON audit_logs(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
    ON audit_logs(entity_type, entity_id);

-- 5. Active Patient Consent Lookups
CREATE INDEX IF NOT EXISTS idx_consents_patient_type 
    ON patient_consents(patient_id, consent_type, is_granted);

-- 6. CAPSTONE CHALLENGE: Overlapping Appointment Prevention Constraint
-- Uses PostgreSQL btree_gist extension for exclusion constraint across temporal ranges
-- Cancelling or No-Show releases the slot for other bookings
ALTER TABLE appointments 
    DROP CONSTRAINT IF EXISTS exclude_provider_overlapping_appointments;

ALTER TABLE appointments 
    ADD CONSTRAINT exclude_provider_overlapping_appointments 
    EXCLUDE USING gist (
        provider_id WITH =,
        tstzrange(scheduled_start, scheduled_end) WITH &&
    ) 
    WHERE (status NOT IN ('CANCELLED', 'NO_SHOW'));
