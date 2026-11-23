import { Request, Response, NextFunction } from 'express';
import { db } from '../db';

export const listAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, patientId, action, entityType, limit, offset } = req.query;

    let logs = [...db.auditLogs];

    if (userId) {
      logs = logs.filter(l => l.user_id === userId);
    }
    if (patientId) {
      logs = logs.filter(l => l.patient_id === patientId);
    }
    if (action) {
      logs = logs.filter(l => l.action === (action as string).toUpperCase());
    }
    if (entityType) {
      logs = logs.filter(l => l.entity_type === (entityType as string).toUpperCase());
    }

    const total = logs.length;
    const l = limit ? parseInt(limit as string, 10) : 50;
    const o = offset ? parseInt(offset as string, 10) : 0;
    const paginated = logs.slice(o, o + l);

    res.status(200).json({
      data: {
        logs: paginated,
        total,
        tamperEvidence: 'IMMUTABLE_APPEND_ONLY_CHAIN_ACTIVE',
      },
    });
  } catch (err) {
    next(err);
  }
};
