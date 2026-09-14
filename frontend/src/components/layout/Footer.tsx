import React from 'react';
import { Layers, ShieldCheck, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-[#0B2A4A] text-slate-300 border-t border-[#123B6D] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#123B6D] text-white flex items-center justify-center font-bold border border-white/20">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-white tracking-tight">GOVCONNECT</span>
              <p className="text-[11px] text-slate-300 font-medium">
                Unified Government Service Interoperability Platform
              </p>
            </div>
          </div>

          {/* Quick Links: Services | About | Privacy | Security | Help */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-300">
            <Link to="/services" className="hover:text-white transition-colors">
              Services
            </Link>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <Link to="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <Link to="/consents" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <Link to="/security" className="hover:text-white transition-colors">
              Security
            </Link>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <Link to="/assistant" className="hover:text-white transition-colors">
              Help
            </Link>
          </nav>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} GOVCONNECT. All rights reserved.</p>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#F4A340]" /> 256-Bit Encryption
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#A3E9B9]" /> DPDP Compliant
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
