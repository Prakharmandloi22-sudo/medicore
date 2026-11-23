import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { AuditLog } from '../db/types';

export interface AuditParams {
  userId?: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'ACCESS_RECORD' | 'EXPORT_FHIR';
  entityType: string;
  entityId: string;
  patientId?: string;
  ipAddress?: string;
  userAgent?: string;
  previousState?: any;
  newState?: any;
  rationale?: string;
}

export const logAudit = (params: AuditParams): AuditLog => {
  const entry: AuditLog = {
    id: `aud-${uuidv4().substring(0, 8)}`,
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    patient_id: params.patientId,
    ip_address: params.ipAddress || '127.0.0.1',
    user_agent: params.userAgent || 'MediCore API Service',
    previous_state: params.previousState,
    new_state: params.newState,
    rationale: params.rationale,
    created_at: new Date().toISOString(),
  };

  db.auditLogs.unshift(entry);
  return entry;
};

export const auditMiddleware = (action: AuditParams['action'], entityType: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json;

    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = body?.data?.id || req.params.id || 'N/A';
        const patientId = body?.data?.patient_id || req.params.patientId || req.user?.patientId;

        logAudit({
          userId: req.user?.id,
          action,
          entityType,
          entityId: String(entityId),
          patientId: patientId ? String(patientId) : undefined,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          rationale: `${req.method} ${req.originalUrl} completed successfully`,
        });
      }
      return originalJson.call(this, body);
    };

    next();
  };
};
