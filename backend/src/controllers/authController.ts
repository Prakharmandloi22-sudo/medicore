import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { db } from '../db';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerPatientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string(),
  gender: z.string().min(1),
  phone: z.string().min(5),
  address: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
});

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login(email, password, req.ip, req.headers['user-agent']);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const registerPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = registerPatientSchema.parse(req.body);
    const result = await authService.registerPatient(data);
    res.status(201).json({
      data: {
        token: result.token,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          fullName: result.user.full_name,
          patientId: result.patient.id,
          mrn: result.patient.mrn,
        },
        patient: result.patient,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not logged in.' } });
    return;
  }

  const user = db.users.find(u => u.id === req.user?.id);
  res.status(200).json({
    data: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.fullName,
      phone: user?.phone,
      patientId: req.user.patientId,
      providerId: req.user.providerId,
    },
  });
};

export const revokeSession = async (req: Request, res: Response): Promise<void> => {
  // Session revocation acknowledgment
  res.status(200).json({ data: { message: 'Session revoked successfully.' } });
};
