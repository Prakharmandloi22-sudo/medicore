import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { billingService } from '../services/billingService';

const createInvoiceSchema = z.object({
  patientId: z.string().min(1),
  encounterId: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string().min(1),
      category: z.string().min(1),
      unitPrice: z.number().positive(),
      quantity: z.number().int().positive().optional(),
    })
  ).min(1),
  copayAmount: z.number().nonnegative().optional(),
  insuranceCovered: z.number().nonnegative().optional(),
  dueDate: z.string().optional(),
});

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.string().min(1),
  transactionReference: z.string().optional(),
});

export const listInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let patientId = req.query.patientId as string | undefined;
    if (req.user?.role === 'patient') {
      patientId = req.user.patientId;
    }
    const invoices = await billingService.listInvoices(patientId);
    res.status(200).json({ data: invoices });
  } catch (err) {
    next(err);
  }
};

export const getInvoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoice = await billingService.getInvoiceById(req.params.id);
    if (req.user?.role === 'patient' && req.user.patientId && invoice.patient_id !== req.user.patientId) {
      res.status(403).json({ error: { code: 'ACCESS_DENIED', message: 'Patients can only view their own invoices.' } });
      return;
    }
    res.status(200).json({ data: invoice });
  } catch (err) {
    next(err);
  }
};

export const createInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createInvoiceSchema.parse(req.body);
    const invoice = await billingService.createInvoice(data, req.user?.id);
    res.status(201).json({ data: invoice });
  } catch (err) {
    next(err);
  }
};

export const recordPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = paymentSchema.parse(req.body);
    const result = await billingService.recordPayment(data, req.user?.id);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};
