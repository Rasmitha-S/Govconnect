import { Router } from 'express';
import {
  AuthController,
  registerSchema,
  registerOfficerSchema,
  registerAdminSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public Citizen Registration (Explicitly CITIZEN role, never accepts client-provided role)
router.post('/register', validateRequest(registerSchema), AuthController.register);

// Department Officer Registration (Creates OFFICER with PENDING_APPROVAL)
router.post('/register/officer', validateRequest(registerOfficerSchema), AuthController.registerOfficer);

// Central Administrator Registration (Creates CENTRAL_ADMIN with PENDING_APPROVAL)
router.post('/register/admin', validateRequest(registerAdminSchema), AuthController.registerAdmin);

router.get('/verify-email', AuthController.verifyEmail);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), AuthController.resetPassword);
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), AuthController.changePassword);
router.get('/me', authenticate, AuthController.me);
router.post('/logout', authenticate, AuthController.logout);

export default router;
