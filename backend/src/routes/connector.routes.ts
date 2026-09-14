import { Router } from 'express';
import { ConnectorController } from '../controllers/connector.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Publicly viewable connector health status
router.get('/', ConnectorController.listConnectors);
router.get('/:id/health', ConnectorController.getConnectorHealth);

// Authenticated triggers and chaos simulation
router.post('/:id/health-check', authenticate, ConnectorController.triggerHealthCheck);
router.post('/:id/simulate-status', authenticate, requireRoles('CENTRAL_ADMIN'), ConnectorController.setFailureSimulation);

export default router;
