import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { clinicalService } from '../services/clinicalService';

const diagnosisSchema = z.object({
  encounterId: z.string().min(1),
  patientId: z.string().min(1),
  code: z.string().min(1),
  description: z.string().min(1),
  category: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const prescriptionSchema = z.object({
  encounterId: z.string().optional(),
  patientId: z.string().min(1),
  providerId: z.string().min(1),
  medicationName: z.string().min(1),
  dosage: z.string().min(1),
  route: z.string().optional(),
  frequency: z.string().min(1),
  durationDays: z.number().int().positive().optional(),
  refillsAllowed: z.number().int().nonnegative().optional(),
  instructions: z.string().optional(),
});

const labOrderSchema = z.object({
  encounterId: z.string().optional(),
  patientId: z.string().min(1),
  providerId: z.string().min(1),
  orderCode: z.string().min(1),
  testName: z.string().min(1),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT']).optional(),
});

const labResultSchema = z.object({
  labOrderId: z.string().min(1),
  testCode: z.string().min(1),
  testName: z.string().min(1),
  numericValue: z.number(),
  unit: z.string().min(1),
  referenceMin: z.number().optional(),
  referenceMax: z.number().optional(),
  notes: z.string().optional(),
});

// Diagnoses
export const addDiagnosis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = diagnosisSchema.parse(req.body);
    const diag = await clinicalService.addDiagnosis(data, req.user?.id);
    res.status(201).json({ data: diag });
  } catch (err) {
    next(err);
  }
};

export const listDiagnoses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = (req.query.patientId as string) || req.user?.patientId;
    if (!patientId) {
      res.status(400).json({ error: { code: 'PATIENT_ID_REQUIRED', message: 'patientId query parameter required.' } });
      return;
    }
    const diagnoses = await clinicalService.listDiagnoses(patientId);
    res.status(200).json({ data: diagnoses });
  } catch (err) {
    next(err);
  }
};

// Prescriptions
export const addPrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = prescriptionSchema.parse(req.body);
    const rx = await clinicalService.addPrescription(data, req.user?.id);
    res.status(201).json({ data: rx });
  } catch (err) {
    next(err);
  }
};

export const listPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = req.user?.role === 'patient' ? req.user.patientId : (req.query.patientId as string | undefined);
    const prescriptions = await clinicalService.listPrescriptions(patientId);
    res.status(200).json({ data: prescriptions });
  } catch (err) {
    next(err);
  }
};

// Lab Orders & Results
export const createLabOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = labOrderSchema.parse(req.body);
    const order = await clinicalService.createLabOrder(data, req.user?.id);
    res.status(201).json({ data: order });
  } catch (err) {
    next(err);
  }
};

export const listLabOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = req.user?.role === 'patient' ? req.user.patientId : (req.query.patientId as string | undefined);
    const orders = await clinicalService.listLabOrders(patientId);
    res.status(200).json({ data: orders });
  } catch (err) {
    next(err);
  }
};

export const recordLabResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = labResultSchema.parse(req.body);
    const result = await clinicalService.recordLabResult(data, req.user?.id);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const listLabResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = req.user?.role === 'patient' ? req.user.patientId : (req.query.patientId as string | undefined);
    const results = await clinicalService.listLabResults(patientId);
    res.status(200).json({ data: results });
  } catch (err) {
    next(err);
  }
};
