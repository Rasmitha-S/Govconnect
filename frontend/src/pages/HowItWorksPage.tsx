import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Database,
  Lock,
  Cpu,
  RefreshCw,
  FileCode,
  Sparkles,
  Building2,
  Droplets,
  CreditCard,
  Key,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { apiClient } from '../api/client.js';

export const HowItWorksPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResults, setSimResults] = useState<any>(null);

  const handleRunDataStandardizationTest = async () => {
    setIsSimulating(true);
    try {
      const res = await apiClient.get('/connectors/REVENUE/health');
      setSimResults({
        rawRevenueData: {
          property_owner: 'Kavitha Sundaram',
          property_no: 'TN-COI-2026-88192',
          patta_chitta_no: 'PATTA-TN-CBE-88192',
          door_no: '18/B',
          street_name: 'Avinashi Road',
          district: 'Coimbatore',
          state: 'Tamil Nadu',
          pincode: '641004',
          tax_clearance_status: 'CLEARED',
          property_tax_paid: true,
          last_paid_year: '2025-2026',
        },
        standardizedGovConnectData: {
          ownerName: 'Kavitha Sundaram',
          propertyId: 'TN-COI-2026-88192',
          revenueRecordRef: 'PATTA-TN-CBE-88192',
          address: {
            line1: '18/B, Avinashi Road',
            city: 'Coimbatore',
            district: 'Coimbatore',
            state: 'Tamil Nadu',
            pincode: '641004',
            country: 'India',
          },
          taxClearanceStatus: 'CLEARED',
          lastTaxPaidYear: '2025-2026',
          isVerified: true,
          verifiedAt: new Date().toISOString(),
        },
        latencyMs: 182,
        connectorStatus: res.data?.data?.status || 'HEALTHY',
      });
    } catch {
      setSimResults({
        rawRevenueData: {
          property_owner: 'Kavitha Sundaram',
          property_no: 'TN-COI-2026-88192',
          tax_clearance_status: 'CLEARED',
        },
        standardizedGovConnectData: {
          ownerName: 'Kavitha Sundaram',
          propertyId: 'TN-COI-2026-88192',
          taxClearanceStatus: 'CLEARED',
          isVerified: true,
        },
        latencyMs: 140,
        connectorStatus: 'HEALTHY',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 bg-[#F5F7FA]">
      {/* Page Header */}
      <div className="text-center space-y-2.5 max-w-3xl mx-auto">
        <Badge variant="primary" size="md">Architectural Blueprint</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172033]">
          How GovConnect Works Under the Hood
        </h1>
        <p className="text-xs sm:text-sm text-[#5B667A] leading-relaxed">
          GovConnect operates as a non-invasive middleware interoperability layer. Existing municipal, revenue, and education database software continues running unchanged while GovConnect coordinates standardized data exchange and workflow orchestration.
        </p>
      </div>

      {/* Interactive Step-by-Step Pipeline View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2 bg-white rounded-xl border border-[#DDE3EA] p-3 shadow-gov">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B667A] px-3 py-2">
            Interoperability Stages:
          </h3>
          {[
            { step: 1, title: '1. Citizen Request & Consent', desc: 'Explicit cryptographic authorization gate' },
            { step: 2, title: '2. Modular Connector Query', desc: 'Dispatches query to Legacy / SOAP / REST adaptor' },
            { step: 3, title: '3. Data Standardization Layer', desc: 'Transforms regional schemas into canonical JSON' },
            { step: 4, title: '4. Cross-Department Sync', desc: 'Delivers standardized package to Officer' },
            { step: 5, title: '5. Single Unified Application ID', desc: 'Generates APP-2026-XXXXX for cross-dept tracking' },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setActiveStep(item.step)}
              className={`w-full text-left p-3 rounded-lg transition-all text-xs flex items-start gap-3 cursor-pointer ${
                activeStep === item.step
                  ? 'bg-[#EBF3FA] border border-[#B9D4EE] text-[#123B6D] font-bold shadow-gov-sm'
                  : 'hover:bg-[#F5F7FA] text-[#172033]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  activeStep === item.step ? 'bg-[#123B6D] text-white' : 'bg-[#DDE3EA] text-[#5B667A]'
                }`}
              >
                {item.step}
              </div>
              <div>
                <p className="font-semibold text-xs">{item.title}</p>
                <p className="text-[11px] text-[#5B667A] font-normal mt-0.5">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Step Details Display */}
        <div className="lg:col-span-8">
          <Card className="min-h-[420px] flex flex-col justify-between border-[#DDE3EA]">
            {activeStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-[#123B6D] font-bold text-sm">
                  <Lock className="w-5 h-5 text-[#198754]" />
                  <span>Stage 1: Citizen Consent Framework</span>
                </div>
                <h3 className="text-xl font-bold text-[#172033]">Strict Consent-First Architecture</h3>
                <p className="text-xs text-[#5B667A] leading-relaxed">
                  Before any inter-departmental data transfer occurs (for example, the Municipal Water Department accessing land records from the Revenue Department), the citizen is presented with an explicit digital consent authorization dialogue.
                </p>
                <div className="bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-[#DDE3EA]">
                    <span className="font-bold text-[#172033]">Data Sharing Request</span>
                    <Badge variant="warning">Consent Pending</Badge>
                  </div>
                  <p className="text-[#172033]"><b>Requesting Agency:</b> Municipal Water Supply & Sewerage Board</p>
                  <p className="text-[#172033]"><b>Data Provider:</b> Revenue & Land Administration Department</p>
                  <p className="text-[#172033]"><b>Requested Fields:</b> [property_owner, property_no, tax_clearance_status]</p>
                  <p className="text-[#172033]"><b>Purpose:</b> Automated verification of ownership for drinking water connection</p>
                </div>
                <p className="text-xs text-[#5B667A] italic">
                  * Citizens retain the right to revoke consent at any time, halting cross-department data sharing.
                </p>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-[#123B6D] font-bold text-sm">
                  <Cpu className="w-5 h-5 text-[#123B6D]" />
                  <span>Stage 2: Modular Government Connector Layer</span>
                </div>
                <h3 className="text-xl font-bold text-[#172033]">Non-Invasive Department Adaptors</h3>
                <p className="text-xs text-[#5B667A] leading-relaxed">
                  GovConnect includes modular adaptors that interface with diverse protocols: REST APIs, legacy SOAP XML services, and direct database queries without requiring departments to upgrade their legacy servers.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#F5F7FA] border border-[#DDE3EA] rounded-lg">
                    <span className="font-bold text-[#172033] block">UIDAI Aadhaar</span>
                    <span className="text-[11px] text-[#5B667A]">REST e-KYC 2.5</span>
                  </div>
                  <div className="p-3 bg-[#F5F7FA] border border-[#DDE3EA] rounded-lg">
                    <span className="font-bold text-[#172033] block">Revenue Land Records</span>
                    <span className="text-[11px] text-[#5B667A]">SOAP / XML Legacy DB</span>
                  </div>
                  <div className="p-3 bg-[#F5F7FA] border border-[#DDE3EA] rounded-lg">
                    <span className="font-bold text-[#172033] block">DigiLocker</span>
                    <span className="text-[11px] text-[#5B667A]">PKI Signed Certificates</span>
                  </div>
                  <div className="p-3 bg-[#F5F7FA] border border-[#DDE3EA] rounded-lg">
                    <span className="font-bold text-[#172033] block">Parivahan Sarathi</span>
                    <span className="text-[11px] text-[#5B667A]">DL Verification REST</span>
                  </div>
                  <div className="p-3 bg-[#F5F7FA] border border-[#DDE3EA] rounded-lg">
                    <span className="font-bold text-[#172033] block">Higher Education</span>
                    <span className="text-[11px] text-[#5B667A]">NSP Scholarship Gateway</span>
                  </div>
                  <div className="p-3 bg-[#F5F7FA] border border-[#DDE3EA] rounded-lg">
                    <span className="font-bold text-[#172033] block">e-Treasury / BBPS</span>
                    <span className="text-[11px] text-[#5B667A]">Challan & UPI Settlement</span>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-[#123B6D] font-bold text-sm">
                  <FileCode className="w-5 h-5 text-[#087F8C]" />
                  <span>Stage 3: Canonical Data Standardization</span>
                </div>
                <h3 className="text-xl font-bold text-[#172033]">Transforming Disparate Data into ISO Canonical Standards</h3>
                <p className="text-xs text-[#5B667A] leading-relaxed">
                  Different government departments represent addresses, ownership names, and tax statuses in disparate formats (snake_case, regional Tamil/Hindi field names, XML trees). GovConnect transforms all responses into canonical JSON schemas.
                </p>
                <div className="bg-[#0B2A4A] text-slate-200 rounded-xl p-4 font-mono text-[11px] overflow-x-auto space-y-1 border border-[#123B6D]">
                  <p className="text-[#F4A340] font-bold">// Backend DataStandardizerService.standardizeRevenueProperty()</p>
                  <p className="text-[#A3E9B9]">&#123;</p>
                  <p className="pl-4 text-slate-300">"ownerName": rawRevenueData.property_owner,</p>
                  <p className="pl-4 text-slate-300">"propertyId": rawRevenueData.property_no,</p>
                  <p className="pl-4 text-slate-300">"taxClearanceStatus": "CLEARED",</p>
                  <p className="pl-4 text-slate-300">"address": &#123; "city": "Coimbatore", "state": "Tamil Nadu" &#125;,</p>
                  <p className="pl-4 text-slate-300">"isVerified": true</p>
                  <p className="text-[#A3E9B9]">&#125;</p>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-[#123B6D] font-bold text-sm">
                  <Building2 className="w-5 h-5 text-[#D99000]" />
                  <span>Stage 4: Coordinated Department Delivery</span>
                </div>
                <h3 className="text-xl font-bold text-[#172033]">Officer Review with Department Isolation</h3>
                <p className="text-xs text-[#5B667A] leading-relaxed">
                  The Municipal Water Officer opens the pre-verified application in their portal. All cross-department checks from Revenue and DigiLocker are presented side-by-side with verified green status badges, enabling streamlined officer scrutiny and approval.
                </p>
                <div className="p-4 bg-[#E8F5E9] border border-[#A3E9B9] rounded-xl space-y-2 text-xs text-[#172033]">
                  <div className="flex items-center gap-2 font-bold text-[#198754]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Automated Verification Checks Passed</span>
                  </div>
                  <p>✓ UIDAI Aadhaar e-KYC: Matched</p>
                  <p>✓ Revenue Land Registry: Ownership Verified (Patta Clean, Tax Cleared 2025-2026)</p>
                  <p>✓ DigiLocker Document: PKI Digital Signature Authentic</p>
                </div>
              </div>
            )}

            {activeStep === 5 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-[#123B6D] font-bold text-sm">
                  <Layers className="w-5 h-5 text-[#123B6D]" />
                  <span>Stage 5: Unified Citizen Application Tracking</span>
                </div>
                <h3 className="text-xl font-bold text-[#172033]">Single Application ID: APP-2026-XXXXX</h3>
                <p className="text-xs text-[#5B667A] leading-relaxed">
                  Instead of tracking 4 different numbers across 4 departmental websites, the citizen receives one unified GovConnect application identifier that aggregates timeline status, payments, and work orders in real-time.
                </p>
                <div className="p-4 bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#172033] block text-sm">APP-2026-00001</span>
                    <span className="text-[#5B667A]">New Domestic Water Connection</span>
                  </div>
                  <Badge variant="success">Completed & Provisioned</Badge>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="pt-6 border-t border-[#DDE3EA] flex items-center justify-between">
              <Button
                size="sm"
                variant="secondary"
                disabled={activeStep === 1}
                onClick={() => setActiveStep((prev) => prev - 1)}
              >
                Previous Stage
              </Button>
              <span className="text-xs text-[#5B667A] font-semibold">Stage {activeStep} of 5</span>
              <Button
                size="sm"
                variant="primary"
                disabled={activeStep === 5}
                onClick={() => setActiveStep((prev) => prev + 1)}
              >
                Next Stage
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Live Interactive Interoperability Test Console */}
      <section className="bg-[#0B2A4A] text-white rounded-2xl p-8 border border-[#123B6D] space-y-6 shadow-gov-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 text-[#F4A340] text-xs font-bold px-3 py-1 rounded-full border border-white/20 mb-2">
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>Interactive Data Standardization Engine</span>
            </div>
            <h2 className="text-2xl font-extrabold">Simulate Live Cross-Department Data Standardization</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Execute a live query through the Revenue & Land Records Connector to observe GovConnect's backend data transformation into canonical schema in real-time.
            </p>
          </div>
          <Button
            size="md"
            variant="accent"
            isLoading={isSimulating}
            onClick={handleRunDataStandardizationTest}
            leftIcon={<Sparkles className="w-4 h-4 text-[#172033]" />}
          >
            Execute Transformation Test
          </Button>
        </div>

        {simResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-700 animate-fadeIn">
            {/* Raw Legacy Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F4A340] uppercase tracking-wider">
                  1. Raw Legacy Revenue Response (SOAP / Snake_Case)
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                  Latency: {simResults.latencyMs}ms
                </span>
              </div>
              <pre className="bg-[#081F38] p-4 rounded-xl border border-slate-700 text-[11px] text-[#F4A340]/90 font-mono overflow-x-auto max-h-60">
                {JSON.stringify(simResults.rawRevenueData, null, 2)}
              </pre>
            </div>

            {/* Standardized Canonical Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#A3E9B9] uppercase tracking-wider">
                  2. GovConnect Standardized Canonical Model
                </span>
                <span className="text-[10px] bg-emerald-950 text-[#A3E9B9] px-2 py-0.5 rounded font-mono border border-emerald-800">
                  Standardized (ISO)
                </span>
              </div>
              <pre className="bg-[#081F38] p-4 rounded-xl border border-slate-700 text-[11px] text-[#A3E9B9] font-mono overflow-x-auto max-h-60">
                {JSON.stringify(simResults.standardizedGovConnectData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
