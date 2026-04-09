import { useState, useEffect, useCallback } from "react";
import { getAuthToken } from "../lib/auth-store";
import {
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  Activity,
  Trophy,
  FileText,
  Handshake,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Building2,
  CircleDot,
  Inbox,
  Zap,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "wouter";
import DealRoomModal from "../components/DealRoomModal";

// ---------------------------------------------------------------------------
// CEO CRM Monitoring — Phase 4.4: Global Oversight Deck
// ---------------------------------------------------------------------------
// Concurrent fetch of /api/analytics/global + /api/crm/leads?limit=10.
// Single AbortController prevents React state leaks on unmount.
// All monetary values formatted via native Intl.NumberFormat.
// ---------------------------------------------------------------------------

const API_BASE =
  import.meta.env.VITE_TRIAGE_API_BASE ||
  "https://api.referralsvc.com";

// ── Native USD Formatter ─────────────────────────────────────────────────────

const usdFull = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatUSD(val) {
  const n = val ?? 0;
  return n >= 10000 ? usdCompact.format(n) : usdFull.format(n);
}

// ── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  new:          { label: "New",         bg: "bg-cyan-500/15",    text: "text-cyan-400",    border: "border-cyan-500/25"    },
  contacted:    { label: "Contacted",   bg: "bg-blue-500/15",    text: "text-blue-400",    border: "border-blue-500/25"    },
  qualified:    { label: "Qualified",   bg: "bg-violet-500/15",  text: "text-violet-400",  border: "border-violet-500/25"  },
  proposal:     { label: "Proposal",    bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/25"   },
  negotiation:  { label: "Negotiation", bg: "bg-orange-500/15",  text: "text-orange-400",  border: "border-orange-500/25"  },
  closed_won:   { label: "Won",         bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25" },
  closed_lost:  { label: "Lost",        bg: "bg-red-500/15",     text: "text-red-400",     border: "border-red-500/25"     },
  released:     { label: "Released",    bg: "bg-slate-500/15",   text: "text-slate-400",   border: "border-slate-500/25"   },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.new;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
}

// ── Hero Metric Card ─────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-5 flex flex-col justify-between min-h-[130px]">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <div className={`text-2xl font-bold font-mono tracking-tight ${color} leading-none`}>
          {value}
        </div>
        <div className="text-[11px] text-white/35 mt-1.5 uppercase tracking-wider font-medium">
          {label}
        </div>
        {sub && (
          <div className="text-[10px] text-white/20 mt-0.5">{sub}</div>
        )}
      </div>
    </div>
  );
}

// ── Pipeline Health Bar ──────────────────────────────────────────────────────

function PipelineHealth({ pipeline, dealRooms }) {
  const segments = [
    { label: "Active Leads",   value: pipeline?.activeLeadCount ?? 0,   color: "bg-cyan-500"    },
    { label: "Recent Closed",  value: pipeline?.recentClosedWon ?? 0,   color: "bg-emerald-500" },
    { label: "Deals Signed",   value: dealRooms?.signed ?? 0,           color: "bg-violet-500"  },
    { label: "Deals Pending",  value: dealRooms?.pending ?? 0,          color: "bg-amber-500"   },
  ];

  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  return (
    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-cyan-400" />
        <h3 className="text-sm font-bold text-white/80">Pipeline Health</h3>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden flex mb-4">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} transition-all duration-500`}
            style={{ width: `${Math.max((seg.value / total) * 100, seg.value > 0 ? 4 : 0)}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
            <div>
              <div className="text-xs font-bold text-white/70">{seg.value}</div>
              <div className="text-[10px] text-white/30">{seg.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Supplementary Stats */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs font-bold text-white/60 font-mono">{pipeline?.totalLeads ?? 0}</div>
          <div className="text-[10px] text-white/25">Total Leads</div>
        </div>
        <div>
          <div className="text-xs font-bold text-white/60 font-mono">{pipeline?.intakeLeads ?? 0}</div>
          <div className="text-[10px] text-white/25">Inbound</div>
        </div>
        <div>
          <div className="text-xs font-bold text-emerald-400/70 font-mono">
            {formatUSD(pipeline?.recentClosedArr ?? 0)}
          </div>
          <div className="text-[10px] text-white/25">Won (30d)</div>
        </div>
      </div>
    </div>
  );
}

// ── Financial Breakdown ──────────────────────────────────────────────────────

function FinancialBreakdown({ financials }) {
  const fin = financials ?? {};
  const rows = [
    { label: "Studio Net Revenue", value: formatUSD(fin.totalStudioNetRevenue), color: "text-emerald-400" },
    { label: "Partner Payouts",    value: formatUSD(fin.totalPartnerPayouts),   color: "text-amber-400"   },
    { label: "AI COGS",            value: formatUSD(fin.totalAiCogs),           color: "text-red-400"     },
    { label: "Blended Margin",     value: `${(fin.blendedGrossMargin ?? 0).toFixed(1)}%`, color: "text-cyan-400" },
  ];

  return (
    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase size={16} className="text-emerald-400" />
        <h3 className="text-sm font-bold text-white/80">FinOps Breakdown</h3>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-xs text-white/40">{r.label}</span>
            <span className={`text-sm font-bold font-mono ${r.color}`}>{r.value}</span>
          </div>
        ))}
      </div>
      {/* Payout Status Chips */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
          {fin.paidCount ?? 0} Paid
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
          {fin.pendingCount ?? 0} Pending
        </span>
        {(fin.flaggedCount ?? 0) > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
            {fin.flaggedCount} Flagged
          </span>
        )}
      </div>
    </div>
  );
}

// ── System Status Grid ───────────────────────────────────────────────────────

function SystemStatus({ systemStatus }) {
  const sys = systemStatus ?? {};
  const services = Object.entries(sys).map(([key, val]) => ({
    name: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
    online: val === "ONLINE",
  }));

  const onlineCount = services.filter((s) => s.online).length;

  return (
    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          <h3 className="text-sm font-bold text-white/80">System Status</h3>
        </div>
        <span className="text-[10px] font-bold text-emerald-400/70 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {onlineCount}/{services.length}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {services.map((svc) => (
          <div key={svc.name} className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${svc.online ? "bg-emerald-400" : "bg-red-400"}`} />
            <span className={`text-[10px] truncate ${svc.online ? "text-white/40" : "text-red-400/80"}`}>
              {svc.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Activity Feed Table ──────────────────────────────────────────────────────

function ActivityFeed({ leads, onRowClick, onDelete }) {
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (!leads || leads.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8">
        <div className="flex flex-col items-center justify-center py-6 opacity-50">
          <Inbox size={32} className="text-white/20 mb-3" />
          <span className="text-sm text-white/30 font-medium">No recent activity</span>
          <span className="text-xs text-white/15 mt-1">Leads will appear here as they enter the pipeline</span>
        </div>
      </div>
    );
  }

  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = async (leadId) => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete?.(leadId);
      setConfirmId(null);
    } catch (err) {
      setDeleteError(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden relative">
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center gap-2">
        <Zap size={16} className="text-amber-400" />
        <h3 className="text-sm font-bold text-white/80">Global Activity Feed</h3>
        <span className="ml-auto text-[10px] text-white/25 font-medium">Top 10 by intent</span>
      </div>

      {/* Delete Confirmation Overlay */}
      {confirmId && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Delete Lead</h4>
                <p className="text-[11px] text-white/40">This will permanently remove the lead and all related deals, notes, and payouts.</p>
              </div>
            </div>
            <p className="text-xs text-white/60 mb-5 bg-white/5 rounded-lg px-3 py-2">
              <span className="font-semibold text-white/80">
                {leads.find(l => (l.id || l.leadId) === confirmId)?.prospectName || "Unknown"}
              </span>
              {" — "}
              {leads.find(l => (l.id || l.leadId) === confirmId)?.prospectCompany || ""}
            </p>
            {deleteError && (
              <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 mb-3">{deleteError}</p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setConfirmId(null); setDeleteError(null); }}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-slate-700 transition disabled:opacity-40"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/30 transition disabled:opacity-40"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800/40">
              <th className="px-5 py-3 text-[10px] font-bold text-white/25 uppercase tracking-wider">Prospect</th>
              <th className="px-5 py-3 text-[10px] font-bold text-white/25 uppercase tracking-wider">Company</th>
              <th className="px-5 py-3 text-[10px] font-bold text-white/25 uppercase tracking-wider">Assigned SP</th>
              <th className="px-5 py-3 text-[10px] font-bold text-white/25 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-[10px] font-bold text-white/25 uppercase tracking-wider text-right">ARR</th>
              <th className="px-5 py-3 text-[10px] font-bold text-white/25 uppercase tracking-wider text-right">Intent</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => (
              <tr
                key={lead.engagementId || i}
                className="border-b border-slate-800/20 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                onClick={() => onRowClick?.(lead)}
              >
                <td className="px-5 py-3">
                  <span className="text-sm font-medium text-white/80">
                    {lead.prospectName || "—"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <Building2 size={12} className="text-white/20 shrink-0" />
                    <span className="text-xs text-white/50 truncate max-w-[160px]">
                      {lead.prospectCompany || "—"}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs text-white/40 font-mono truncate max-w-[180px] block">
                    {lead.prospectEmail || "unassigned"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="text-xs font-bold font-mono text-emerald-400/80">
                    {formatUSD(lead.estimatedArr)}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {(() => {
                    const s = lead.intentScore ?? 0;
                    const c = s >= 80 ? "text-emerald-400" : s >= 50 ? "text-amber-400" : "text-red-400";
                    return <span className={`text-xs font-bold font-mono ${c}`}>{s}</span>;
                  })()}
                </td>
                <td className="px-2 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmId(lead.id || lead.leadId);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400"
                    title="Delete lead"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CEOCrmMonitoring() {
  const [analytics, setAnalytics] = useState(null);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const loadData = useCallback(async (signal) => {
    try {
      const token = getAuthToken();
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      };

      const [analyticsRes, leadsRes] = await Promise.all([
        fetch(`${API_BASE}/api/analytics/global`, { headers, signal }),
        fetch(`${API_BASE}/api/crm/leads?limit=10`, { headers, signal }),
      ]);

      const analyticsJson = await analyticsRes.json().catch(() => null);
      const leadsJson = await leadsRes.json().catch(() => null);

      if (!analyticsRes.ok) {
        setError(
          `Analytics: ${analyticsRes.status} — ${analyticsJson?.error || analyticsJson?.message || "Request failed"}`
        );
        return;
      }

      setAnalytics(analyticsJson);
      setLeads(Array.isArray(leadsJson?.handoffs) ? leadsJson.handoffs : []);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Network error");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const handleDeleteLead = useCallback(async (leadId) => {
    // Decode CEO email from JWT (same approach as DealRoomModal.getCallerEmail)
    let ceoEmail = "";
    try {
      const jwt = sessionStorage.getItem("rsllc_ceo_jwt");
      if (jwt) {
        const payload = JSON.parse(atob(jwt.split(".")[1]));
        ceoEmail = payload.email || payload.sub || "";
      }
    } catch { /* fallback to empty */ }

    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/admin/lead/${leadId}`, {
      method: "DELETE",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
        "x-partner-email": ceoEmail,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Delete failed");
    }
    // Optimistic removal: instantly remove from local state
    setLeads((prev) => prev.filter((l) => (l.id || l.leadId) !== leadId));
    // Then reload full data from API to sync metrics
    await loadData();
  }, [loadData]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-emerald-400 animate-spin" />
          <span className="text-sm text-white/40">Loading telemetry…</span>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertTriangle size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Telemetry Error</h2>
          <p className="text-sm text-red-400/80 mb-4">{error}</p>
          <Link
            href="/crm"
            className="inline-flex items-center gap-1.5 text-white/40 text-xs hover:text-white/60 transition-colors"
          >
            <ArrowLeft size={12} /> Back to CRM
          </Link>
        </div>
      </div>
    );
  }

  const fin = analytics?.financials ?? {};
  const pipe = analytics?.pipeline ?? {};
  const partners = analytics?.partnerNetwork ?? {};

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ── Header ── */}
      <div className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              CEO Command Center
            </h1>
            <p className="text-xs text-white/30 mt-0.5">
              Global CRM Telemetry — Real-time oversight
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-white/20">
              <CircleDot size={8} className="text-emerald-400" />
              {analytics?.timestamp
                ? new Date(analytics.timestamp).toLocaleTimeString()
                : "—"}
            </div>
            <Link
              href="/ceo"
              className="flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors bg-white/5 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft size={12} /> Back to CEO Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">

        {/* Hero Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={DollarSign}
            label="GMV Collected"
            value={formatUSD(fin.totalGmvCollected)}
            sub={`${fin.paidCount ?? 0} paid deals`}
            color="text-emerald-400"
          />
          <MetricCard
            icon={TrendingUp}
            label="Active Pipeline"
            value={formatUSD(pipe.activePipelineTcv)}
            sub={`${pipe.activeLeadCount ?? 0} active leads`}
            color="text-cyan-400"
          />
          <MetricCard
            icon={FileText}
            label="Total Leads"
            value={pipe.totalLeads ?? 0}
            sub={`${pipe.recentClosedWon ?? 0} won (30d)`}
            color="text-purple-400"
          />
          <MetricCard
            icon={Users}
            label="Active Partners"
            value={partners.activePartners ?? 0}
            sub={partners.pendingApprovals > 0 ? `${partners.pendingApprovals} pending` : "All approved"}
            color="text-blue-400"
          />
        </div>

        {/* Middle Row: Pipeline Health + FinOps + System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PipelineHealth
            pipeline={analytics?.pipeline}
            dealRooms={analytics?.dealRooms}
          />
          <FinancialBreakdown financials={analytics?.financials} />
          <SystemStatus systemStatus={analytics?.systemStatus} />
        </div>

        {/* Bottom Row: Activity Feed */}
        <ActivityFeed
          leads={leads}
          onRowClick={(lead) => {
            const id = lead.id || lead.leadId;
            if (id) setSelectedLeadId(id);
          }}
          onDelete={handleDeleteLead}
        />
      </div>

      {/* Epic 28: Deal Room Modal */}
      {selectedLeadId && (
        <DealRoomModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </div>
  );
}
