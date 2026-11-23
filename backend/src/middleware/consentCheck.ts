import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { logAudit } from './auditLogger';

export const requireActiveConsent = (requiredConsentType: 'TREATMENT' | 'DATA_SHARING' = 'TREATMENT') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    // Admins and emergency bypass can be audited
    if (user.role === 'admin') {
      return next();
    }

    const patientId =
      req.params.patientId ||
      req.params.id ||
      req.body?.patientId ||
      req.body?.patient_id ||
      (req.query.patientId as string);
    if (!patientId) {
      return next();
    }

    // Check active consent
    const consent = db.consents.find(c =>
      c.patient_id === patientId &&
      c.consent_type === requiredConsentType &&
      c.is_granted === true
    );

    if (!consent) {
      logAudit({
        userId: user.id,
        action: 'ACCESS_RECORD',
        entityType: 'CONSENT_CHECK',
        entityId: patientId,
        patientId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        rationale: `CONSENT_BLOCKED: Patient has not granted active '${requiredConsentType}' consent or consent was revoked.`,
      });

      res.status(403).json({
        error: {
          code: 'CONSENT_REQUIRED',
          message: `Operation halted: Active patient consent for '${requiredConsentType}' is required to access or create clinical records.`,
          patientId,
          requestId: req.requestId,
        },
      });
      return;
    }

    next();
  };
};
