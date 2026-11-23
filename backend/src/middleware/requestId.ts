import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const reqId = (req.headers['x-request-id'] as string) || `req-${uuidv4().substring(0, 8)}`;
  req.requestId = reqId;
  res.setHeader('x-request-id', reqId);
  next();
};
