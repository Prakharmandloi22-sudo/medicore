import { Router } from 'express';
import { sendNotification, listNotifications } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole(['admin']), listNotifications);
router.post('/send', requireRole(['admin', 'receptionist', 'doctor', 'nurse']), sendNotification);

export default router;
