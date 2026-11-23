import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../db/types';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'You must be logged in to perform this action.',
          requestId: req.requestId,
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' is not authorized for this action. Required: [${allowedRoles.join(', ')}]`,
          requestId: req.requestId,
        },
      });
      return;
    }

    next();
  };
};
