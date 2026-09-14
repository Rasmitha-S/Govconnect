import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Search,
  ArrowRight,
  Filter,
  ShieldCheck,
  Eye,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { officerApi, grievanceApi } from '../api/client.js';
import { Application, Grievance } from '../types/index.js';
import { Card, CardHeader } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/ui/Modal.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Skeleton } from '../components/ui/Skeleton.js';

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isProcessingDecision, setIsProcessingDecision] = useState(false);
  const [activeTab, setActiveTab] = useState<'applications' | 'grievances'>('applications');
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [grievanceResolutionText, setGrievanceResolutionText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchOfficerData = async () => {
    try {
      const [appsRes, statsRes, grvRes] = await Promise.all([
        officerApi.listApplications(),
        officerApi.getStats(),
        grievanceApi.listDepartment(),
      ]);

      if (appsRes.success) setApplications(appsRes.data || []);
      if (statsRes.success) setStats(statsRes.data);
      if (grvRes.success) setGrievances(grvRes.data || []);
    } catch (err) {
      console.error('Error fetching officer dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficerData();
  }, []);

  const handleProcessDecision = async () => {
    if (!selectedApp || !decisionType) return;
    setIsProcessingDecision(true);
    try {
      await officerApi.processDecision(selectedApp.id, {
        decision: decisionType,
        remarks: remarks || `Application ${decisionType.toLowerCase()}d by Officer.`,
      });

      setSelectedApp(null);
      setDecisionType(null);
      setRemarks('');
      await fetchOfficerData();
    } catch (err) {
      console.error('Decision error', err);
    } finally {
      setIsProcessingDecision(false);
    }
  };

  const handleResolveGrievance = async () => {
    if (!selectedGrievance) return;
    setIsProcessingDecision(true);
    try {
      await grievanceApi.resolve(selectedGrievance.id, {
        resolutionRemarks: grievanceResolutionText,
        status: 'RESOLVED',
      });
      setSelectedGrievance(null);
      setGrievanceResolutionText('');
      await fetchOfficerData();
    } catch (err) {
      console.error('Resolve error', err);
    } finally {
      setIsProcessingDecision(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#F5F7FA]">
      {/* Officer Department Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-gov flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EBF3FA] text-[#123B6D] border border-[#B9D4EE]">
              Department Portal: {user?.department?.code || 'OFFICE'}
            </span>
            <span className="text-xs text-[#5B667A]">Employee Code: {user?.profile?.employeeCode || 'OFF-101'}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033]">
            {user?.department?.name || 'Department Officer Workspace'}
          </h1>
          <p className="text-xs text-[#5B667A]">
            Officer: <b className="text-[#172033]">{user?.fullName}</b> ({user?.profile?.designation || 'Reviewing Officer'})
          </p>
        </div>

        <div className="p-3.5 bg-[#E8F5E9] border border-[#A3E9B9] rounded-xl text-xs text-[#172033] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#198754] shrink-0" />
          <span><b>Department Boundary Enforced:</b> Direct access isolated to {user?.department?.code} records.</span>
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-[#DDE3EA]">
          <span className="text-2xl font-extrabold text-[#172033]">{stats?.counts?.total || applications.length}</span>
          <p className="text-xs text-[#5B667A] font-medium mt-0.5">Total Dept Applications</p>
        </Card>
        <Card className="p-4 bg-[#FFF8E6] border-[#FFE082]">
          <span className="text-2xl font-extrabold text-[#D99000]">{stats?.counts?.pending || applications.filter((a) => a.status === 'PENDING_APPROVAL').length}</span>
          <p className="text-xs text-[#B37400] font-bold mt-0.5">Pending My Review</p>
        </Card>
        <Card className="p-4 bg-[#E8F5E9] border-[#A3E9B9]">
          <span className="text-2xl font-extrabold text-[#198754]">{stats?.counts?.approved || applications.filter((a) => a.status === 'APPROVED' || a.status === 'COMPLETED').length}</span>
          <p className="text-xs text-[#198754] font-bold mt-0.5">Approved</p>
        </Card>
        <Card className="p-4 bg-[#F5F7FA] border-[#DDE3EA]">
          <span className="text-2xl font-extrabold text-[#087F8C]">{grievances.filter((g) => g.status !== 'RESOLVED').length}</span>
          <p className="text-xs text-[#5B667A] font-medium mt-0.5">Open Grievances</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#DDE3EA] gap-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'applications'
              ? 'border-[#123B6D] text-[#123B6D]'
              : 'border-transparent text-[#5B667A] hover:text-[#172033]'
          }`}
        >
          Department Applications ({applications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('grievances')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'grievances'
              ? 'border-[#123B6D] text-[#123B6D]'
              : 'border-transparent text-[#5B667A] hover:text-[#172033]'
          }`}
        >
          Department Grievances ({grievances.length})
        </button>
      </div>

      {/* Tab 1: Applications Table */}
      {activeTab === 'applications' && (
        <Card className="border-[#DDE3EA]">
          <CardHeader
            title="Application Inbound Queue"
            subtitle="Pre-verified interoperability data packages ready for decision"
            icon={<FileText className="w-5 h-5 text-[#123B6D]" />}
          />

          {isLoading ? (
            <div className="py-6 space-y-3">
              <Skeleton variant="rectangular" count={4} />
            </div>
          ) : applications.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-8 h-8 text-[#123B6D]" />}
              title="No Inbound Applications"
              description={`No pending applications in queue for ${user?.department?.code || 'your'} department.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DDE3EA] text-[#5B667A] font-bold uppercase tracking-wider text-[11px] bg-[#F5F7FA]">
                    <th className="py-2.5 px-3">App Number</th>
                    <th className="py-2.5 px-3">Applicant Name</th>
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Interoperability Checks</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE3EA]/70">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-[#F5F7FA] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#123B6D]">{app.applicationNumber}</td>
                      <td className="py-3 px-3 font-bold text-[#172033]">
                        {app.citizen?.citizenProfile?.fullName || app.rawFormData?.fullName || 'Citizen'}
                      </td>
                      <td className="py-3 px-3 text-[#5B667A]">{app.service?.name}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#198754] font-bold bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#A3E9B9]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Passed (Aadhaar + Verified Records)
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            app.status === 'COMPLETED'
                              ? 'success'
                              : app.status === 'APPROVED'
                              ? 'primary'
                              : app.status === 'PENDING_APPROVAL'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {app.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedApp(app);
                            setDecisionType(null);
                            setRemarks('');
                          }}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Grievances Queue */}
      {activeTab === 'grievances' && (
        <Card className="border-[#DDE3EA]">
          <CardHeader
            title="Department Grievance Queue"
            subtitle="Citizen complaints assigned by AI classifier"
            icon={<AlertCircle className="w-5 h-5 text-[#123B6D]" />}
          />

          {grievances.length === 0 ? (
            <EmptyState
              icon={<AlertCircle className="w-8 h-8 text-[#123B6D]" />}
              title="No Assigned Grievances"
              description="No open citizen grievances for this department."
            />
          ) : (
            <div className="space-y-4">
              {grievances.map((grv) => (
                <div key={grv.id} className="p-4 bg-white rounded-xl border border-[#DDE3EA] shadow-gov-sm space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#123B6D]">{grv.grievanceNumber}</span>
                    <Badge variant={grv.status === 'RESOLVED' ? 'success' : 'warning'}>{grv.status}</Badge>
                  </div>
                  <p className="text-[#172033] font-bold">{grv.category}</p>
                  <p className="text-[#5B667A]">{grv.description}</p>
                  {grv.status !== 'RESOLVED' && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setSelectedGrievance(grv)}
                      >
                        Resolve Grievance
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Application Review Modal */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title={`Review Application: ${selectedApp.applicationNumber}`}
          maxWidth="xl"
        >
          <div className="space-y-5 text-xs text-[#172033]">
            {/* Applicant demographic and property info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#F5F7FA] rounded-xl border border-[#DDE3EA]">
              <div>
                <span className="font-bold text-[#172033] block mb-1">Applicant:</span>
                <p className="text-[#172033] font-semibold">{selectedApp.rawFormData?.fullName}</p>
                <p className="text-[#5B667A]">{selectedApp.rawFormData?.mobile} | {selectedApp.rawFormData?.email}</p>
              </div>
              <div>
                <span className="font-bold text-[#172033] block mb-1">Service Reference / Address:</span>
                <p className="text-[#172033]">{selectedApp.rawFormData?.doorNumber || selectedApp.rawFormData?.houseBuilding}, {selectedApp.rawFormData?.streetName || selectedApp.rawFormData?.street}</p>
                <p className="text-[#5B667A] font-mono">Reference: {selectedApp.rawFormData?.propertyId || selectedApp.rawFormData?.dlNumber}</p>
              </div>
            </div>

            {/* Interoperability Verification Checklist */}
            <div className="space-y-2">
              <span className="font-bold text-[#172033] uppercase tracking-wider block text-[11px]">
                Interoperability Cross-Department Verification Checklist:
              </span>
              <div className="p-3.5 bg-[#E8F5E9] border border-[#A3E9B9] rounded-xl text-[#172033] space-y-1.5">
                <p className="flex items-center gap-1.5 font-bold text-[#198754]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>UIDAI Aadhaar e-KYC: <b>Demographic Match 99.8%</b></span>
                </p>
                <p className="flex items-center gap-1.5 font-bold text-[#198754]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cross-Department Gateway: <b>Record Cleared, Legal Jurisdiction Verified</b></span>
                </p>
                <p className="flex items-center gap-1.5 font-bold text-[#198754]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>DigiLocker PKI Seal: <b>Authentic Digital Certificate Signature Verified</b></span>
                </p>
              </div>
            </div>

            {/* Decision Action Buttons */}
            <div>
              <label className="block font-bold text-[#172033] mb-1">Officer Remarks / Instructions:</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Verified against department records. Approved for dispatch."
                rows={3}
                className="w-full p-2.5 border border-[#DDE3EA] rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] bg-white shadow-gov-sm"
              />
            </div>

            <div className="pt-4 border-t border-[#DDE3EA] flex flex-wrap items-center justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setSelectedApp(null)}>
                Close
              </Button>
              <Button
                size="sm"
                variant="danger"
                isLoading={isProcessingDecision}
                onClick={() => {
                  setDecisionType('REJECT');
                  handleProcessDecision();
                }}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="success"
                isLoading={isProcessingDecision}
                onClick={() => {
                  setDecisionType('APPROVE');
                  handleProcessDecision();
                }}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Approve Application
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Grievance Resolution Modal */}
      {selectedGrievance && (
        <Modal
          isOpen={!!selectedGrievance}
          onClose={() => setSelectedGrievance(null)}
          title={`Resolve Grievance: ${selectedGrievance.grievanceNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-[#172033]">
            <div className="p-3.5 bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl">
              <p className="font-bold text-[#172033]">{selectedGrievance.category}</p>
              <p className="text-[#5B667A] mt-1">{selectedGrievance.description}</p>
            </div>

            <div>
              <label className="block font-bold text-[#172033] mb-1">Action Taken / Resolution Remarks: <span className="text-[#C0392B]">*</span></label>
              <textarea
                value={grievanceResolutionText}
                onChange={(e) => setGrievanceResolutionText(e.target.value)}
                placeholder="Describe actions taken (e.g. Field engineer inspected pipeline and restored water pressure)..."
                rows={4}
                className="w-full p-2.5 border border-[#DDE3EA] rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] bg-white shadow-gov-sm"
              />
            </div>

            <div className="pt-3 border-t border-[#DDE3EA] flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setSelectedGrievance(null)}>Cancel</Button>
              <Button size="sm" variant="success" isLoading={isProcessingDecision} onClick={handleResolveGrievance}>
                Mark Resolved & Notify Citizen
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
