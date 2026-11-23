import { Router } from 'express';
import { listDepartments, listProviders, listStaff } from '../controllers/departmentController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', listDepartments);
router.get('/providers', listProviders);
router.get('/staff', requireRole(['admin']), listStaff);

export default router;
