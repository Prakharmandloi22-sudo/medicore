import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { patientService } from '../services/patientService';

const createPatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string(),
  gender: z.string().min(1),
  contactPhone: z.string().min(5),
  contactEmail: z.string().email().optional(),
  address: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  emergencyContact: z.any().optional(),
});

export const listPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = req.query.search as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    // If logged-in user is a patient, return only themselves
    if (req.user?.role === 'patient') {
      const patient = await patientService.getPatientById(req.user.patientId!);
      res.status(200).json({ data: { patients: [patient], total: 1 } });
      return;
    }

    const result = await patientService.listPatients({ search, limit, offset });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const getPatientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    res.status(200).json({ data: patient });
  } catch (err) {
    next(err);
  }
};

export const createPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createPatientSchema.parse(req.body);
    const newPatient = await patientService.createPatient(data, req.user?.id);
    res.status(201).json({ data: newPatient });
  } catch (err) {
    next(err);
  }
};

export const updatePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updated = await patientService.updatePatient(req.params.id, req.body, req.user?.id);
    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
};

export const getPatientChart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const chart = await patientService.getPatientChart(req.params.id);
    res.status(200).json({ data: chart });
  } catch (err) {
    next(err);
  }
};
