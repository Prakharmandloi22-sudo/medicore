import { Router } from 'express';
import {
  addDiagnosis,
  listDiagnoses,
  addPrescription,
  listPrescriptions,
  createLabOrder,
  listLabOrders,
  recordLabResult,
  listLabResults,
} from '../controllers/clinicalController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { authorizePatientAccess } from '../middleware/recordAccess';
import { requireActiveConsent } from '../middleware/consentCheck';

const router = Router();

router.use(authenticateToken);

// Diagnoses
router.get('/diagnoses', authorizePatientAccess, listDiagnoses);
router.post(
  '/diagnoses',
  requireRole(['doctor', 'admin']),
  requireActiveConsent('TREATMENT'),
  addDiagnosis
);

// Prescriptions
router.get('/prescriptions', authorizePatientAccess, listPrescriptions);
router.post(
  '/prescriptions',
  requireRole(['doctor', 'admin']),
  requireActiveConsent('TREATMENT'),
  addPrescription
);

// Lab Orders
router.get('/lab-orders', listLabOrders);
router.post(
  '/lab-orders',
  requireRole(['doctor', 'nurse', 'admin']),
  requireActiveConsent('TREATMENT'),
  createLabOrder
);

// Lab Results
router.get('/lab-results', authorizePatientAccess, listLabResults);
router.post(
  '/lab-results',
  requireRole(['lab_tech', 'admin']),
  recordLabResult
);

export default router;
