import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Lock,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Card } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-[#F5F7FA] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Page Title Header */}
        <div className="text-center space-y-2.5">
          <Badge variant="primary" size="md">Platform Overview</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#123B6D] tracking-tight">
            About GOVCONNECT
          </h1>
          <p className="text-sm sm:text-base text-[#5B667A] max-w-2xl mx-auto">
            Unified Government Service Interoperability Platform
          </p>
        </div>

        {/* 1. What GOVCONNECT is */}
        <Card className="bg-white border border-[#DDE3EA] p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3FA] text-[#123B6D] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5 text-[#123B6D]" />
            </div>
            <h2 className="text-xl font-bold text-[#172033]">What is GOVCONNECT?</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#5B667A] leading-relaxed">
            GOVCONNECT is a non-invasive digital governance middleware platform engineered to bridge fragmented municipal, state, and central public administration systems. It serves as a unified interoperability layer, allowing citizens to discover, apply for, and track essential public services through a single secure interface while enabling authorized departments to verify cross-departmental records in real time.
          </p>
        </Card>

        {/* 2. The Problem */}
        <Card className="bg-white border border-[#DDE3EA] p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDEDEC] text-[#C0392B] flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5 text-[#C0392B]" />
            </div>
            <h2 className="text-xl font-bold text-[#172033]">The Problem</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="bg-[#F5F7FA] border border-[#DDE3EA] p-3.5 rounded-xl space-y-1">
              <h3 className="text-xs font-bold text-[#172033]">Fragmented Silos</h3>
              <p className="text-xs text-[#5B667A] leading-relaxed">
                Citizens must navigate dozens of disconnected portals with separate credentials and disjointed processes.
              </p>
            </div>
            <div className="bg-[#F5F7FA] border border-[#DDE3EA] p-3.5 rounded-xl space-y-1">
              <h3 className="text-xs font-bold text-[#172033]">Redundant Paperwork</h3>
              <p className="text-xs text-[#5B667A] leading-relaxed">
                Applicants are repeatedly forced to submit identical certificates and identity proofs already held by the government.
              </p>
            </div>
            <div className="bg-[#F5F7FA] border border-[#DDE3EA] p-3.5 rounded-xl space-y-1">
              <h3 className="text-xs font-bold text-[#172033]">Manual Verification</h3>
              <p className="text-xs text-[#5B667A] leading-relaxed">
                Department officers spend weeks verifying records physically or waiting on cross-agency manual approvals.
              </p>
            </div>
          </div>
        </Card>

        {/* 3. The Solution */}
        <Card className="bg-white border border-[#DDE3EA] p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3FA] text-[#087F8C] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5 text-[#087F8C]" />
            </div>
            <h2 className="text-xl font-bold text-[#172033]">The Solution</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#5B667A] leading-relaxed">
            Rather than attempting a costly rewrite of existing government software, GOVCONNECT connects them via modern standard adapters. Existing municipal databases, land registries, transport portals, and welfare programs operate unchanged while GovConnect coordinates asynchronous verification, data transformation, and unified tracking.
          </p>
        </Card>

        {/* 4. Interoperability Concept */}
        <Card className="bg-white border border-[#DDE3EA] p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3FA] text-[#123B6D] flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5 text-[#123B6D]" />
            </div>
            <h2 className="text-xl font-bold text-[#172033]">The Interoperability Concept</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#5B667A]">
            <div className="border border-[#DDE3EA] p-4 rounded-xl space-y-1 bg-[#F5F7FA]">
              <h3 className="font-bold text-[#172033]">Canonical Data Transformation</h3>
              <p className="leading-relaxed">
                Translates heterogeneous legacy XML/SOAP formats into standardized, normalized JSON data models automatically.
              </p>
            </div>
            <div className="border border-[#DDE3EA] p-4 rounded-xl space-y-1 bg-[#F5F7FA]">
              <h3 className="font-bold text-[#172033]">Zero-Trust Consent Architecture</h3>
              <p className="leading-relaxed">
                Adheres strictly to the DPDP Act 2023. Data is never shared across departments without explicit, revocable citizen consent.
              </p>
            </div>
          </div>
        </Card>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between pt-4">
          <Link to="/services">
            <Button variant="secondary" size="sm">
              View Services Directory
            </Button>
          </Link>
          <Link to="/how-it-works">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              How It Works
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
};
