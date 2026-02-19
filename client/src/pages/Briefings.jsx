import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Zap,
  Radio,
  PenTool,
  CheckCircle,
  Send,
  Clock,
  Mail,
  Linkedin,
  ChevronRight,
  Target,
  Brain,
  AlertTriangle,
  Flame,
  TrendingUp,
  UserPlus,
  Eye,
  Link2,
  RefreshCw,
  BarChart3,
  Filter,
  Sparkles,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Live API — no mock fallback. Glass pane over bare metal.
// ---------------------------------------------------------------------------

const API_BASE = "https://moltbot-triage-engine.jamarr.workers.dev/api/outbound";

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n) => (n ?? 0).toLocaleString();
const fmtUSD = (n) => `$${(n ?? 0).toFixed(2)}`;
const fmtPct = (n) => `${(n ?? 0).toFixed(1)}%`;

const timeAgo = (iso) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const intentColor = (score) => {
  if (score >= 85) return { bg: "bg-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400", label: "High Intent" };
  if (score >= 70) return { bg: "bg-amber-500/20", text: "text-amber-400", dot: "bg-amber-400", label: "Warm" };
  return { bg: "bg-red-500/20", text: "text-red-400", dot: "bg-red-400", label: "Exploratory" };
};

const sentimentIcon = (label) => {
  const map = {
    excited: { emoji: "🔥", color: "text-emerald-400" },
    curious: { emoji: "🧐", color: "text-cyan-400" },
    anxious: { emoji: "😰", color: "text-amber-400" },
    urgent: { emoji: "⚡", color: "text-red-400" },
    neutral: { emoji: "😐", color: "text-white/50" },
  };
  return map[label] ?? map.neutral;
};

const channelIcon = (ch) => {
  if (ch === "linkedin") return <Linkedin size={13} className="text-blue-400" />;
  return <Mail size={13} className="text-cyan-400" />;
};

// ---------------------------------------------------------------------------
// Kanban Column Configuration
// ---------------------------------------------------------------------------

const KANBAN_COLUMNS = [
  { state: "Signal Analysis", icon: Radio, color: "cyan", bgGlow: "from-cyan-500/10" },
  { state: "Drafting", icon: PenTool, color: "violet", bgGlow: "from-violet-500/10" },
  { state: "Quality Gate", icon: CheckCircle, color: "amber", bgGlow: "from-amber-500/10" },
  { state: "Dispatched", icon: Send, color: "emerald", bgGlow: "from-emerald-500/10" },
  { state: "Cooldown", icon: Clock, color: "orange", bgGlow: "from-orange-500/10" },
];

const stateColorMap = {
  "Signal Analysis": "border-cyan-400/30",
  Drafting: "border-violet-400/30",
  "Quality Gate": "border-amber-400/30",
  Dispatched: "border-emerald-400/30",
  Cooldown: "border-orange-400/30",
};

// ===========================================================================
// 1. AI Bouncer Ledger Widget
// ===========================================================================

function BouncerLedger({ stats, funnel }) {
  const rejectedTotal = stats.rejectedDeterministic + stats.rejectedLLM;

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-5 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
            <Shield size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">AI Bouncer Ledger</h3>
            <p className="text-white/40 text-xs">ICP filter performance &amp; FinOps savings</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-emerald-400">{fmtUSD(stats.computeCapitalDefendedUSD)}</p>
          <p className="text-white/30 text-xs">compute capital defended</p>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {/* Total Ingested */}
        <div className="glass noise rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 size={12} className="text-primary" />
            <span className="text-white/40 text-xs">Ingested</span>
          </div>
          <p className="text-white font-bold text-xl">{fmt(stats.totalIngested)}</p>
        </div>

        {/* Allowed */}
        <div className="glass noise rounded-xl p-3 border border-emerald-400/10">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span className="text-white/40 text-xs">Allowed</span>
          </div>
          <p className="text-emerald-400 font-bold text-xl">{fmt(stats.allowed)}</p>
        </div>

        {/* Rejected */}
        <div className="glass noise rounded-xl p-3 border border-red-400/10">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldX size={12} className="text-red-400" />
            <span className="text-white/40 text-xs">Rejected</span>
          </div>
          <p className="text-red-400 font-bold text-xl">{fmt(rejectedTotal)}</p>
        </div>

        {/* Pass Rate */}
        <div className="glass noise rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-1.5 mb-1">
            <Filter size={12} className="text-amber-400" />
            <span className="text-white/40 text-xs">Pass Rate</span>
          </div>
          <p className="text-amber-400 font-bold text-xl">{fmtPct(stats.passRate)}</p>
        </div>
      </div>

      {/* Rejection Breakdown + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rejection Breakdown */}
        <div className="glass noise rounded-xl p-4 border border-white/5">
          <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Rejection Breakdown</h4>

          {/* Pre-filter bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-white/50">Deterministic Pre-Filter</span>
              <span className="text-white/70 font-mono">{fmt(stats.rejectedDeterministic)}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500/80 to-red-400/60"
                style={{ width: `${(stats.rejectedDeterministic / stats.totalIngested) * 100}%` }}
              />
            </div>
            <p className="text-white/25 text-[10px] mt-0.5">Zero tokens spent — instant reject</p>
          </div>

          {/* LLM filter bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-white/50">LLM ICP Filter (Llama 3.1 8B)</span>
              <span className="text-white/70 font-mono">{fmt(stats.rejectedLLM)}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500/80 to-amber-400/60"
                style={{ width: `${(stats.rejectedLLM / stats.totalIngested) * 100}%` }}
              />
            </div>
            <p className="text-white/25 text-[10px] mt-0.5">~${stats.avgFilterCostUSD}/call &bull; Total: {fmtUSD(stats.totalFilterCostUSD)}</p>
          </div>

          {/* Passed bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-emerald-400/80">Passed → Engagement</span>
              <span className="text-emerald-400 font-mono font-semibold">{fmt(stats.allowed)}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500/80 to-accent/60"
                style={{ width: `${(stats.allowed / stats.totalIngested) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ingestion Funnel */}
        <div className="glass noise rounded-xl p-4 border border-white/5">
          <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Ingestion Funnel</h4>
          <div className="space-y-2">
            {funnel.map((stage, i) => {
              const maxCount = funnel[0]?.count || 1;
              const pct = (stage.count / maxCount) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white/60">{stage.stage}</span>
                    <span className="text-white/80 font-mono font-semibold">{fmt(stage.count)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Source Breakdown Footer */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="glass noise rounded-lg p-3 border border-white/5 text-center">
          <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Apollo</p>
          <p className="text-white font-bold">{fmt(stats.ingestionSources.apollo.total)}</p>
          <p className="text-white/25 text-[10px]">{fmt(stats.ingestionSources.apollo.passedPreFilter)} pre-filtered</p>
        </div>
        <div className="glass noise rounded-lg p-3 border border-white/5 text-center">
          <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Proxycurl</p>
          <p className="text-white font-bold">{fmt(stats.ingestionSources.proxycurl.enriched)}</p>
          <p className="text-white/25 text-[10px]">{fmt(stats.ingestionSources.proxycurl.llmFiltered)} LLM-passed</p>
        </div>
        <div className="glass noise rounded-lg p-3 border border-white/5 text-center">
          <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Manual</p>
          <p className="text-white font-bold">{fmt(stats.ingestionSources.manual.total)}</p>
          <p className="text-white/25 text-[10px]">{fmt(stats.ingestionSources.manual.passedPreFilter)} pre-filtered</p>
        </div>
      </div>
    </motion.div>
  );
}

// ===========================================================================
// 2. Engagement State Machine — Kanban Board
// ===========================================================================

function ProspectCard({ prospect }) {
  const touchPct = (prospect.touchCount / prospect.maxTouches) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass noise rounded-xl p-3 border ${stateColorMap[prospect.currentState] ?? "border-white/5"} hover:border-white/20 transition-colors cursor-default group`}
    >
      {/* Top row: name + channel */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-white/90 font-semibold text-sm truncate">{prospect.name}</p>
          <p className="text-white/40 text-[11px] truncate">{prospect.role} @ {prospect.company}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          {channelIcon(prospect.channel)}
          <span className="text-white/30 text-[10px] uppercase">{prospect.channel}</span>
        </div>
      </div>

      {/* ICP Confidence badge */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
          <Target size={10} />
          {prospect.icpConfidence}% ICP
        </div>
        <span className="text-white/20 text-[10px]">{prospect.industry}</span>
      </div>

      {/* Touch progress */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] mb-0.5">
          <span className="text-white/30">Touches</span>
          <span className="text-white/50 font-mono">{prospect.touchCount}/{prospect.maxTouches}</span>
        </div>
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/80 to-accent/60"
            style={{ width: `${touchPct}%` }}
          />
        </div>
      </div>

      {/* Signals row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px]">
          {prospect.sentimentScore !== null && (
            <span className="text-white/40">
              Sentiment: <span className={prospect.sentimentScore > 0.5 ? "text-emerald-400" : "text-amber-400"}>
                {(prospect.sentimentScore * 100).toFixed(0)}
              </span>
            </span>
          )}
          {prospect.emailOpened && (
            <span className="flex items-center gap-0.5 text-cyan-400">
              <Eye size={10} /> opened
            </span>
          )}
          {prospect.linkClicked && (
            <span className="flex items-center gap-0.5 text-emerald-400">
              <Link2 size={10} /> clicked
            </span>
          )}
        </div>
        <span className="text-white/20 text-[10px]">{timeAgo(prospect.lastActivityAt)}</span>
      </div>

      {/* Cooldown countdown */}
      {prospect.currentState === "Cooldown" && prospect.cooldownEndsAt && (
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-orange-400/70">
          <Clock size={10} />
          Cooldown ends {timeAgo(prospect.cooldownEndsAt).replace(" ago", "")}
        </div>
      )}
    </motion.div>
  );
}

function EngagementKanban({ prospects }) {
  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-5 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-400/20 flex items-center justify-center">
            <Zap size={20} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Engagement State Machine</h3>
            <p className="text-white/40 text-xs">LangGraph pipeline &mdash; {prospects.length} active prospects</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* Kanban columns — horizontal scroll on mobile */}
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
        {KANBAN_COLUMNS.map((col) => {
          const Icon = col.icon;
          const colProspects = prospects.filter((p) => p.currentState === col.state);

          return (
            <div key={col.state} className="min-w-[220px] flex-1 snap-start">
              {/* Column header */}
              <div className={`flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg bg-gradient-to-r ${col.bgGlow} to-transparent`}>
                <Icon size={14} className={`text-${col.color}-400`} />
                <span className="text-white/70 text-xs font-semibold">{col.state}</span>
                <span className={`ml-auto text-${col.color}-400 text-xs font-bold bg-${col.color}-400/10 px-1.5 py-0.5 rounded-full`}>
                  {colProspects.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[80px]">
                {colProspects.length === 0 ? (
                  <div className="flex items-center justify-center h-20 rounded-xl border border-dashed border-white/5 text-white/15 text-xs">
                    Empty
                  </div>
                ) : (
                  colProspects.map((p) => <ProspectCard key={p.id} prospect={p} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ===========================================================================
// 3. Triage Launchpad — Priority Queue
// ===========================================================================

function TriageRow({ item, onAssign }) {
  const ic = intentColor(item.intentScore);
  const sc = sentimentIcon(item.sentimentLabel);

  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-xl p-4 border border-white/5 hover:border-primary/20 transition-all"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white font-semibold text-sm">{item.name}</p>
            <span className="text-white/20">|</span>
            <p className="text-white/50 text-xs truncate">{item.role}, {item.company}</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {/* Intent Score */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${ic.bg} ${ic.text} font-bold`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ic.dot}`} />
              {item.intentScore}/100
            </div>
            {/* Sentiment */}
            <div className="flex items-center gap-1">
              <span className="text-sm">{sc.emoji}</span>
              <span className={`${sc.color} capitalize`}>{item.sentimentLabel}</span>
            </div>
            {/* Reply channel */}
            <div className="flex items-center gap-1 text-white/30">
              {channelIcon(item.replyChannel)}
              <span className="capitalize">{item.replyChannel}</span>
            </div>
            {/* Timing */}
            <span className="text-white/25">{timeAgo(item.repliedAt)}</span>
          </div>
        </div>

        {/* Schedule Partner Badge */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {item.scheduleHumanPartner && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              <Flame size={10} />
              Human Partner
            </span>
          )}
          <button
            onClick={() => onAssign(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors"
          >
            <UserPlus size={12} />
            Assign to SP
          </button>
        </div>
      </div>

      {/* Engagement Context */}
      <div className="flex items-center gap-4 text-[10px] text-white/30 mb-3">
        <span>{item.touchesBeforeReply} touches before reply</span>
        <span>&bull;</span>
        <span>{item.engagementDurationDays} day engagement</span>
        {item.humanPartnerReason && (
          <>
            <span>&bull;</span>
            <span className="text-amber-400/60">{item.humanPartnerReason}</span>
          </>
        )}
      </div>

      {/* Section Zero: Outbound Promise */}
      <div className="rounded-lg bg-gradient-to-r from-primary/5 to-transparent border-l-2 border-primary/40 px-4 py-3">
        <div className="flex items-center gap-1.5 mb-1.5 text-primary text-[10px] font-semibold uppercase tracking-wider">
          <Sparkles size={10} />
          &sect; 0: Outbound Promise
        </div>
        <blockquote className="text-white/70 text-xs leading-relaxed italic">
          &ldquo;{item.sectionZeroPromise}&rdquo;
        </blockquote>
      </div>
    </motion.div>
  );
}

function TriageLaunchpad({ queue, onAssign }) {
  // Sort by intent score descending (highest priority first)
  const sorted = [...queue].sort((a, b) => b.intentScore - a.intentScore);

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-5 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-red-400/20 flex items-center justify-center">
            <Target size={20} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Triage Launchpad</h3>
            <p className="text-white/40 text-xs">Prospects who replied &mdash; crossed the Event Bridge</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs">{queue.length} awaiting triage</span>
        </div>
      </div>

      {/* Queue */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-white/20 gap-2">
          <Target size={32} className="opacity-30" />
          <p className="text-sm">No replies in the queue</p>
          <p className="text-[10px]">Prospects will appear here when they respond to outreach</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-3">
          {sorted.map((item) => (
            <TriageRow key={item.id} item={item} onAssign={onAssign} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// ===========================================================================
// Main Export — ToFu Radar Command Center
// ===========================================================================

export default function Briefings() {
  const [bouncerStats, setBouncerStats] = useState(null);
  const [activeGraph, setActiveGraph] = useState([]);
  const [triageQueue, setTriageQueue] = useState([]);
  const [ingestionFunnel, setIngestionFunnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  // ── Fetch live data — no mock fallback ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("ceo_token") || localStorage.getItem("ceo_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [statsRes, graphRes, triageRes] = await Promise.all([
        fetch(`${API_BASE}/bouncer-stats`, { headers }),
        fetch(`${API_BASE}/active-graph`, { headers }),
        fetch(`${API_BASE}/triage-queue`, { headers }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setBouncerStats(data);
      }
      if (graphRes.ok) {
        const data = await graphRes.json();
        setActiveGraph(data.engagements ?? []);
      }
      if (triageRes.ok) {
        const data = await triageRes.json();
        setTriageQueue(data.queue ?? []);
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error("[ToFu Radar] Fetch error:", err);
      setBouncerStats(null);
      setActiveGraph([]);
      setTriageQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ── Assign to SP handler (mock for now) ──
  const handleAssign = (item) => {
    console.log("[ToFu Radar] Assign to SP:", item.name, item.company);
    // Future: open SP assignment modal or POST to /api/outbound/assign
  };

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="mb-8">
        <motion.div variants={fadeUp} className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
            ToFu Radar
          </h1>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
            Command Center
          </span>
        </motion.div>

        <motion.div variants={fadeUp} className="flex items-center justify-between mt-3">
          <p className="text-white/40 text-sm">
            AI SDR Outbound Engine telemetry &mdash; autonomous top-of-funnel acquisition
          </p>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-white/20 text-xs">
                {timeAgo(lastRefresh.toISOString())}
              </span>
            )}
            <button
              onClick={fetchAll}
              className="p-2 rounded-lg glass noise hover:bg-white/10 transition-colors"
              title="Refresh data"
            >
              <RefreshCw
                size={14}
                className={`text-white/40 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        {/* 1. AI Bouncer Ledger */}
        {bouncerStats && <BouncerLedger stats={bouncerStats} funnel={ingestionFunnel} />}

        {/* 2. Engagement State Machine Kanban */}
        <EngagementKanban prospects={activeGraph} />

        {/* 3. Triage Launchpad */}
        <TriageLaunchpad queue={triageQueue} onAssign={handleAssign} />
      </motion.div>
    </div>
  );
}
