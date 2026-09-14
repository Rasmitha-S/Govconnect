import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Copy,
  Check,
  Lock,
  UserCheck,
  Server,
} from 'lucide-react';
import { adminApi } from '../api/client.js';
import { AuditLog } from '../types/index.js';
import { Card, CardHeader } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/ui/Modal.js';
import { SkeletonTable } from '../components/ui/Skeleton.js';
import { EmptyState } from '../components/ui/EmptyState.js';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAuditLogs({ search, action: actionFilter });
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Error loading audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleCopyPayload = () => {
    if (selectedLog) {
      navigator.clipboard.writeText(JSON.stringify(selectedLog.details || {}, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="danger">{role}</Badge>;
      case 'OFFICER':
        return <Badge variant="secondary">{role}</Badge>;
      case 'CITIZEN':
        return <Badge variant="primary">{role}</Badge>;
      default:
        return <Badge variant="neutral">{role || 'SYSTEM'}</Badge>;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('APPROVED') || action.includes('SUCCESS') || action.includes('COMPLETED')) {
      return 'text-[#198754]';
    }
    if (action.includes('REJECTED') || action.includes('REVOKED') || action.includes('FAIL')) {
      return 'text-[#C0392B]';
    }
    if (action.includes('SUBMITTED') || action.includes('CREATED')) {
      return 'text-[#123B6D]';
    }
    return 'text-gov-slate';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* GovTech Header Banner */}
      <div className="bg-gradient-to-r from-[#123B6D] via-[#0E2E55] to-[#087F8C] rounded-2xl p-6 sm:p-8 text-white shadow-gov relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur border border-white/20 text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F4A340]" />
              <span>Immutable Non-Repudiation Security Log</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              System Audit Trail Explorer
            </h1>
            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
              Cryptographically timestamped, tamper-evident audit records of all citizen authentication, data exchange consents, cross-department queries, and officer actions.
            </p>
          </div>

          <Button
            size="md"
            variant="secondary"
            onClick={fetchLogs}
            leftIcon={<RefreshCw className={`w-4 h-4 text-[#123B6D] ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh Logs
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gov-muted absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
              placeholder="Search by actor email, entity ID, or action name..."
              className="w-full pl-10 pr-4 py-2.5 text-xs text-gov-slate bg-[#F5F7FA] border border-gov-border rounded-lg focus:bg-white focus:border-[#123B6D] focus:ring-2 focus:ring-[#123B6D]/20 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2.5 text-xs font-medium text-gov-slate bg-[#F5F7FA] border border-gov-border rounded-lg focus:bg-white focus:border-[#123B6D] focus:ring-2 focus:ring-[#123B6D]/20 outline-none transition-all cursor-pointer"
            >
              <option value="">All Audit Actions</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
              <option value="USER_REGISTER">USER_REGISTER</option>
              <option value="APPLICATION_SUBMITTED">APPLICATION_SUBMITTED</option>
              <option value="APPLICATION_APPROVED">APPLICATION_APPROVED</option>
              <option value="APPLICATION_REJECTED">APPLICATION_REJECTED</option>
              <option value="CONSENT_GRANTED">CONSENT_GRANTED</option>
              <option value="CONSENT_REVOKED">CONSENT_REVOKED</option>
              <option value="PAYMENT_AND_SERVICE_COMPLETED">PAYMENT_AND_SERVICE_COMPLETED</option>
              <option value="CONNECTOR_PROBE_EXECUTED">CONNECTOR_PROBE_EXECUTED</option>
            </select>

            <Button size="sm" variant="primary" onClick={fetchLogs}>
              Apply Filter
            </Button>
            {(search || actionFilter) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setActionFilter('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader
          title={`Audit Records (${logs.length})`}
          subtitle="Sanitized records complying with non-repudiation and zero-raw-secret standards"
          icon={<FileText className="w-5 h-5 text-[#123B6D]" />}
        />

        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={8} columns={7} />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<ShieldCheck className="w-10 h-10 text-gov-muted" />}
              title="No Matching Audit Records"
              description="Try modifying your search criteria or action filter."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setActionFilter('');
                  }}
                >
                  Reset Filters
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FA] border-b border-gov-border">
                <tr className="text-gov-muted font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4 text-gov-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-gov-slate">{log.actorEmail || 'System'}</td>
                    <td className="py-3 px-4">
                      {getRoleBadge(log.actorRole)}
                    </td>
                    <td className={`py-3 px-4 font-mono font-bold ${getActionColor(log.action)}`}>
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-gov-slate font-medium">{log.entity}</td>
                    <td className="py-3 px-4 text-gov-muted font-mono text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="py-1 px-2.5 text-[11px]"
                        onClick={() => setSelectedLog(log)}
                      >
                        Inspect Payload
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Log Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event: ${selectedLog.action}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Metadata Summary Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-[#F5F7FA] rounded-xl border border-gov-border">
              <div>
                <span className="text-gov-muted text-[10px] uppercase font-bold block">Actor Email</span>
                <span className="font-semibold text-gov-slate text-xs">{selectedLog.actorEmail || 'System'}</span>
              </div>
              <div>
                <span className="text-gov-muted text-[10px] uppercase font-bold block">Actor Role</span>
                <span className="mt-0.5 inline-block">{getRoleBadge(selectedLog.actorRole)}</span>
              </div>
              <div>
                <span className="text-gov-muted text-[10px] uppercase font-bold block">Target Entity</span>
                <span className="font-semibold text-gov-slate text-xs font-mono">
                  {selectedLog.entity} {selectedLog.entityId ? `(#${selectedLog.entityId.slice(0, 8)})` : ''}
                </span>
              </div>
              <div>
                <span className="text-gov-muted text-[10px] uppercase font-bold block">Timestamp</span>
                <span className="font-mono text-gov-slate text-[11px]">
                  {new Date(selectedLog.createdAt).toISOString()}
                </span>
              </div>
              <div>
                <span className="text-gov-muted text-[10px] uppercase font-bold block">IP Origin</span>
                <span className="font-mono text-gov-slate text-[11px]">{selectedLog.ipAddress || '127.0.0.1'}</span>
              </div>
              <div>
                <span className="text-gov-muted text-[10px] uppercase font-bold block">Log ID</span>
                <span className="font-mono text-gov-muted text-[11px]">{selectedLog.id}</span>
              </div>
            </div>

            {/* Sanitized JSON Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gov-slate text-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#198754]" />
                  Sanitized Metadata Payload (No Raw Secrets)
                </span>
                <button
                  onClick={handleCopyPayload}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#123B6D] hover:underline"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#198754]" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy JSON
                    </>
                  )}
                </button>
              </div>

              <div className="relative bg-[#0F172A] text-[#38BDF8] p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-72 border border-slate-800 shadow-inner">
                <pre>{JSON.stringify(selectedLog.details || {}, null, 2)}</pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setSelectedLog(null)}>
                Close Explorer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
