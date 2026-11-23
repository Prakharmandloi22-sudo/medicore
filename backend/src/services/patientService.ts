import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { Patient } from '../db/types';
import { logAudit } from '../middleware/auditLogger';

export class PatientService {
  async listPatients(options: { search?: string; limit?: number; offset?: number } = {}): Promise<{ patients: Patient[]; total: number }> {
    let result = [...db.patients];

    if (options.search) {
      const q = options.search.toLowerCase();
      result = result.filter(
        p =>
          p.mrn.toLowerCase().includes(q) ||
          p.first_name.toLowerCase().includes(q) ||
          p.last_name.toLowerCase().includes(q) ||
          (p.contact_email && p.contact_email.toLowerCase().includes(q))
      );
    }

    const total = result.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const paginated = result.slice(offset, offset + limit);

    return { patients: paginated, total };
  }

  async getPatientById(id: string): Promise<Patient> {
    const patient = db.patients.find(p => p.id === id || p.mrn === id);
    if (!patient) {
      throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: `Patient with ID or MRN '${id}' not found.` };
    }
    return patient;
  }

  async createPatient(data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    contactPhone: string;
    contactEmail?: string;
    address?: string;
    bloodType?: string;
    allergies?: string[];
    emergencyContact?: any;
  }, staffUserId?: string): Promise<Patient> {
    const id = `pat-${uuidv4().substring(0, 8)}`;
    const mrn = `MRN-${Math.floor(10000 + Math.random() * 90000)}`;

    const newPatient: Patient = {
      id,
      mrn,
      first_name: data.firstName,
      last_name: data.lastName,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
      contact_phone: data.contactPhone,
      contact_email: data.contactEmail,
      address: data.address,
      blood_type: data.bloodType,
      allergies: data.allergies || [],
      emergency_contact: data.emergencyContact,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.patients.push(newPatient);

    // Default Treatment consent on in-person intake
    db.consents.push({
      id: `cst-${uuidv4().substring(0, 8)}`,
      patient_id: id,
      consent_type: 'TREATMENT',
      is_granted: true,
      granted_at: new Date().toISOString(),
      notes: 'In-person front desk intake consent signed',
    });

    logAudit({
      userId: staffUserId,
      action: 'CREATE',
      entityType: 'PATIENT',
      entityId: id,
      patientId: id,
      rationale: `Staff registered patient ${newPatient.first_name} ${newPatient.last_name} with MRN ${mrn}`,
    });

    return newPatient;
  }

  async updatePatient(id: string, updates: Partial<Patient>, staffUserId?: string): Promise<Patient> {
    const patient = await this.getPatientById(id);
    const prev = { ...patient };

    if (updates.first_name) patient.first_name = updates.first_name;
    if (updates.last_name) patient.last_name = updates.last_name;
    if (updates.contact_phone) patient.contact_phone = updates.contact_phone;
    if (updates.contact_email !== undefined) patient.contact_email = updates.contact_email;
    if (updates.address !== undefined) patient.address = updates.address;
    if (updates.allergies !== undefined) patient.allergies = updates.allergies;
    if (updates.emergency_contact !== undefined) patient.emergency_contact = updates.emergency_contact;
    patient.updated_at = new Date().toISOString();

    logAudit({
      userId: staffUserId,
      action: 'UPDATE',
      entityType: 'PATIENT',
      entityId: id,
      patientId: id,
      previousState: prev,
      newState: patient,
      rationale: 'Updated patient demographics or allergies',
    });

    return patient;
  }

  async getPatientChart(patientId: string): Promise<any> {
    const patient = await this.getPatientById(patientId);
    const appointments = db.appointments.filter(a => a.patient_id === patient.id);
    const encounters = db.encounters.filter(e => e.patient_id === patient.id);
    const encounterIds = encounters.map(e => e.id);

    const vitals = db.vitals.filter(v => encounterIds.includes(v.encounter_id));
    const diagnoses = db.diagnoses.filter(d => d.patient_id === patient.id);
    const prescriptions = db.prescriptions.filter(p => p.patient_id === patient.id);
    const labOrders = db.labOrders.filter(lo => lo.patient_id === patient.id);
    const labResults = db.labResults.filter(lr => lr.patient_id === patient.id);
    const consents = db.consents.filter(c => c.patient_id === patient.id);
    const invoices = db.invoices.filter(i => i.patient_id === patient.id);

    return {
      patient,
      appointments,
      encounters,
      vitals,
      diagnoses,
      prescriptions,
      labOrders,
      labResults,
      consents,
      invoices,
    };
  }
}

export const patientService = new PatientService();
