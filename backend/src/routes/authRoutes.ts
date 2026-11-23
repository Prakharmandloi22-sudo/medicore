import { Router } from 'express';
import { login, registerPatient, getCurrentUser, revokeSession } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', registerPatient);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, revokeSession);

export default router;
