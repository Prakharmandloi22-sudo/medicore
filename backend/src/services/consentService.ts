import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { PatientConsent } from '../db/types';
import { logAudit } from '../middleware/auditLogger';

export class ConsentService {
  async listConsents(patientId: string): Promise<PatientConsent[]> {
    return db.consents.filter(c => c.patient_id === patientId);
  }

  async grantConsent(data: {
    patientId: string;
    consentType: 'TREATMENT' | 'DATA_SHARING' | 'RESEARCH' | 'TELEHEALTH';
    validUntil?: string;
    notes?: string;
    ipAddress?: string;
  }, userId?: string): Promise<PatientConsent> {
    // Check if an existing record exists for this type
    const existing = db.consents.find(
      c => c.patient_id === data.patientId && c.consent_type === data.consentType
    );

    if (existing) {
      const prev = { ...existing };
      existing.is_granted = true;
      existing.granted_at = new Date().toISOString();
      existing.revoked_at = undefined;
      existing.valid_until = data.validUntil;
      existing.notes = data.notes || existing.notes;

      logAudit({
        userId,
        action: 'UPDATE',
        entityType: 'CONSENT',
        entityId: existing.id,
        patientId: data.patientId,
        previousState: prev,
        newState: existing,
        rationale: `Re-granted consent for ${data.consentType}`,
      });

      return existing;
    }

    const consent: PatientConsent = {
      id: `cst-${uuidv4().substring(0, 8)}`,
      patient_id: data.patientId,
      consent_type: data.consentType,
      is_granted: true,
      granted_at: new Date().toISOString(),
      valid_until: data.validUntil,
      ip_address: data.ipAddress,
      notes: data.notes,
    };

    db.consents.push(consent);

    logAudit({
      userId,
      action: 'CREATE',
      entityType: 'CONSENT',
      entityId: consent.id,
      patientId: data.patientId,
      newState: consent,
      rationale: `Granted consent for ${data.consentType}`,
    });

    return consent;
  }

  async revokeConsent(consentId: string, rationale?: string, userId?: string): Promise<PatientConsent> {
    const consent = db.consents.find(c => c.id === consentId);
    if (!consent) {
      throw { statusCode: 404, code: 'CONSENT_NOT_FOUND', message: 'Consent record not found.' };
    }

    const prev = { ...consent };
    consent.is_granted = false;
    consent.revoked_at = new Date().toISOString();

    logAudit({
      userId,
      action: 'UPDATE',
      entityType: 'CONSENT',
      entityId: consentId,
      patientId: consent.patient_id,
      previousState: prev,
      newState: consent,
      rationale: rationale || `Explicitly revoked consent for ${consent.consent_type}`,
    });

    return consent;
  }
}

export const consentService = new ConsentService();
