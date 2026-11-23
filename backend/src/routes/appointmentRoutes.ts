import { Router } from 'express';
import {
  listAppointments,
  getAppointmentById,
  bookAppointment,
  updateAppointmentStatus,
  addToWaitingList,
  listWaitingList,
} from '../controllers/appointmentController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', listAppointments);
router.get('/waiting-list', requireRole(['receptionist', 'admin']), listWaitingList);
router.post('/waiting-list', requireRole(['receptionist', 'admin']), addToWaitingList);
router.get('/:id', getAppointmentById);

// Booking allowed for receptionist, admin, and patient (self-booking)
router.post(
  '/',
  requireRole(['receptionist', 'doctor', 'patient', 'admin']),
  bookAppointment
);

// Updating status (Check-in by receptionist/nurse, cancellation by receptionist/doctor/patient)
router.patch(
  '/:id/status',
  requireRole(['receptionist', 'nurse', 'doctor', 'patient', 'admin']),
  updateAppointmentStatus
);

export default router;
