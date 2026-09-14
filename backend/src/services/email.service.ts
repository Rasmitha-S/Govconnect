import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class EmailService {
  /**
   * Sends or previews verification email
   */
  public static async sendVerificationEmail(email: string, fullName: string, token: string): Promise<void> {
    const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    // In simulated environment: log dispatch preview
    logger.info(
      `
============================================================
[EMAIL DISPATCH SIMULATION] - EMAIL VERIFICATION
To: ${fullName} <${email}>
Subject: Verify your GovConnect Citizen Account
Link: ${verifyUrl}
Token: ${token}
============================================================
      `.trim()
    );
  }

  /**
   * Sends or previews password reset email
   */
  public static async sendPasswordResetEmail(email: string, fullName: string, token: string): Promise<void> {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    logger.info(
      `
============================================================
[EMAIL DISPATCH SIMULATION] - PASSWORD RESET
To: ${fullName} <${email}>
Subject: GovConnect Password Reset Request
Link: ${resetUrl}
Token: ${token}
============================================================
      `.trim()
    );
  }
}
