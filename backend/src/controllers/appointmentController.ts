import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { appointmentService } from '../services/appointmentService';
import { AppointmentStatus } from '../db/types';

const bookAppointmentSchema = z.object({
  patientId: z.string().min(1),
  providerId: z.string().min(1),
  departmentId: z.string().optional(),
  scheduledStart: z.string().min(1),
  durationMinutes: z.number().int().positive().optional(),
  reason: z.string().min(1),
});

const updateStatusSchema = z.object({
  status: z.enum([
    'SCHEDULED',
    'CONFIRMED',
    'CHECKED_IN',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ]),
  cancellationReason: z.string().optional(),
});

export const listAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let patientId = req.query.patientId as string | undefined;
    let providerId = req.query.providerId as string | undefined;

    // Record-level isolation: patient sees only their appointments
    if (req.user?.role === 'patient') {
      patientId = req.user.patientId;
    } else if (req.user?.role === 'doctor') {
      // Doctor can query own or patient
      if (!patientId && !providerId) {
        providerId = req.user.providerId;
      }
    }

    const appointments = await appointmentService.listAppointments({
      patientId,
      providerId,
      departmentId: req.query.departmentId as string,
      status: req.query.status as AppointmentStatus,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });

    res.status(200).json({ data: appointments });
  } catch (err) {
    next(err);
  }
};

export const getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apt = await appointmentService.getAppointmentById(req.params.id);
    res.status(200).json({ data: apt });
  } catch (err) {
    next(err);
  }
};

export const bookAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = bookAppointmentSchema.parse(req.body);

    // If patient, ensure they only book for themselves
    if (req.user?.role === 'patient' && req.user.patientId) {
      data.patientId = req.user.patientId;
    }

    const apt = await appointmentService.bookAppointment(data, req.user?.id);
    res.status(201).json({ data: apt });
  } catch (err) {
    next(err);
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, cancellationReason } = updateStatusSchema.parse(req.body);
    const apt = await appointmentService.updateAppointmentStatus(req.params.id, status, {
      cancellationReason,
      userId: req.user?.id,
    });
    res.status(200).json({ data: apt });
  } catch (err) {
    next(err);
  }
};

export const addToWaitingList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      patientId: z.string().min(1),
      departmentId: z.string().min(1),
      providerId: z.string().optional(),
      preferredDateStart: z.string().min(1),
      preferredDateEnd: z.string().min(1),
      priority: z.number().int().optional(),
    });
    const data = schema.parse(req.body);
    const entry = await appointmentService.addToWaitingList(data);
    res.status(201).json({ data: entry });
  } catch (err) {
    next(err);
  }
};

export const listWaitingList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deptId = req.query.departmentId as string | undefined;
    const list = await appointmentService.listWaitingList(deptId);
    res.status(200).json({ data: list });
  } catch (err) {
    next(err);
  }
};
