import { BaseGovernmentConnector, ConnectorResult } from './base.connector.js';

export class PaymentConnector extends BaseGovernmentConnector {
  public readonly code = 'PAYMENT';
  public readonly name = 'Payment Connector';
  public readonly platformName = 'State e-Treasury & Bharat BillPay / UPI Gateway';
  public readonly type = 'REST' as const;
  public readonly description = 'Integrated Treasury, Bharat BillPay (BBPS) & Digital Payment Processing Gateway';
  public readonly purpose = 'Online fee and service payments';
  public readonly capabilities = ['payment initiation', 'payment status', 'transaction reference', 'payment confirmation'];

  protected baseLatencyMs = 150;

  public async healthCheck(): Promise<ConnectorResult> {
    const latency = await this.simulateLatency();
    const { isHealthy, status } = await this.checkHealthAndReliability();

    return {
      success: isHealthy,
      statusCode: isHealthy ? 200 : 503,
      latencyMs: latency,
      connectorName: this.name,
      platformName: this.platformName,
      timestamp: new Date().toISOString(),
      data: {
        platform: this.platformName,
        status,
        settlementEngine: isHealthy ? 'ONLINE' : 'OFFLINE',
        supportedRails: ['UPI_SWITCH', 'STATE_TREASURY_CHALLAN', 'NETBANKING'],
        currency: 'INR',
      },
    };
  }

  public async processSimulatedPayment(
    applicationNumber: string,
    amount: number,
    paymentMethod: string,
    citizenId: string,
    applicationId?: string
  ): Promise<ConnectorResult> {
    const latency = await this.simulateLatency(80);
    const { isHealthy, status } = await this.checkHealthAndReliability();

    const requestPayload = {
      operation: 'CAPTURE_TREASURY_RECEIPT',
      app_no: applicationNumber,
      amount_inr: amount,
      payment_method: paymentMethod || 'SIMULATED_UPI',
      payer_id: citizenId,
    };

    if (!isHealthy) {
      const errResponse = { error: `Payment Gateway Switch is ${status}` };
      await this.recordTransaction(applicationId, 'PROCESS_PAYMENT', requestPayload, errResponse, 503, latency, false, errResponse.error);
      return {
        success: false,
        statusCode: 503,
        error: `Payment processing switch unavailable (${status})`,
        latencyMs: latency,
        connectorName: this.name,
        platformName: this.platformName,
        timestamp: new Date().toISOString(),
      };
    }

    const txnNumber = `TXN-SIM-2026-${Date.now().toString().slice(-6)}`;
    const gatewayResponse = {
      transaction_id: txnNumber,
      bank_ref_no: `UPI-BNK-${Date.now()}`,
      status: 'SUCCESS',
      amount_paid: amount,
      currency: 'INR',
      head_of_account: '0215-01-102-AA-0001 (Municipal Water Supply Fees)',
      treasury_challan_no: `CHALLAN-TN-${Date.now().toString().slice(-8)}`,
      timestamp: new Date().toISOString(),
    };

    await this.recordTransaction(applicationId, 'PROCESS_PAYMENT', requestPayload, gatewayResponse, 200, latency, true);

    return {
      success: true,
      statusCode: 200,
      data: {
        transactionNumber: txnNumber,
        ...gatewayResponse,
      },
      latencyMs: latency,
      connectorName: this.name,
      platformName: this.platformName,
      timestamp: new Date().toISOString(),
    };
  }
}
