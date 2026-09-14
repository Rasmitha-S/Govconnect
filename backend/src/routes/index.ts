import { Router } from 'express';
import authRoutes from './auth.routes.js';
import serviceRoutes from './service.routes.js';
import applicationRoutes from './application.routes.js';
import consentRoutes from './consent.routes.js';
import officerRoutes from './officer.routes.js';
import grievanceRoutes from './grievance.routes.js';
import paymentRoutes from './payment.routes.js';
import adminRoutes from './admin.routes.js';
import aiRoutes from './ai.routes.js';
import connectorRoutes from './connector.routes.js';
import notificationRoutes from './notification.routes.js';
import { digiLockerRoutes } from './digilocker.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/services', serviceRoutes);
router.use('/applications', applicationRoutes);
router.use('/consent', consentRoutes);
router.use('/consents', consentRoutes);
router.use('/officer', officerRoutes);
router.use('/grievances', grievanceRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/ai', aiRoutes);
router.use('/connectors', connectorRoutes);
router.use('/notifications', notificationRoutes);
router.use('/integrations/digilocker', digiLockerRoutes);

export default router;
