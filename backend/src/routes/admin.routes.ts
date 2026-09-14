import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Strictly protected by backend token authentication & CENTRAL_ADMIN role enforcement
router.use(authenticate);
router.use(requireRoles('CENTRAL_ADMIN'));

router.get('/metrics', AdminController.getMetrics);
router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/users', AdminController.listUsers);

// Officer & Administrator Registration Approval Requests
router.get('/registration-requests', AdminController.getRegistrationRequests);
router.post('/registration-requests/:userId/approve', AdminController.approveRegistrationRequest);
router.post('/registration-requests/:userId/reject', AdminController.rejectRegistrationRequest);

export default router;
