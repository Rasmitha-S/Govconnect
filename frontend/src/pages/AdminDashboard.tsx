import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  FileText,
  Activity,
  Cpu,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Server,
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  Shield,
  Briefcase,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { adminApi } from '../api/client.js';
import { RegistrationRequest } from '../types/index.js';
import { Card, CardHeader } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/ui/Modal.js';
import { SkeletonCard, SkeletonTable } from '../components/ui/Skeleton.js';
import { EmptyState } from '../components/ui/EmptyState.js';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED'>('PENDING_APPROVAL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingUser, setRejectingUser] = useState<RegistrationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, requestsRes] = await Promise.all([
        adminApi.getMetrics(),
        adminApi.getRegistrationRequests(),
      ]);

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
      if (requestsRes.success && requestsRes.data) {
        setRegistrationRequests(requestsRes.data);
      }
    } catch (err) {
      console.error('Admin data fetch error', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (userId: string) => {
    setActionLoading(`approve-${userId}`);
    try {
      await adminApi.approveRegistrationRequest(userId);
      await fetchDashboardData();
    } catch (err) {
      console.error('Approval failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingUser) return;
    setActionLoading(`reject-${rejectingUser.id}`);
    try {
      await adminApi.rejectRegistrationRequest(rejectingUser.id, rejectReason);
      setRejectingUser(null);
      setRejectReason('');
      await fetchDashboardData();
    } catch (err) {
      console.error('Rejection failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRequests = registrationRequests.filter((r) => r.accountStatus === 'PENDING_APPROVAL');
  const filteredRequests =
    requestFilter === 'ALL'
      ? registrationRequests
      : registrationRequests.filter((r) => r.accountStatus === requestFilter);

  const CHART_COLORS = ['#123B6D', '#087F8C', '#198754', '#D99000', '#C0392B', '#6366F1'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* GovTech Header Banner */}
      <div className="bg-gradient-to-r from-[#123B6D] via-[#0E2E55] to-[#087F8C] rounded-2xl p-6 sm:p-8 text-white shadow-gov relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur border border-white/20 text-white">
              <Server className="w-3.5 h-3.5 text-[#F4A340]" />
              <span>Central Platform Governance & Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Central Administration Console
            </h1>
            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
              Real-time cross-department interoperability metrics, connector health, non-repudiation audit trail, and multi-tier role authorization controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/admin/connectors">
              <Button size="md" variant="secondary" leftIcon={<Cpu className="w-4 h-4 text-[#123B6D]" />}>
                Connector Health
              </Button>
            </Link>
            <Link to="/admin/audit">
              <Button
                size="md"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                leftIcon={<ShieldCheck className="w-4 h-4 text-[#F4A340]" />}
              >
                Audit Explorer
              </Button>
            </Link>
            <Button
              size="md"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-3"
              onClick={fetchDashboardData}
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-5 border-l-4 border-l-[#123B6D] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gov-muted uppercase tracking-wider">Registered Citizens</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#123B6D]" />
              </div>
            </div>
            <span className="text-3xl font-extrabold text-gov-slate block mt-3">
              {(metrics?.overview?.totalCitizens ?? 0).toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gov-muted">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>Verified digital citizen profiles</span>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-[#087F8C] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gov-muted uppercase tracking-wider">Officers & Depts</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[#087F8C]" />
              </div>
            </div>
            <span className="text-3xl font-extrabold text-gov-slate block mt-3">
              {metrics?.overview?.totalOfficers || 0}{' '}
              <span className="text-base font-normal text-gov-muted">/ {metrics?.overview?.totalDepartments || 0}</span>
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gov-muted">
              <span>Isolated role domains across ministries</span>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-[#198754] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gov-muted uppercase tracking-wider">Total Applications</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#198754]" />
              </div>
            </div>
            <span className="text-3xl font-extrabold text-gov-slate block mt-3">
              {(metrics?.overview?.totalApplications ?? 0).toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-700 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{metrics?.overview?.successRatePercentage || 100}% Completion Success Rate</span>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-[#F4A340] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gov-muted uppercase tracking-wider">Pending Registrations</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-[#D99000]" />
              </div>
            </div>
            <span className="text-3xl font-extrabold text-gov-slate block mt-3">
              {pendingRequests.length}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#D99000] font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Officer & Admin approval queue</span>
            </div>
          </Card>
        </div>
      )}

      {/* REGISTRATION APPROVAL REQUESTS SECTION */}
      <Card>
        <CardHeader
          title={`Officer & Administrator Registration Requests (${pendingRequests.length} Pending)`}
          subtitle="Review official credentials and grant authorized role access"
          icon={<ShieldCheck className="w-5 h-5 text-[#123B6D]" />}
          action={
            <div className="flex items-center gap-1.5 bg-[#F5F7FA] p-1 rounded-lg border border-gov-border text-xs">
              <button
                type="button"
                onClick={() => setRequestFilter('PENDING_APPROVAL')}
                className={`px-3 py-1 rounded font-semibold transition-all ${
                  requestFilter === 'PENDING_APPROVAL'
                    ? 'bg-[#123B6D] text-white shadow-sm'
                    : 'text-gov-muted hover:text-gov-slate'
                }`}
              >
                Pending ({pendingRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setRequestFilter('ACTIVE')}
                className={`px-3 py-1 rounded font-semibold transition-all ${
                  requestFilter === 'ACTIVE'
                    ? 'bg-[#123B6D] text-white shadow-sm'
                    : 'text-gov-muted hover:text-gov-slate'
                }`}
              >
                Approved
              </button>
              <button
                type="button"
                onClick={() => setRequestFilter('REJECTED')}
                className={`px-3 py-1 rounded font-semibold transition-all ${
                  requestFilter === 'REJECTED'
                    ? 'bg-[#123B6D] text-white shadow-sm'
                    : 'text-gov-muted hover:text-gov-slate'
                }`}
              >
                Rejected
              </button>
              <button
                type="button"
                onClick={() => setRequestFilter('ALL')}
                className={`px-3 py-1 rounded font-semibold transition-all ${
                  requestFilter === 'ALL'
                    ? 'bg-[#123B6D] text-white shadow-sm'
                    : 'text-gov-muted hover:text-gov-slate'
                }`}
              >
                All
              </button>
            </div>
          }
        />

        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={4} columns={6} />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<UserCheck className="w-8 h-8 text-gov-muted" />}
              title="No Registration Requests"
              description={
                requestFilter === 'PENDING_APPROVAL'
                  ? 'All officer and administrator registration requests have been reviewed.'
                  : 'No registration requests matching the selected filter.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FA] border-b border-gov-border">
                <tr className="text-gov-muted font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Applicant Name</th>
                  <th className="py-3 px-4">Official Email</th>
                  <th className="py-3 px-4">Requested Role</th>
                  <th className="py-3 px-4">Department / Org</th>
                  <th className="py-3 px-4">Employee / Admin ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-border">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-gov-slate">{req.fullName}</td>
                    <td className="py-3 px-4 text-gov-muted font-mono">{req.email}</td>
                    <td className="py-3 px-4">
                      {req.role === 'OFFICER' ? (
                        <Badge variant="secondary">Officer</Badge>
                      ) : (
                        <Badge variant="danger">Central Admin</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gov-slate font-medium">
                      {req.department?.name || req.organization || 'Platform Governance'}
                    </td>
                    <td className="py-3 px-4 font-mono text-gov-slate">{req.employeeId || 'N/A'}</td>
                    <td className="py-3 px-4">
                      {req.accountStatus === 'PENDING_APPROVAL' && (
                        <Badge variant="warning" dot>Pending Approval</Badge>
                      )}
                      {req.accountStatus === 'ACTIVE' && (
                        <Badge variant="success" dot>Active / Approved</Badge>
                      )}
                      {req.accountStatus === 'REJECTED' && (
                        <Badge variant="danger" dot>Rejected</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.accountStatus === 'PENDING_APPROVAL' ? (
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            className="py-1 px-2.5 text-[11px]"
                            isLoading={actionLoading === `approve-${req.id}`}
                            onClick={() => handleApprove(req.id)}
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="py-1 px-2.5 text-[11px] text-[#C0392B] border-[#F5B7B1] hover:bg-[#FDEDEC]"
                            onClick={() => setRejectingUser(req)}
                            leftIcon={<XCircle className="w-3.5 h-3.5" />}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gov-muted">
                          {req.approvedAt ? `Approved ${new Date(req.approvedAt).toLocaleDateString()}` : req.accountStatus}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Department Distribution (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col">
            <CardHeader
              title="Applications by Department"
              subtitle="Interoperable request volumes across state departments"
              icon={<TrendingUp className="w-5 h-5 text-[#123B6D]" />}
            />
            <div className="p-6 flex-1 flex flex-col justify-center min-h-[300px]">
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-8 bg-slate-100 rounded animate-pulse" />
                  <div className="h-32 bg-slate-100 rounded animate-pulse" />
                </div>
              ) : metrics?.charts?.departmentDistribution && metrics.charts.departmentDistribution.length > 0 ? (
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.charts.departmentDistribution}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#5B667A' }} interval={0} angle={-25} textAnchor="end" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#5B667A' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#DDE3EA',
                          borderRadius: '8px',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Bar dataKey="count" name="Applications" fill="#123B6D" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-gov-muted">No department application data available yet.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Status Breakdown (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col">
            <CardHeader
              title="Application Status Breakdown"
              subtitle="State machine distribution across all workflows"
              icon={<Activity className="w-5 h-5 text-[#087F8C]" />}
            />
            <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[300px]">
              {isLoading ? (
                <div className="w-40 h-40 rounded-full border-4 border-slate-100 border-t-[#123B6D] animate-spin" />
              ) : metrics?.charts?.statusDistribution && metrics.charts.statusDistribution.length > 0 ? (
                <div className="w-full flex flex-col items-center">
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.charts.statusDistribution}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={45}
                          paddingAngle={3}
                          label={({ status, count }) => `${status}: ${count}`}
                          labelLine={false}
                        >
                          {metrics.charts.statusDistribution.map((_entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderColor: '#DDE3EA',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-3 max-w-xs">
                    {metrics.charts.statusDistribution.map((item: any, idx: number) => (
                      <span key={item.status} className="inline-flex items-center gap-1.5 text-[11px] text-gov-slate">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                        />
                        {item.status} ({item.count})
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-gov-muted">No status telemetry recorded yet.</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Security & Audit Logs */}
      <Card>
        <CardHeader
          title="Live Platform Audit Log Feed"
          subtitle="Non-repudiation audit trail of recent security & workflow events"
          icon={<ShieldCheck className="w-5 h-5 text-[#198754]" />}
          action={
            <Link to="/admin/audit">
              <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View Complete Log Explorer
              </Button>
            </Link>
          }
        />

        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={5} columns={6} />
          </div>
        ) : !metrics?.recentActivity || metrics.recentActivity.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<ShieldCheck className="w-8 h-8 text-gov-muted" />}
              title="No Audit Logs Recorded"
              description="Platform actions and security events will automatically stream here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FA] border-b border-gov-border">
                <tr className="text-gov-muted font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor / Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-border">
                {metrics.recentActivity.slice(0, 8).map((log: any) => (
                  <tr key={log.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4 text-gov-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-gov-slate font-medium">{log.actorEmail || 'System'}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] bg-slate-100 text-gov-slate px-2 py-0.5 rounded font-mono font-semibold border border-slate-200">
                        {log.actorRole || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#123B6D]">{log.action}</td>
                    <td className="py-3 px-4 text-gov-slate">{log.entity}</td>
                    <td className="py-3 px-4 text-gov-muted font-mono text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reject Modal */}
      {rejectingUser && (
        <Modal
          isOpen={!!rejectingUser}
          onClose={() => setRejectingUser(null)}
          title={`Reject Registration: ${rejectingUser.fullName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-gov-slate">
              Please state the reason for rejecting this {rejectingUser.role === 'OFFICER' ? 'Officer' : 'Administrator'} registration request. The applicant will be notified.
            </p>
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. Employee code not recognized by department directory."
                className="w-full p-2.5 text-xs border border-gov-border rounded-lg outline-none focus:border-[#123B6D] focus:ring-2 focus:ring-[#123B6D]/20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setRejectingUser(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                isLoading={actionLoading === `reject-${rejectingUser.id}`}
                onClick={handleReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
