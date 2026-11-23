import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input payload provided.',
        details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        requestId: req.requestId,
      },
    });
    return;
  }

  // Handle explicit HTTP errors
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'API_ERROR');
  const message = statusCode === 500 ? 'An unexpected server error occurred.' : err.message;

  // Log server errors internally without exposing secrets
  if (statusCode === 500) {
    console.error(`[CRITICAL_ERROR] Request ${req.requestId}:`, err.message || err);
  }

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      requestId: req.requestId,
    },
  });
};
