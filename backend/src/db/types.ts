export type UserRole =
  | 'patient'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'lab_tech'
  | 'billing_officer'
  | 'admin';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type EncounterStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type LabOrderStatus = 'ORDERED' | 'COLLECTED' | 'IN_ANALYSIS' | 'COMPLETED' | 'CANCELLED';

export type LabFlag = 'NORMAL' | 'ABNORMAL_LOW' | 'ABNORMAL_HIGH' | 'CRITICAL';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  location?: string;
  is_active: boolean;
  created_at: string;
}

export interface Provider {
  id: string;
  user_id: string;
  department_id: string;
  license_number: string;
  specialty: string;
  max_daily_appointments: number;
  schedule_config?: any;
  is_active: boolean;
  created_at: string;
  full_name?: string;
  department_name?: string;
}

export interface Patient {
  id: string;
  user_id?: string;
  mrn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_phone: string;
  contact_email?: string;
  address?: string;
  emergency_contact?: any;
  blood_type?: string;
  allergies?: string[];
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  department_id: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  status: AppointmentStatus;
  reason: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  provider_name?: string;
  department_name?: string;
}

export interface WaitingListEntry {
  id: string;
  patient_id: string;
  provider_id?: string;
  department_id: string;
  preferred_date_start: string;
  preferred_date_end: string;
  priority: number;
  status: 'WAITING' | 'OFFERED' | 'FULFILLED' | 'EXPIRED';
  created_at: string;
}

export interface Encounter {
  id: string;
  appointment_id?: string;
  patient_id: string;
  provider_id: string;
  status: EncounterStatus;
  encounter_type: string;
  chief_complaint: string;
  clinical_notes?: string;
  start_time: string;
  end_time?: string;
  created_at: string;
}

export interface Vitals {
  id: string;
  encounter_id: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature_c?: number;
  sp_o2?: number;
  bmi?: number;
  recorded_at: string;
}

export interface Diagnosis {
  id: string;
  encounter_id: string;
  patient_id: string;
  code: string;
  description: string;
  category?: string;
  is_primary: boolean;
  recorded_at: string;
}

export interface Prescription {
  id: string;
  encounter_id?: string;
  patient_id: string;
  provider_id: string;
  medication_name: string;
  dosage: string;
  route: string;
  frequency: string;
  duration_days: number;
  refills_allowed: number;
  status: 'ACTIVE' | 'DISPENSED' | 'CANCELLED' | 'EXPIRED';
  instructions?: string;
  issued_at: string;
}

export interface LabOrder {
  id: string;
  encounter_id?: string;
  patient_id: string;
  provider_id: string;
  order_code: string;
  test_name: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  status: LabOrderStatus;
  ordered_at: string;
  collected_at?: string;
}

export interface LabResult {
  id: string;
  lab_order_id: string;
  patient_id: string;
  test_code: string;
  test_name: string;
  numeric_value?: number;
  unit: string;
  reference_min?: number;
  reference_max?: number;
  flag: LabFlag;
  verified_by?: string;
  verified_at?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  patient_id: string;
  encounter_id?: string;
  invoice_number: string;
  total_amount: number;
  copay_amount: number;
  insurance_covered: number;
  status: InvoiceStatus;
  due_date: string;
  created_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  category: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  transaction_reference: string;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paid_at: string;
}

export interface PatientConsent {
  id: string;
  patient_id: string;
  consent_type: 'TREATMENT' | 'DATA_SHARING' | 'RESEARCH' | 'TELEHEALTH';
  is_granted: boolean;
  granted_at: string;
  revoked_at?: string;
  valid_until?: string;
  ip_address?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'ACCESS_RECORD' | 'EXPORT_FHIR';
  entity_type: string;
  entity_id: string;
  patient_id?: string;
  ip_address?: string;
  user_agent?: string;
  previous_state?: any;
  new_state?: any;
  rationale?: string;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  recipient: string;
  channel: 'EMAIL' | 'SMS';
  template_name: string;
  payload: any;
  status: 'DELIVERED' | 'PENDING' | 'FAILED';
  idempotency_key: string;
  sent_at: string;
}
