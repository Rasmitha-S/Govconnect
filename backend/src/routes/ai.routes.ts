import { Router } from 'express';
import {
  AIController,
  serviceDetectSchema,
  assistantChatSchema,
  grievanceClassifySchema,
} from '../controllers/ai.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/service-detect', validateRequest(serviceDetectSchema), AIController.detectService);
router.post('/assistant', optionalAuthenticate, validateRequest(assistantChatSchema), AIController.assistantChat);
router.post('/grievance-classify', validateRequest(grievanceClassifySchema), AIController.classifyGrievance);

export default router;
