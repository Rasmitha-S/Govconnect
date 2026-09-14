import { Router } from 'express';
import { PaymentController, paymentSimulateSchema } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/simulate', validateRequest(paymentSimulateSchema), PaymentController.simulatePayment);

export default router;
