import { Router } from 'express';
import {
  listConsents,
  grantConsent,
  revokeConsent,
} from '../controllers/consentController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { authorizePatientAccess } from '../middleware/recordAccess';

const router = Router();

router.use(authenticateToken);

router.get('/:patientId', authorizePatientAccess, listConsents);
router.post('/', grantConsent);
router.post(
  '/:id/revoke',
  requireRole(['patient', 'admin']),
  revokeConsent
);

export default router;
