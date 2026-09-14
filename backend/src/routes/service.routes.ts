import { Router } from 'express';
import { ServiceController } from '../controllers/service.controller.js';

const router = Router();

router.get('/', ServiceController.listServices);
router.get('/categories', ServiceController.listCategories);
router.get('/departments', ServiceController.listDepartments);
router.get('/:id', ServiceController.getServiceById);

export default router;
