import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  FileCheck2,
  Database,
  KeyRound,
  FileText,
  Activity,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Card } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';

export const SecurityPage: React.FC = () => {
  return (
    <div className="bg-[#F5F7FA] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Page Title Header */}
        <div className="text-center space-y-2.5">
          <Badge variant="primary" size="md">Enterprise Security Architecture</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#123B6D] tracking-tight">
            Security & Data Protection
          </h1>
          <p className="text-sm sm:text-base text-[#5B667A] max-w-2xl mx-auto">
            Government-grade security controls, DPDP compliance, and role-based zero-trust architecture.
          </p>
        </div>

        {/* 1. Multi-Role Authentication */}
        <Card className="bg-white border border-[#DDE3EA] p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3FA] text-[#123B6D] flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5 text-[#123B6D]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#172033]">1. Multi-Role Authentication</h2>
              <p className="text-xs text-[#5B667A]">Cryptographic tokens & secure salted password hashing</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#5B667A] leading-relaxed">
            All user sessions are secured using industry-standard JSON Web Tokens (JWT) signed with HMAC-SHA256 secrets. User passwords are encrypted on the backend with bcrypt using a salt round of 10. Sessions expire automatically and support token renewal.
          </p>
        </Card>

        {/* 2. Role-Based Access Control (RBAC) */}
        <Card className="bg-white border border-[#DDE3EA] p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3FA] text-[#087F8C] flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5 text-[#087F8C]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#172033]">2. Strict Role Authorization</h2>
              <p className="text-xs text-[#5B667A]">Enforced directly by backend route middleware</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="bg-[#F5F7FA] border border-[#DDE3EA] p-3 rounded-lg space-y-1">
              <span className="font-bold text-[#123B6D]">CITIZEN</span>
              <p className="text-[#5B667A]">Restricted to own profile, personal applications, and consent ledger.</p>
            </div>
            <div className="bg-[#F5F7FA] border border-[#DDE3EA] p-3 rounded-lg space-y-1">
              <span className="font-bold text-[#087F8C]">DEPARTMENT OFFICER</span>
              <p className="text-[#5B667A]">Scoped exclusively to department applications and assigned verification tasks.</p>
            </div>
            <div className="bg-[#F5F7FA] border border-[#DDE3EA] p-3 rounded-lg space-y-1">
              <span className="font-bold text-[#172033]">CENTRAL ADMIN</span>
              <p className="text-[#5B667A]">Platform-wide audit oversight, officer registration approvals, and connector status.</p>
            </div>
          </div>
        </Card>

        {/* 3. Consent Architecture */}
        <Card className="bg-white border border-[#DDE3EA] p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3FA] text-[#123B6D] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-[#123B6D]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#172033]">3. DPDP 2023 Consent Management</h2>
              <p className="text-xs text-[#5B667A]">Explicit, granular, time-bound and revocable permissions</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#5B667A] leading-relaxed">
            In full compliance with India's Digital Personal Data Protection (DPDP) Act 2023, data access between connected platforms requires explicit citizen authorization. Every consent artifact is tokenized, purpose-bound, and can be revoked by the citizen at any time through their Consent Dashboard.
          </p>
        </Card>

        {/* 4. Tamper-Evident Audit Logs */}
        <Card className="bg-white border border-[#DDE3EA] p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3FA] text-[#087F8C] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 text-[#087F8C]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#172033]">4. Tamper-Evident Audit Ledger</h2>
              <p className="text-xs text-[#5B667A]">Cryptographic traceability for every transaction and query</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#5B667A] leading-relaxed">
            Every critical event—including logins, consent grants/revocations, officer decisions, document lookups, and administrator approvals—is recorded in an append-only audit trail with IP address, actor role, timestamp, and entity references.
          </p>
        </Card>

        {/* 5. Secure Connectors */}
        <Card className="bg-white border border-[#DDE3EA] p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3FA] text-[#123B6D] flex items-center justify-center font-bold">
              <Activity className="w-5 h-5 text-[#123B6D]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#172033]">5. Resilient Connector Gateways</h2>
              <p className="text-xs text-[#5B667A]">Fault-tolerant integration adapters with circuit breakers</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#5B667A] leading-relaxed">
            Each government system integration (DigiLocker, Parivahan, Land Registry, etc.) runs inside an isolated connector module equipped with strict timeout controls, schema validation, and fallback simulation for network resilience.
          </p>
        </Card>

        {/* Bottom CTA */}
        <div className="flex items-center justify-between pt-4">
          <Link to="/how-it-works">
            <Button variant="secondary" size="sm">
              How Interoperability Works
            </Button>
          </Link>
          <Link to="/services">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore Services
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
};
