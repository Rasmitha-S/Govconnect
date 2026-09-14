import { Router } from 'express';
import {
  ApplicationController,
  waterApplicationSchema,
  drivingLicenceApplicationSchema,
} from '../controllers/application.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/water', validateRequest(waterApplicationSchema), ApplicationController.createWaterApplication);
router.post('/driving-licence', validateRequest(drivingLicenceApplicationSchema), ApplicationController.createDrivingLicenceApplication);
router.post('/:id/sync-status', ApplicationController.syncExternalStatus);
router.get('/', ApplicationController.listCitizenApplications);
router.get('/:id', ApplicationController.getApplicationDetail);
router.get('/:id/timeline', ApplicationController.getApplicationTimeline);

export default router;

