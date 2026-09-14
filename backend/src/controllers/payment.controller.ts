import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ConnectorRegistry } from '../connectors/connector.registry.js';
import { PaymentConnector } from '../connectors/payment.connector.js';
import { WorkflowService } from '../workflows/workflow.service.js';

export const paymentSimulateSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  amount: z.number().min(1, 'Payment amount must be greater than 0'),
  paymentMethod: z.enum(['SIMULATED_UPI', 'SIMULATED_NETBANKING', 'TREASURY_CHALLAN']).default('SIMULATED_UPI'),
});

export class PaymentController {
  public static async simulatePayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    const citizenId = req.user!.userId;
    const { applicationId, amount, paymentMethod } = req.body;

    const application = await prisma.application.findFirst({
      where: {
        OR: [{ id: applicationId }, { applicationNumber: applicationId }],
        citizenId,
      },
      include: { service: true, department: true },
    });

    if (!application) {
      res.status(404).json({
        success: false,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found or unauthorized.' },
      });
      return;
    }

    // Call Payment Connector
    const registry = ConnectorRegistry.getInstance();
    const paymentConn = registry.getConnector<PaymentConnector>('PAYMENT');

    if (!paymentConn) {
      res.status(500).json({ success: false, error: { code: 'GATEWAY_ERROR', message: 'Payment gateway unconfigured.' } });
      return;
    }

    const payResult = await paymentConn.processSimulatedPayment(
      application.applicationNumber,
      amount,
      paymentMethod,
      citizenId,
      application.id
    );

    if (!payResult.success) {
      res.status(503).json({
        success: false,
        error: { code: 'PAYMENT_FAILED', message: payResult.error || 'Payment gateway simulation failed.' },
      });
      return;
    }

    // Record in DB Payment table
    const payment = await prisma.payment.create({
      data: {
        transactionNumber: payResult.data.transactionNumber,
        applicationId: application.id,
        citizenId,
        amount,
        currency: 'INR',
        status: 'SUCCESS',
        paymentMethod,
        gatewayResponse: JSON.stringify(payResult.data),
      },
    });

    // Advance workflow state and issue connection work order
    await WorkflowService.completePaymentAndProvisioning(application.id, {
      transactionNumber: payment.transactionNumber,
      amount,
      paymentMethod,
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Payment verified and connection work order provisioned successfully!',
        payment,
        gatewayDetails: payResult.data,
      },
    });
  }
}
