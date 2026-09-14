import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  Bell,
  Sparkles,
  Droplets,
  LandPlot,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  PlusCircle,
  CreditCard,
  Building2,
  Car,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { applicationApi, notificationApi, consentApi } from '../api/client.js';
import { Application, Notification, Consent } from '../types/index.js';
import { Card, CardHeader } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Skeleton } from '../components/ui/Skeleton.js';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [appsRes, notifsRes, consentsRes] = await Promise.all([
          applicationApi.listCitizenApplications(),
          notificationApi.list(),
          consentApi.listConsents(),
        ]);

        if (appsRes.success) setApplications(appsRes.data || []);
        if (notifsRes.success) setNotifications(notifsRes.data || []);
        if (consentsRes.success) setConsents(consentsRes.data || []);
      } catch (err) {
        console.error('Failed to load citizen dashboard', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const activeApps = applications.filter((a) => !['COMPLETED', 'REJECTED'].includes(a.status));
  const completedApps = applications.filter((a) => a.status === 'COMPLETED');
  const pendingActions = applications.filter((a) => a.status === 'APPROVED' || a.status === 'UNDER_VERIFICATION');
  const unreadNotifs = notifications.filter((n) => !n.isRead);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'APPROVED':
        return <Badge variant="primary">Approved (Pay Fee)</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge variant="info">Officer Review</Badge>;
      case 'SUBMITTED':
      case 'UNDER_VERIFICATION':
      case 'CROSS_DEPARTMENT_CHECK':
        return <Badge variant="warning">Interoperability Check</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#F5F7FA]">
      {/* Welcome Banner */}
      <div className="bg-[#0B2A4A] rounded-2xl p-6 sm:p-8 text-white flex flex-wrap items-center justify-between gap-6 shadow-gov-md border border-[#123B6D]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#198754] border border-[#A3E9B9]">
              Verified Citizen Profile
            </span>
            <span className="text-xs text-slate-300 font-mono">UIDAI: XXXX-XXXX-4819</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good morning, {user?.fullName || 'Citizen'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Access, track, and manage your connected government services and cross-department verification consents from one secure dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/services">
            <Button variant="accent" size="md" leftIcon={<Search className="w-4 h-4" />}>
              Find a Service
            </Button>
          </Link>
          <Link to="/assistant">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Sparkles className="w-4 h-4 text-[#F4A340]" />}
            >
              Ask AI Assistant
            </Button>
          </Link>
        </div>
      </div>

      {/* Real-time KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="flex items-center gap-4 border-[#DDE3EA]">
          <div className="p-3 bg-[#EBF3FA] text-[#123B6D] rounded-xl border border-[#B9D4EE]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#172033]">{activeApps.length}</span>
            <p className="text-xs text-[#5B667A] font-medium">Active Applications</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-[#DDE3EA]">
          <div className="p-3 bg-[#E8F5E9] text-[#198754] rounded-xl border border-[#A3E9B9]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#172033]">{completedApps.length}</span>
            <p className="text-xs text-[#5B667A] font-medium">Completed Services</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-[#DDE3EA]">
          <div className="p-3 bg-[#FFF8E6] text-[#D99000] rounded-xl border border-[#FFE082]">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#172033]">{pendingActions.length}</span>
            <p className="text-xs text-[#5B667A] font-medium">Pending Actions / Fee</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-[#DDE3EA]">
          <div className="p-3 bg-[#E6F4F5] text-[#087F8C] rounded-xl border border-[#B2E2E6]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#172033]">{consents.length}</span>
            <p className="text-xs text-[#5B667A] font-medium">Active Data Consents</p>
          </div>
        </Card>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-white p-4 rounded-xl border border-[#DDE3EA] shadow-gov flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
          Quick Workflows:
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/apply/water">
            <Button size="sm" variant="primary" leftIcon={<Droplets className="w-3.5 h-3.5" />}>
              Water Connection
            </Button>
          </Link>
          <Link to="/apply/driving-licence">
            <Button size="sm" variant="primary" leftIcon={<Car className="w-3.5 h-3.5" />}>
              Driving Licence Renewal
            </Button>
          </Link>
          <Link to="/consents">
            <Button size="sm" variant="secondary" leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}>
              My Data Consents
            </Button>
          </Link>
          <Link to="/grievances">
            <Button size="sm" variant="outline">
              CPGRAMS Grievances
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content Grid: Recent Applications & AI Quick Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col (8 cols): Applications Table */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-[#DDE3EA]">
            <CardHeader
              title="Recent Applications"
              subtitle="Real-time multi-department workflow tracking"
              icon={<FileText className="w-5 h-5 text-[#123B6D]" />}
              action={
                <Link to="/services">
                  <Button size="sm" variant="outline">Explore Services</Button>
                </Link>
              }
            />

            {isLoading ? (
              <div className="py-6 space-y-3">
                <Skeleton variant="rectangular" count={4} />
              </div>
            ) : applications.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-8 h-8 text-[#123B6D]" />}
                title="No Applications Submitted Yet"
                description="Your submitted government service applications will appear here with live tracking."
                actionLabel="Explore Service Directory"
                onAction={() => window.location.assign('/services')}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#DDE3EA] text-[#5B667A] font-bold uppercase tracking-wider text-[11px] bg-[#F5F7FA]">
                      <th className="py-2.5 px-3">App ID</th>
                      <th className="py-2.5 px-3">Service & Department</th>
                      <th className="py-2.5 px-3">Tracking Mode</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE3EA]/70">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-[#F5F7FA] transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-[#123B6D] block">{app.applicationNumber}</span>
                          {app.externalReferenceId && (
                            <span className="font-mono text-[10px] text-[#5B667A] block truncate max-w-[130px]" title={app.externalReferenceId}>
                              Ref: {app.externalReferenceId}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#172033] block">{app.service?.name}</span>
                          <span className="text-[11px] text-[#5B667A]">{app.department?.name}</span>
                        </td>
                        <td className="py-3 px-3">
                          {app.applicationType === 'INTEGRATED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#EBF3FA] text-[#123B6D] border border-[#B9D4EE]">
                              API: {app.externalPlatform || 'Connector'}
                            </span>
                          ) : app.applicationType === 'EXTERNAL_ONLY' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0F3F7] text-[#5B667A] border border-[#DDE3EA]">
                              External Portal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F5E9] text-[#198754] border border-[#A3E9B9]">
                              Native Workflow
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(app.status)}</td>
                        <td className="py-3 px-3 text-[#5B667A]">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link to={`/applications/${app.id}`}>
                            <Button size="sm" variant="secondary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                              Track
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col (4 cols): AI Assistant Prompt & Notifications */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Assistant Quick Prompt */}
          <Card className="bg-gradient-to-br from-[#EBF3FA] to-white border-[#B9D4EE] shadow-gov">
            <div className="flex items-center gap-2 text-[#123B6D] font-bold text-xs mb-3">
              <Sparkles className="w-4 h-4 text-[#F4A340]" />
              <span>AI Service Assistant</span>
            </div>
            <h3 className="font-bold text-sm text-[#172033] mb-1">Need help with an application?</h3>
            <p className="text-xs text-[#5B667A] mb-4 leading-relaxed">
              Ask natural questions like <i>"How do I renew my driving licence?"</i> to discover requirements and launch services instantly.
            </p>
            <Link to="/assistant">
              <Button size="sm" variant="primary" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Launch AI Assistant
              </Button>
            </Link>
          </Card>

          {/* Citizen Notifications */}
          <Card className="border-[#DDE3EA]">
            <CardHeader
              title="Recent Updates"
              subtitle={`${unreadNotifs.length} unread notifications`}
              icon={<Bell className="w-4 h-4 text-[#123B6D]" />}
            />
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-xs text-[#5B667A] py-4 text-center">No notifications</p>
              ) : (
                notifications.slice(0, 4).map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg text-xs space-y-1 border ${
                      notif.isRead
                        ? 'bg-[#F5F7FA] border-[#DDE3EA] text-[#5B667A]'
                        : 'bg-[#EBF3FA] border-[#B9D4EE] text-[#172033] font-medium'
                    }`}
                  >
                    <p className="font-bold">{notif.title}</p>
                    <p className="text-[11px] text-[#5B667A]">{notif.message}</p>
                    <span className="text-[10px] text-[#5B667A]/80 block font-mono">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
