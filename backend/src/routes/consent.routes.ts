import { Router } from 'express';
import { ConsentController } from '../controllers/consent.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', ConsentController.listCitizenConsents);
router.post('/:id/revoke', ConsentController.revokeConsent);
router.get('/:id/history', ConsentController.getConsentAuditHistory);

export default router;
