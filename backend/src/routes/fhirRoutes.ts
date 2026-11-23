import { Router } from 'express';
import {
  exportPatientBundle,
  importFhirBundle,
  getFhirResource,
} from '../controllers/fhirController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { requireActiveConsent } from '../middleware/consentCheck';

const router = Router();

// Export complete Patient Bundle (Requires DATA_SHARING consent)
// Must be registered before parameterized route /:resourceType/:id
router.get(
  '/export/:patientId',
  authenticateToken,
  requireRole(['doctor', 'patient', 'admin']),
  requireActiveConsent('DATA_SHARING'),
  exportPatientBundle
);

// Import synthetic FHIR Bundle
router.post(
  '/import',
  authenticateToken,
  requireRole(['admin']),
  importFhirBundle
);

// Standalone FHIR standard resources (e.g. /Patient/pat-1, /Observation/obs-1)
router.get('/:resourceType/:id', getFhirResource);

export default router;
