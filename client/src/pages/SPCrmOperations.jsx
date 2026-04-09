import { useState, useEffect, useRef, useCallback } from "react";
import { getAuthToken } from "../lib/auth-store";
import {
  Inbox,
  Phone,
  CheckCircle2,
  FileText,
  Handshake,
  Trophy,
  Loader2,
  AlertTriangle,
  Building2,
  TrendingUp,
  Users,
  DollarSign,
  ArrowLeft,
  ChevronRight,
  X,
  FileSignature,
  Link2,
  Check,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

// ---------------------------------------------------------------------------
// SP CRM Operations — Phase 5.2: Kanban Pipeline with Optimistic Mutations
// ---------------------------------------------------------------------------
// Fetches /api/crm/leads (RBAC-filtered: partner sees only their leads).
// Move Stage action fires PATCH /api/crm/leads/:id with optimistic UI update
// and automatic rollback on failure.
// ---------------------------------------------------------------------------

const API_BASE =
  import.meta.env.VITE_TRIAGE_API_BASE ||
  "https://api.referralsvc.com";

// ── Kanban Column Definitions ────────────────────────────────────────────────

const COLUMNS = [
  { key: "new",         label: "New",         icon: Inbox,        accent: "cyan"    },
  { key: "contacted",   label: "Contacted",   icon: Phone,        accent: "blue"    },
  { key: "qualified",   label: "Qualified",   icon: CheckCircle2, accent: "violet"  },
  { key: "proposal",    label: "Proposal",    icon: FileText,     accent: "amber"   },
  { key: "negotiation", label: "Negotiation", icon: Handshake,    accent: "orange"  },
  { key: "closed_won",  label: "Closed Won",  icon: Trophy,       accent: "emerald" },
];

const COLUMN_KEYS = COLUMNS.map((c) => c.key);

// ── Accent Color Map (Tailwind classes) ──────────────────────────────────────

const ACCENT = {
  cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    text: "text-cyan-400",    dot: "bg-cyan-400"    },
  blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400",    dot: "bg-blue-400"    },
  violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/20",  text: "text-violet-400",  dot: "bg-violet-400"  },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   dot: "bg-amber-400"   },
  orange:  { bg: "bg-orange-500/10",  border: "border-orange-500/20",  text: "text-orange-400",  dot: "bg-orange-400"  },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400" },
};

// ── USD Formatter ────────────────────────────────────────────────────────────

function formatUSD(val) {
  if (!val || val === 0) return "$0";
  if (val >= 1000) return `$${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K`;
  return `$${val.toLocaleString()}`;
}

// ── Intent Score Badge ───────────────────────────────────────────────────────

function IntentBadge({ score }) {
  const s = score ?? 0;
  const color =
    s >= 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
    s >= 50 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
              "bg-red-500/20 text-red-400 border-red-500/30";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      <TrendingUp size={10} />
      {s}
    </span>
  );
}

// ── Error Toast ──────────────────────────────────────────────────────────────

function ErrorToast({ message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
      <div className="bg-red-950/95 border border-red-500/40 rounded-lg px-4 py-3 shadow-2xl shadow-red-900/30 flex items-center gap-3 max-w-sm">
        <AlertTriangle size={16} className="text-red-400 shrink-0" />
        <span className="text-sm text-red-200 leading-tight">{message}</span>
        <button
          onClick={onDismiss}
          className="text-red-400/60 hover:text-red-300 transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Move Stage Menu ──────────────────────────────────────────────────────────

function MoveStageMenu({ currentStatus, onMove, disabled }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const targets = COLUMN_KEYS.filter((k) => k !== currentStatus);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-1 text-[10px] font-medium text-white/30 hover:text-white/60 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Move <ChevronRight size={10} className={`transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-slate-900 border border-slate-700/60 rounded-lg shadow-xl shadow-black/40 py-1 min-w-[140px]">
          {targets.map((key) => {
            const col = COLUMNS.find((c) => c.key === key);
            const a = ACCENT[col?.accent || "cyan"];
            return (
              <button
                key={key}
                onClick={() => { onMove(key); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                {col?.label || key}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({ lead, onMoveStage, mutating, generating, dealLink, copied, onGenerateDealRoom, onCopyLink }) {
  return (
    <div className={`group bg-slate-800/60 backdrop-blur border border-slate-700/40 rounded-xl p-3.5 hover:border-slate-600/60 hover:bg-slate-800/80 transition-all duration-200 ${mutating ? "opacity-60" : ""}`}>
      {/* Header: Name + Intent */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-white truncate leading-tight">
          {lead.prospectName || "Unknown"}
        </h4>
        <IntentBadge score={lead.intentScore} />
      </div>

      {/* Company */}
      <div className="flex items-center gap-1.5 mb-2">
        <Building2 size={12} className="text-white/30 shrink-0" />
        <span className="text-xs text-white/50 truncate">
          {lead.prospectCompany || "\u2014"}
        </span>
      </div>

      {/* Deal Room Action (closed_won leads only) */}
      {lead.status === "closed_won" && (
        <div className="mb-2">
          {dealLink ? (
            <button
              onClick={() => onCopyLink(lead.id, dealLink)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
            >
              {copied ? (
                <>
                  <Check size={12} />
                  Copied!
                </>
              ) : (
                <>
                  <Link2 size={12} />
                  Copy Payment Link
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => onGenerateDealRoom(lead.id)}
              disabled={generating}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <FileSignature size={12} />
                  Generate SOW &amp; Payment Link
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Footer: ARR + Move Action */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/30">
        <div className="flex items-center gap-1">
          <DollarSign size={11} className="text-emerald-400/70" />
          <span className="text-xs font-medium text-emerald-400/90">
            {formatUSD(lead.estimatedArr)}
          </span>
          <span className="text-[10px] text-white/25 ml-0.5">ARR</span>
        </div>
        <div className="flex items-center gap-1.5">
          {lead.isHumanTakeover && (
            <span className="text-[10px] font-medium text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded">
              HUMAN
            </span>
          )}
          <MoveStageMenu
            currentStatus={lead.status}
            onMove={(newStatus) => onMoveStage(lead.id, lead.status, newStatus)}
            disabled={mutating}
          />
        </div>
      </div>
    </div>
  );
}

// ── Empty Column State ───────────────────────────────────────────────────────

function EmptyColumn({ accent }) {
  const a = ACCENT[accent];
  return (
    <div className={`flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-dashed ${a.border} ${a.bg} opacity-60`}>
      <Inbox size={24} className={`${a.text} mb-2 opacity-50`} />
      <span className="text-xs text-white/30 font-medium">Pipeline Clear</span>
    </div>
  );
}

// ── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({ column, leads, onMoveStage, mutatingIds, generatingId, dealLinks, copiedId, onGenerateDealRoom, onCopyLink }) {
  const a = ACCENT[column.accent];
  const Icon = column.icon;
  const colArr = leads.reduce((sum, l) => sum + (l.estimatedArr || 0), 0);

  return (
    <div className="flex flex-col min-w-[260px] max-w-[320px] flex-1">
      {/* Column Header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 ${a.bg} border ${a.border}`}>
        <div className={`w-2 h-2 rounded-full ${a.dot}`} />
        <Icon size={14} className={a.text} />
        <span className={`text-xs font-bold ${a.text} uppercase tracking-wider`}>
          {column.label}
        </span>
        <span className="ml-auto text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>

      {/* Column ARR Total */}
      {leads.length > 0 && (
        <div className="flex items-center gap-1 px-3 mb-2">
          <DollarSign size={10} className="text-white/20" />
          <span className="text-[10px] font-medium text-white/30">
            {formatUSD(colArr)} pipeline
          </span>
        </div>
      )}

      {/* Cards */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-1 scrollbar-thin">
        {leads.length === 0 ? (
          <EmptyColumn accent={column.accent} />
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.engagementId}
              lead={lead}
              onMoveStage={onMoveStage}
              mutating={mutatingIds.has(lead.id)}
              generating={generatingId === lead.id}
              dealLink={dealLinks[lead.id]}
              copied={copiedId === lead.id}
              onGenerateDealRoom={onGenerateDealRoom}
              onCopyLink={onCopyLink}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Summary Stats Bar ────────────────────────────────────────────────────────

function StatsBar({ leads }) {
  const total = leads.length;
  const totalArr = leads.reduce((s, l) => s + (l.estimatedArr || 0), 0);
  const avgIntent = total > 0 ? Math.round(leads.reduce((s, l) => s + (l.intentScore || 0), 0) / total) : 0;
  const wonCount = leads.filter((l) => l.status === "closed_won").length;

  const stats = [
    { label: "Total Leads",  value: total,              icon: Users,       color: "text-cyan-400"    },
    { label: "Pipeline ARR", value: formatUSD(totalArr), icon: DollarSign,  color: "text-emerald-400" },
    { label: "Avg Intent",   value: avgIntent,           icon: TrendingUp,  color: "text-amber-400"   },
    { label: "Won",          value: wonCount,            icon: Trophy,      color: "text-violet-400"  },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center ${s.color}`}>
            <s.icon size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-white leading-none">{s.value}</div>
            <div className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wider">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function SPCrmOperations() {
  const [leads, setLeads] = useState([]);
  const [handoffs, setHandoffs] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [mutatingIds, setMutatingIds] = useState(new Set());
  // ── FinOps Deal Room State ──
  const [generatingId, setGeneratingId] = useState(null);
  const [dealLinks, setDealLinks] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // ── Data Fetch: Leads + Triage Handoffs (concurrent) ──
  useEffect(() => {
    const controller = new AbortController();
    const headers = (token) => ({
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    });

    (async () => {
      try {
        const token = getAuthToken();
        const [leadsRes, handoffsRes] = await Promise.all([
          fetch(`${API_BASE}/api/crm/leads?limit=100`, {
            headers: headers(token),
            signal: controller.signal,
          }),
          fetch(`${API_BASE}/api/triage/handoffs?limit=50`, {
            headers: headers(token),
            signal: controller.signal,
          }).catch(() => null),
        ]);

        if (!leadsRes.ok) {
          const json = await leadsRes.json().catch(() => ({}));
          setFetchError(`${leadsRes.status} \u2014 ${json.error || json.message || "Request failed"}`);
          return;
        }

        const leadsJson = await leadsRes.json();
        setLeads(Array.isArray(leadsJson.handoffs) ? leadsJson.handoffs : []);

        if (handoffsRes?.ok) {
          const handoffsJson = await handoffsRes.json().catch(() => ({}));
          setHandoffs(Array.isArray(handoffsJson?.handoffs) ? handoffsJson.handoffs : []);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setFetchError(err.message || "Network error");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  // ── Optimistic Move Stage ──
  const handleMoveStage = useCallback(async (leadId, currentStatus, newStatus) => {
    // Prevent double-mutations
    if (mutatingIds.has(leadId)) return;

    // 1. Cache previous state for rollback
    const prevLeads = leads;

    // 2. Optimistic update: clone array, update status
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    setMutatingIds((prev) => new Set(prev).add(leadId));

    try {
      // 3. Fire PATCH request
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/crm/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const msg = json.error || json.message || `Status ${res.status}`;
        throw new Error(msg);
      }
    } catch (err) {
      // 4. Rollback on failure
      setLeads(prevLeads);
      setToast(`Move failed: ${err.message}`);
    } finally {
      // 5. Clear mutating state
      setMutatingIds((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  }, [leads, mutatingIds]);

  // ── Deal Room Generation ──
  const handleGenerateDealRoom = useCallback(async (leadId) => {
    if (generatingId) return; // one at a time
    setGeneratingId(leadId);

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/crm/leads/${leadId}/deal-room`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || json.message || `Status ${res.status}`);
      }

      // Cache the checkout URL (works for both fresh + idempotent responses)
      const url = json.checkoutUrl || json.stripeSessionId || json.magicToken;
      if (url) {
        setDealLinks((prev) => ({ ...prev, [leadId]: json.checkoutUrl || `Deal Room: ${json.magicToken}` }));
      }
    } catch (err) {
      setToast(`Deal room failed: ${err.message}`);
    } finally {
      setGeneratingId(null);
    }
  }, [generatingId]);

  // ── Clipboard Copy ──
  const handleCopyLink = useCallback((leadId, url) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(leadId);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      setToast("Clipboard access denied");
    });
  }, []);

  // ── Optimistic Cross-State Takeover ──
  const handleAcceptHandoff = useCallback(async (engagementId, handoff) => {
    if (mutatingIds.has(engagementId)) return;

    // 1. Cache previous state for rollback
    const prevHandoffs = handoffs;
    const prevLeads = leads;

    // 2. Map KV handoff payload → CrmLead schema
    const mappedLead = {
      id: Date.now(),
      engagementId: handoff.engagementId,
      prospectName: handoff.prospectName,
      prospectEmail: handoff.prospectEmail,
      prospectPhone: handoff.prospectPhone,
      prospectCompany: handoff.prospectCompany,
      prospectRole: handoff.prospectRole,
      intentScore: handoff.intentScore ?? 0,
      replyChannel: handoff.replyChannel,
      status: "new",
      isHumanTakeover: 1,
      estimatedArr: 0,
      createdAt: new Date().toISOString(),
    };

    // 3. Optimistic UI: remove from handoffs, add to leads
    setHandoffs((prev) => prev.filter((h) => h.engagementId !== engagementId));
    setLeads((prev) => [mappedLead, ...prev]);
    setMutatingIds((prev) => new Set(prev).add(engagementId));

    try {
      // 4. Network execution
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/triage/takeover/${engagementId}`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || json.message || `Status ${res.status}`);
      }
    } catch (err) {
      // 5. Rollback both arrays
      setHandoffs(prevHandoffs);
      setLeads(prevLeads);
      setToast(`Takeover failed: ${err.message}`);
    } finally {
      setMutatingIds((prev) => {
        const next = new Set(prev);
        next.delete(engagementId);
        return next;
      });
    }
  }, [handoffs, leads, mutatingIds]);

  // ── Group leads by status ──
  const grouped = {};
  for (const col of COLUMNS) {
    grouped[col.key] = [];
  }
  for (const lead of leads) {
    const key = lead.status || "new";
    if (grouped[key]) {
      grouped[key].push(lead);
    }
  }

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-cyan-400 animate-spin" />
          <span className="text-sm text-white/40">Loading pipeline\u2026</span>
        </div>
      </div>
    );
  }

  // ── Fetch Error State ──
  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertTriangle size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Pipeline Error</h2>
          <p className="text-sm text-red-400/80 mb-4">{fetchError}</p>
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

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ── Error Toast ── */}
      {toast && <ErrorToast message={toast} onDismiss={() => setToast(null)} />}

      {/* ── Header ── */}
      <div className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              SP Pipeline
            </h1>
            <p className="text-xs text-white/30 mt-0.5">
              CRM Operations — Your assigned leads
            </p>
          </div>
          <Link
            href="/crm"
            className="flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors bg-white/5 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft size={12} /> CRM Portal
          </Link>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Stats Bar */}
        <StatsBar leads={leads} />

        {/* ── Pending AI Handoffs ── */}
        {handoffs.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-purple-400" />
              <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider">
                Pending AI Handoffs
              </h2>
              <span className="text-[10px] font-bold text-white/40 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                {handoffs.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {handoffs.map((h) => (
                <div
                  key={h.engagementId}
                  className={`bg-slate-900/50 backdrop-blur border border-purple-500/30 rounded-xl p-4 hover:border-purple-500/50 transition-all duration-200 ${mutatingIds.has(h.engagementId) ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {h.prospectName || "Unknown"}
                    </h4>
                    <IntentBadge score={h.intentScore} />
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Building2 size={12} className="text-white/30 shrink-0" />
                    <span className="text-xs text-white/50 truncate">
                      {h.prospectCompany || "\u2014"}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mb-3 line-clamp-2 leading-relaxed">
                    {h.humanPartnerReason || "High-intent prospect — AI recommends human engagement"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-purple-400/60 uppercase tracking-wider">
                      via {h.replyChannel || "email"}
                    </span>
                    <button
                      onClick={() => handleAcceptHandoff(h.engagementId, h)}
                      disabled={mutatingIds.has(h.engagementId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 hover:text-purple-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {mutatingIds.has(h.engagementId) ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Zap size={12} />
                      )}
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              column={col}
              leads={grouped[col.key]}
              onMoveStage={handleMoveStage}
              mutatingIds={mutatingIds}
              generatingId={generatingId}
              dealLinks={dealLinks}
              copiedId={copiedId}
              onGenerateDealRoom={handleGenerateDealRoom}
              onCopyLink={handleCopyLink}
            />
          ))}
        </div>

        {/* Hidden statuses footnote */}
        {leads.some((l) => l.status === "closed_lost" || l.status === "released") && (
          <div className="mt-4 text-[10px] text-white/20 text-center">
            {leads.filter((l) => l.status === "closed_lost").length} closed-lost ·{" "}
            {leads.filter((l) => l.status === "released").length} released — hidden from board
          </div>
        )}
      </div>
    </div>
  );
}
