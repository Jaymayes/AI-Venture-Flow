/**
 * Portal.jsx — Sovereign Partner CRM Portal (Phase 11 → AI-Venture-Flow).
 *
 * Full-featured CRM dashboard backed by the D1 moltbot-crm-db.
 * Three sections:
 *   1. Metrics Overview   — 4 KPI stat cards
 *   2. Pipeline Table     — Sortable, searchable lead table with intent badges
 *   3. Lead Detail Modal  — Full Context Briefing, competitor intel, actions
 *
 * RBAC: Admin (jamarr@referralsvc.com) sees global pipeline.
 *       Partners see only their scoped leads.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Flame,
  TrendingUp,
  Bot,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  ExternalLink,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Clock,
  ShieldCheck,
  Target,
  MessageSquare,
  Swords,
  ChevronRight,
  AlertTriangle,
  Zap,
  UserCheck,
  RotateCcw,
  Rocket,
} from "lucide-react";
import {
  fetchCrmLeads,
  fetchCrmLead,
  fetchCrmMetrics,
  crmTakeover,
  crmRelease,
  launchOutboundCampaign,
  fetchDrafts,
  approveDraft,
} from "../lib/triage-client";

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = "jamarr@referralsvc.com";

function intentColor(score) {
  if (score >= 85) return "text-emerald-400 bg-emerald-500/20";
  if (score >= 60) return "text-amber-400 bg-amber-500/20";
  if (score >= 40) return "text-orange-400 bg-orange-500/20";
  return "text-red-400 bg-red-500/20";
}

function intentLabel(score) {
  if (score >= 85) return "Hot";
  if (score >= 60) return "Warm";
  if (score >= 40) return "Cool";
  return "Cold";
}

function sentimentIcon(trend) {
  if (trend === "improving") return "↑";
  if (trend === "declining") return "↓";
  if (trend === "volatile") return "↕";
  return "→";
}

function timeAgo(isoString) {
  if (!isoString) return "—";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};
const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({ label, value, icon: Icon, color = "text-primary", loading }) {
  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-white/40">
            {label}
          </div>
          {loading ? (
            <div className="mt-1 h-8 w-16 animate-pulse rounded bg-white/10" />
          ) : (
            <div className="mt-1 text-3xl font-bold">{value}</div>
          )}
        </div>
        <div className={`rounded-xl bg-white/5 p-2.5 ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Lead Detail Modal
// ---------------------------------------------------------------------------

function LeadDetailModal({ engagementId, onClose, onAction }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!engagementId) return;
    setLoading(true);
    fetchCrmLead(engagementId)
      .then((d) => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [engagementId]);

  const lead = detail?.lead;
  const briefing = detail?.lead?.context_briefing_parsed;
  const meta = detail?.meta;

  const handleTakeover = async () => {
    setActing(true);
    try {
      await crmTakeover(engagementId);
      onAction?.();
      onClose();
    } catch (err) {
      alert("Takeover failed: " + err.message);
    } finally {
      setActing(false);
    }
  };

  const handleRelease = async () => {
    setActing(true);
    try {
      await crmRelease(engagementId);
      onAction?.();
      onClose();
    } catch (err) {
      alert("Release failed: " + err.message);
    } finally {
      setActing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 pt-12 pb-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 24 }}
        className="glass noise relative w-full max-w-2xl rounded-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-bold">Lead Detail</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !lead ? (
          <div className="py-16 text-center text-white/40">Lead not found.</div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">
            {/* Identity */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
                <Users size={14} /> Lead Identity
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Building2 size={14} className="text-white/30" />
                  {lead.prospect_company}
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Briefcase size={14} className="text-white/30" />
                  {lead.prospect_role || "—"}
                </div>
                {lead.prospect_email && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Mail size={14} className="text-white/30" />
                    {lead.prospect_email}
                  </div>
                )}
                {lead.prospect_phone && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Phone size={14} className="text-white/30" />
                    {lead.prospect_phone}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${intentColor(lead.intent_score)}`}>
                  Intent: {lead.intent_score}/100
                </span>
                {lead.sentiment_label && (
                  <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-medium text-sky-400">
                    {sentimentIcon(lead.sentiment_trend)} {lead.sentiment_label}
                  </span>
                )}
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/60">
                  {lead.source} · {lead.reply_channel}
                </span>
              </div>
            </div>

            {/* Escalation Reason */}
            {lead.escalation_reason && (
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
                  <AlertTriangle size={14} /> Escalation Reason
                </h3>
                <p className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-200">
                  {lead.escalation_reason}
                </p>
              </div>
            )}

            {/* Context Briefing */}
            {briefing && (
              <>
                {briefing.dealHypothesis && (
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
                      <Target size={14} /> Deal Hypothesis
                    </h3>
                    <p className="text-sm leading-relaxed text-white/70">{briefing.dealHypothesis}</p>
                  </div>
                )}
                {briefing.conversationSummary && (
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
                      <MessageSquare size={14} /> Conversation Summary
                    </h3>
                    <p className="text-sm leading-relaxed text-white/70">{briefing.conversationSummary}</p>
                  </div>
                )}
                {briefing.psychographicNarrative && (
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
                      <ShieldCheck size={14} /> Psychographic Profile
                    </h3>
                    <p className="text-sm leading-relaxed text-white/70">{briefing.psychographicNarrative}</p>
                  </div>
                )}
                {briefing.tacticalPlaybook?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
                      <Zap size={14} /> Tactical Playbook
                    </h3>
                    <ul className="space-y-1.5">
                      {briefing.tacticalPlaybook.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                          <ChevronRight size={14} className="mt-0.5 text-accent shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {briefing.marketIntel && (
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
                      <Swords size={14} /> Competitor Intelligence
                    </h3>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-white/40">Competitor</span>
                        <span className="text-white/80">{briefing.marketIntel.competitor_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Threat Level</span>
                        <span className={
                          briefing.marketIntel.threat_level === "CRITICAL"
                            ? "text-red-400"
                            : briefing.marketIntel.threat_level === "MODERATE"
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }>
                          {briefing.marketIntel.threat_level}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Our Wedge</span>
                        <span className="text-white/70 text-right max-w-[60%]">{briefing.marketIntel.our_wedge}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Recommended Next Steps */}
            {lead.recommended_steps && (
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
                  <ExternalLink size={14} /> Recommended Next Steps
                </h3>
                <p className="text-sm leading-relaxed text-white/70">{lead.recommended_steps}</p>
              </div>
            )}

            {/* Escalation Audit */}
            {detail?.escalations?.length > 0 && (
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
                  <Clock size={14} /> Escalation Audit Trail
                </h3>
                <div className="space-y-1.5">
                  {detail.escalations.map((esc) => (
                    <div key={esc.id} className="flex items-center justify-between text-xs text-white/50 rounded-lg bg-white/5 px-3 py-2">
                      <span>{esc.dispatch_channel.toUpperCase()}</span>
                      <span className={esc.success ? "text-emerald-400" : "text-red-400"}>
                        {esc.success ? "OK" : "FAILED"}
                      </span>
                      <span>{timeAgo(esc.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {lead && (
          <div className="flex items-center gap-3 border-t border-white/10 px-6 py-4">
            {meta?.isHumanTakeover ? (
              <button
                onClick={handleRelease}
                disabled={acting}
                className="flex items-center gap-2 rounded-xl bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-400 hover:bg-amber-500/30 transition disabled:opacity-50"
              >
                <RotateCcw size={16} />
                {acting ? "Releasing..." : "Release to AI"}
              </button>
            ) : (
              <button
                onClick={handleTakeover}
                disabled={acting}
                className="flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 transition disabled:opacity-50"
              >
                <UserCheck size={16} />
                {acting ? "Taking over..." : "Take Over"}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 transition"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Outbound Campaign Launch Modal
// ---------------------------------------------------------------------------

function OutboundLaunchModal({ onClose, onSuccess }) {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const LINKEDIN_RE = /^https?:\/\/(www\.)?linkedin\.com\/in\/.+/i;

  const profiles = useMemo(() => {
    return input
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }, [input]);

  const invalidUrls = useMemo(
    () => profiles.filter((u) => !LINKEDIN_RE.test(u)),
    [profiles]
  );

  const isValid =
    profiles.length > 0 && profiles.length <= 20 && invalidUrls.length === 0;

  const handleLaunch = async () => {
    if (!isValid) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const data = await launchOutboundCampaign(profiles);
      setResult(data);
      setStatus("success");
      onSuccess?.();
    } catch (err) {
      setErrorMsg(err.message || "Campaign launch failed");
      setStatus("error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 pt-12 pb-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 24 }}
        className="glass noise relative w-full max-w-2xl rounded-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Rocket size={20} className="text-primary" />
            Outbound Campaign Launcher
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {status === "idle" || status === "error" ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/60">
                  LinkedIn Profile URLs (one per line, max 20)
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/50 transition font-mono"
                  placeholder={
                    "https://linkedin.com/in/first-last\nhttps://linkedin.com/in/another-person"
                  }
                />
              </div>

              {/* Validation */}
              <div className="flex items-center justify-between text-xs">
                <span
                  className={
                    profiles.length > 20 ? "text-red-400" : "text-white/40"
                  }
                >
                  {profiles.length} / 20 profiles
                </span>
                {invalidUrls.length > 0 && (
                  <span className="text-red-400">
                    {invalidUrls.length} invalid URL
                    {invalidUrls.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {status === "error" && errorMsg && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errorMsg}
                </div>
              )}
            </>
          ) : status === "loading" ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-white/50">
                Enriching {profiles.length} profile
                {profiles.length > 1 ? "s" : ""} via Apollo.io…
              </p>
            </div>
          ) : status === "success" && result ? (
            <div className="space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    {result.enriched ?? 0}
                  </div>
                  <div className="text-xs text-white/40">Enriched</div>
                </div>
                <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-3 text-center">
                  <div className="text-2xl font-bold text-sky-400">
                    {result.ingested ?? 0}
                  </div>
                  <div className="text-xs text-white/40">Ingested</div>
                </div>
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {result.failed ?? 0}
                  </div>
                  <div className="text-xs text-white/40">Failed</div>
                </div>
              </div>

              {/* Per-profile results */}
              {Array.isArray(result.results) && (
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {result.results.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs"
                    >
                      <span
                        className="truncate text-white/70 max-w-[60%]"
                        title={r.url}
                      >
                        {r.name || r.url}
                      </span>
                      <span
                        className={
                          r.status === "ingested"
                            ? "text-emerald-400"
                            : r.status === "enriched"
                            ? "text-sky-400"
                            : "text-red-400"
                        }
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-white/5 px-5 py-2.5 text-sm text-white/60 hover:bg-white/10 transition"
          >
            {status === "success" ? "Close" : "Cancel"}
          </button>
          {(status === "idle" || status === "error") && (
            <button
              onClick={handleLaunch}
              disabled={!isValid}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Rocket size={14} />
              Launch Campaign
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Portal Component
// ---------------------------------------------------------------------------

export default function Portal() {
  // ── State ──
  const [leads, setLeads] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("intent_score");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);
  const [showOutboundModal, setShowOutboundModal] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  // ── Fetch Data ──
  const loadLeads = useCallback(async () => {
    try {
      const data = await fetchCrmLeads(100);
      setLeads(data?.handoffs || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      const data = await fetchCrmMetrics();
      setMetrics(data?.metrics || null);
    } catch {
      setMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const loadDrafts = useCallback(async () => {
    try {
      const data = await fetchDrafts("pending_approval");
      setDrafts(data?.drafts || []);
    } catch {
      setDrafts([]);
    } finally {
      setDraftsLoading(false);
    }
  }, []);

  const handleApproveDraft = async (draftId) => {
    setApprovingId(draftId);
    try {
      await approveDraft(draftId);
      loadDrafts();
    } catch (err) {
      alert("Approval failed: " + err.message);
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    loadLeads();
    loadMetrics();
    loadDrafts();
    const interval = setInterval(() => {
      loadLeads();
      loadMetrics();
      loadDrafts();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadLeads, loadMetrics, loadDrafts]);

  // ── Filtering + Sorting ──
  const filtered = useMemo(() => {
    let result = [...leads];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (h) =>
          h.prospectName?.toLowerCase().includes(q) ||
          h.prospectCompany?.toLowerCase().includes(q) ||
          h.prospectRole?.toLowerCase().includes(q) ||
          h.engagementId?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "intent_score":
          aVal = a.intentScore ?? 0;
          bVal = b.intentScore ?? 0;
          break;
        case "name":
          aVal = a.prospectName ?? "";
          bVal = b.prospectName ?? "";
          return sortDir === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        case "company":
          aVal = a.prospectCompany ?? "";
          bVal = b.prospectCompany ?? "";
          return sortDir === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        case "date":
          aVal = new Date(a.handoffAt || 0).getTime();
          bVal = new Date(b.handoffAt || 0).getTime();
          break;
        default:
          aVal = a.intentScore ?? 0;
          bVal = b.intentScore ?? 0;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [leads, search, sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ArrowUpDown size={12} className="text-white/20" />;
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="text-accent" />
    ) : (
      <ArrowDown size={12} className="text-accent" />
    );
  };

  const handleRefresh = () => {
    setLoading(true);
    setMetricsLoading(true);
    loadLeads();
    loadMetrics();
  };

  // ── Render ──
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-accent/8 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-10 pb-20 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mb-8"
        >
          <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="gradient-text">CRM Portal</span>
              </h1>
              <p className="mt-1 text-sm text-white/40">
                Sovereign Partner Pipeline — powered by D1 + Cloudflare Edge
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm text-white/60 hover:bg-white/10 transition"
            >
              <RotateCcw size={14} />
              Refresh
            </button>
          </motion.div>
        </motion.div>

        {/* Metrics */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            label="Total Pipeline"
            value={metrics?.total_leads ?? 0}
            icon={Users}
            color="text-primary"
            loading={metricsLoading}
          />
          <StatCard
            label="High Intent (85+)"
            value={metrics?.high_intent_leads ?? 0}
            icon={Flame}
            color="text-emerald-400"
            loading={metricsLoading}
          />
          <StatCard
            label="Avg Intent Score"
            value={metrics?.avg_intent_score ?? 0}
            icon={TrendingUp}
            color="text-amber-400"
            loading={metricsLoading}
          />
          <StatCard
            label="Active (AI)"
            value={metrics?.active_ai_leads ?? 0}
            icon={Bot}
            color="text-accent"
            loading={metricsLoading}
          />
        </motion.div>

        {/* Outbound Campaign Launcher */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowOutboundModal(true)}
            className="flex items-center gap-2 rounded-xl bg-primary/20 border border-primary/30 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/30 transition"
          >
            <Rocket size={16} />
            Launch Outbound Campaign
          </button>
        </div>

        {/* Pending Drafts Review Panel */}
        {!draftsLoading && drafts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 glass noise rounded-2xl border border-amber-500/20 p-5"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">
              <Mail size={14} />
              Pending Review — {drafts.length} Draft{drafts.length !== 1 ? "s" : ""}
            </h3>
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex flex-col gap-3 rounded-xl bg-white/5 border border-white/10 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-white/90">
                      <span>{draft.prospect_name}</span>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400 uppercase">
                        {draft.channel}
                      </span>
                    </div>
                    {draft.prospect_email && (
                      <div className="text-xs text-white/40">{draft.prospect_email}</div>
                    )}
                    {draft.subject && (
                      <div className="text-xs text-white/60">
                        <span className="text-white/30">Subject:</span> {draft.subject}
                      </div>
                    )}
                    <div className="text-sm text-white/70 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                      {draft.body}
                    </div>
                    <div className="text-[10px] text-white/30 pt-1">
                      Created {timeAgo(draft.created_at)} · ID #{draft.id}
                    </div>
                  </div>
                  <button
                    onClick={() => handleApproveDraft(draft.id)}
                    disabled={approvingId === draft.id}
                    className="shrink-0 flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 transition disabled:opacity-50 self-start"
                  >
                    <ShieldCheck size={14} />
                    {approvingId === draft.id ? "Approving..." : "Approve & Send"}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/50 transition"
              placeholder="Search by name, company, or role..."
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            <span className="font-medium">API Error:</span> {error}
          </div>
        )}

        {/* Pipeline Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
          className="glass noise overflow-hidden rounded-2xl border border-white/10"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-white/40">
              {search
                ? "No leads match your search."
                : "No leads in the pipeline yet. Escalations from 85+ intent scoring will appear here."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {[
                      { key: "name", label: "Prospect" },
                      { key: "company", label: "Company" },
                      { key: "intent_score", label: "Intent" },
                      { key: "channel", label: "Channel" },
                      { key: "status", label: "Status" },
                      { key: "date", label: "Handoff" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => toggleSort(col.key)}
                        className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition select-none"
                      >
                        <span className="flex items-center gap-1.5">
                          {col.label}
                          <SortIcon col={col.key} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr
                      key={lead.engagementId}
                      onClick={() => setSelectedId(lead.engagementId)}
                      className="cursor-pointer border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="px-4 py-3 font-medium text-white/90">
                        {lead.prospectName || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        {lead.prospectCompany || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${intentColor(lead.intentScore)}`}
                        >
                          {lead.intentScore} · {intentLabel(lead.intentScore)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/50 capitalize">
                        {lead.replyChannel || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {lead.isHumanTakeover ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-medium text-sky-400">
                            <UserCheck size={12} /> Human
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/50">
                            <Bot size={12} /> AI
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {timeAgo(lead.handoffAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="border-t border-white/5 px-4 py-2.5 text-xs text-white/30">
              Showing {filtered.length} of {leads.length} leads
              {search && " (filtered)"}
            </div>
          )}
        </motion.div>
      </div>

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedId && (
          <LeadDetailModal
            engagementId={selectedId}
            onClose={() => setSelectedId(null)}
            onAction={() => {
              loadLeads();
              loadMetrics();
            }}
          />
        )}
      </AnimatePresence>

      {/* Outbound Campaign Modal */}
      <AnimatePresence>
        {showOutboundModal && (
          <OutboundLaunchModal
            onClose={() => setShowOutboundModal(false)}
            onSuccess={() => {
              loadLeads();
              loadMetrics();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
