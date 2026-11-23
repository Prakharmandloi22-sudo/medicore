import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { Patient, Appointment, Encounter, LabResult, Vitals } from '../db/types';
import { logAudit } from '../middleware/auditLogger';

export interface FHIRResource {
  resourceType: string;
  id: string;
  [key: string]: any;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  type: string;
  total: number;
  entry: Array<{ fullUrl?: string; resource: FHIRResource }>;
}

export class FhirService {
  /**
   * Translates MediCore Patient to FHIR R4 Patient Resource
   */
  toFhirPatient(patient: Patient): FHIRResource {
    return {
      resourceType: 'Patient',
      id: patient.id,
      identifier: [
        {
          system: 'https://medicore.internal/mrn',
          value: patient.mrn,
          use: 'official',
        },
      ],
      active: true,
      name: [
        {
          use: 'official',
          family: patient.last_name,
          given: [patient.first_name],
        },
      ],
      gender: patient.gender.toLowerCase() === 'female' ? 'female' : 'male',
      birthDate: patient.date_of_birth,
      telecom: [
        { system: 'phone', value: patient.contact_phone, use: 'mobile' },
        ...(patient.contact_email ? [{ system: 'email', value: patient.contact_email }] : []),
      ],
      address: [
        {
          text: patient.address || 'Springfield, USA',
          use: 'home',
        },
      ],
    };
  }

  /**
   * Translates MediCore Appointment to FHIR R4 Appointment Resource
   */
  toFhirAppointment(apt: Appointment): FHIRResource {
    return {
      resourceType: 'Appointment',
      id: apt.id,
      status: apt.status.toLowerCase() === 'scheduled' ? 'booked' : apt.status.toLowerCase(),
      description: apt.reason,
      start: apt.scheduled_start,
      end: apt.scheduled_end,
      minutesDuration: apt.duration_minutes,
      participant: [
        {
          actor: { reference: `Patient/${apt.patient_id}`, display: apt.patient_name },
          status: 'accepted',
        },
        {
          actor: { reference: `Practitioner/${apt.provider_id}`, display: apt.provider_name },
          status: 'accepted',
        },
      ],
    };
  }

  /**
   * Translates MediCore Encounter to FHIR R4 Encounter Resource
   */
  toFhirEncounter(enc: Encounter): FHIRResource {
    return {
      resourceType: 'Encounter',
      id: enc.id,
      status: enc.status === 'COMPLETED' ? 'finished' : 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: enc.encounter_type || 'AMB',
        display: 'ambulatory',
      },
      subject: { reference: `Patient/${enc.patient_id}` },
      period: {
        start: enc.start_time,
        end: enc.end_time,
      },
      reasonCode: [{ text: enc.chief_complaint }],
    };
  }

  /**
   * Translates MediCore LabResult to FHIR R4 Observation Resource
   */
  toFhirObservation(lab: LabResult): FHIRResource {
    return {
      resourceType: 'Observation',
      id: lab.id,
      status: 'final',
      category: [
        {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }],
        },
      ],
      code: {
        coding: [{ system: 'http://loinc.org', code: lab.test_code, display: lab.test_name }],
        text: lab.test_name,
      },
      subject: { reference: `Patient/${lab.patient_id}` },
      valueQuantity: lab.numeric_value !== undefined ? {
        value: lab.numeric_value,
        unit: lab.unit,
        system: 'http://unitsofmeasure.org',
      } : undefined,
      interpretation: [
        {
          coding: [{ code: lab.flag }],
          text: lab.flag,
        },
      ],
      referenceRange: [
        {
          low: lab.reference_min !== undefined ? { value: lab.reference_min, unit: lab.unit } : undefined,
          high: lab.reference_max !== undefined ? { value: lab.reference_max, unit: lab.unit } : undefined,
        },
      ],
    };
  }

  /**
   * Exports full Patient FHIR Bundle (Patient + Appointments + Encounters + Observations)
   */
  async exportPatientBundle(patientId: string, requestingUserId?: string): Promise<FHIRBundle> {
    const patient = db.patients.find(p => p.id === patientId);
    if (!patient) {
      throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: `Patient ${patientId} not found for FHIR export.` };
    }

    const appointments = db.appointments.filter(a => a.patient_id === patientId);
    const encounters = db.encounters.filter(e => e.patient_id === patientId);
    const labResults = db.labResults.filter(lr => lr.patient_id === patientId);

    const entries: Array<{ fullUrl: string; resource: FHIRResource }> = [];

    // 1. Patient
    const fhirPatient = this.toFhirPatient(patient);
    entries.push({ fullUrl: `urn:uuid:${patient.id}`, resource: fhirPatient });

    // 2. Appointments
    for (const apt of appointments) {
      entries.push({ fullUrl: `urn:uuid:${apt.id}`, resource: this.toFhirAppointment(apt) });
    }

    // 3. Encounters
    for (const enc of encounters) {
      entries.push({ fullUrl: `urn:uuid:${enc.id}`, resource: this.toFhirEncounter(enc) });
    }

    // 4. Lab Observations
    for (const lr of labResults) {
      entries.push({ fullUrl: `urn:uuid:${lr.id}`, resource: this.toFhirObservation(lr) });
    }

    logAudit({
      userId: requestingUserId,
      action: 'EXPORT_FHIR',
      entityType: 'FHIR_BUNDLE',
      entityId: patientId,
      patientId,
      rationale: `Exported complete FHIR R4 Bundle containing ${entries.length} resources for patient ${patient.mrn}`,
    });

    return {
      resourceType: 'Bundle',
      type: 'collection',
      total: entries.length,
      entry: entries,
    };
  }

  /**
   * Ingests an incoming synthetic FHIR Bundle
   */
  async importFhirBundle(bundle: FHIRBundle, userId?: string): Promise<{ importedCount: number; message: string }> {
    if (!bundle || bundle.resourceType !== 'Bundle' || !Array.isArray(bundle.entry)) {
      throw { statusCode: 400, code: 'INVALID_FHIR_BUNDLE', message: 'Payload must be a valid FHIR R4 Bundle.' };
    }

    let imported = 0;
    for (const item of bundle.entry) {
      const res = item.resource;
      if (res && res.resourceType === 'Patient') {
        const mrn = res.identifier?.[0]?.value || `MRN-${Math.floor(10000 + Math.random() * 90000)}`;
        const given = res.name?.[0]?.given?.[0] || 'Unknown';
        const family = res.name?.[0]?.family || 'Unknown';

        const newPat: Patient = {
          id: `pat-fhir-${uuidv4().substring(0, 8)}`,
          mrn,
          first_name: given,
          last_name: family,
          date_of_birth: res.birthDate || '1990-01-01',
          gender: res.gender || 'Unknown',
          contact_phone: res.telecom?.find((t: any) => t.system === 'phone')?.value || '+1-555-0000',
          contact_email: res.telecom?.find((t: any) => t.system === 'email')?.value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        db.patients.push(newPat);
        imported++;
      }
    }

    logAudit({
      userId,
      action: 'CREATE',
      entityType: 'FHIR_IMPORT',
      entityId: `import-${Date.now()}`,
      rationale: `Imported ${imported} resources from synthetic FHIR Bundle`,
    });

    return { importedCount: imported, message: `Successfully imported ${imported} FHIR resources.` };
  }
}

export const fhirService = new FhirService();
