import { Router } from 'express';
import {
  listInvoices,
  getInvoiceById,
  createInvoice,
  recordPayment,
} from '../controllers/billingController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { authorizePatientAccess } from '../middleware/recordAccess';

const router = Router();

router.use(authenticateToken);

// Invoices
router.get('/', listInvoices);
router.get('/:id', getInvoiceById);

// Create invoice (Billing Officer, Admin)
router.post(
  '/',
  requireRole(['billing_officer', 'admin']),
  createInvoice
);

// Record payment (Billing Officer, Receptionist, Patient, Admin)
router.post(
  '/:id/payments',
  requireRole(['billing_officer', 'receptionist', 'patient', 'admin']),
  recordPayment
);

export default router;
