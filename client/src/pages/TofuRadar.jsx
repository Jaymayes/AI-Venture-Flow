import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchTofuPipeline,
  qualifyProspect,
  fetchTofuLead,
  triggerEscalation,
  fetchEscalationPipeline,
} from "../lib/triage-client";
import {
  RefreshCw,
  Target,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  BarChart3,
  ArrowRight,
  Star,
  UserCheck,
  Briefcase,
  Filter,
  Play,
  Eye,
  Send,
  Rocket,
  ShieldCheck,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Animation variants (matches CEODashboard pattern)
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtUSD = (n) => {
  if (n == null) return "N/A";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const fmtNum = (n) => (n ?? 0).toLocaleString();

// Stage config: color, icon, label
const STAGE_CONFIG = {
  awareness: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", label: "Awareness", icon: Eye },
  consideration: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", label: "Consideration", icon: BarChart3 },
  decision: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30", label: "Decision", icon: Target },
  qualified: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", label: "Qualified", icon: CheckCircle2 },
  disqualified: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", label: "Disqualified", icon: XCircle },
};

const ACTION_CONFIG = {
  nurture: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Nurture" },
  "schedule-discovery": { bg: "bg-purple-500/20", text: "text-purple-400", label: "Schedule Discovery" },
  "send-proposal": { bg: "bg-amber-500/20", text: "text-amber-400", label: "Send Proposal" },
  "escalate-to-sp": { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Escalate to SP" },
  disqualify: { bg: "bg-red-500/20", text: "text-red-400", label: "Disqualify" },
};

const getStageConfig = (stage) => STAGE_CONFIG[stage] ?? STAGE_CONFIG.awareness;
const getActionConfig = (action) => ACTION_CONFIG[action] ?? ACTION_CONFIG.nurture;

// ---------------------------------------------------------------------------
// Score Bar — horizontal bar with gradient fill
// ---------------------------------------------------------------------------

function ScoreBar({ score, max = 25, label, color }) {
  const pct = Math.min((score / max) * 100, 100);
  const colors = {
    blue: { bar: "bg-blue-500", track: "bg-blue-500/10" },
    purple: { bar: "bg-purple-500", track: "bg-purple-500/10" },
    amber: { bar: "bg-amber-500", track: "bg-amber-500/10" },
    emerald: { bar: "bg-emerald-500", track: "bg-emerald-500/10" },
  };
  const c = colors[color] ?? colors.blue;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="text-white/80 font-mono">{score}/{max}</span>
      </div>
      <div className={`h-2 rounded-full ${c.track}`}>
        <motion.div
          className={`h-full rounded-full ${c.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Funnel Stage Badge
// ---------------------------------------------------------------------------

function StageBadge({ stage, size = "sm" }) {
  const cfg = getStageConfig(stage);
  const Icon = cfg.icon;
  const sizeClasses = size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${cfg.bg} ${cfg.text} ${sizeClasses} font-medium`}>
      <Icon size={size === "lg" ? 14 : 12} />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Funnel Metrics Bar — horizontal funnel visualization
// ---------------------------------------------------------------------------

function FunnelBar({ stageCounts, totalEstimatedARR, avgTofuScore }) {
  const stages = ["awareness", "consideration", "decision", "qualified"];
  const total = stages.reduce((s, k) => s + (stageCounts[k] ?? 0), 0) || 1;

  return (
    <motion.div variants={fadeUp} className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Target size={18} className="text-purple-400" />
          ToFu Funnel
        </h3>
        <div className="flex items-center gap-4 text-xs text-white/50">
          <span>Pipeline: <strong className="text-emerald-400">{fmtUSD(totalEstimatedARR)}</strong> ARR</span>
          <span>Avg Score: <strong className="text-purple-400">{avgTofuScore}/100</strong></span>
        </div>
      </div>

      {/* Funnel bars */}
      <div className="space-y-2">
        {stages.map((stage) => {
          const count = stageCounts[stage] ?? 0;
          const pct = (count / total) * 100;
          const cfg = getStageConfig(stage);
          return (
            <div key={stage} className="flex items-center gap-3">
              <div className="w-28 text-xs text-white/60 flex items-center gap-1.5">
                <cfg.icon size={12} className={cfg.text} />
                {cfg.label}
              </div>
              <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden relative">
                <motion.div
                  className={`h-full ${cfg.bg} ${cfg.border} border rounded-lg`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 2)}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-xs text-white/80 font-mono">
                  {count} lead{count !== 1 ? "s" : ""} ({pct.toFixed(0)}%)
                </span>
              </div>
            </div>
          );
        })}
        {/* Disqualified (separate) */}
        <div className="flex items-center gap-3 opacity-50">
          <div className="w-28 text-xs text-white/40 flex items-center gap-1.5">
            <XCircle size={12} className="text-red-400" />
            Disqualified
          </div>
          <span className="text-xs text-white/40 font-mono">{stageCounts.disqualified ?? 0}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Lead Card — individual lead in the pipeline
// ---------------------------------------------------------------------------

function LeadCard({ lead, onSelect, onDispatch, dispatching }) {
  const cfg = getStageConfig(lead.stage);
  const actionCfg = getActionConfig(lead.nextAction);
  const isDispatchable = lead.tofuScore >= 85 && lead.stage === "qualified";

  return (
    <motion.div
      variants={fadeUp}
      className="glass rounded-xl p-4 hover:bg-white/[0.06] transition-colors cursor-pointer border border-white/5"
      onClick={() => onSelect?.(lead.id)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-medium text-sm">{lead.name}</h4>
            {lead.decisionMakerIdentified && (
              <UserCheck size={14} className="text-emerald-400" title="Decision Maker" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Briefcase size={12} />
            <span>{lead.company}</span>
            <span className="text-white/20">|</span>
            <span>{lead.role}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <StageBadge stage={lead.stage} />
          <span className="text-lg font-mono font-bold text-white/90">{lead.tofuScore}</span>
        </div>
      </div>

      {/* Score dimensions */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        <ScoreBar score={lead.fitScore} label="Fit" color="blue" />
        <ScoreBar score={lead.engagementScore} label="Engage" color="purple" />
        <ScoreBar score={lead.buySignalScore} label="Buy Sig" color="amber" />
        <ScoreBar score={25 - (25 - (lead.tofuScore - lead.fitScore - lead.engagementScore - lead.buySignalScore))} label="Authority" color="emerald" />
      </div>

      {/* Footer: ARR + next action + dispatch button */}
      <div className="mt-3 flex items-center justify-between text-xs">
        {lead.estimatedARR ? (
          <span className="text-emerald-400 font-mono flex items-center gap-1">
            <DollarSign size={12} />
            {fmtUSD(lead.estimatedARR)} ARR
          </span>
        ) : (
          <span className="text-white/30">ARR: TBD</span>
        )}
        <div className="flex items-center gap-2">
          {isDispatchable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDispatch?.(lead);
              }}
              disabled={dispatching}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-600/80 hover:bg-sky-500 text-white text-xs font-medium transition-colors disabled:bg-white/10 disabled:text-white/30"
              title="Dispatch to Success Partner"
            >
              {dispatching ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
              Dispatch
            </button>
          )}
          <span className={`px-2 py-0.5 rounded-full ${actionCfg.bg} ${actionCfg.text} text-xs font-medium`}>
            {actionCfg.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Lead Detail Panel — expanded view of a selected lead
// ---------------------------------------------------------------------------

function LeadDetailPanel({ leadId, onClose }) {
  const [lead, setLead] = useState(null);
  const [funnelHistory, setFunnelHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    fetchTofuLead(leadId)
      .then((data) => {
        setLead(data.lead);
        setFunnelHistory(data.funnelHistory ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [leadId]);

  if (loading) {
    return (
      <motion.div variants={fadeUp} className="glass rounded-2xl p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-400" size={24} />
        <span className="ml-2 text-white/50">Loading lead detail...</span>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div variants={fadeUp} className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
        <button onClick={onClose} className="mt-3 text-xs text-white/50 hover:text-white">Close</button>
      </motion.div>
    );
  }

  if (!lead) return null;

  const qual = lead.qualification_data ? JSON.parse(lead.qualification_data) : {};

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="glass rounded-2xl p-6 space-y-4 border border-purple-500/20"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            {lead.prospect_name}
            {lead.decision_maker_identified === 1 && (
              <UserCheck size={16} className="text-emerald-400" />
            )}
          </h3>
          <p className="text-white/50 text-sm">{lead.prospect_company} | {lead.prospect_role}</p>
        </div>
        <div className="flex items-center gap-3">
          <StageBadge stage={lead.tofu_stage} size="lg" />
          <span className="text-2xl font-mono font-bold text-white">{lead.tofu_score ?? 0}</span>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white text-xs ml-2"
          >
            Close
          </button>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreBar score={lead.fit_score ?? 0} label="ICP Fit" color="blue" />
        <ScoreBar score={lead.engagement_score ?? 0} label="Engagement" color="purple" />
        <ScoreBar score={lead.buy_signal_score ?? 0} label="Buy Signals" color="amber" />
        <ScoreBar score={(lead.tofu_score ?? 0) - (lead.fit_score ?? 0) - (lead.engagement_score ?? 0) - (lead.buy_signal_score ?? 0)} label="Authority" color="emerald" />
      </div>

      {/* Qualification summary */}
      {qual.summary && (
        <div className="bg-white/5 rounded-lg p-3 text-sm text-white/70">
          <p className="text-white/40 text-xs mb-1">AI Assessment</p>
          {qual.summary}
        </div>
      )}

      {/* Pain point alignment */}
      {qual.painPointAlignment?.length > 0 && (
        <div>
          <p className="text-white/40 text-xs mb-2">Pain Point Alignment</p>
          <div className="flex flex-wrap gap-1.5">
            {qual.painPointAlignment.map((p, i) => (
              <span key={i} className="px-2 py-0.5 bg-purple-500/15 text-purple-300 text-xs rounded-full">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* BANT signals */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className={`rounded-lg p-2 text-center ${qual.budgetConfirmed ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/30"}`}>
          <DollarSign size={14} className="mx-auto mb-1" />
          Budget {qual.budgetConfirmed ? "Confirmed" : "Unknown"}
        </div>
        <div className={`rounded-lg p-2 text-center ${qual.timelineConfirmed ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/30"}`}>
          <Clock size={14} className="mx-auto mb-1" />
          Timeline {qual.timelineConfirmed ? "Confirmed" : "Unknown"}
        </div>
        <div className={`rounded-lg p-2 text-center ${qual.decisionMakerIdentified ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/30"}`}>
          <UserCheck size={14} className="mx-auto mb-1" />
          DM {qual.decisionMakerIdentified ? "Identified" : "Unknown"}
        </div>
      </div>

      {/* Estimated ARR */}
      {lead.estimated_arr && (
        <div className="flex items-center gap-2 text-sm">
          <DollarSign size={16} className="text-emerald-400" />
          <span className="text-white/60">Estimated ARR:</span>
          <span className="text-emerald-400 font-mono font-bold">{fmtUSD(lead.estimated_arr)}</span>
        </div>
      )}

      {/* Funnel History */}
      {funnelHistory.length > 0 && (
        <div>
          <p className="text-white/40 text-xs mb-2 flex items-center gap-1">
            <TrendingUp size={12} />
            Funnel Journey
          </p>
          <div className="space-y-1">
            {funnelHistory.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-white/50">
                <Clock size={10} />
                <span className="font-mono text-white/30">{new Date(e.triggered_at).toLocaleDateString()}</span>
                <StageBadge stage={e.from_stage} />
                <ArrowRight size={10} />
                <StageBadge stage={e.to_stage} />
                <span className={`font-mono ${e.score_delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {e.score_delta > 0 ? "+" : ""}{e.score_delta}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact info */}
      <div className="flex items-center gap-4 text-xs text-white/40 pt-2 border-t border-white/5">
        {lead.prospect_email && <span>Email: {lead.prospect_email}</span>}
        {lead.prospect_phone && <span>Phone: {lead.prospect_phone}</span>}
        <span>Source: {lead.source}</span>
        <span>Updated: {new Date(lead.updated_at).toLocaleString()}</span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Quick Qualify Panel — ad-hoc prospect scoring
// ---------------------------------------------------------------------------

function QuickQualifyPanel() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleQualify = useCallback(async () => {
    if (!name || !company) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const prospect = {
        name,
        company,
        role: role || "Unknown",
        industry: industry || "Technology",
        companySize: companySize || undefined,
        painPoints: painPoints ? painPoints.split(",").map((s) => s.trim()) : [],
        channel: "email",
        contactAddress: "unknown@example.com",
      };
      const res = await qualifyProspect(prospect, [], true);
      setResult(res.qualification);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [name, company, role, industry, companySize, painPoints]);

  return (
    <motion.div variants={fadeUp} className="glass rounded-2xl p-5 space-y-3">
      <h3 className="text-white font-semibold text-sm flex items-center gap-2">
        <Zap size={16} className="text-amber-400" />
        Quick Qualify
      </h3>
      <p className="text-white/40 text-xs">Score a prospect through the ToFu Radar engine</p>

      <div className="grid grid-cols-2 gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name *"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
        />
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company *"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
        />
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role / Title"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
        />
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="Industry"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
        />
        <input
          value={companySize}
          onChange={(e) => setCompanySize(e.target.value)}
          placeholder="Company Size (e.g. 500-1000)"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
        />
        <input
          value={painPoints}
          onChange={(e) => setPainPoints(e.target.value)}
          placeholder="Pain Points (comma-separated)"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
        />
      </div>

      <button
        onClick={handleQualify}
        disabled={loading || !name || !company}
        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:text-white/30 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
        {loading ? "Scoring..." : "Run ToFu Qualification"}
      </button>

      {error && (
        <div className="text-red-400 text-xs flex items-center gap-1">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      {/* Result card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 rounded-xl p-4 space-y-3 border border-purple-500/20"
          >
            <div className="flex items-center justify-between">
              <StageBadge stage={result.stage} size="lg" />
              <span className="text-2xl font-mono font-bold text-white">{result.tofuScore}/100</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <ScoreBar score={result.fitScore} label="Fit" color="blue" />
              <ScoreBar score={result.engagementScore} label="Engage" color="purple" />
              <ScoreBar score={result.buySignalScore} label="Buy Sig" color="amber" />
              <ScoreBar score={result.authorityScore} label="Authority" color="emerald" />
            </div>
            <p className="text-white/60 text-xs">{result.summary}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/30">{result.evaluationMethod} | {result.latencyMs}ms</span>
              <span className={`px-2 py-0.5 rounded-full ${getActionConfig(result.nextAction).bg} ${getActionConfig(result.nextAction).text}`}>
                {getActionConfig(result.nextAction).label}
              </span>
            </div>
            {result.estimatedARR && (
              <div className="text-emerald-400 text-xs font-mono flex items-center gap-1">
                <DollarSign size={12} /> Est. ARR: {fmtUSD(result.estimatedARR)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Funnel Velocity Card — stage transition analytics
// ---------------------------------------------------------------------------

function FunnelVelocityCard({ velocity }) {
  if (!velocity?.length) return null;

  return (
    <motion.div variants={fadeUp} className="glass rounded-2xl p-5 space-y-3">
      <h3 className="text-white font-semibold text-sm flex items-center gap-2">
        <TrendingUp size={16} className="text-emerald-400" />
        Funnel Velocity (7-day)
      </h3>
      <div className="space-y-2">
        {velocity.map((v, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <StageBadge stage={v.fromStage} />
            <ArrowRight size={10} className="text-white/30" />
            <StageBadge stage={v.toStage} />
            <span className="ml-auto text-white/50 font-mono">{v.count}x</span>
            <span className={`font-mono ${v.avgDelta > 0 ? "text-emerald-400" : "text-red-400"}`}>
              avg {v.avgDelta > 0 ? "+" : ""}{v.avgDelta}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Escalation Dispatch Panel — shows recent dispatches (Phase 21)
// ---------------------------------------------------------------------------

function EscalationDispatchPanel({ dispatches, lastDispatch }) {
  const [expanded, setExpanded] = useState(false);

  if (!dispatches?.length && !lastDispatch) return null;

  return (
    <motion.div variants={fadeUp} className="glass rounded-2xl p-5 space-y-3 border border-sky-500/20">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Rocket size={16} className="text-sky-400" />
          Escalation Dispatches
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-white/30 hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Last dispatch result */}
      {lastDispatch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-lg p-3 text-sm ${
            lastDispatch.status === "completed"
              ? "bg-emerald-500/10 border border-emerald-500/20"
              : lastDispatch.status === "no_match"
              ? "bg-amber-500/10 border border-amber-500/20"
              : "bg-red-500/10 border border-red-500/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {lastDispatch.status === "completed" ? (
              <ShieldCheck size={16} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={16} className="text-amber-400" />
            )}
            <span className={lastDispatch.status === "completed" ? "text-emerald-400" : "text-amber-400"}>
              {lastDispatch.status === "completed"
                ? `Dispatched to ${lastDispatch.partnerMatch?.partnerName ?? "Partner"}`
                : lastDispatch.status === "no_match"
                ? "No available partner found"
                : `Dispatch failed: ${lastDispatch.haltReason ?? "unknown error"}`}
            </span>
          </div>
          {lastDispatch.partnerMatch && (
            <div className="mt-2 text-xs text-white/50 space-y-0.5">
              <p>Partner: {lastDispatch.partnerMatch.partnerName} ({lastDispatch.partnerMatch.partnerEmail})</p>
              <p>Tier: {lastDispatch.partnerMatch.matchedTier} | Active Leads: {lastDispatch.partnerMatch.partnerActiveLeads}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Dispatch history */}
      <AnimatePresence>
        {expanded && dispatches?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <p className="text-white/40 text-xs">Recent Dispatches</p>
            {dispatches.slice(0, 10).map((d) => (
              <div
                key={d.executionId}
                className="flex items-center gap-3 text-xs bg-white/5 rounded-lg p-2"
              >
                <span className={`w-2 h-2 rounded-full ${
                  d.status === "completed" ? "bg-emerald-400" :
                  d.status === "no_match" ? "bg-amber-400" : "bg-red-400"
                }`} />
                <span className="text-white/70 font-medium truncate flex-1">
                  {d.prospectName} ({d.prospectCompany})
                </span>
                <span className="text-white/40 font-mono">{d.tofuScore}/100</span>
                {d.partnerMatch && (
                  <span className="text-sky-400 truncate max-w-[120px]">
                    → {d.partnerMatch.partnerName}
                  </span>
                )}
                <span className="text-white/30 font-mono">
                  {new Date(d.startedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component: TofuRadarContent
// ---------------------------------------------------------------------------

export function TofuRadarContent() {
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [stageFilter, setStageFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [dispatchingLeadId, setDispatchingLeadId] = useState(null);
  const [lastDispatch, setLastDispatch] = useState(null);
  const [dispatches, setDispatches] = useState([]);

  const loadPipeline = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchTofuPipeline();
      setPipeline(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadDispatches = useCallback(async () => {
    try {
      const data = await fetchEscalationPipeline(20);
      setDispatches(data.executions ?? []);
    } catch {
      // Non-critical — silent fail
    }
  }, []);

  const handleDispatch = useCallback(async (lead) => {
    setDispatchingLeadId(lead.id);
    try {
      const result = await triggerEscalation({
        leadId: lead.id,
        engagementId: lead.engagementId || `lead-${lead.id}`,
        tofuScore: lead.tofuScore,
        estimatedArr: lead.estimatedARR,
        prospectName: lead.name,
        prospectCompany: lead.company,
        tofuStage: lead.stage,
      });
      setLastDispatch(result);
      // Refresh dispatches
      loadDispatches();
    } catch (err) {
      setLastDispatch({ status: "halted", haltReason: err.message });
    } finally {
      setDispatchingLeadId(null);
    }
  }, [loadDispatches]);

  useEffect(() => {
    loadPipeline();
    loadDispatches();
  }, [loadPipeline, loadDispatches]);

  // Filter leads by stage
  const filteredLeads = pipeline?.recentLeads?.filter((l) =>
    stageFilter === "all" ? true : l.stage === stageFilter
  ) ?? [];

  // Summary KPIs
  const totalActive = pipeline ? Object.entries(pipeline.stageCounts ?? {})
    .filter(([k]) => k !== "disqualified")
    .reduce((s, [, v]) => s + v, 0) : 0;
  const qualifiedCount = pipeline?.stageCounts?.qualified ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-purple-400" size={32} />
        <span className="ml-3 text-white/50">Loading ToFu Radar...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center space-y-3">
        <AlertTriangle size={32} className="text-red-400 mx-auto" />
        <p className="text-red-400 font-medium">ToFu Radar Offline</p>
        <p className="text-white/40 text-sm">{error}</p>
        <button
          onClick={() => loadPipeline()}
          className="mt-3 text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 mx-auto"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target size={22} className="text-purple-400" />
            ToFu Radar
          </h2>
          <p className="text-white/40 text-sm mt-0.5">
            Lead Qualification Pipeline | BANT + Engagement Scoring
          </p>
        </div>
        <button
          onClick={() => loadPipeline(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </motion.div>

      {/* KPI Summary Cards */}
      <motion.div variants={stagger} className="grid grid-cols-4 gap-3">
        <motion.div variants={fadeUp} className="glass rounded-xl p-4 text-center">
          <Users size={20} className="text-blue-400 mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-white">{fmtNum(totalActive)}</p>
          <p className="text-white/40 text-xs">Active Leads</p>
        </motion.div>
        <motion.div variants={fadeUp} className="glass rounded-xl p-4 text-center">
          <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-emerald-400">{fmtNum(qualifiedCount)}</p>
          <p className="text-white/40 text-xs">Qualified (85+)</p>
        </motion.div>
        <motion.div variants={fadeUp} className="glass rounded-xl p-4 text-center">
          <DollarSign size={20} className="text-amber-400 mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-amber-400">{fmtUSD(pipeline?.totalEstimatedARR ?? 0)}</p>
          <p className="text-white/40 text-xs">Pipeline ARR</p>
        </motion.div>
        <motion.div variants={fadeUp} className="glass rounded-xl p-4 text-center">
          <BarChart3 size={20} className="text-purple-400 mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-purple-400">{pipeline?.avgTofuScore ?? 0}</p>
          <p className="text-white/40 text-xs">Avg ToFu Score</p>
        </motion.div>
      </motion.div>

      {/* Funnel Visualization */}
      <FunnelBar
        stageCounts={pipeline?.stageCounts ?? {}}
        totalEstimatedARR={pipeline?.totalEstimatedARR ?? 0}
        avgTofuScore={pipeline?.avgTofuScore ?? 0}
      />

      {/* Lead Detail Panel (if selected) */}
      <AnimatePresence>
        {selectedLeadId && (
          <LeadDetailPanel
            leadId={selectedLeadId}
            onClose={() => setSelectedLeadId(null)}
          />
        )}
      </AnimatePresence>

      {/* Stage filter tabs */}
      <motion.div variants={fadeUp} className="flex items-center gap-2">
        <Filter size={14} className="text-white/30" />
        {["all", "awareness", "consideration", "decision", "qualified", "disqualified"].map((stage) => {
          const active = stageFilter === stage;
          const label = stage === "all" ? "All" : getStageConfig(stage).label;
          return (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                active
                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                  : "bg-white/5 text-white/40 hover:text-white/70 border border-white/5"
              }`}
            >
              {label}
              {stage !== "all" && pipeline?.stageCounts?.[stage] > 0 && (
                <span className="ml-1 text-white/30">({pipeline.stageCounts[stage]})</span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Lead Grid */}
      {filteredLeads.length > 0 ? (
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onSelect={setSelectedLeadId}
              onDispatch={handleDispatch}
              dispatching={dispatchingLeadId === lead.id}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-12 text-center">
          <Target size={40} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">
            {stageFilter === "all"
              ? "No leads in the ToFu pipeline yet. Use Quick Qualify or run an ingestion batch to populate."
              : `No leads in the "${getStageConfig(stageFilter).label}" stage.`}
          </p>
        </motion.div>
      )}

      {/* Escalation Dispatch Panel */}
      <EscalationDispatchPanel dispatches={dispatches} lastDispatch={lastDispatch} />

      {/* Bottom panel: Quick Qualify + Funnel Velocity */}
      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <QuickQualifyPanel />
        <FunnelVelocityCard velocity={pipeline?.funnelVelocity ?? []} />
      </motion.div>
    </motion.div>
  );
}
