import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  Droplets,
  LandPlot,
  GraduationCap,
  HeartPulse,
  Car,
  AlertCircle,
  Clock,
  ArrowRight,
  Layers,
  FileCheck,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { serviceApi } from '../api/client.js';
import { Service, ServiceCategory, Department } from '../types/index.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/ui/Modal.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Skeleton } from '../components/ui/Skeleton.js';

export const ServiceDirectoryPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDirectory = async () => {
      try {
        const [srvRes, catRes, deptRes] = await Promise.all([
          serviceApi.listServices(),
          serviceApi.listCategories(),
          serviceApi.listDepartments(),
        ]);

        if (srvRes.success) setServices(srvRes.data || []);
        if (catRes.success) setCategories(catRes.data || []);
        if (deptRes.success) setDepartments(deptRes.data || []);
      } catch (err) {
        console.error('Error fetching services directory', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDirectory();
  }, []);

  const filteredServices = services.filter((s) => {
    const matchesCat = selectedCategory === 'ALL' || s.category?.name === selectedCategory;
    const matchesDept = selectedDept === 'ALL' || s.department?.code === selectedDept;
    const matchesQuery =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.eligibility.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesDept && matchesQuery;
  });

  const getServiceIcon = (code: string) => {
    if (code.startsWith('WTR')) return <Droplets className="w-5 h-5 text-[#123B6D]" />;
    if (code.startsWith('TRN')) return <Car className="w-5 h-5 text-[#087F8C]" />;
    if (code.startsWith('REV')) return <LandPlot className="w-5 h-5 text-[#D99000]" />;
    if (code.startsWith('EDU')) return <GraduationCap className="w-5 h-5 text-[#198754]" />;
    return <Building2 className="w-5 h-5 text-[#123B6D]" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#F5F7FA]">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="primary" size="md">Government Service Directory</Badge>
        <h1 className="text-3xl font-extrabold text-[#172033]">Discover & Apply for Public Services</h1>
        <p className="text-xs sm:text-sm text-[#5B667A] max-w-3xl leading-relaxed">
          Explore government services connected via GovConnect's cross-department interoperability layer with automated verification, zero repeated physical submissions, and unified tracking.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-[#DDE3EA] shadow-gov space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search Box */}
          <div className="flex-1 min-w-[260px] relative">
            <Search className="w-4 h-4 text-[#5B667A] absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by service name or keyword (e.g. water connection, driving licence, patta)..."
              className="w-full pl-10 pr-4 py-2 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm transition-all"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#172033]">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 text-xs text-[#172033] border border-[#DDE3EA] rounded-lg bg-white focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#DDE3EA]">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#123B6D] text-white shadow-sm'
                : 'bg-[#F0F3F7] text-[#5B667A] hover:bg-[#EBF3FA] hover:text-[#123B6D]'
            }`}
          >
            All Categories ({services.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.name)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === c.name
                  ? 'bg-[#123B6D] text-white shadow-sm'
                  : 'bg-[#F0F3F7] text-[#5B667A] hover:bg-[#EBF3FA] hover:text-[#123B6D]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" count={6} />
        </div>
      ) : filteredServices.length === 0 ? (
        <Card className="border-[#DDE3EA]">
          <EmptyState
            title="No Services Found"
            description="No government services match your current search query and filters. Try adjusting your search term."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedDept('ALL');
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              hoverable
              className="flex flex-col justify-between border-t-4 border-t-[#123B6D] space-y-4 border-[#DDE3EA]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#EBF3FA] rounded-lg border border-[#B9D4EE]">
                      {getServiceIcon(service.serviceCode)}
                    </div>
                    <span className="text-[11px] font-bold text-[#123B6D] font-mono">
                      {service.serviceCode}
                    </span>
                  </div>

                  {service.trackingMode === 'INTEGRATED' ? (
                    <Badge variant="primary" size="sm">API Integrated</Badge>
                  ) : service.trackingMode === 'NATIVE' || service.govconnectSupported ? (
                    <Badge variant="success" size="sm">Native Workflow</Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">Official Portal</Badge>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#172033] line-clamp-2 leading-snug">{service.name}</h3>
                <p className="text-xs text-[#5B667A] line-clamp-2 leading-relaxed">{service.description}</p>

                <div className="pt-2 border-t border-[#DDE3EA] text-[11px] text-[#5B667A] space-y-1">
                  <p className="font-semibold text-[#172033] truncate">
                    🏢 {service.department?.name}
                  </p>
                  <p className="flex items-center gap-1 text-[#5B667A]">
                    <Clock className="w-3.5 h-3.5 text-[#5B667A]" /> Est. Time: {service.processingDays} Days
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#DDE3EA] flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#172033]">
                  {service.feeAmount > 0 ? `Fee: ₹${service.feeAmount}` : 'Fee: Free'}
                </span>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedService(service)}
                  >
                    Details
                  </Button>

                  {service.govconnectSupported && (
                    <Link
                      to={
                        service.serviceCode === 'WTR-001'
                          ? '/apply/water'
                          : service.serviceCode === 'TRN-001'
                          ? '/apply/driving-licence'
                          : '/apply/driving-licence'
                      }
                    >
                      <Button size="sm" variant="primary">
                        Apply
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Service Detail Modal */}
      {selectedService && (
        <Modal
          isOpen={!!selectedService}
          onClose={() => setSelectedService(null)}
          title={selectedService.name}
          maxWidth="lg"
        >
          <div className="space-y-5 text-xs text-[#172033]">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#DDE3EA]">
              <span className="font-mono font-bold text-[#123B6D] bg-[#EBF3FA] px-2 py-0.5 rounded border border-[#B9D4EE]">
                {selectedService.serviceCode}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant={selectedService.govconnectSupported ? 'success' : 'neutral'}>
                  {selectedService.govconnectSupported ? 'GovConnect Interoperable' : 'External Portal'}
                </Badge>
                <span className="font-bold text-[#172033]">
                  Fee: {selectedService.feeAmount > 0 ? `₹${selectedService.feeAmount}` : 'Free'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-bold text-[#172033] mb-1 text-xs uppercase tracking-wider">Service Overview</h4>
              <p className="text-[#5B667A] leading-relaxed">{selectedService.description}</p>
            </div>

            {/* Department */}
            <div className="p-3.5 bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl space-y-1">
              <p className="text-[#172033]"><b>Administering Department:</b> {selectedService.department?.name}</p>
              <p className="text-[#5B667A] text-[11px]">{selectedService.department?.description}</p>
            </div>

            {/* Eligibility */}
            <div>
              <h4 className="font-bold text-[#172033] mb-1 text-xs uppercase tracking-wider">Eligibility Criteria</h4>
              <p className="text-[#5B667A] leading-relaxed">{selectedService.eligibility}</p>
            </div>

            {/* Required Documents */}
            <div>
              <h4 className="font-bold text-[#172033] mb-1 text-xs uppercase tracking-wider">
                Required Proofs & Documents
              </h4>
              <ul className="space-y-1.5 pt-1">
                {(selectedService.requiredDocuments || []).map((doc, i) => (
                  <li key={i} className="flex items-center gap-2 text-[#172033]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#198754] shrink-0" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#DDE3EA] flex items-center justify-end gap-3">
              <Button size="sm" variant="outline" onClick={() => setSelectedService(null)}>
                Close
              </Button>

              {selectedService.govconnectSupported ? (
                selectedService.serviceCode === 'WTR-001' ? (
                  <Link to="/apply/water">
                    <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Start Application
                    </Button>
                  </Link>
                ) : selectedService.serviceCode === 'TRN-001' ? (
                  <Link to="/apply/driving-licence">
                    <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Start Application
                    </Button>
                  </Link>
                ) : (
                  <Link to="/apply/driving-licence">
                    <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Start Application
                    </Button>
                  </Link>
                )
              ) : (
                <a
                  href={selectedService.officialPortalURL}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button size="sm" variant="secondary" rightIcon={<ExternalLink className="w-4 h-4" />}>
                    Visit {selectedService.officialPortalName}
                  </Button>
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
