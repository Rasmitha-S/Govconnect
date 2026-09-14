import { Router } from 'express';
import {
  GrievanceController,
  submitGrievanceSchema,
} from '../controllers/grievance.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(submitGrievanceSchema), GrievanceController.submitGrievance);
router.get('/my', GrievanceController.listCitizenGrievances);
router.get('/department', GrievanceController.listDepartmentGrievances);
router.patch('/:id/resolve', GrievanceController.resolveGrievance);

export default router;
