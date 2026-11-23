import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { Encounter, EncounterStatus, Vitals } from '../db/types';
import { logAudit } from '../middleware/auditLogger';

export class EncounterService {
  async listEncounters(patientId?: string): Promise<Encounter[]> {
    if (patientId) {
      return db.encounters.filter(e => e.patient_id === patientId);
    }
    return db.encounters;
  }

  async getEncounterById(id: string): Promise<Encounter> {
    const enc = db.encounters.find(e => e.id === id);
    if (!enc) {
      throw { statusCode: 404, code: 'ENCOUNTER_NOT_FOUND', message: `Encounter ${id} not found.` };
    }
    return enc;
  }

  async createEncounter(data: {
    appointmentId?: string;
    patientId: string;
    providerId: string;
    encounterType?: string;
    chiefComplaint: string;
    clinicalNotes?: string;
  }, userId?: string): Promise<Encounter> {
    const id = `enc-${uuidv4().substring(0, 8)}`;
    const newEncounter: Encounter = {
      id,
      appointment_id: data.appointmentId,
      patient_id: data.patientId,
      provider_id: data.providerId,
      status: 'IN_PROGRESS',
      encounter_type: data.encounterType || 'AMBULATORY',
      chief_complaint: data.chiefComplaint,
      clinical_notes: data.clinicalNotes,
      start_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    db.encounters.push(newEncounter);

    // If linked to an appointment, transition appointment to IN_PROGRESS
    if (data.appointmentId) {
      const apt = db.appointments.find(a => a.id === data.appointmentId);
      if (apt) {
        apt.status = 'IN_PROGRESS';
        apt.updated_at = new Date().toISOString();
      }
    }

    logAudit({
      userId,
      action: 'CREATE',
      entityType: 'ENCOUNTER',
      entityId: id,
      patientId: data.patientId,
      newState: newEncounter,
      rationale: `Started clinical encounter for chief complaint: ${data.chiefComplaint}`,
    });

    return newEncounter;
  }

  async completeEncounter(id: string, notes?: string, userId?: string): Promise<Encounter> {
    const enc = await this.getEncounterById(id);
    const prev = { ...enc };

    enc.status = 'COMPLETED';
    enc.end_time = new Date().toISOString();
    if (notes) {
      enc.clinical_notes = (enc.clinical_notes ? enc.clinical_notes + '\n\n' : '') + notes;
    }

    // Complete linked appointment
    if (enc.appointment_id) {
      const apt = db.appointments.find(a => a.id === enc.appointment_id);
      if (apt) {
        apt.status = 'COMPLETED';
        apt.updated_at = new Date().toISOString();
      }
    }

    logAudit({
      userId,
      action: 'UPDATE',
      entityType: 'ENCOUNTER',
      entityId: id,
      patientId: enc.patient_id,
      previousState: prev,
      newState: enc,
      rationale: 'Clinical encounter completed and locked.',
    });

    return enc;
  }

  async recordVitals(encounterId: string, vitalsData: {
    systolicBp?: number;
    diastolicBp?: number;
    heartRate?: number;
    respiratoryRate?: number;
    temperatureC?: number;
    spO2?: number;
    bmi?: number;
  }, userId?: string): Promise<Vitals> {
    const enc = await this.getEncounterById(encounterId);

    const vitalsRecord: Vitals = {
      id: `vit-${uuidv4().substring(0, 8)}`,
      encounter_id: encounterId,
      systolic_bp: vitalsData.systolicBp,
      diastolic_bp: vitalsData.diastolicBp,
      heart_rate: vitalsData.heartRate,
      respiratory_rate: vitalsData.respiratoryRate,
      temperature_c: vitalsData.temperatureC,
      sp_o2: vitalsData.spO2,
      bmi: vitalsData.bmi,
      recorded_at: new Date().toISOString(),
    };

    db.vitals.push(vitalsRecord);

    logAudit({
      userId,
      action: 'CREATE',
      entityType: 'VITALS',
      entityId: vitalsRecord.id,
      patientId: enc.patient_id,
      newState: vitalsRecord,
      rationale: 'Recorded patient clinical vitals',
    });

    return vitalsRecord;
  }

  async getVitalsForEncounter(encounterId: string): Promise<Vitals[]> {
    return db.vitals.filter(v => v.encounter_id === encounterId);
  }
}

export const encounterService = new EncounterService();
