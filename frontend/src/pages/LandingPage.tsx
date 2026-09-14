import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Layers,
  Activity,
  CheckCircle2,
  Lock,
  Building2,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/ui/Button.js';
import { Card } from '../components/ui/Card.js';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, role } = useAuth();

  const getDashboardPath = () => {
    if (role === 'CENTRAL_ADMIN') return '/admin';
    if (role === 'OFFICER') return '/officer';
    return '/citizen';
  };

  const getDashboardLabel = () => {
    if (role === 'CENTRAL_ADMIN') return 'Go to Admin Dashboard';
    if (role === 'OFFICER') return 'Go to Officer Workspace';
    return 'Go to Citizen Dashboard';
  };

  return (
    <div className="bg-[#F5F7FA] text-[#172033] min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Top Main Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 w-full space-y-8">
        
        {/* 1. HERO */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF3FA] border border-[#B9D4EE] text-[#123B6D] text-xs font-bold tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-[#087F8C]"></span>
            GOVCONNECT
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#123B6D] tracking-tight leading-tight">
            Unified Government Service Interoperability Platform
          </h1>

          <p className="text-sm sm:text-base text-[#5B667A] font-normal leading-relaxed max-w-2xl mx-auto">
            Connect, access and track government services through one secure platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/services">
              <Button
                variant="primary"
                size="md"
                className="bg-[#123B6D] hover:bg-[#0B2A4A] text-white font-semibold shadow-sm px-6"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Explore Services
              </Button>
            </Link>

            {isAuthenticated ? (
              <Link to={getDashboardPath()}>
                <Button
                  variant="secondary"
                  size="md"
                  className="border border-[#123B6D] text-[#123B6D] hover:bg-[#EBF3FA] font-semibold px-5"
                >
                  {getDashboardLabel()}
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button
                  variant="secondary"
                  size="md"
                  className="border border-[#123B6D] text-[#123B6D] hover:bg-[#EBF3FA] font-semibold px-6"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* 2. SIMPLE INTEROPERABILITY VISUAL (Citizen → GOVCONNECT → Connected Government Services) */}
        <section className="bg-white border border-[#DDE3EA] rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            
            {/* Step 1: Citizen */}
            <div className="bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl p-4 text-center space-y-1.5">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#EBF3FA] text-[#123B6D] flex items-center justify-center border border-[#B9D4EE]">
                <UserCheck className="w-5 h-5 text-[#123B6D]" />
              </div>
              <h2 className="text-sm font-bold text-[#172033]">Citizen</h2>
              <p className="text-[11px] text-[#5B667A] leading-snug">
                Single secure identity & explicit consent management
              </p>
            </div>

            {/* Step 2: GOVCONNECT (Center Hub) */}
            <div className="relative bg-[#123B6D] text-white rounded-xl p-4 text-center space-y-1.5 shadow-md">
              <div className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#087F8C] text-white items-center justify-center text-xs font-bold shadow">
                →
              </div>
              <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#087F8C] text-white items-center justify-center text-xs font-bold shadow">
                →
              </div>
              <div className="w-10 h-10 mx-auto rounded-full bg-white/10 text-white flex items-center justify-center border border-white/20">
                <Layers className="w-5 h-5 text-[#F4A340]" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-wide">GOVCONNECT</h2>
              <p className="text-[11px] text-slate-200 leading-snug">
                Unified interoperability & canonical data exchange
              </p>
            </div>

            {/* Step 3: Connected Government Services */}
            <div className="bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl p-4 text-center space-y-1.5">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#EBF3FA] text-[#087F8C] flex items-center justify-center border border-[#B9D4EE]">
                <Building2 className="w-5 h-5 text-[#087F8C]" />
              </div>
              <h2 className="text-sm font-bold text-[#172033]">Connected Government Services</h2>
              <p className="text-[11px] text-[#5B667A] leading-snug">
                Municipal Water, Land Revenue, Transport & Welfare
              </p>
            </div>

          </div>
        </section>

        {/* 3. 3 SMALL FEATURE CARDS ONLY */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Feature Card 1: Unified Services */}
          <Card className="bg-white border border-[#DDE3EA] p-5 rounded-xl hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-lg bg-[#EBF3FA] text-[#123B6D] flex items-center justify-center mb-3">
              <Layers className="w-5 h-5 text-[#123B6D]" />
            </div>
            <h2 className="text-base font-bold text-[#172033] mb-1.5">Unified Services</h2>
            <p className="text-xs text-[#5B667A] leading-relaxed">
              Access connected government services from one platform.
            </p>
          </Card>

          {/* Feature Card 2: Secure Data Sharing */}
          <Card className="bg-white border border-[#DDE3EA] p-5 rounded-xl hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-lg bg-[#EBF3FA] text-[#087F8C] flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5 text-[#087F8C]" />
            </div>
            <h2 className="text-base font-bold text-[#172033] mb-1.5">Secure Data Sharing</h2>
            <p className="text-xs text-[#5B667A] leading-relaxed">
              Consent-based information and document sharing.
            </p>
          </Card>

          {/* Feature Card 3: Application Tracking */}
          <Card className="bg-white border border-[#DDE3EA] p-5 rounded-xl hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-lg bg-[#EBF3FA] text-[#123B6D] flex items-center justify-center mb-3">
              <Activity className="w-5 h-5 text-[#123B6D]" />
            </div>
            <h2 className="text-base font-bold text-[#172033] mb-1.5">Application Tracking</h2>
            <p className="text-xs text-[#5B667A] leading-relaxed">
              Track applications across connected systems where authorized.
            </p>
          </Card>

        </section>

        {/* 4. SMALL FINAL CTA */}
        <section className="bg-[#123B6D] text-white rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            Ready to access government services?
          </h2>
          <div>
            <Link to={isAuthenticated ? '/services' : '/register'}>
              <Button
                variant="primary"
                size="md"
                className="bg-[#F4A340] hover:bg-[#E0922F] text-[#0B2A4A] font-bold px-6 shadow-sm cursor-pointer"
                rightIcon={<ChevronRight className="w-4 h-4 text-[#0B2A4A]" />}
              >
                Get Started
              </Button>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};
