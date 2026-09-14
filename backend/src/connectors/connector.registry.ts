import { BaseGovernmentConnector } from './base.connector.js';
import { AadhaarConnector } from './aadhaar.connector.js';
import { DigiLockerConnector } from './digilocker.connector.js';
import { TnESevaiConnector } from './tn_esevai.connector.js';
import { RevenueConnector } from './revenue.connector.js';
import { WaterConnector } from './water.connector.js';
import { AbdmConnector } from './abdm.connector.js';
import { EducationConnector } from './education.connector.js';
import { EpfoConnector } from './epfo.connector.js';
import { PmKisanConnector } from './pm_kisan.connector.js';
import { EShramConnector } from './e_shram.connector.js';
import { VoterServicesConnector } from './voter_services.connector.js';
import { MySchemeConnector } from './myscheme.connector.js';
import { UmangConnector } from './umang.connector.js';
import { ParivahanConnector } from './parivahan.connector.js';
import { CpgramsConnector } from './cpgrams.connector.js';
import { SsoConnector } from './sso.connector.js';
import { PaymentConnector } from './payment.connector.js';
import { IncomeTaxConnector } from './income_tax.connector.js';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors: Map<string, BaseGovernmentConnector> = new Map();

  private constructor() {
    // Register all 18 Government Platform Connectors
    this.registerConnector(new AadhaarConnector());
    this.registerConnector(new DigiLockerConnector());
    this.registerConnector(new TnESevaiConnector());
    this.registerConnector(new RevenueConnector());
    this.registerConnector(new WaterConnector());
    this.registerConnector(new AbdmConnector());
    this.registerConnector(new EducationConnector());
    this.registerConnector(new EpfoConnector());
    this.registerConnector(new PmKisanConnector());
    this.registerConnector(new EShramConnector());
    this.registerConnector(new VoterServicesConnector());
    this.registerConnector(new MySchemeConnector());
    this.registerConnector(new UmangConnector());
    this.registerConnector(new ParivahanConnector());
    this.registerConnector(new CpgramsConnector());
    this.registerConnector(new SsoConnector());
    this.registerConnector(new PaymentConnector());
    this.registerConnector(new IncomeTaxConnector());
  }

  public static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  public registerConnector(connector: BaseGovernmentConnector) {
    this.connectors.set(connector.code.toUpperCase(), connector);
  }

  public getConnector<T extends BaseGovernmentConnector = BaseGovernmentConnector>(code: string): T | undefined {
    return this.connectors.get(code.toUpperCase()) as T | undefined;
  }

  public getAllConnectors(): BaseGovernmentConnector[] {
    return Array.from(this.connectors.values());
  }

  /**
   * Syncs connectors state with DB and runs health checks for all 18 platforms
   */
  public async syncAndHealthCheckAll() {
    const results = [];
    for (const connector of this.connectors.values()) {
      try {
        const health = await connector.healthCheck();

        await prisma.connector.upsert({
          where: { code: connector.code },
          update: {
            name: connector.name,
            type: connector.type,
            description: connector.description,
            healthStatus: health.success ? 'OPERATIONAL' : 'DEGRADED_OR_OFFLINE',
            lastHealthCheck: new Date(),
          },
          create: {
            code: connector.code,
            name: connector.name,
            type: connector.type,
            description: connector.description,
            status: 'HEALTHY',
            healthStatus: health.success ? 'OPERATIONAL' : 'DEGRADED_OR_OFFLINE',
            avgLatencyMs: health.latencyMs,
            totalRequests: 0,
            errorCount: 0,
            simulatedMode: 'REPRESENTATIVE_ADAPTER',
            failureRate: 0.0,
          },
        });

        results.push({ code: connector.code, health });
      } catch (err) {
        logger.error({ err, code: connector.code }, 'Error health checking connector');
      }
    }
    return results;
  }

  /**
   * Sets connector reliability testing status (Healthy, Degraded, Offline)
   */
  public async setConnectorSimulationStatus(code: string, status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE', failureRate = 0.0) {
    const updated = await prisma.connector.update({
      where: { code: code.toUpperCase() },
      data: {
        status,
        failureRate: status === 'OFFLINE' ? 1.0 : status === 'DEGRADED' ? (failureRate || 0.5) : 0.0,
        lastHealthCheck: new Date(),
      },
    });
    return updated;
  }
}
