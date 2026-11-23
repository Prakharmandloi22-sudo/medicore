import { Router } from 'express';
import {
  listPatients,
  getPatientById,
  createPatient,
  updatePatient,
  getPatientChart,
} from '../controllers/patientController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { authorizePatientAccess } from '../middleware/recordAccess';
import { auditMiddleware } from '../middleware/auditLogger';

const router = Router();

router.use(authenticateToken);

// Receptionist, Doctor, Nurse, Admin can list patients; Patient gets only their own
router.get('/', listPatients);

// Patient creation (Receptionist, Admin)
router.post(
  '/',
  requireRole(['receptionist', 'admin']),
  auditMiddleware('CREATE', 'PATIENT'),
  createPatient
);

// Get specific patient (Record-level authorization prevents IDOR)
router.get('/:id', authorizePatientAccess, getPatientById);

// Update patient
router.patch(
  '/:id',
  authorizePatientAccess,
  requireRole(['receptionist', 'nurse', 'doctor', 'admin']),
  auditMiddleware('UPDATE', 'PATIENT'),
  updatePatient
);

// Comprehensive clinical chart (Requires clinical roles or patient self-view)
router.get(
  '/:id/chart',
  authorizePatientAccess,
  requireRole(['doctor', 'nurse', 'patient', 'admin']),
  getPatientChart
);

export default router;
