import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { logAudit } from './auditLogger';

export const authorizePatientAccess = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.', requestId: req.requestId },
    });
    return;
  }

  // Administrators have supervisory read access
  if (user.role === 'admin') {
    return next();
  }

  // Determine requested patient ID from params or query
  const requestedPatientId = req.params.patientId || req.params.id || req.query.patientId as string;

  // Patient role: STRICT record-level defense against IDOR
  if (user.role === 'patient') {
    if (!user.patientId) {
      res.status(403).json({
        error: { code: 'PATIENT_PROFILE_NOT_LINKED', message: 'No patient record associated with this account.', requestId: req.requestId },
      });
      return;
    }

    if (requestedPatientId && requestedPatientId !== user.patientId) {
      // Security Event: Record access violation attempt
      logAudit({
        userId: user.id,
        action: 'ACCESS_RECORD',
        entityType: 'PATIENT',
        entityId: requestedPatientId,
        patientId: requestedPatientId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        rationale: 'SECURITY_ALERT: Unauthorized cross-patient record access attempt blocked (IDOR).',
      });

      res.status(403).json({
        error: {
          code: 'ACCESS_DENIED_IDOR',
          message: 'Security policy violation: Patients may only access their own clinical records.',
          requestId: req.requestId,
        },
      });
      return;
    }
  }

  // Receptionist role: May view demographic & appointment records, but NOT clinical data
  if (user.role === 'receptionist') {
    const isClinicalRoute = req.originalUrl.includes('/encounters') ||
                            req.originalUrl.includes('/diagnoses') ||
                            req.originalUrl.includes('/prescriptions') ||
                            req.originalUrl.includes('/lab-results');
    if (isClinicalRoute) {
      logAudit({
        userId: user.id,
        action: 'ACCESS_RECORD',
        entityType: 'CLINICAL_RECORD',
        entityId: requestedPatientId || 'UNKNOWN',
        patientId: requestedPatientId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        rationale: 'SECURITY_ALERT: Receptionist attempted to access protected clinical records.',
      });

      res.status(403).json({
        error: {
          code: 'CLINICAL_ACCESS_RESTRICTED',
          message: 'Reception staff are restricted from viewing clinical notes, diagnoses, and lab results.',
          requestId: req.requestId,
        },
      });
      return;
    }
  }

  next();
};
