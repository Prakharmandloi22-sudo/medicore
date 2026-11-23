import { Router } from 'express';
import authRoutes from './authRoutes';
import patientRoutes from './patientRoutes';
import departmentRoutes from './departmentRoutes';
import appointmentRoutes from './appointmentRoutes';
import encounterRoutes from './encounterRoutes';
import clinicalRoutes from './clinicalRoutes';
import billingRoutes from './billingRoutes';
import consentRoutes from './consentRoutes';
import auditRoutes from './auditRoutes';
import fhirRoutes from './fhirRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/departments', departmentRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/encounters', encounterRoutes);
router.use('/clinical', clinicalRoutes);
router.use('/billing', billingRoutes);
router.use('/consents', consentRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/fhir', fhirRoutes);
router.use('/notifications', notificationRoutes);

export default router;
