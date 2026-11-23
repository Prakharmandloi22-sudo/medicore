import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '../db/types';
import { db } from '../db';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  patientId?: string;
  providerId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required. Please sign in.',
        requestId: req.requestId,
      },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    
    // Check if user is still active in database
    const user = db.users.find(u => u.id === decoded.id);
    if (!user || !user.is_active) {
      res.status(401).json({
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'User account is inactive or revoked.',
          requestId: req.requestId,
        },
      });
      return;
    }

    // Attach patientId or providerId if applicable
    let patientId: string | undefined;
    let providerId: string | undefined;

    if (user.role === 'patient') {
      const patient = db.patients.find(p => p.user_id === user.id);
      patientId = patient?.id;
    } else if (user.role === 'doctor') {
      const provider = db.providers.find(p => p.user_id === user.id);
      providerId = provider?.id;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      patientId,
      providerId,
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      error: {
        code: 'TOKEN_INVALID',
        message: 'Invalid or expired authentication token.',
        requestId: req.requestId,
      },
    });
  }
};
