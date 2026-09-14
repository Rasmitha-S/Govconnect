import { Router } from 'express';
import {
  OfficerController,
  officerDecisionSchema,
} from '../controllers/officer.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRoles('OFFICER', 'CENTRAL_ADMIN'));

router.get('/applications', OfficerController.listDepartmentApplications);
router.post('/applications/:id/decision', validateRequest(officerDecisionSchema), OfficerController.processDecision);
router.get('/stats', OfficerController.getDepartmentStats);

export default router;
