import React, { useEffect, useState } from 'react';
import {
  Cpu,
  RefreshCw,
  Activity,
  ShieldCheck,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Radio,
  Server,
  Layers,
} from 'lucide-react';
import { connectorApi } from '../api/client.js';
import { Connector } from '../types/index.js';
import { Card, CardHeader } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { SkeletonCard } from '../components/ui/Skeleton.js';
import { EmptyState } from '../components/ui/EmptyState.js';

export const AdminConnectorsPage: React.FC = () => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchConnectors = async () => {
    setIsLoading(true);
    try {
      const res = await connectorApi.listConnectors();
      if (res.success && res.data) {
        setConnectors(res.data);
      }
    } catch (err) {
      console.error('Error fetching connectors', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectors();
  }, []);

  const handleTriggerHealthCheck = async (code: string) => {
    setActionLoading(`health-${code}`);
    try {
      await connectorApi.triggerHealthCheck(code);
      await fetchConnectors();
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetSimulationStatus = async (code: string, status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE') => {
    setActionLoading(`sim-${code}`);
    try {
      await connectorApi.simulateStatus(code, {
        status,
        failureRate: status === 'OFFLINE' ? 1.0 : status === 'DEGRADED' ? 0.6 : 0.0,
      });
      await fetchConnectors();
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <Badge variant="success" dot>Healthy</Badge>;
      case 'DEGRADED':
        return <Badge variant="warning" dot>Degraded</Badge>;
      case 'OFFLINE':
        return <Badge variant="danger" dot>Offline</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const healthyCount = connectors.filter((c) => c.status === 'HEALTHY').length;
  const degradedCount = connectors.filter((c) => c.status === 'DEGRADED').length;
  const offlineCount = connectors.filter((c) => c.status === 'OFFLINE').length;
  const avgLatency = connectors.length > 0
    ? Math.round(connectors.reduce((acc, c) => acc + (c.avgLatencyMs || 0), 0) / connectors.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* GovTech Header Banner */}
      <div className="bg-gradient-to-r from-[#123B6D] via-[#0E2E55] to-[#087F8C] rounded-2xl p-6 sm:p-8 text-white shadow-gov relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur border border-white/20 text-white">
              <Cpu className="w-3.5 h-3.5 text-[#F4A340]" />
              <span>Interoperability Infrastructure Layer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Government Platform Connectors & Reliability
            </h1>
            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
              Monitor real-time connector latencies, execute on-demand health probes, and simulate resilience scenarios across all national and state department adapters.
            </p>
          </div>

          <Button
            size="md"
            variant="secondary"
            onClick={fetchConnectors}
            leftIcon={<RefreshCw className={`w-4 h-4 text-[#123B6D] ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh Connectors
          </Button>
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 border-l-4 border-l-[#123B6D]">
          <span className="text-[11px] font-bold text-gov-muted uppercase block">Total Connectors</span>
          <span className="text-2xl font-extrabold text-gov-slate block mt-1">{connectors.length}</span>
          <span className="text-[11px] text-gov-muted">Configured adapters</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-[#198754]">
          <span className="text-[11px] font-bold text-gov-muted uppercase block">Healthy</span>
          <span className="text-2xl font-extrabold text-[#198754] block mt-1">{healthyCount}</span>
          <span className="text-[11px] text-emerald-700">100% operational</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-[#D99000]">
          <span className="text-[11px] font-bold text-gov-muted uppercase block">Degraded</span>
          <span className="text-2xl font-extrabold text-[#D99000] block mt-1">{degradedCount}</span>
          <span className="text-[11px] text-amber-700">Partial latency/failures</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-[#C0392B]">
          <span className="text-[11px] font-bold text-gov-muted uppercase block">Offline</span>
          <span className="text-2xl font-extrabold text-[#C0392B] block mt-1">{offlineCount}</span>
          <span className="text-[11px] text-rose-700">Fallback queue active</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-[#087F8C]">
          <span className="text-[11px] font-bold text-gov-muted uppercase block">Avg Latency</span>
          <span className="text-2xl font-extrabold text-[#087F8C] block mt-1">{avgLatency}ms</span>
          <span className="text-[11px] text-teal-700">Across all gateways</span>
        </Card>
      </div>

      {/* Technical Architecture Notice */}
      <div className="bg-[#EBF3FA] border border-[#B8D5ED] rounded-xl p-4 flex items-start gap-3.5 text-xs text-gov-slate">
        <Info className="w-5 h-5 text-[#123B6D] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-[#123B6D] text-sm block">Architectural Notice — Representative Connector Framework:</span>
          <p className="leading-relaxed text-gov-muted">
            Government integrations shown in this environment operate through GovConnect's standard connector interface layer using representative sandbox adapters. Production deployments seamlessly switch to live national gateways (DigiLocker, Parivahan Sarathi, CPGRAMS, State Portals) with authorized credentials and mTLS encryption.
          </p>
        </div>
      </div>

      {/* Connectors Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : connectors.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<Cpu className="w-10 h-10 text-gov-muted" />}
            title="No Connectors Found"
            description="Unable to load connector registry. Please refresh or verify backend connection."
            action={
              <Button size="sm" variant="primary" onClick={fetchConnectors}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectors.map((conn) => (
            <Card key={conn.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="p-5 space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F5F7FA] border border-gov-border text-[11px] font-mono font-bold text-gov-slate uppercase">
                    <Radio className="w-3 h-3 text-[#123B6D]" />
                    {conn.code}
                  </span>
                  {getStatusBadge(conn.status)}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-gov-slate">{conn.name}</h3>
                  <p className="text-xs text-gov-muted mt-1 leading-relaxed line-clamp-2">
                    {conn.description}
                  </p>
                </div>

                {/* Integration Mode Indicator */}
                {conn.code === 'DIGILOCKER' && (
                  <div className="flex items-center justify-between text-[11px] bg-[#EBF3FA] px-2.5 py-1.5 rounded-lg border border-[#B9D4EE]">
                    <span className="font-semibold text-[#123B6D]">Mode:</span>
                    <span className="font-bold text-[#123B6D]">
                      {conn.integrationMode === 'REAL_AUTHORIZED'
                        ? 'Official Requester Gateway'
                        : conn.integrationMode === 'NOT_CONFIGURED'
                        ? 'Not Configured'
                        : 'Representative Environment'}
                    </span>
                  </div>
                )}

                {/* Metrics Counters */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-[#F5F7FA] rounded-xl border border-gov-border text-center font-mono">
                  <div>
                    <span className="text-gov-muted block text-[10px] uppercase font-sans font-medium">Avg Latency</span>
                    <span className="font-bold text-xs text-[#123B6D]">{conn.avgLatencyMs || 0}ms</span>
                  </div>
                  <div>
                    <span className="text-gov-muted block text-[10px] uppercase font-sans font-medium">Requests</span>
                    <span className="font-bold text-xs text-gov-slate">{(conn.totalRequests || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gov-muted block text-[10px] uppercase font-sans font-medium">Errors</span>
                    <span className={`font-bold text-xs ${conn.errorCount > 0 ? 'text-[#C0392B]' : 'text-gov-slate'}`}>
                      {conn.errorCount || 0}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-gov-muted flex items-center justify-between">
                  <span>Last Health Probe:</span>
                  <span className="font-medium text-gov-slate">
                    {conn.lastHealthCheck ? new Date(conn.lastHealthCheck).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </div>

              {/* Interactive Actions & Reliability Controls */}
              <div className="p-5 pt-0 space-y-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => handleTriggerHealthCheck(conn.code)}
                  isLoading={actionLoading === `health-${conn.code}`}
                  leftIcon={<Zap className="w-3.5 h-3.5 text-[#F4A340]" />}
                >
                  Trigger Health Check Probe
                </Button>

                {/* Reliability Testing States */}
                <div className="space-y-1.5 bg-[#F5F7FA] p-3 rounded-xl border border-gov-border">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gov-muted">
                      Reliability Testing State:
                    </span>
                    <span className="text-[10px] text-gov-muted font-medium">Simulate Chaos</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      onClick={() => handleSetSimulationStatus(conn.code, 'HEALTHY')}
                      disabled={actionLoading === `sim-${conn.code}`}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                        conn.status === 'HEALTHY'
                          ? 'bg-[#198754] text-white shadow-sm ring-1 ring-[#198754]'
                          : 'bg-white text-gov-slate hover:bg-slate-100 border border-gov-border'
                      }`}
                    >
                      Healthy
                    </button>
                    <button
                      onClick={() => handleSetSimulationStatus(conn.code, 'DEGRADED')}
                      disabled={actionLoading === `sim-${conn.code}`}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                        conn.status === 'DEGRADED'
                          ? 'bg-[#D99000] text-white shadow-sm ring-1 ring-[#D99000]'
                          : 'bg-white text-gov-slate hover:bg-slate-100 border border-gov-border'
                      }`}
                    >
                      Degraded
                    </button>
                    <button
                      onClick={() => handleSetSimulationStatus(conn.code, 'OFFLINE')}
                      disabled={actionLoading === `sim-${conn.code}`}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                        conn.status === 'OFFLINE'
                          ? 'bg-[#C0392B] text-white shadow-sm ring-1 ring-[#C0392B]'
                          : 'bg-white text-gov-slate hover:bg-slate-100 border border-gov-border'
                      }`}
                    >
                      Offline
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
