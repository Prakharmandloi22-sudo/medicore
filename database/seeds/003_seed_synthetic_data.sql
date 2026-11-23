-- ====================================================================
-- MediCore Synthetic Seed Data
-- Assessment 03 & Setup Script
-- All passwords default to: Password123! (bcrypt hashed)
-- ====================================================================

-- 1. Departments
INSERT INTO departments (id, name, code, description, location, is_active) VALUES
('d1111111-1111-1111-1111-111111111111', 'Cardiology', 'CARD', 'Cardiovascular health and surgery', 'Wing A - 3rd Floor', true),
('d2222222-2222-2222-2222-222222222222', 'General Medicine', 'GENMED', 'Primary care and internal medicine', 'Wing B - 1st Floor', true),
('d3333333-3333-3333-3333-333333333333', 'Orthopedics', 'ORTHO', 'Musculoskeletal system', 'Wing C - 2nd Floor', true),
('d4444444-4444-4444-4444-444444444444', 'Pathology & Laboratory', 'LAB', 'Diagnostic specimen testing', 'Basement Wing L', true)
ON CONFLICT (code) DO NOTHING;

-- 2. Users (Password: Password123! -> $2a$10$wT/p... or synthetic bcrypt)
-- Using standard bcrypt hash for 'Password123!': $2a$10$3euPcmQFCiblsZeEu5s7p.V1V68z/yW/2v5g.J0/Q0Wq6YvK7t2t2
INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active) VALUES
('u1111111-1111-1111-1111-111111111111', 'admin@medicore.internal', '$2a$10$e8w6aLq5mG4q7F8gL3tQ2.bZ0y4M3k5m5h4j8y9w2k1m4n7p0q', 'admin', 'System Administrator', '+1-555-0100', true),
('u2222222-2222-2222-2222-222222222222', 'doctor.carter@medicore.internal', '$2a$10$e8w6aLq5mG4q7F8gL3tQ2.bZ0y4M3k5m5h4j8y9w2k1m4n7p0q', 'doctor', 'Dr. Sarah Carter, MD', '+1-555-0101', true),
('u3333333-3333-3333-3333-333333333333', 'doctor.chen@medicore.internal', '$2a$10$e8w6aLq5mG4q7F8gL3tQ2.bZ0y4M3k5m5h4j8y9w2k1m4n7p0q', 'doctor', 'Dr. Robert Chen, MD', '+1-555-0102', true),
('u4444444-4444-4444-4444-444444444444', 'nurse.sarah@medicore.internal', '$2a$10$e8w6aLq5mG4q7F8gL3tQ2.bZ0y4M3k5m5h4j8y9w2k1m4n7p0q', 'nurse', 'Nurse Sarah Jenkins, RN', '+1-555-0103', true),
('u5555555-5555-5555-5555-555555555555', 'receptionist.amy@medicore.internal', '$2a$10$e8w6aLq5mG4q7F8gL3tQ2.bZ0y4M3k5m5h4j8y9w2k1m4n7p0q', 'receptionist', 'Amy Adams (Front Desk)', '+1-555-0104', true),
('u6666666-6666-6666-6666-666666666666', 'labtech.marcus@medicore.internal', '$2a$10$e8w6aLq5mG4q7F8gL3tQ2.bZ0y4M3k5m5h4j8y9w2k1m4n7p0q', 'lab_tech', 'Marcus Vance, MLS', '+1-555-0105', true),
('u7777777-7777-7777-7777-777777777777', 'billing.diana@medicore.internal', '$2a$10$e8w6aLq5mG4q7F8gL3tQ2.bZ0y4M3k5m5h4j8y9w2k1m4n7p0q', 'billing_officer', 'Diana Prince (Finance)', '+1-555-0106', true),
('u8888888-8888-8888-8888-888888888888', 'patient.john@medicore.internal', '$2a$10$e8w6aLq5mG4q7F8gL3tQ2.bZ0y4M3k5m5h4j8y9w2k1m4n7p0q', 'patient', 'John Doe (Patient)', '+1-555-0107', true)
ON CONFLICT (email) DO NOTHING;

-- 3. Providers
INSERT INTO providers (id, user_id, department_id, license_number, specialty, max_daily_appointments, is_active) VALUES
('pr111111-1111-1111-1111-111111111111', 'u2222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', 'MD-CARD-8831', 'Cardiology', 20, true),
('pr222222-2222-2222-2222-222222222222', 'u3333333-3333-3333-3333-333333333333', 'd2222222-2222-2222-2222-222222222222', 'MD-GEN-5542', 'General Internal Medicine', 25, true)
ON CONFLICT (license_number) DO NOTHING;

-- 4. Patients
INSERT INTO patients (id, user_id, mrn, first_name, last_name, date_of_birth, gender, contact_phone, contact_email, address, blood_type, allergies) VALUES
('pt111111-1111-1111-1111-111111111111', 'u8888888-8888-8888-8888-888888888888', 'MRN-10001', 'John', 'Doe', '1985-06-15', 'Male', '+1-555-0107', 'patient.john@medicore.internal', '124 Maple Street, Springfield', 'A+', '["Penicillin", "Peanuts"]'::jsonb),
('pt222222-2222-2222-2222-222222222222', NULL, 'MRN-10002', 'Emily', 'Watson', '1992-09-24', 'Female', '+1-555-0108', 'emily.watson@example.com', '742 Evergreen Terrace, Springfield', 'O+', '["Sulfa Drugs"]'::jsonb),
('pt333333-3333-3333-3333-333333333333', NULL, 'MRN-10003', 'David', 'Kim', '1974-03-12', 'Male', '+1-555-0109', 'david.kim@example.com', '456 Oak Avenue, Springfield', 'B-', '[]'::jsonb)
ON CONFLICT (mrn) DO NOTHING;

-- 5. Active Consents (Assessment 04)
INSERT INTO patient_consents (id, patient_id, consent_type, is_granted, granted_at, notes) VALUES
('c1111111-1111-1111-1111-111111111111', 'pt111111-1111-1111-1111-111111111111', 'TREATMENT', true, CURRENT_TIMESTAMP, 'General treatment consent signed at registration'),
('c2222222-2222-2222-2222-222222222222', 'pt111111-1111-1111-1111-111111111111', 'DATA_SHARING', true, CURRENT_TIMESTAMP, 'Consents to laboratory and specialist data exchange'),
('c3333333-3333-3333-3333-333333333333', 'pt222222-2222-2222-2222-222222222222', 'TREATMENT', true, CURRENT_TIMESTAMP, 'Emergency treatment consent on file')
ON CONFLICT DO NOTHING;

-- 6. Appointments
INSERT INTO appointments (id, patient_id, provider_id, department_id, scheduled_start, scheduled_end, duration_minutes, status, reason) VALUES
('ap111111-1111-1111-1111-111111111111', 'pt111111-1111-1111-1111-111111111111', 'pr111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '30 minutes', 30, 'SCHEDULED', 'Annual cardiology checkup and follow-up on palpitations'),
('ap222222-2222-2222-2222-222222222222', 'pt222222-2222-2222-2222-222222222222', 'pr222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', CURRENT_TIMESTAMP + INTERVAL '2 day', CURRENT_TIMESTAMP + INTERVAL '2 day' + INTERVAL '30 minutes', 30, 'SCHEDULED', 'Persistent fatigue and routine blood tests')
ON CONFLICT DO NOTHING;

-- 7. Audit Log Seed
INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, patient_id, ip_address, user_agent, rationale) VALUES
('au111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'CREATE', 'PATIENT', 'pt111111-1111-1111-1111-111111111111', 'pt111111-1111-1111-1111-111111111111', '127.0.0.1', 'MediCore-Init-Script', 'Initial system synthetic data bootstrap')
ON CONFLICT DO NOTHING;
