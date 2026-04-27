import express from 'express';
import { protect, superAdminOnly } from '../middleware/auth.js';
import {
  getSystemStats, getAllUsers, updateUserRole,
  deleteUser, getAuditLogs, getNgoPerformance,
} from '../controllers/adminController.js';

const router = express.Router();

// All /api/admin routes require: valid JWT + super_admin role
router.use(protect, superAdminOnly);

router.get('/stats',           getSystemStats);
router.get('/users',           getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id',    deleteUser);
router.get('/audit-logs',      getAuditLogs);
router.get('/ngo-performance', getNgoPerformance);

export default router;
