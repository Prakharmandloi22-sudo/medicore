-- ====================================================================
-- MediCore Hospital & Patient Care Management Platform
-- Relational Database DDL Schema (PostgreSQL 16+)
-- Assessment 03: Clinical Relational Database
-- ====================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ENUM Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'patient', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'billing_officer', 'admin'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM (
        'SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE encounter_status AS ENUM (
        'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE lab_order_status AS ENUM (
        'ORDERED', 'COLLECTED', 'IN_ANALYSIS', 'COMPLETED', 'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM (
        'DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. USERS & IDENTITY
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    location VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. HEALTHCARE PROVIDERS (Doctors, Specialists)
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialty VARCHAR(150) NOT NULL,
    max_daily_appointments INT NOT NULL DEFAULT 20,
    schedule_config JSONB NOT NULL DEFAULT '{"workDays": [1,2,3,4,5], "startHour": 9, "endHour": 17, "slotDurationMinutes": 30}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. PATIENTS
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    mrn VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255),
    address TEXT,
    emergency_contact JSONB,
    blood_type VARCHAR(10),
    allergies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. APPOINTMENTS (With Provider Schedule Concurrency Locking)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    status appointment_status NOT NULL DEFAULT 'SCHEDULED',
    reason TEXT NOT NULL,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_appointment_time CHECK (scheduled_end > scheduled_start)
);

-- 6. WAITING LIST
CREATE TABLE IF NOT EXISTS waiting_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    preferred_date_start DATE NOT NULL,
    preferred_date_end DATE NOT NULL,
    priority INT NOT NULL DEFAULT 1, -- 1=Routine, 2=Urgent, 3=Critical
    status VARCHAR(50) NOT NULL DEFAULT 'WAITING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. CLINICAL ENCOUNTERS
CREATE TABLE IF NOT EXISTS encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    status encounter_status NOT NULL DEFAULT 'IN_PROGRESS',
    encounter_type VARCHAR(50) NOT NULL DEFAULT 'AMBULATORY',
    chief_complaint TEXT NOT NULL,
    clinical_notes TEXT,
    start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. VITALS
CREATE TABLE IF NOT EXISTS vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    systolic_bp INT,
    diastolic_bp INT,
    heart_rate INT,
    respiratory_rate INT,
    temperature_c NUMERIC(4,1),
    sp_o2 INT,
    bmi NUMERIC(4,1),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. DIAGNOSES (ICD-10)
CREATE TABLE IF NOT EXISTS diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    route VARCHAR(50) NOT NULL DEFAULT 'ORAL',
    frequency VARCHAR(100) NOT NULL,
    duration_days INT NOT NULL DEFAULT 7,
    refills_allowed INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    instructions TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. LAB ORDERS & RESULTS
CREATE TABLE IF NOT EXISTS lab_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    order_code VARCHAR(50) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'ROUTINE',
    status lab_order_status NOT NULL DEFAULT 'ORDERED',
    ordered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    collected_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_order_id UUID UNIQUE NOT NULL REFERENCES lab_orders(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    test_code VARCHAR(50) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    numeric_value NUMERIC(10,2),
    unit VARCHAR(50) NOT NULL,
    reference_min NUMERIC(10,2),
    reference_max NUMERIC(10,2),
    flag VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    notes TEXT
);

-- 12. BILLING & INVOICES
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    copay_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    insurance_covered NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status invoice_status NOT NULL DEFAULT 'ISSUED',
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    paid_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. PATIENT CONSENTS (Assessment 04)
CREATE TABLE IF NOT EXISTS patient_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL, -- 'TREATMENT', 'DATA_SHARING', 'RESEARCH', 'TELEHEALTH'
    is_granted BOOLEAN NOT NULL DEFAULT TRUE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    ip_address VARCHAR(45),
    notes TEXT
);

-- 14. IMMUTABLE AUDIT LOG (Assessment 04)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE', 'ACCESS_RECORD', 'EXPORT_FHIR'
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    previous_state JSONB,
    new_state JSONB,
    rationale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. NOTIFICATIONS DISPATCH LOG (Assessment 08)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(255) NOT NULL,
    channel VARCHAR(20) NOT NULL, -- 'EMAIL', 'SMS'
    template_name VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DELIVERED',
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
