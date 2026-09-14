import { Request, Response } from 'express';
import { z } from 'zod';
import { DigiLockerService } from '../services/digilocker.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { config } from '../config/env.js';

export const initiateConsentSchema = z.object({
  serviceCode: z.string().min(1, 'Service Code is required'),
  returnUrl: z.string().optional(),
});

export const completeRepresentativeSchema = z.object({
  sessionId: z.string().uuid('Valid Session ID is required'),
});

export const denyConsentSchema = z.object({
  sessionId: z.string().uuid('Valid Session ID is required'),
});

export class DigiLockerController {
  /**
   * GET /api/integrations/digilocker/status
   */
  public static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = DigiLockerService.getStatus();
      res.status(200).json({ success: true, data: status });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message || 'Failed to retrieve DigiLocker status' },
      });
    }
  }

  /**
   * POST /api/integrations/digilocker/initiate
   */
  public static async initiateConsent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const citizenId = req.user!.userId;
      const { serviceCode, returnUrl } = initiateConsentSchema.parse(req.body);

      const result = await DigiLockerService.initiateConsentSession(
        citizenId,
        serviceCode,
        returnUrl,
        req.ip
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: err.errors } });
        return;
      }
      res.status(err.statusCode || 500).json({
        success: false,
        error: { code: err.code || 'INITIATE_FAILED', message: err.message || 'Failed to initiate consent session' },
      });
    }
  }

  /**
   * POST /api/integrations/digilocker/complete-representative
   */
  public static async completeRepresentative(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const citizenId = req.user!.userId;
      const { sessionId } = completeRepresentativeSchema.parse(req.body);

      const result = await DigiLockerService.completeRepresentativeConsent(
        sessionId,
        citizenId,
        req.ip
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: err.errors } });
        return;
      }
      res.status(err.statusCode || 500).json({
        success: false,
        error: { code: err.code || 'COMPLETE_FAILED', message: err.message || 'Failed to complete representative authorization' },
      });
    }
  }

  /**
   * GET /api/integrations/digilocker/callback
   */
  public static async handleCallback(req: Request, res: Response): Promise<void> {
    const { code, state, error, error_description } = req.query;

    if (error) {
      const errMsg = error_description || error;
      res.redirect(`${config.frontendUrl}/services?digilocker_error=${encodeURIComponent(String(errMsg))}`);
      return;
    }

    if (!state) {
      res.status(400).json({ success: false, error: { code: 'MISSING_STATE', message: 'Missing OAuth state token' } });
      return;
    }

    try {
      const result = await DigiLockerService.processOAuthCallback(
        String(code || 'authorized_code'),
        String(state),
        undefined,
        req.ip
      );

      // Redirect back dynamically to the specific application form
      const targetPath = result.returnUrl || (result.serviceCode.startsWith('TRN') ? '/apply/driving-licence' : '/apply/water');
      res.redirect(`${config.frontendUrl}${targetPath}?digilocker_session=${encodeURIComponent(result.sessionId)}`);
    } catch (err: any) {
      res.redirect(`${config.frontendUrl}/services?digilocker_error=${encodeURIComponent(err.message || 'Authorization failed')}`);
    }
  }

  /**
   * GET /api/integrations/digilocker/session/:sessionId
   */
  public static async getSessionData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const citizenId = req.user!.userId;
      const { sessionId } = req.params;

      const result = await DigiLockerService.getSessionAutofillData(sessionId, citizenId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        error: { code: err.code || 'SESSION_ERROR', message: err.message || 'Failed to retrieve session data' },
      });
    }
  }

  /**
   * POST /api/integrations/digilocker/deny
   */
  public static async denyConsent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const citizenId = req.user!.userId;
      const { sessionId } = denyConsentSchema.parse(req.body);

      const result = await DigiLockerService.denyConsent(sessionId, citizenId, req.ip);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: err.errors } });
        return;
      }
      res.status(err.statusCode || 500).json({
        success: false,
        error: { code: err.code || 'DENY_FAILED', message: err.message || 'Failed to deny consent' },
      });
    }
  }

  /**
   * POST /api/integrations/digilocker/revoke (or /revoke/:consentId)
   */
  public static async revokeConsent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const citizenId = req.user!.userId;
      const identifier = req.params.consentId || req.body.consentId || req.body.serviceCode;

      if (!identifier) {
        res.status(400).json({ success: false, error: { code: 'MISSING_IDENTIFIER', message: 'consentId or serviceCode is required' } });
        return;
      }

      const result = await DigiLockerService.revokeAccess(identifier, citizenId, req.ip);

      res.status(200).json({
        success: true,
        message: 'DigiLocker access revoked successfully.',
        data: result,
      });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        error: { code: err.code || 'REVOKE_FAILED', message: err.message || 'Failed to revoke consent' },
      });
    }
  }
}
