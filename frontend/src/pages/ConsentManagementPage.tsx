import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, XCircle, FileText } from 'lucide-react';
import { consentApi } from '../api/client.js';
import { Consent } from '../types/index.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/ui/Modal.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Skeleton } from '../components/ui/Skeleton.js';

export const ConsentManagementPage: React.FC = () => {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [selectedConsent, setSelectedConsent] = useState<Consent | null>(null);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConsents = async () => {
    try {
      const res = await consentApi.listConsents();
      if (res.success && res.data) {
        setConsents(res.data);
      }
    } catch (err) {
      console.error('Error fetching consents', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const handleRevoke = async () => {
    if (!selectedConsent) return;
    setIsRevoking(true);
    try {
      await consentApi.revokeConsent(selectedConsent.id, revokeReason);
      setIsRevokeModalOpen(false);
      setRevokeReason('');
      setSelectedConsent(null);
      await fetchConsents();
    } catch (err) {
      console.error('Revoke error', err);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#F5F7FA]">
      <div className="space-y-2">
        <Badge variant="primary" size="md">Privacy & Sovereign Citizen Consent</Badge>
        <h1 className="text-3xl font-extrabold text-[#172033]">Citizen Data Consent Manager</h1>
        <p className="text-xs sm:text-sm text-[#5B667A] max-w-2xl leading-relaxed">
          GovConnect guarantees that no government department can access your records from another department without your explicit, auditable permission. You can review and revoke consents at any time.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton variant="card" count={4} />
        </div>
      ) : consents.length === 0 ? (
        <Card className="border-[#DDE3EA]">
          <EmptyState
            icon={<ShieldCheck className="w-8 h-8 text-[#123B6D]" />}
            title="No Active Data Sharing Authorizations"
            description="When you apply for services requiring cross-department checks, your consent records will appear here."
            actionLabel="Explore Services"
            onAction={() => window.location.assign('/services')}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {consents.map((consent) => {
            const isGranted = consent.status === 'GRANTED';
            const isRevoked = consent.status === 'REVOKED';

            return (
              <Card key={consent.id} className="flex flex-col justify-between space-y-4 border-[#DDE3EA]">
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#172033] text-sm">
                      {consent.application?.service?.name || 'Cross-Department Authorization'}
                    </span>
                    <Badge variant={isGranted ? 'success' : isRevoked ? 'danger' : 'neutral'}>
                      {consent.status}
                    </Badge>
                  </div>

                  <p className="text-[#5B667A] leading-relaxed">{consent.purpose}</p>

                  <div className="p-3.5 bg-[#F5F7FA] rounded-xl space-y-1 text-[11px] border border-[#DDE3EA]">
                    <p className="text-[#172033]">
                      <b>Requesting Department:</b> {consent.requestingDeptCode} Department
                    </p>
                    <p className="text-[#172033]">
                      <b>Data Provider:</b> {consent.dataProviderDeptCode} Records
                    </p>
                    <p className="text-[#5B667A]">
                      <b>Authorized Data Scope:</b>{' '}
                      <span className="font-mono text-[#123B6D]">{consent.dataFields?.join(', ')}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#5B667A]">
                    <span>Granted: {new Date(consent.createdAt).toLocaleDateString()}</span>
                    {consent.expiresAt && (
                      <span>Expires: {new Date(consent.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {isGranted && (
                  <div className="pt-3 border-t border-[#DDE3EA] flex items-center justify-end">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setSelectedConsent(consent);
                        setIsRevokeModalOpen(true);
                      }}
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    >
                      Revoke Data Consent
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {isRevokeModalOpen && (
        <Modal
          isOpen={isRevokeModalOpen}
          onClose={() => setIsRevokeModalOpen(false)}
          title="Revoke Data Sharing Consent"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#FDEDEC] border border-[#F5B7B1] rounded-xl text-[#C0392B] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>
                Revoking consent will immediately prevent future cross-department data sharing for this application.
              </span>
            </div>

            <div>
              <label className="block font-bold text-[#172033] mb-1">Reason for Revocation (Optional):</label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Service application cancelled or data no longer required."
                rows={3}
                className="w-full p-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#C0392B]/20 focus:border-[#C0392B] outline-none shadow-gov-sm"
              />
            </div>

            <div className="pt-4 border-t border-[#DDE3EA] flex items-center justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setIsRevokeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                isLoading={isRevoking}
                onClick={handleRevoke}
              >
                Confirm Revocation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
