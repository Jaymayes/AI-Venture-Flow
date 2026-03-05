/**
 * PartnerDashboard.jsx — Sovereign Professional Workspace (Phase 22)
 *
 * Dedicated RBAC-protected portal for 1099 partners to:
 *   1. View dispatched leads with Full Context Briefings (Inbox View)
 *   2. Track and update lead stages via Kanban board (Kanban View)
 *
 * Auth: Partner PIN gate (sessionStorage) + X-Partner-Email header on API calls.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Briefcase,
  Users,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Target,
  LayoutGrid,
  List,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Phone,
  FileText,
  TrendingUp,
  AlertCircle,
  X,
  MessageSquare,
  Star,
  ExternalLink,
  Link2,
  Copy,
  Mail,
} from "lucide-react";
import {
  fetchPartnerLeads,
  updateLeadStage,
  generateDealRoom,
} from "../lib/partner-client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PARTNER_EMAIL_KEY = "rsllc_partner_email";

const STAGES = [
  { key: "qualified", label: "Qualified", color: "cyan", icon: Target },
  { key: "consultation_scheduled", label: "Consultation", color: "amber", icon: Phone },
  { key: "proposal_sent", label: "Proposal Sent", color: "violet", icon: FileText },
  { key: "negotiation", label: "Negotiation", color: "orange", icon: MessageSquare },
  { key: "closed_won", label: "Closed Won", color: "emerald", icon: CheckCircle2 },
  { key: "closed_lost", label: "Closed Lost", color: "red", icon: X },
];

const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.key, s]));

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatCurrency(val) {
  if (!val) return "$0";
  return `$${Number(val).toLocaleString()}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function scoreColor(score) {
  if (score >= 85) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

// ---------------------------------------------------------------------------
// KPI Cards
// ---------------------------------------------------------------------------

function KPICard({ label, value, icon: Icon, color }) {
  return (
    <div className="glass noise rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-9 h-9 rounded-lg bg-${color}-500/10 flex items-center justify-center`}
        >
          <Icon size={18} className={`text-${color}-400`} />
        </div>
        <p className="text-white/40 text-xs font-medium">{label}</p>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Context Briefing Expander
// ---------------------------------------------------------------------------

function BriefingPanel({ briefing }) {
  const [expanded, setExpanded] = useState(false);
  if (!briefing) {
    return (
      <p className="text-white/30 text-xs italic">No briefing available</p>
    );
  }
  const { qualificationData, sentimentAnalysis, recommendedNextSteps } =
    briefing;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold hover:text-cyan-300 transition-colors"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Full Context Briefing
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-3"
          >
            {/* Qualification Data */}
            {qualificationData && (
              <div className="glass noise rounded-lg p-3 border border-white/5">
                <h4 className="text-xs font-bold text-white/60 mb-2 uppercase tracking-wide">
                  Qualification (BANT)
                </h4>
                <div className="space-y-1 text-xs text-white/50">
                  {qualificationData.icpFitSummary && (
                    <p>
                      <span className="text-white/70 font-medium">ICP Fit:</span>{" "}
                      {qualificationData.icpFitSummary}
                    </p>
                  )}
                  {qualificationData.budgetIndicators && (
                    <p>
                      <span className="text-white/70 font-medium">Budget:</span>{" "}
                      {qualificationData.budgetIndicators}
                    </p>
                  )}
                  {qualificationData.timeline && (
                    <p>
                      <span className="text-white/70 font-medium">Timeline:</span>{" "}
                      {qualificationData.timeline}
                    </p>
                  )}
                  {qualificationData.painPoints && (
                    <p>
                      <span className="text-white/70 font-medium">Pain Points:</span>{" "}
                      {qualificationData.painPoints}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sentiment */}
            {sentimentAnalysis && (
              <div className="glass noise rounded-lg p-3 border border-white/5">
                <h4 className="text-xs font-bold text-white/60 mb-2 uppercase tracking-wide">
                  Sentiment Analysis
                </h4>
                <div className="space-y-1 text-xs text-white/50">
                  <p>
                    <span className="text-white/70 font-medium">Overall:</span>{" "}
                    {sentimentAnalysis.overallSentiment}
                  </p>
                  <p>
                    <span className="text-white/70 font-medium">Trust:</span>{" "}
                    {sentimentAnalysis.trustLevel}
                  </p>
                  <p>
                    <span className="text-white/70 font-medium">Trajectory:</span>{" "}
                    {sentimentAnalysis.engagementTrajectory}
                  </p>
                </div>
              </div>
            )}

            {/* Next Steps */}
            {recommendedNextSteps && (
              <div className="glass noise rounded-lg p-3 border border-white/5">
                <h4 className="text-xs font-bold text-white/60 mb-2 uppercase tracking-wide">
                  Recommended Next Steps
                </h4>
                <div className="space-y-1 text-xs text-white/50">
                  {recommendedNextSteps.immediateAction && (
                    <p>
                      <span className="text-emerald-400 font-medium">Action:</span>{" "}
                      {recommendedNextSteps.immediateAction}
                    </p>
                  )}
                  {recommendedNextSteps.talkingPoints &&
                    Array.isArray(recommendedNextSteps.talkingPoints) && (
                      <div>
                        <span className="text-white/70 font-medium">
                          Talking Points:
                        </span>
                        <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                          {recommendedNextSteps.talkingPoints.map((tp, i) => (
                            <li key={i}>{tp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  {recommendedNextSteps.objectionsToAnticipate &&
                    Array.isArray(recommendedNextSteps.objectionsToAnticipate) && (
                      <div>
                        <span className="text-amber-400 font-medium">
                          Objections to Anticipate:
                        </span>
                        <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                          {recommendedNextSteps.objectionsToAnticipate.map(
                            (obj, i) => (
                              <li key={i}>{obj}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  {recommendedNextSteps.closingStrategy && (
                    <p>
                      <span className="text-cyan-400 font-medium">
                        Closing Strategy:
                      </span>{" "}
                      {recommendedNextSteps.closingStrategy}
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage Badge
// ---------------------------------------------------------------------------

function StageBadge({ stage }) {
  const s = STAGE_MAP[stage] || { label: stage, color: "gray", icon: Clock };
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-${s.color}-500/10 text-${s.color}-400 border border-${s.color}-500/20`}
    >
      <Icon size={10} />
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Inbox View — Lead Cards
// ---------------------------------------------------------------------------

function InboxCard({ lead, onStageChange, updatingId, onGenerateDealRoom, dealRoomLinks, generatingDealRoom }) {
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUpdating = updatingId === lead.id;
  const briefing = lead.context_briefing;
  const dealLink = dealRoomLinks?.[lead.id];
  const isGenerating = generatingDealRoom === lead.id;
  const canGenerateDealRoom = ["proposal_sent", "negotiation"].includes(lead.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass noise rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold text-sm truncate">
              {lead.prospect_name || "Unknown"}
            </h3>
            {lead.decision_maker_identified && (
              <Star size={12} className="text-amber-400 flex-shrink-0" />
            )}
            {(lead.drip_count ?? 0) > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 flex-shrink-0" title={`${lead.drip_count} AI follow-up${lead.drip_count > 1 ? 's' : ''} sent`}>
                <Mail size={10} className="text-blue-400" />
                <span className="text-[10px] font-semibold text-blue-400">{lead.drip_count}</span>
              </div>
            )}
          </div>
          <p className="text-white/40 text-xs truncate">
            {lead.prospect_company || "No company"}{" "}
            {lead.prospect_role ? `· ${lead.prospect_role}` : ""}
          </p>
        </div>
        <StageBadge stage={lead.status} />
      </div>

      {/* Score row */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <Target size={12} className="text-white/30" />
          <span className={`text-xs font-bold ${scoreColor(lead.tofu_score || 0)}`}>
            {lead.tofu_score ?? "—"}
          </span>
          <span className="text-white/20 text-xs">ToFu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp size={12} className="text-white/30" />
          <span className="text-xs font-bold text-white/70">
            {lead.intent_score ?? "—"}
          </span>
          <span className="text-white/20 text-xs">Intent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign size={12} className="text-white/30" />
          <span className="text-xs font-bold text-emerald-400">
            {formatCurrency(lead.estimated_arr)}
          </span>
          <span className="text-white/20 text-xs">ARR</span>
        </div>
      </div>

      {/* Context Briefing */}
      <BriefingPanel briefing={briefing} />

      {/* Deal Room Link (Phase 24) */}
      {canGenerateDealRoom && (
        <div className="mt-3 pt-3 border-t border-white/5">
          {dealLink ? (
            <div className="flex items-center gap-2">
              <Link2 size={12} className="text-violet-400 flex-shrink-0" />
              <a
                href={dealLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 text-xs font-medium hover:text-violet-300 transition-colors truncate flex-1"
              >
                {dealLink}
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(dealLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-500/10 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-colors flex-shrink-0"
              >
                {copied ? <CheckCircle2 size={10} /> : <Copy size={10} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={dealLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors flex-shrink-0"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          ) : (
            <button
              onClick={() => onGenerateDealRoom(lead.id)}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/20 text-violet-300 text-xs font-semibold hover:from-violet-500/30 hover:to-purple-500/30 hover:text-violet-200 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Link2 size={12} />
              )}
              {isGenerating ? "Generating..." : "Generate Deal Room Link"}
            </button>
          )}
        </div>
      )}

      {/* Stage update */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-white/20 text-xs">
          {formatDate(lead.updated_at)}
        </span>
        <div className="relative">
          <button
            onClick={() => setShowStageMenu(!showStageMenu)}
            disabled={isUpdating}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white/80 transition-all disabled:opacity-50"
          >
            {isUpdating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <>
                Update Stage <ChevronDown size={12} />
              </>
            )}
          </button>
          <AnimatePresence>
            {showStageMenu && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 bottom-full mb-1 w-48 glass noise rounded-lg border border-white/10 overflow-hidden z-50"
              >
                {STAGES.filter((s) => s.key !== lead.status).map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.key}
                      onClick={() => {
                        setShowStageMenu(false);
                        onStageChange(lead.id, s.key);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/5 hover:text-${s.color}-400 transition-colors`}
                    >
                      <Icon size={12} />
                      {s.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Kanban View
// ---------------------------------------------------------------------------

function KanbanColumn({ stage, leads, onStageChange, updatingId }) {
  const s = STAGE_MAP[stage.key] || stage;
  const Icon = s.icon;
  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div
          className={`w-6 h-6 rounded-md bg-${s.color}-500/10 flex items-center justify-center`}
        >
          <Icon size={12} className={`text-${s.color}-400`} />
        </div>
        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wide">
          {s.label}
        </h3>
        <span
          className={`ml-auto text-xs font-bold text-${s.color}-400 bg-${s.color}-500/10 px-2 py-0.5 rounded-full`}
        >
          {leads.length}
        </span>
      </div>
      <div className="space-y-2 min-h-[120px]">
        {leads.length === 0 && (
          <div className="glass noise rounded-lg p-4 border border-white/5 text-center">
            <p className="text-white/20 text-xs">No leads</p>
          </div>
        )}
        {leads.map((lead) => (
          <motion.div
            key={lead.id}
            layout
            className="glass noise rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-start justify-between mb-1.5">
              <h4 className="text-white font-semibold text-xs truncate flex-1">
                {lead.prospect_name || "Unknown"}
              </h4>
              <span className={`text-xs font-bold ${scoreColor(lead.tofu_score || 0)} ml-2`}>
                {lead.tofu_score ?? "—"}
              </span>
            </div>
            <p className="text-white/30 text-xs truncate mb-2">
              {lead.prospect_company || "—"}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-emerald-400/70 text-xs font-medium">
                {formatCurrency(lead.estimated_arr)}
              </span>
              <div className="relative group">
                <button
                  disabled={updatingId === lead.id}
                  className="text-white/30 hover:text-white/60 transition-colors p-1"
                  title="Change stage"
                >
                  {updatingId === lead.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
                <div className="hidden group-hover:block absolute right-0 bottom-full mb-1 w-44 glass noise rounded-lg border border-white/10 overflow-hidden z-50">
                  {STAGES.filter((st) => st.key !== stage.key).map((st) => {
                    const StIcon = st.icon;
                    return (
                      <button
                        key={st.key}
                        onClick={() => onStageChange(lead.id, st.key)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-${st.color}-400 transition-colors`}
                      >
                        <StIcon size={10} />
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Content (authenticated state)
// ---------------------------------------------------------------------------

function PartnerDashboardContent({ partnerEmail, onLogout }) {
  const [leads, setLeads] = useState([]);
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("inbox"); // "inbox" | "kanban"
  const [updatingId, setUpdatingId] = useState(null);
  const [dealRoomLinks, setDealRoomLinks] = useState({});
  const [generatingDealRoom, setGeneratingDealRoom] = useState(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPartnerLeads(partnerEmail);
      setLeads(data.leads || []);
      setPartnerInfo(data.partner || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [partnerEmail]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleStageChange = useCallback(
    async (leadId, newStage) => {
      setUpdatingId(leadId);
      try {
        await updateLeadStage(leadId, newStage, null, partnerEmail);
        // Optimistic update
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, status: newStage, updated_at: new Date().toISOString() } : l
          )
        );
      } catch (err) {
        setError(`Stage update failed: ${err.message}`);
      } finally {
        setUpdatingId(null);
      }
    },
    [partnerEmail]
  );

  const handleGenerateDealRoom = useCallback(
    async (leadId) => {
      setGeneratingDealRoom(leadId);
      try {
        const data = await generateDealRoom(leadId, partnerEmail);
        if (data.magicLink) {
          setDealRoomLinks((prev) => ({ ...prev, [leadId]: data.magicLink }));
        }
      } catch (err) {
        setError(`Deal room generation failed: ${err.message}`);
      } finally {
        setGeneratingDealRoom(null);
      }
    },
    [partnerEmail]
  );

  // KPI computations
  const kpis = useMemo(() => {
    const total = leads.length;
    const active = leads.filter(
      (l) => !["closed_won", "closed_lost"].includes(l.status)
    ).length;
    const won = leads.filter((l) => l.status === "closed_won").length;
    const totalArr = leads.reduce(
      (sum, l) => sum + (l.estimated_arr || 0),
      0
    );
    return { total, active, won, totalArr };
  }, [leads]);

  // Group leads by stage for Kanban
  const leadsByStage = useMemo(() => {
    const grouped = {};
    STAGES.forEach((s) => (grouped[s.key] = []));
    leads.forEach((l) => {
      if (grouped[l.status]) grouped[l.status].push(l);
      else if (grouped.qualified) grouped.qualified.push(l);
    });
    return grouped;
  }, [leads]);

  return (
    <div className="min-h-screen relative">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-sky-500/15 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-white/30 hover:text-white/50 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold gradient-text">
                Partner Workspace
              </h1>
              <p className="text-white/40 text-sm mt-0.5">
                {partnerInfo?.name || partnerEmail} — Sovereign Professional Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="glass noise rounded-lg border border-white/10 p-0.5 flex">
              <button
                onClick={() => setView("inbox")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  view === "inbox"
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <List size={14} className="inline mr-1" />
                Inbox
              </button>
              <button
                onClick={() => setView("kanban")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  view === "kanban"
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <LayoutGrid size={14} className="inline mr-1" />
                Kanban
              </button>
            </div>
            <button
              onClick={loadLeads}
              disabled={loading}
              className="p-2 rounded-lg glass noise border border-white/10 text-white/40 hover:text-white/70 transition-colors"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <KPICard
            label="Total Leads"
            value={kpis.total}
            icon={Users}
            color="cyan"
          />
          <KPICard
            label="Active Pipeline"
            value={kpis.active}
            icon={Briefcase}
            color="amber"
          />
          <KPICard
            label="Closed Won"
            value={kpis.won}
            icon={CheckCircle2}
            color="emerald"
          />
          <KPICard
            label="Pipeline ARR"
            value={formatCurrency(kpis.totalArr)}
            icon={DollarSign}
            color="violet"
          />
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 glass noise rounded-xl p-4 border border-red-500/20 flex items-center gap-3"
          >
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400/50 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-cyan-400" />
          </div>
        )}

        {/* Empty State */}
        {!loading && leads.length === 0 && !error && (
          <div className="glass noise rounded-2xl p-12 border border-white/5 text-center">
            <Briefcase size={48} className="text-white/10 mx-auto mb-4" />
            <h3 className="text-white/50 font-semibold mb-2">No Assigned Leads</h3>
            <p className="text-white/30 text-sm max-w-md mx-auto">
              Leads dispatched through the Escalation Protocol will appear here with
              full context briefings and qualification data.
            </p>
          </div>
        )}

        {/* Inbox View */}
        {!loading && leads.length > 0 && view === "inbox" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {leads.map((lead) => (
              <InboxCard
                key={lead.id}
                lead={lead}
                onStageChange={handleStageChange}
                updatingId={updatingId}
                onGenerateDealRoom={handleGenerateDealRoom}
                dealRoomLinks={dealRoomLinks}
                generatingDealRoom={generatingDealRoom}
              />
            ))}
          </div>
        )}

        {/* Kanban View */}
        {!loading && leads.length > 0 && view === "kanban" && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {STAGES.map((stage) => (
                <KanbanColumn
                  key={stage.key}
                  stage={stage}
                  leads={leadsByStage[stage.key] || []}
                  onStageChange={handleStageChange}
                  updatingId={updatingId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Partner Auth Gate (PIN + Email)
// ---------------------------------------------------------------------------

function PartnerAuthGate({ onAuthenticate }) {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const [showPin, setShowPin] = useState(false);

  const SP_PIN = "PLAYBOOK2026";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (pin.trim() !== SP_PIN) {
      setError("Invalid access code. Contact your team lead for credentials.");
      setPin("");
      return;
    }
    // Store email for subsequent API calls
    sessionStorage.setItem(PARTNER_EMAIL_KEY, email.trim());
    onAuthenticate(email.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-sky-500/15 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 glass noise rounded-2xl p-8 w-full max-w-md border border-white/10"
      >
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/30 to-cyan-500/20 flex items-center justify-center">
            <Briefcase size={32} className="text-sky-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center gradient-text mb-1">
          Sovereign Professional Portal
        </h1>
        <p className="text-white/40 text-sm text-center mb-8">
          Referral Service LLC — Sovereign Professional Workspace
        </p>

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-white/50 mb-2">
              Partner Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="you@example.com"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-sky-400/40 focus:ring-1 focus:ring-sky-400/20 transition-all"
            />
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-semibold text-white/50 mb-2">
              Access Code
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                placeholder="Enter access code"
                className="w-full px-4 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-sky-400/40 focus:ring-1 focus:ring-sky-400/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPin ? (
                  <span className="text-xs">Hide</span>
                ) : (
                  <span className="text-xs">Show</span>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs bg-red-400/5 border border-red-400/10 rounded-lg p-3 text-center"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-black font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </form>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors"
          >
            <ArrowLeft size={12} />
            Back to Referral Service LLC
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported Component
// ---------------------------------------------------------------------------

export default function PartnerDashboard() {
  const [partnerEmail, setPartnerEmail] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(PARTNER_EMAIL_KEY);
    if (stored) setPartnerEmail(stored);
    setChecking(false);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem(PARTNER_EMAIL_KEY);
    setPartnerEmail(null);
  };

  if (checking) return null;

  if (!partnerEmail) {
    return <PartnerAuthGate onAuthenticate={setPartnerEmail} />;
  }

  return (
    <PartnerDashboardContent
      partnerEmail={partnerEmail}
      onLogout={handleLogout}
    />
  );
}
