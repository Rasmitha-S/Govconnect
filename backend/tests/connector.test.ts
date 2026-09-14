import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { DataStandardizerService } from '../src/services/standardizer.service.js';
import { ConnectorRegistry } from '../src/connectors/connector.registry.js';

const app = createApp();

describe('Interoperability Connectors & Data Standardization', () => {
  const all18Connectors = [
    'AADHAAR',
    'DIGILOCKER',
    'TN_ESEVAI',
    'REVENUE',
    'WATER',
    'ABDM',
    'EDUCATION',
    'EPFO',
    'PM_KISAN',
    'E_SHRAM',
    'VOTER_SERVICES',
    'MYSCHEME',
    'UMANG',
    'PARIVAHAN',
    'CPGRAMS',
    'SSO',
    'PAYMENT',
    'INCOME_TAX',
  ];

  it('ConnectorRegistry should register and recognize all 18 government platform connectors', () => {
    const registry = ConnectorRegistry.getInstance();
    const registered = registry.getAllConnectors();
    const registeredCodes = registered.map((c) => c.code);

    for (const code of all18Connectors) {
      expect(registeredCodes).toContain(code);
      const conn = registry.getConnector(code);
      expect(conn).toBeDefined();
      expect(conn?.platformName).toBeTruthy();
      expect(conn?.capabilities.length).toBeGreaterThan(0);
    }
    expect(registered.length).toBe(18);
  });

  it('GET /api/connectors - should list all 18 platform connectors in database', async () => {
    const res = await request(app).get('/api/connectors');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(18);
  });

  it('GET /api/connectors/REVENUE/health - should return operational status for Revenue connector', async () => {
    const res = await request(app).get('/api/connectors/REVENUE/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe('REVENUE');
  });

  it('All 18 connectors should execute health check successfully without crashing', async () => {
    const registry = ConnectorRegistry.getInstance();
    for (const code of all18Connectors) {
      const conn = registry.getConnector(code);
      expect(conn).toBeDefined();
      const health = await conn!.healthCheck();
      expect(health.connectorName).toBe(conn!.name);
      expect(health.success).toBe(true);
      expect(health.latencyMs).toBeGreaterThan(0);
    }
  });

  it('DataStandardizerService.standardizeRevenueProperty - should transform legacy snake_case into GovConnect canonical model', () => {
    const rawLegacy = {
      property_owner: 'Kavitha Sundaram',
      property_no: 'TN-COI-2026-88192',
      door_no: '18/B',
      street_name: 'Avinashi Road',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641004',
      tax_clearance_status: 'CLEARED',
      property_tax_paid: true,
      last_paid_year: '2025-2026',
    };

    const canonical = DataStandardizerService.standardizeRevenueProperty(rawLegacy);

    expect(canonical.ownerName).toBe('Kavitha Sundaram');
    expect(canonical.propertyId).toBe('TN-COI-2026-88192');
    expect(canonical.taxClearanceStatus).toBe('CLEARED');
    expect(canonical.address.city).toBe('Coimbatore');
    expect(canonical.isVerified).toBe(true);
  });
});

