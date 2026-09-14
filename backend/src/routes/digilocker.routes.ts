import { Router } from 'express';
import { DigiLockerController } from '../controllers/digilocker.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const digiLockerRoutes = Router();

// Public status check
digiLockerRoutes.get('/status', DigiLockerController.getStatus);

// Public OAuth redirect callback from DigiLocker
digiLockerRoutes.get('/callback', DigiLockerController.handleCallback);

// Authenticated citizen consent operations
digiLockerRoutes.post('/initiate', authenticate, DigiLockerController.initiateConsent);
digiLockerRoutes.post('/consent/initiate', authenticate, DigiLockerController.initiateConsent);
digiLockerRoutes.post('/complete-representative', authenticate, DigiLockerController.completeRepresentative);
digiLockerRoutes.get('/session/:sessionId', authenticate, DigiLockerController.getSessionData);
digiLockerRoutes.post('/deny', authenticate, DigiLockerController.denyConsent);
digiLockerRoutes.post('/consent/deny', authenticate, DigiLockerController.denyConsent);
digiLockerRoutes.post('/revoke', authenticate, DigiLockerController.revokeConsent);
digiLockerRoutes.post('/revoke/:consentId', authenticate, DigiLockerController.revokeConsent);

