import { Router } from 'express';
import { listAuditLogs } from '../controllers/auditController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

// Audit logs are restricted to Administrator only
router.get('/', requireRole(['admin']), listAuditLogs);

export default router;
