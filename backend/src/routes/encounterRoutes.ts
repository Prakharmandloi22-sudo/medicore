import { Router } from 'express';
import {
  listEncounters,
  getEncounterById,
  createEncounter,
  completeEncounter,
  recordVitals,
} from '../controllers/encounterController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { authorizePatientAccess } from '../middleware/recordAccess';
import { requireActiveConsent } from '../middleware/consentCheck';

const router = Router();

router.use(authenticateToken);

// Clinical staff and patients (own records) can view encounters
router.get('/', listEncounters);
router.get('/:id', authorizePatientAccess, getEncounterById);

// Start encounter (Doctor, Nurse, Admin) - Requires active TREATMENT consent
router.post(
  '/',
  requireRole(['doctor', 'nurse', 'admin']),
  requireActiveConsent('TREATMENT'),
  createEncounter
);

// Complete encounter (Doctor, Admin)
router.post(
  '/:id/complete',
  requireRole(['doctor', 'admin']),
  completeEncounter
);

// Record vitals (Nurse, Doctor, Admin)
router.post(
  '/:id/vitals',
  requireRole(['nurse', 'doctor', 'admin']),
  recordVitals
);

export default router;
