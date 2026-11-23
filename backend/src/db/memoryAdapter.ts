import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  User, Department, Provider, Patient, Appointment, WaitingListEntry,
  Encounter, Vitals, Diagnosis, Prescription, LabOrder, LabResult,
  Invoice, InvoiceItem, Payment, PatientConsent, AuditLog, NotificationLog
} from './types';

export class MemoryDatabase {
  users: User[] = [];
  departments: Department[] = [];
  providers: Provider[] = [];
  patients: Patient[] = [];
  appointments: Appointment[] = [];
  waitingList: WaitingListEntry[] = [];
  encounters: Encounter[] = [];
  vitals: Vitals[] = [];
  diagnoses: Diagnosis[] = [];
  prescriptions: Prescription[] = [];
  labOrders: LabOrder[] = [];
  labResults: LabResult[] = [];
  invoices: Invoice[] = [];
  invoiceItems: InvoiceItem[] = [];
  payments: Payment[] = [];
  consents: PatientConsent[] = [];
  auditLogs: AuditLog[] = [];
  notifications: NotificationLog[] = [];

  // Active lock locks for providers to simulate concurrency locking
  private providerLocks: Set<string> = new Set();

  constructor() {
    this.seed();
  }

  seed() {
    const defaultPassword = 'Password123!';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(defaultPassword, salt);

    // Departments
    this.departments = [
      {
        id: 'dept-cardio',
        name: 'Cardiology',
        code: 'CARD',
        description: 'Comprehensive cardiovascular care & surgery',
        location: 'Wing A - 3rd Floor',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'dept-genmed',
        name: 'General Medicine',
        code: 'GENMED',
        description: 'Primary care, family medicine & internal health',
        location: 'Wing B - 1st Floor',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'dept-ortho',
        name: 'Orthopedics',
        code: 'ORTHO',
        description: 'Musculoskeletal medicine and joint surgery',
        location: 'Wing C - 2nd Floor',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'dept-lab',
        name: 'Pathology & Laboratory',
        code: 'LAB',
        description: 'Clinical biochemistry, hematology & microbiology',
        location: 'Basement Wing L',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];

    // Users across all 7 required roles
    this.users = [
      {
        id: 'usr-admin-1',
        email: 'admin@medicore.internal',
        password_hash: hash,
        role: 'admin',
        full_name: 'Dr. Arthur Vance (Admin)',
        phone: '+1-555-0100',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'usr-doc-carter',
        email: 'doctor.carter@medicore.internal',
        password_hash: hash,
        role: 'doctor',
        full_name: 'Dr. Sarah Carter, MD',
        phone: '+1-555-0101',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'usr-doc-chen',
        email: 'doctor.chen@medicore.internal',
        password_hash: hash,
        role: 'doctor',
        full_name: 'Dr. Robert Chen, MD',
        phone: '+1-555-0102',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'usr-nurse-sarah',
        email: 'nurse.sarah@medicore.internal',
        password_hash: hash,
        role: 'nurse',
        full_name: 'Sarah Jenkins, RN',
        phone: '+1-555-0103',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'usr-rec-amy',
        email: 'receptionist.amy@medicore.internal',
        password_hash: hash,
        role: 'receptionist',
        full_name: 'Amy Adams (Front Desk)',
        phone: '+1-555-0104',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'usr-lab-marcus',
        email: 'labtech.marcus@medicore.internal',
        password_hash: hash,
        role: 'lab_tech',
        full_name: 'Marcus Vance, MLS',
        phone: '+1-555-0105',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'usr-bill-diana',
        email: 'billing.diana@medicore.internal',
        password_hash: hash,
        role: 'billing_officer',
        full_name: 'Diana Prince (Finance)',
        phone: '+1-555-0106',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'usr-pat-john',
        email: 'patient.john@medicore.internal',
        password_hash: hash,
        role: 'patient',
        full_name: 'John Doe',
        phone: '+1-555-0107',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Providers
    this.providers = [
      {
        id: 'prov-carter',
        user_id: 'usr-doc-carter',
        department_id: 'dept-cardio',
        license_number: 'MD-CARD-8831',
        specialty: 'Cardiovascular Medicine',
        max_daily_appointments: 20,
        schedule_config: { workDays: [1, 2, 3, 4, 5], startHour: 9, endHour: 17, slotDurationMinutes: 30 },
        is_active: true,
        created_at: new Date().toISOString(),
        full_name: 'Dr. Sarah Carter, MD',
        department_name: 'Cardiology',
      },
      {
        id: 'prov-chen',
        user_id: 'usr-doc-chen',
        department_id: 'dept-genmed',
        license_number: 'MD-GEN-5542',
        specialty: 'General Internal Medicine',
        max_daily_appointments: 25,
        schedule_config: { workDays: [1, 2, 3, 4, 5], startHour: 9, endHour: 17, slotDurationMinutes: 30 },
        is_active: true,
        created_at: new Date().toISOString(),
        full_name: 'Dr. Robert Chen, MD',
        department_name: 'General Medicine',
      },
    ];

    // Patients
    this.patients = [
      {
        id: 'pat-john-doe',
        user_id: 'usr-pat-john',
        mrn: 'MRN-10001',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1985-06-15',
        gender: 'Male',
        contact_phone: '+1-555-0107',
        contact_email: 'patient.john@medicore.internal',
        address: '124 Maple Street, Springfield',
        emergency_contact: { name: 'Mary Doe', relation: 'Spouse', phone: '+1-555-0199' },
        blood_type: 'A+',
        allergies: ['Penicillin', 'Peanuts'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'pat-emily-watson',
        user_id: undefined,
        mrn: 'MRN-10002',
        first_name: 'Emily',
        last_name: 'Watson',
        date_of_birth: '1992-09-24',
        gender: 'Female',
        contact_phone: '+1-555-0108',
        contact_email: 'emily.watson@example.com',
        address: '742 Evergreen Terrace, Springfield',
        emergency_contact: { name: 'Arthur Watson', relation: 'Father', phone: '+1-555-0198' },
        blood_type: 'O+',
        allergies: ['Sulfa Drugs'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'pat-david-kim',
        user_id: undefined,
        mrn: 'MRN-10003',
        first_name: 'David',
        last_name: 'Kim',
        date_of_birth: '1974-03-12',
        gender: 'Male',
        contact_phone: '+1-555-0109',
        contact_email: 'david.kim@example.com',
        address: '456 Oak Avenue, Springfield',
        emergency_contact: { name: 'Grace Kim', relation: 'Sister', phone: '+1-555-0197' },
        blood_type: 'B-',
        allergies: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Active Consents
    this.consents = [
      {
        id: 'cst-001',
        patient_id: 'pat-john-doe',
        consent_type: 'TREATMENT',
        is_granted: true,
        granted_at: new Date().toISOString(),
        notes: 'General treatment consent granted upon portal registration',
      },
      {
        id: 'cst-002',
        patient_id: 'pat-john-doe',
        consent_type: 'DATA_SHARING',
        is_granted: true,
        granted_at: new Date().toISOString(),
        notes: 'Data exchange consent for laboratory and specialty providers',
      },
      {
        id: 'cst-003',
        patient_id: 'pat-emily-watson',
        consent_type: 'TREATMENT',
        is_granted: true,
        granted_at: new Date().toISOString(),
        notes: 'Emergency and outpatient treatment consent',
      },
    ];

    // Baseline Appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setMinutes(tomorrow.getMinutes() + 30);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(14, 0, 0, 0);
    const dayAfterEnd = new Date(dayAfter);
    dayAfterEnd.setMinutes(dayAfter.getMinutes() + 30);

    this.appointments = [
      {
        id: 'apt-001',
        patient_id: 'pat-john-doe',
        provider_id: 'prov-carter',
        department_id: 'dept-cardio',
        scheduled_start: tomorrow.toISOString(),
        scheduled_end: tomorrowEnd.toISOString(),
        duration_minutes: 30,
        status: 'SCHEDULED',
        reason: 'Follow-up consultation on mild arrhythmia and blood pressure review',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        patient_name: 'John Doe',
        provider_name: 'Dr. Sarah Carter, MD',
        department_name: 'Cardiology',
      },
      {
        id: 'apt-002',
        patient_id: 'pat-emily-watson',
        provider_id: 'prov-chen',
        department_id: 'dept-genmed',
        scheduled_start: dayAfter.toISOString(),
        scheduled_end: dayAfterEnd.toISOString(),
        duration_minutes: 30,
        status: 'SCHEDULED',
        reason: 'Routine health checkup and annual metabolic panel',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        patient_name: 'Emily Watson',
        provider_name: 'Dr. Robert Chen, MD',
        department_name: 'General Medicine',
      },
    ];

    // Seed Encounter
    this.encounters = [
      {
        id: 'enc-001',
        appointment_id: 'apt-001',
        patient_id: 'pat-john-doe',
        provider_id: 'prov-carter',
        status: 'IN_PROGRESS',
        encounter_type: 'AMBULATORY',
        chief_complaint: 'Palpitations after moderate exercise and occasional dizziness',
        clinical_notes: 'Patient reports sporadic palpitations. S1/S2 heart sounds regular. No peripheral edema.',
        start_time: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];

    // Seed Vitals
    this.vitals = [
      {
        id: 'vit-001',
        encounter_id: 'enc-001',
        systolic_bp: 128,
        diastolic_bp: 82,
        heart_rate: 76,
        respiratory_rate: 16,
        temperature_c: 36.8,
        sp_o2: 98,
        bmi: 24.2,
        recorded_at: new Date().toISOString(),
      },
    ];

    // Seed Diagnoses
    this.diagnoses = [
      {
        id: 'diag-001',
        encounter_id: 'enc-001',
        patient_id: 'pat-john-doe',
        code: 'I49.9',
        description: 'Cardiac arrhythmia, unspecified',
        category: 'Cardiology',
        is_primary: true,
        recorded_at: new Date().toISOString(),
      },
    ];

    // Seed Prescription
    this.prescriptions = [
      {
        id: 'rx-001',
        encounter_id: 'enc-001',
        patient_id: 'pat-john-doe',
        provider_id: 'prov-carter',
        medication_name: 'Metoprolol Tartrate',
        dosage: '25mg',
        route: 'ORAL',
        frequency: 'Twice daily with meals',
        duration_days: 30,
        refills_allowed: 2,
        status: 'ACTIVE',
        instructions: 'Monitor pulse daily. Avoid sudden cessation.',
        issued_at: new Date().toISOString(),
      },
    ];

    // Seed Lab Orders & Results
    this.labOrders = [
      {
        id: 'lo-001',
        encounter_id: 'enc-001',
        patient_id: 'pat-john-doe',
        provider_id: 'prov-carter',
        order_code: 'L-LIPID',
        test_name: 'Lipid & Electrolyte Profile',
        priority: 'ROUTINE',
        status: 'COMPLETED',
        ordered_at: new Date().toISOString(),
        collected_at: new Date().toISOString(),
      },
    ];

    this.labResults = [
      {
        id: 'lr-001',
        lab_order_id: 'lo-001',
        patient_id: 'pat-john-doe',
        test_code: 'CHOL',
        test_name: 'Total Cholesterol',
        numeric_value: 215.0,
        unit: 'mg/dL',
        reference_min: 125.0,
        reference_max: 200.0,
        flag: 'ABNORMAL_HIGH',
        verified_by: 'usr-lab-marcus',
        verified_at: new Date().toISOString(),
        notes: 'Mild hypercholesterolemia noted.',
      },
      {
        id: 'lr-002',
        lab_order_id: 'lo-001',
        patient_id: 'pat-john-doe',
        test_code: 'K',
        test_name: 'Potassium',
        numeric_value: 4.2,
        unit: 'mmol/L',
        reference_min: 3.5,
        reference_max: 5.0,
        flag: 'NORMAL',
        verified_by: 'usr-lab-marcus',
        verified_at: new Date().toISOString(),
        notes: 'Normal electrolyte balance.',
      },
    ];

    // Seed Invoice
    this.invoices = [
      {
        id: 'inv-001',
        patient_id: 'pat-john-doe',
        encounter_id: 'enc-001',
        invoice_number: 'INV-2026-0001',
        total_amount: 250.0,
        copay_amount: 30.0,
        insurance_covered: 220.0,
        status: 'ISSUED',
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        items: [
          {
            id: 'item-001',
            invoice_id: 'inv-001',
            description: 'Specialist Cardiology Consultation',
            category: 'CONSULTATION',
            unit_price: 150.0,
            quantity: 1,
            total_price: 150.0,
          },
          {
            id: 'item-002',
            invoice_id: 'inv-001',
            description: 'Comprehensive Lipid Panel',
            category: 'LAB',
            unit_price: 100.0,
            quantity: 1,
            total_price: 100.0,
          },
        ],
      },
    ];

    // Audit Log Seed
    this.auditLogs = [
      {
        id: 'aud-001',
        user_id: 'usr-admin-1',
        action: 'CREATE',
        entity_type: 'PATIENT',
        entity_id: 'pat-john-doe',
        patient_id: 'pat-john-doe',
        ip_address: '127.0.0.1',
        user_agent: 'MediCore System Bootstrap',
        rationale: 'Initial synthetic seed load',
        created_at: new Date().toISOString(),
      },
    ];
  }

  // Capstone concurrency protection: Check slot collision
  checkProviderSlotCollision(providerId: string, startTime: Date, endTime: Date, excludeAppointmentId?: string): boolean {
    return this.appointments.some(apt => {
      if (apt.provider_id !== providerId) return false;
      if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
      if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') return false;

      const aptStart = new Date(apt.scheduled_start);
      const aptEnd = new Date(apt.scheduled_end);

      // Overlap condition: start < aptEnd && end > aptStart
      return startTime < aptEnd && endTime > aptStart;
    });
  }

  // Simulated transaction wrapper with atomic lock
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    return await fn();
  }
}

export const memoryDb = new MemoryDatabase();
