import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { encounterService } from '../services/encounterService';

const createEncounterSchema = z.object({
  appointmentId: z.string().optional(),
  patientId: z.string().min(1),
  providerId: z.string().min(1),
  encounterType: z.string().optional(),
  chiefComplaint: z.string().min(1),
  clinicalNotes: z.string().optional(),
});

const vitalsSchema = z.object({
  systolicBp: z.number().int().optional(),
  diastolicBp: z.number().int().optional(),
  heartRate: z.number().int().optional(),
  respiratoryRate: z.number().int().optional(),
  temperatureC: z.number().optional(),
  spO2: z.number().int().optional(),
  bmi: z.number().optional(),
});

export const listEncounters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let patientId = req.query.patientId as string | undefined;
    if (req.user?.role === 'patient') {
      patientId = req.user.patientId;
    }
    const encounters = await encounterService.listEncounters(patientId);
    res.status(200).json({ data: encounters });
  } catch (err) {
    next(err);
  }
};

export const getEncounterById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const enc = await encounterService.getEncounterById(req.params.id);
    const vitals = await encounterService.getVitalsForEncounter(enc.id);
    res.status(200).json({ data: { ...enc, vitals } });
  } catch (err) {
    next(err);
  }
};

export const createEncounter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createEncounterSchema.parse(req.body);
    const encounter = await encounterService.createEncounter(data, req.user?.id);
    res.status(201).json({ data: encounter });
  } catch (err) {
    next(err);
  }
};

export const completeEncounter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notes = req.body.clinicalNotes as string | undefined;
    const encounter = await encounterService.completeEncounter(req.params.id, notes, req.user?.id);
    res.status(200).json({ data: encounter });
  } catch (err) {
    next(err);
  }
};

export const recordVitals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = vitalsSchema.parse(req.body);
    const vitals = await encounterService.recordVitals(req.params.id, data, req.user?.id);
    res.status(201).json({ data: vitals });
  } catch (err) {
    next(err);
  }
};
