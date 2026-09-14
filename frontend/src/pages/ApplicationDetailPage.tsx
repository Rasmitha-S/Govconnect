import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  Building2,
  Droplets,
  CreditCard,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileCode,
  Download,
  Calendar,
  Layers,
  RefreshCw,
  ExternalLink,
  Radio,
  CheckCircle,
  Printer,
} from 'lucide-react';
import { applicationApi, paymentApi } from '../api/client.js';
import { Application } from '../types/index.js';
import { Card, CardHeader } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Timeline } from '../components/ui/Timeline.js';
import { Modal } from '../components/ui/Modal.js';
import { Skeleton } from '../components/ui/Skeleton.js';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [application, setApplication] = useState<Application | null>(null);
  const [activeDataTab, setActiveDataTab] = useState<'standardized' | 'rawRevenue' | 'digilocker' | 'consent' | 'externalSync'>('standardized');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'SIMULATED_UPI' | 'SIMULATED_NETBANKING' | 'TREASURY_CHALLAN'>('SIMULATED_UPI');
  const [isPaying, setIsPaying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplication = async () => {
    if (!id) return;
    try {
      const res = await applicationApi.getApplicationDetail(id);
      if (res.success && res.data) {
        setApplication(res.data);
      }
    } catch (err) {
      console.error('Failed to load application detail', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const handleSyncStatus = async () => {
    if (!application) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await applicationApi.syncStatus(application.id);
      if (res.success) {
        setSyncFeedback({
          type: 'success',
          message: res.message || `External status synchronized: ${res.data.externalStatus} (Canonical: ${res.data.status})`,
        });
        await fetchApplication();
      } else {
        setSyncFeedback({
          type: 'error',
          message: res.message || 'Failed to synchronize external status.',
        });
      }
    } catch (err: any) {
      console.error('Sync status error', err);
      setSyncFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error communicating with external gateway connector adapter.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!application) return;
    setIsPaying(true);
    try {
      const res = await paymentApi.simulate({
        applicationId: application.id,
        amount: application.service?.feeAmount || 250,
        paymentMethod,
      });

      if (res.success) {
        setPaymentSuccessData(res.data);
        await fetchApplication();
      }
    } catch (err) {
      console.error('Payment error', err);
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton variant="card" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7"><Skeleton variant="rectangular" count={4} /></div>
          <div className="lg:col-span-5"><Skeleton variant="rectangular" count={3} /></div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-[#FDEDEC] text-[#C0392B] border border-[#F5B7B1] flex items-center justify-center mx-auto shadow-gov-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-[#172033]">Application Not Found</h2>
        <p className="text-xs text-[#5B667A]">The requested application record could not be loaded or has been archived.</p>
        <Link to="/citizen">
          <Button variant="secondary" size="sm">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isApproved = application.status === 'APPROVED';
  const isCompleted = application.status === 'COMPLETED';
  const appType = application.applicationType || 'NATIVE';
  const isIntegrated = appType === 'INTEGRATED';
  const isExternalOnly = appType === 'EXTERNAL_ONLY';
  const isNative = appType === 'NATIVE';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#F5F7FA]">
      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-gov-sm ${
            syncFeedback.type === 'success'
              ? 'bg-[#E8F5E9] border-[#A3E9B9] text-[#198754]'
              : 'bg-[#FDEDEC] border-[#F5B7B1] text-[#C0392B]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {syncFeedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-[#198754] shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#C0392B] shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-[#5B667A] hover:text-[#172033] text-sm font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-gov flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#EBF3FA] text-[#123B6D] border border-[#B9D4EE]">
              {application.applicationNumber}
            </span>

            {/* Tracking Type Badge */}
            {isIntegrated && (
              <Badge variant="primary" size="sm">
                Integrated API ({application.externalPlatform || 'Connector'})
              </Badge>
            )}
            {isExternalOnly && (
              <Badge variant="neutral" size="sm">
                External Portal Service
              </Badge>
            )}
            {isNative && (
              <Badge variant="success" size="sm">
                Native Workflow
              </Badge>
            )}

            {/* Canonical Status Badge */}
            <Badge
              variant={
                isCompleted
                  ? 'success'
                  : isApproved
                  ? 'primary'
                  : application.status === 'REJECTED'
                  ? 'danger'
                  : 'warning'
              }
            >
              {application.status.replace(/_/g, ' ')}
            </Badge>
          </div>

          <h1 className="text-2xl font-extrabold text-[#172033]">{application.service?.name}</h1>
          <p className="text-xs text-[#5B667A]">
            Managing Department: <b className="text-[#172033]">{application.department?.name}</b> | Submitted on{' '}
            {new Date(application.createdAt).toLocaleDateString()}
            {application.lastSyncedAt && (
              <span className="ml-2 pl-2 border-l border-[#DDE3EA]">
                Last Synced: <b className="text-[#172033]">{new Date(application.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</b>
              </span>
            )}
          </p>
        </div>

        {/* Action Button Area */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 bg-white hover:bg-[#F5F7FA] border border-[#DDE3EA] text-[#172033] text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-gov-sm cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#5B667A]" />
            Print Receipt
          </button>

          {/* Integrated Application: Refresh / Sync External Status */}
          {isIntegrated && (
            <Button
              size="md"
              variant="primary"
              isLoading={isSyncing}
              onClick={handleSyncStatus}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
            >
              Sync External Status
            </Button>
          )}

          {/* External-Only Application: Open Official Portal Link */}
          {isExternalOnly && application.service?.officialPortalURL && (
            <a
              href={application.service.officialPortalURL}
              target="_blank"
              rel="noreferrer"
            >
              <Button
                size="md"
                variant="primary"
                leftIcon={<ExternalLink className="w-4 h-4" />}
              >
                Track on {application.service.officialPortalName || 'Official Portal'}
              </Button>
            </a>
          )}

          {/* Native Water App: Pay Fee if Approved */}
          {isNative && isApproved && (
            <Button
              size="md"
              variant="primary"
              onClick={() => setIsPaymentModalOpen(true)}
              leftIcon={<CreditCard className="w-4 h-4" />}
            >
              Pay Connection Fee (₹250.00)
            </Button>
          )}

          {/* Native Water App: Completed Certificate */}
          {isNative && isCompleted && (
            <div className="p-3 bg-[#E8F5E9] border border-[#A3E9B9] rounded-xl text-xs text-[#172033] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#198754] shrink-0" />
              <div>
                <span className="font-bold text-[#198754] block">Work Order Provisioned</span>
                <span className="text-[11px] text-[#5B667A]">Municipal Installation Scheduled within 3 Days.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* External Integration Overview Banner for INTEGRATED Applications */}
      {isIntegrated && (
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-gov space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#DDE3EA]">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#123B6D] animate-pulse" />
              <div>
                <h2 className="text-sm font-bold text-[#172033]">Government Gateway Status Synchronization</h2>
                <p className="text-[11px] text-[#5B667A]">Live integration via GovConnect Connector Adapter</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#5B667A] font-medium">Sync State:</span>
              <Badge variant={application.syncStatus === 'SUCCESS' ? 'success' : application.syncStatus === 'FAILED' ? 'danger' : 'warning'} size="sm">
                {application.syncStatus || 'SUCCESS'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-[#F5F7FA] rounded-xl border border-[#DDE3EA] space-y-1">
              <span className="text-[10px] font-bold text-[#5B667A] uppercase tracking-wider">External Platform</span>
              <p className="text-sm font-bold text-[#172033]">{application.externalPlatform || 'PARIVAHAN'}</p>
              <span className="text-[10px] text-[#5B667A]">MoRTH / State Transport</span>
            </div>

            <div className="p-3.5 bg-[#F5F7FA] rounded-xl border border-[#DDE3EA] space-y-1">
              <span className="text-[10px] font-bold text-[#5B667A] uppercase tracking-wider">External Reference No.</span>
              <p className="text-sm font-bold font-mono text-[#123B6D]">{application.externalReferenceId || 'N/A'}</p>
              <span className="text-[10px] text-[#5B667A]">Official Gateway Identifier</span>
            </div>

            <div className="p-3.5 bg-[#F5F7FA] rounded-xl border border-[#DDE3EA] space-y-1">
              <span className="text-[10px] font-bold text-[#5B667A] uppercase tracking-wider">Live External Status</span>
              <p className="text-sm font-bold text-[#087F8C]">
                {application.externalStatus?.replace(/_/g, ' ') || 'DOCUMENT_VERIFICATION_PENDING'}
              </p>
              <span className="text-[10px] text-[#5B667A]">Normalized: {application.status}</span>
            </div>

            <div className="p-3.5 bg-[#F5F7FA] rounded-xl border border-[#DDE3EA] space-y-1">
              <span className="text-[10px] font-bold text-[#5B667A] uppercase tracking-wider">Last Gateway Check</span>
              <p className="text-sm font-semibold text-[#172033]">
                {application.lastSyncedAt
                  ? new Date(application.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'On Creation'}
              </p>
              <span className="text-[10px] text-[#5B667A]">
                {application.lastSyncedAt ? new Date(application.lastSyncedAt).toLocaleDateString() : 'Active'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* External-Only Notice Card */}
      {isExternalOnly && (
        <div className="p-6 bg-white rounded-2xl border border-[#DDE3EA] shadow-gov space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#D99000] shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs text-[#172033]">
              <h3 className="font-bold text-sm">External Government Portal Tracking Notice</h3>
              <p className="leading-relaxed text-[#5B667A]">
                This service ({application.service?.name}) is administered directly by{' '}
                <b>{application.department?.name}</b> through their official portal. No authorized real-time API is published for third-party synchronization.
              </p>
              <p className="leading-relaxed text-[#5B667A]">
                GovConnect adheres to strict government data governance and security compliance: we do not scrape external portals or simulate arbitrary progress. Please use your official application reference to check live records directly on the authorized portal.
              </p>
              {application.externalReferenceId && (
                <p className="pt-2 font-mono text-xs font-bold text-[#172033]">
                  Your Reference ID: <span className="text-[#123B6D]">{application.externalReferenceId}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col (7 cols): Workflow Timeline */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-[#DDE3EA]">
            <CardHeader
              title={
                isIntegrated
                  ? 'Connector Synchronization Timeline'
                  : 'Multi-Department Workflow Timeline'
              }
              subtitle={
                isIntegrated
                  ? 'Audit trail of external gateway synchronization events'
                  : 'Coordinated state machine transitions'
              }
              icon={<Clock className="w-5 h-5 text-[#123B6D]" />}
            />

            {application.workflow ? (
              <Timeline
                steps={application.workflow.steps}
                currentStage={application.workflow.currentStage}
              />
            ) : (
              <div className="py-6 text-center text-xs text-[#5B667A]">No workflow steps recorded.</div>
            )}
          </Card>
        </div>

        {/* Right Col (5 cols): Data Exchange Inspector */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5 border-[#DDE3EA]">
            <CardHeader
              title="Interoperability Data Exchange"
              subtitle="Inspect cross-department canonical models"
              icon={<FileCode className="w-5 h-5 text-[#123B6D]" />}
            />

            {/* Sub-tabs */}
            <div className="flex border-b border-[#DDE3EA] mb-4 text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveDataTab('standardized')}
                className={`pb-2 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeDataTab === 'standardized'
                    ? 'border-[#123B6D] text-[#123B6D] font-bold'
                    : 'border-transparent text-[#5B667A] hover:text-[#172033]'
                }`}
              >
                Canonical Data
              </button>
              {isIntegrated && (
                <button
                  type="button"
                  onClick={() => setActiveDataTab('externalSync')}
                  className={`pb-2 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    activeDataTab === 'externalSync'
                      ? 'border-[#123B6D] text-[#123B6D] font-bold'
                      : 'border-transparent text-[#5B667A] hover:text-[#172033]'
                  }`}
                >
                  External Sync Data
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveDataTab('rawRevenue')}
                className={`pb-2 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeDataTab === 'rawRevenue'
                    ? 'border-[#123B6D] text-[#123B6D] font-bold'
                    : 'border-transparent text-[#5B667A] hover:text-[#172033]'
                }`}
              >
                Raw Revenue
              </button>
              <button
                type="button"
                onClick={() => setActiveDataTab('digilocker')}
                className={`pb-2 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeDataTab === 'digilocker'
                    ? 'border-[#123B6D] text-[#123B6D] font-bold'
                    : 'border-transparent text-[#5B667A] hover:text-[#172033]'
                }`}
              >
                DigiLocker PKI
              </button>
              <button
                type="button"
                onClick={() => setActiveDataTab('consent')}
                className={`pb-2 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeDataTab === 'consent'
                    ? 'border-[#123B6D] text-[#123B6D] font-bold'
                    : 'border-transparent text-[#5B667A] hover:text-[#172033]'
                }`}
              >
                Consent
              </button>
            </div>

            {/* Tab: External Sync */}
            {activeDataTab === 'externalSync' && isIntegrated && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-[#EBF3FA] border border-[#B9D4EE] rounded-xl text-[#172033] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#123B6D]">
                    <Radio className="w-4 h-4" />
                    <span>External Gateway Connector Metadata</span>
                  </div>
                  <p>• Adapter: <b>Parivahan Sarathi / Vahan Connector (REST + OAuth)</b></p>
                  <p>• External Ref: <b>{application.externalReferenceId}</b></p>
                  <p>• External Status: <b>{application.externalStatus}</b></p>
                  <p>• Normalized Canonical: <b>{application.status}</b></p>
                  <p>• Response Signature: <b className="font-mono text-[10px]">ECDSA-SHA256:VERIFIED</b></p>
                </div>
                <pre className="bg-[#0B2A4A] p-3 rounded-xl text-[10px] text-[#A3E9B9] font-mono overflow-x-auto max-h-48 border border-[#123B6D]">
                  {JSON.stringify(
                    {
                      gateway: application.externalPlatform,
                      referenceId: application.externalReferenceId,
                      externalStatus: application.externalStatus,
                      normalizedGovConnectStatus: application.status,
                      lastSyncedAt: application.lastSyncedAt,
                      syncStatus: application.syncStatus,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

            {/* Tab: Standardized Canonical */}
            {activeDataTab === 'standardized' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-[#E8F5E9] border border-[#A3E9B9] rounded-xl text-[#172033] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#198754]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>GovConnect Standardized ISO Record</span>
                  </div>
                  <p>• Applicant: <b>{application.standardizedData?.applicant?.fullName || application.rawFormData?.fullName || 'Kavitha Sundaram'}</b></p>
                  <p>• Service: <b>{application.service?.name}</b></p>
                  <p>• Tracking Architecture: <b>{appType}</b></p>
                  {isIntegrated && <p>• External ID: <b>{application.externalReferenceId}</b></p>}
                </div>
                <pre className="bg-[#0B2A4A] p-3 rounded-xl text-[10px] text-[#A3E9B9] font-mono overflow-x-auto max-h-48 border border-[#123B6D]">
                  {JSON.stringify(application.standardizedData || application.rawFormData || {}, null, 2)}
                </pre>
              </div>
            )}

            {/* Tab: Raw Revenue */}
            {activeDataTab === 'rawRevenue' && (
              <div className="space-y-2 text-xs">
                <p className="text-[#5B667A] text-[11px]">
                  Raw response queried from the Revenue Department Patta/Chitta database via SOAP/XML adapter:
                </p>
                <pre className="bg-[#0B2A4A] p-3 rounded-xl text-[10px] text-[#F4A340] font-mono overflow-x-auto max-h-56 border border-[#123B6D]">
                  {JSON.stringify(
                    {
                      property_no: application.rawFormData?.propertyId || 'TN-COI-2026-88192',
                      property_owner: application.rawFormData?.fullName || 'Kavitha Sundaram',
                      patta_holder_name: application.rawFormData?.fullName || 'Kavitha Sundaram',
                      door_no: application.rawFormData?.doorNumber || '18/B',
                      street_name: application.rawFormData?.streetName || 'Avinashi Road',
                      district: 'Coimbatore',
                      tax_clearance_status: 'CLEARED',
                      patta_chitta_no: `PATTA-TN-CBE-88192`,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

            {/* Tab: DigiLocker */}
            {activeDataTab === 'digilocker' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl space-y-1">
                  <p className="font-bold text-[#172033]">DigiLocker National Gateway v3.1</p>
                  <p className="text-[#5B667A]">Issuer: <b>Government of Tamil Nadu - Municipal Authority</b></p>
                  <p className="text-[#5B667A]">Signature: <b className="font-mono text-[11px] text-[#198754]">SHA256withRSA:VERIFIED</b></p>
                </div>
              </div>
            )}

            {/* Tab: Consent */}
            {activeDataTab === 'consent' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-[#EBF3FA] border border-[#B9D4EE] rounded-xl space-y-1">
                  <span className="font-bold text-[#123B6D]">Digital Data Sharing Consent</span>
                  <p className="text-[#172033]">Status: <b className="text-[#198754]">GRANTED</b></p>
                  <p className="text-[#5B667A]">Granted to: <b>Municipal Water Department</b></p>
                  <p className="text-[#5B667A]">Provider: <b>Revenue Land Records</b></p>
                </div>
              </div>
            )}
          </Card>

          {/* Officer Remarks if any */}
          {application.officerRemarks && (
            <Card className="bg-[#F5F7FA] border-[#DDE3EA]">
              <span className="text-xs font-bold text-[#172033] block mb-1">Officer Notes & Decisions:</span>
              <p className="text-xs text-[#5B667A] italic">"{application.officerRemarks}"</p>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Simulation Modal */}
      {isPaymentModalOpen && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="e-Treasury & BBPS Payment Gateway"
          maxWidth="md"
        >
          {paymentSuccessData ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 bg-[#E8F5E9] text-[#198754] border border-[#A3E9B9] rounded-2xl flex items-center justify-center mx-auto shadow-gov-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-[#172033]">Payment Successful!</h3>
              <p className="text-xs text-[#5B667A]">
                Transaction Ref: <b className="font-mono text-[#172033]">{paymentSuccessData.payment?.transactionNumber}</b>
              </p>
              <p className="text-xs text-[#198754] font-bold">
                Work order issued to Assistant Executive Engineer for pipeline tapping.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full mt-4"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPaymentSuccessData(null);
                }}
              >
                View Updated Application
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-[#EBF3FA] border border-[#B9D4EE] rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-[#172033]">
                  <span>Municipal Connection Fee:</span>
                  <span className="text-[#123B6D]">₹250.00</span>
                </div>
                <p className="text-[11px] text-[#5B667A]">Application Number: {application.applicationNumber}</p>
                <p className="text-[11px] text-[#5B667A]">Head of Account: 0215-01-102-AA-0001 (Water Supply)</p>
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-2">Select Payment Channel:</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'SIMULATED_UPI', name: 'UPI Gateway (GPay / PhonePe / BHIM)', icon: '📱' },
                    { id: 'SIMULATED_NETBANKING', name: 'State Treasury NetBanking', icon: '🏦' },
                    { id: 'TREASURY_CHALLAN', name: 'Municipal e-Challan', icon: '📄' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? 'border-[#123B6D] bg-[#EBF3FA] font-bold text-[#123B6D] shadow-gov-sm'
                          : 'border-[#DDE3EA] hover:bg-[#F5F7FA] text-[#172033]'
                      }`}
                    >
                      <span className="text-base">{m.icon}</span>
                      <span>{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#DDE3EA] flex items-center justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="success" isLoading={isPaying} onClick={handleSimulatePayment}>
                  Confirm Payment of ₹250
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
