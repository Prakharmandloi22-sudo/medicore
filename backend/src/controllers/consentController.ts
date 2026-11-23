import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { consentService } from '../services/consentService';

const grantConsentSchema = z.object({
  patientId: z.string().min(1),
  consentType: z.enum(['TREATMENT', 'DATA_SHARING', 'RESEARCH', 'TELEHEALTH']),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
});

export const listConsents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let patientId = req.params.patientId || (req.query.patientId as string);
    if (req.user?.role === 'patient') {
      patientId = req.user.patientId!;
    }
    if (!patientId) {
      res.status(400).json({ error: { code: 'PATIENT_ID_REQUIRED', message: 'patientId is required.' } });
      return;
    }
    const consents = await consentService.listConsents(patientId);
    res.status(200).json({ data: consents });
  } catch (err) {
    next(err);
  }
};

export const grantConsent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = grantConsentSchema.parse(req.body);
    if (req.user?.role === 'patient' && req.user.patientId && data.patientId !== req.user.patientId) {
      res.status(403).json({ error: { code: 'ACCESS_DENIED', message: 'Patients can only manage their own consent.' } });
      return;
    }
    const consent = await consentService.grantConsent({
      ...data,
      ipAddress: req.ip,
    }, req.user?.id);
    res.status(201).json({ data: consent });
  } catch (err) {
    next(err);
  }
};

export const revokeConsent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { rationale } = req.body;
    const consent = await consentService.revokeConsent(req.params.id, rationale, req.user?.id);
    res.status(200).json({ data: consent });
  } catch (err) {
    next(err);
  }
};
