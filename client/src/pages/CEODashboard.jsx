import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import Briefings from "./Briefings";
import RecruitmentOps from "./RecruitmentOps";
import { DisbursementsContent } from "./Disbursements";
import { SPOnboardingContent } from "./SPOnboarding";
import { RevenueSalvageContent } from "./RevenueSalvage";
import { SecOpsLedgerContent } from "./SecOpsLedger";
import { ComplianceDashboardContent } from "./ComplianceDashboard";
import { TeamDelegationContent } from "./TeamDelegation";
import { getAnalytics } from "../lib/triage-client";
import {
  ArrowLeft,
  Activity,
  Cpu,
  DollarSign,
  TrendingUp,
  Target,
  Server,
  ShieldCheck,
  ScanSearch,
  ShieldAlert,
  RotateCcw,
  PieChart,
  Network,
  RefreshCw,
  FileText,
  Users,
  Lock,
  Banknote,
  UserPlus,
  Flame,
  Ghost,
  Sparkles,
  Radio,
  Megaphone,
  Mail,
  MessageSquare,
  Linkedin,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_TRIAGE_API_BASE || "https://moltbot-triage-engine.jamarr.workers.dev";
const FINOPS_URL = `${API_BASE}/api/finops/metrics`;
const POLL_INTERVAL = 30_000;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n) => (n ?? 0).toLocaleString();
const fmtPct = (n) => `${((n ?? 0) * 100).toFixed(1)}%`;
const fmtUSD = (n) => `$${(n ?? 0).toFixed(2)}`;
const fmtNum = (n) => (n ?? 0).toLocaleString();

const statusColors = {
  nominal: { bg: "bg-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400" },
  warning: { bg: "bg-amber-500/20", text: "text-amber-400", dot: "bg-amber-400" },
  critical: { bg: "bg-red-500/20", text: "text-red-400", dot: "bg-red-400" },
};

const marginColor = (cur, tgt) =>
  cur >= tgt ? "text-emerald-400" : cur >= tgt - 0.05 ? "text-amber-400" : "text-red-400";
const cplColor = (v) => (v <= 40 ? "text-emerald-400" : v <= 50 ? "text-amber-400" : "text-red-400");
const gaugeStroke = (cur, tgt) =>
  cur >= tgt ? "#00e5a0" : cur >= tgt - 0.05 ? "#f59e0b" : "#ef4444";

// Model display-name shortener
const shortModel = (m) =>
  m.replace("@cf/meta/", "").replace("-instruct", "");

// ---------------------------------------------------------------------------
// SVG: Semi-circular Gross Margin Gauge
// ---------------------------------------------------------------------------

function GrossMarginGauge({ current = 0, target = 0.8 }) {
  const R = 70;
  const half = Math.PI * R;
  const valLen = half * Math.min(current, 1);

  // Target tick position (angle from left)
  const tAngle = Math.PI * (1 - target);
  const tx = 100 + R * Math.cos(tAngle);
  const ty = 95 - R * Math.sin(tAngle);

  const stroke = gaugeStroke(current, target);

  return (
    <svg viewBox="0 0 200 115" className="mx-auto w-full max-w-[260px]">
      <defs>
        <linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6d5cff" />
          <stop offset="100%" stopColor={stroke} />
        </linearGradient>
      </defs>
      {/* background arc */}
      <path
        d="M 18 95 A 70 70 0 0 1 182 95"
        fill="none"
        stroke="#1e2235"
        strokeWidth="14"
        strokeLinecap="round"
      />
      {/* value arc */}
      <path
        d="M 18 95 A 70 70 0 0 1 182 95"
        fill="none"
        stroke="url(#gg)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={half}
        strokeDashoffset={half - valLen}
      />
      {/* target tick */}
      <circle cx={tx} cy={ty} r="3" fill="#fff" opacity="0.5" />
      {/* center label */}
      <text x="100" y="82" textAnchor="middle" fill="white" fontSize="28" fontWeight="700">
        {(current * 100).toFixed(1)}%
      </text>
      <text x="100" y="108" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11">
        Target {(target * 100).toFixed(0)}%
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// SVG: Donut Chart
// ---------------------------------------------------------------------------

const DONUT_COLORS = ["#6d5cff", "#00e5a0", "#f59e0b", "#3b82f6", "#ec4899", "#ef4444"];

function DonutChart({ data = {} }) {
  const entries = Object.entries(data);
  if (entries.length === 0)
    return <p className="text-sm text-white/30">No routing data yet</p>;

  const R = 52;
  const C = 2 * Math.PI * R;
  let acc = 0;

  const segs = entries.map(([label, ratio], i) => {
    const len = C * ratio;
    const off = -C * acc;
    acc += ratio;
    return { label, ratio, len, off, color: DONUT_COLORS[i % DONUT_COLORS.length] };
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
        {segs.map((s, i) => (
          <circle
            key={i}
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="18"
            strokeDasharray={`${s.len} ${C - s.len}`}
            strokeDashoffset={s.off}
            transform="rotate(-90 70 70)"
          />
        ))}
      </svg>
      <div className="space-y-1.5">
        {segs.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-white/50">{shortModel(s.label)}</span>
            <span className="font-semibold text-white">{(s.ratio * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProgressBar with optional threshold
// ---------------------------------------------------------------------------

function Bar({ value = 0, max = 1, color = "from-primary to-accent", threshold }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
      {threshold != null && (
        <div
          className="absolute top-0 h-full w-0.5 bg-white/50"
          style={{ left: `${(threshold / max) * 100}%` }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable Metric Card (matches Dashboard.jsx stat-card pattern)
// ---------------------------------------------------------------------------

function Card({ label, value, sub, icon: Icon, iconColor = "text-primary", children }) {
  return (
    <motion.div variants={fadeUp} className="glass noise relative overflow-hidden rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs text-white/40">{label}</div>
          <div className={`mt-1 text-2xl font-bold ${iconColor}`}>{value}</div>
          {sub && <div className="mt-0.5 text-xs text-white/30">{sub}</div>}
        </div>
        {Icon && <Icon size={22} className={`${iconColor} shrink-0 opacity-50`} />}
      </div>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Boolean Status Indicator
// ---------------------------------------------------------------------------

function StatusDot({ label, active, yesLabel = "Enforced", noLabel = "Disabled", icon: Icon }) {
  const ok = !!active;
  return (
    <motion.div variants={fadeUp} className="glass noise relative overflow-hidden rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-white/40">{label}</div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-400 shadow-lg shadow-emerald-400/30" : "bg-red-400 shadow-lg shadow-red-400/30"}`}
            />
            <span className={`text-lg font-bold ${ok ? "text-emerald-400" : "text-red-400"}`}>
              {ok ? yesLabel : noLabel}
            </span>
          </div>
        </div>
        {Icon && <Icon size={22} className={`${ok ? "text-emerald-400" : "text-red-400"} shrink-0 opacity-50`} />}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function Section({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4 mt-10 flex items-center gap-3 first:mt-0">
      {Icon && <Icon size={20} className="text-primary opacity-70" />}
      <div>
        <h2 className="text-base font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
      </div>
    </div>
  );
}

// ===========================================================================
// Internal Tab System
// ===========================================================================

const ceoTabs = [
  { id: "dashboard", label: "Dashboard", icon: Activity, color: "emerald" },
  { id: "briefings", label: "ToFu Radar", icon: Radio, color: "cyan" },
  { id: "recruiting", label: "Recruitment Ops", icon: Users, color: "violet" },
  { id: "disbursements", label: "Disbursements", icon: Banknote, color: "amber" },
  { id: "sp-onboarding", label: "SP Onboarding", icon: UserPlus, color: "teal" },
  { id: "revenue-salvage", label: "Revenue Salvage", icon: Flame, color: "red" },
  { id: "secops", label: "SecOps Ledger", icon: ShieldAlert, color: "rose" },
  { id: "compliance", label: "Compliance", icon: Lock, color: "indigo" },
  { id: "delegation", label: "SP Teams", icon: Users, color: "cyan" },
  { id: "campaign", label: "Campaign", icon: Megaphone, color: "blue", href: "/campaign" },
  { id: "triage", label: "Triage", icon: Target, color: "pink", href: "/triage" },
];

const colorMap = {
  emerald: {
    active: "border-emerald-400 text-emerald-400 bg-emerald-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-emerald-400",
  },
  cyan: {
    active: "border-cyan-400 text-cyan-400 bg-cyan-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-cyan-400",
  },
  violet: {
    active: "border-violet-400 text-violet-400 bg-violet-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-violet-400",
  },
  amber: {
    active: "border-amber-400 text-amber-400 bg-amber-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-amber-400",
  },
  teal: {
    active: "border-teal-400 text-teal-400 bg-teal-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-teal-400",
  },
  red: {
    active: "border-red-400 text-red-400 bg-red-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-red-400",
  },
  rose: {
    active: "border-rose-400 text-rose-400 bg-rose-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-rose-400",
  },
  pink: {
    active: "border-pink-400 text-pink-400 bg-pink-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-pink-400",
  },
  blue: {
    active: "border-blue-400 text-blue-400 bg-blue-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-blue-400",
  },
  indigo: {
    active: "border-indigo-400 text-indigo-400 bg-indigo-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-indigo-400",
  },
};

// ===========================================================================
// CEO Dashboard Page
// ===========================================================================

export default function CEODashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [compressionData, setCompressionData] = useState({
    actionableTokenRatio: 0,
    atrTarget: 0.80,
    phantomTokens24h: 0,
    phantomTokens7d: 0,
    inferenceRate: 0.00000015,
    defendedCapital24h: 0,
    defendedCapital7d: 0,
    compressionPasses: 0,
    passBreakdown: {},
  });

  const fetchMetrics = async () => {
    try {
      const res = await fetch(FINOPS_URL);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setMetrics(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompression = async () => {
    try {
      const token = sessionStorage.getItem("ceo_token") || localStorage.getItem("ceo_token");
      const res = await fetch(
        `${API_BASE}/api/finops/compression-roi`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) return;
      const data = await res.json();
      // Map backend fields to the shape the widget expects
      setCompressionData({
        actionableTokenRatio: data.actionableTokenRatio ?? 0,
        atrTarget: data.actionableTokenRatioTarget ?? 0.80,
        phantomTokens24h: data.phantomTokensStripped24h ?? 0,
        phantomTokens7d: data.phantomTokensStripped7d ?? 0,
        inferenceRate: 0.00000015,
        defendedCapital24h: data.defendedCapitalUSD24h ?? 0,
        defendedCapital7d: data.defendedCapitalUSD7d ?? 0,
        compressionPasses: data.compressionPasses ?? 0,
        passBreakdown: data.passBreakdown ?? {},
      });
    } catch {
      // Enforce zeroes on failure — no mock padding
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch {
      // Silent — God View is additive, not critical path
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchCompression();
    fetchAnalytics();
    const id = setInterval(fetchMetrics, POLL_INTERVAL);
    const id2 = setInterval(fetchCompression, POLL_INTERVAL);
    const id3 = setInterval(fetchAnalytics, POLL_INTERVAL);
    return () => { clearInterval(id); clearInterval(id2); clearInterval(id3); };
  }, []);

  const m = metrics ?? {};
  const ue = m.unitEconomics ?? {};
  const sr = m.semanticRouting ?? {};
  const tv = m.triageVelocity ?? {};
  const sg = m.securityGovernance ?? {};
  const an = analytics ?? {};
  const pipeline = an.pipeline ?? {};
  const roi = an.finops ?? {};
  const channels = an.channels ?? {};

  // ── Phase 12: Prefer live KV-sourced analytics over volatile in-memory metrics ──
  const liveGrossMargin = roi.grossMargin24h ?? ue.currentGrossMargin ?? 0;
  const liveCPL = roi.costPerLead24h ?? ue.averageCPL ?? 0;
  const liveCOGS24h = roi.cogs24h ?? ue.cogs24h ?? 0;
  const liveInputTokens = roi.inputTokens24h ?? ue.totalTokens24h?.input ?? 0;
  const liveOutputTokens = roi.outputTokens24h ?? ue.totalTokens24h?.output ?? 0;
  const liveExecCount = roi.executionCount24h ?? ue.executionCount ?? 0;
  const livePhantom24h = roi.phantomTokensStripped24h ?? compressionData.phantomTokens24h;
  const liveDefended24h = roi.defendedCapital24h ?? compressionData.defendedCapital24h;

  const overallStatus = m.status ?? "nominal";
  const sc = statusColors[overallStatus] ?? statusColors.nominal;

  const escRate =
    tv.leadsScored > 0
      ? ((tv.highIntentEscalations / tv.leadsScored) * 100).toFixed(1)
      : "0.0";

  // Hardware arbitrage — check 80% edge target
  const edgeRatio = sr.hardwareArbitrage?.workersAI_edge ?? 0;
  const edgeTargetMet = edgeRatio >= 0.8;

  return (
    <div className="min-h-screen">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      {/* ── Internal Tab Bar (replaces CEONav) ── */}
      <div className="glass noise sticky top-0 z-50 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6">
          {/* Top bar with back link + lock badge */}
          <div className="flex items-center justify-between py-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
            >
              <ArrowLeft size={14} />
              Back to Home
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/30">
              <Lock size={10} />
              Executive Access
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex gap-1 overflow-x-auto pb-0 -mb-px">
            {ceoTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const colors = colorMap[tab.color];
              const cls = `flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                isActive ? colors.active : colors.idle
              }`;

              if (tab.href) {
                return (
                  <Link key={tab.id} href={tab.href} className={cls}>
                    <tab.icon size={15} className={colors.icon} />
                    {tab.label}
                  </Link>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cls}
                >
                  <tab.icon size={15} className={isActive ? colors.icon : "text-white/30"} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "briefings" && <Briefings />}
      {activeTab === "recruiting" && <RecruitmentOps />}
      {activeTab === "disbursements" && <DisbursementsContent />}
      {activeTab === "sp-onboarding" && <SPOnboardingContent />}
      {activeTab === "revenue-salvage" && <RevenueSalvageContent />}
      {activeTab === "secops" && <SecOpsLedgerContent />}
      {activeTab === "compliance" && <ComplianceDashboardContent />}
      {activeTab === "delegation" && <TeamDelegationContent />}

      {activeTab === "dashboard" && (
      loading && !metrics ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <RefreshCw size={32} className="mx-auto animate-spin text-primary" />
            <p className="mt-4 text-sm text-white/40">Loading FinOps telemetry...</p>
          </div>
        </div>
      ) : (
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-8">
        {/* ── Header ── */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">
                <span className="gradient-text">FinOps 2.0</span> CEO Dashboard
              </h1>
              <p className="text-sm text-white/40">
                Clawbot Unit Economics &middot; Real-time Observability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* overall status badge */}
            <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${sc.bg} ${sc.text}`}>
              <span className={`inline-block h-2 w-2 rounded-full ${sc.dot}`} />
              {overallStatus.toUpperCase()}
            </div>

            {/* refresh + timestamp */}
            <button
              onClick={() => { fetchMetrics(); fetchCompression(); fetchAnalytics(); }}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              title="Refresh now"
            >
              <RefreshCw size={16} />
            </button>
            {lastUpdated && (
              <span className="text-xs text-white/30">
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* error banner */}
        {error && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
            Failed to refresh &mdash; showing data from{" "}
            {lastUpdated?.toLocaleTimeString() ?? "cache"}. Retrying...
          </div>
        )}

        {/* ================================================================ */}
        {/* MODULE 1: Unit Economics & Margin Protection                     */}
        {/* ================================================================ */}
        <Section
          icon={DollarSign}
          title="Unit Economics & Margin Protection"
          subtitle="Live gross margin tracking, COGS, and Cost Per Lead"
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Gross Margin Gauge (spans 2 cols) */}
          <motion.div
            variants={fadeUp}
            className="glass noise relative overflow-hidden rounded-2xl p-5 sm:col-span-2"
          >
            <div className="text-xs text-white/40">Gross Margin</div>
            <GrossMarginGauge
              current={liveGrossMargin}
              target={ue.targetGrossMargin ?? 0.8}
            />
            <div className="mt-2 text-center text-xs text-white/30">
              GrossMargin = (Revenue &minus; COGS) / Revenue &ge; 80%
            </div>
          </motion.div>

          {/* CPL */}
          <Card
            label="Cost Per Lead"
            value={fmtUSD(liveCPL)}
            sub="Ceiling: $50.00"
            icon={DollarSign}
            iconColor={cplColor(liveCPL)}
          >
            <div className="mt-3">
              <Bar value={liveCPL} max={60} threshold={50} color="from-emerald-400 to-emerald-600" />
            </div>
          </Card>

          {/* COGS 24h */}
          <Card
            label="COGS (24h)"
            value={fmtUSD(liveCOGS24h)}
            sub={`LLM: $${(roi.llmInferenceCost24h ?? 0).toFixed(4)} · E2B: $${(roi.e2bScrapeCost24h ?? 0).toFixed(2)} · Vapi: $${(roi.vapiVoiceCost24h ?? 0).toFixed(2)}`}
            icon={Activity}
            iconColor="text-primary"
          />
        </motion.div>

        {/* Token row */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <Card
            label="Input Tokens (24h)"
            value={fmt(liveInputTokens)}
            icon={Cpu}
            iconColor="text-blue-400"
          />
          <Card
            label="Output Tokens (24h)"
            value={fmt(liveOutputTokens)}
            sub="3-10x costlier than input"
            icon={Cpu}
            iconColor="text-purple-400"
          />
          <Card
            label="Executions (24h)"
            value={fmt(liveExecCount)}
            sub={`${roi.e2bScrapeCount24h ?? 0} scrapes · ${(roi.vapiVoiceMinutes24h ?? 0).toFixed(0)}m voice`}
            icon={Activity}
            iconColor="text-accent"
          />
        </motion.div>

        {/* ================================================================ */}
        {/* MODULE 1.5: Compression ROI Telemetry (P3 Engine)               */}
        {/* ================================================================ */}
        <Section
          icon={Sparkles}
          title="Compression ROI Telemetry"
          subtitle="P3 Token Compression — Defending the 0.80 gross margin floor"
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          {/* ATR Gauge */}
          <motion.div variants={fadeUp} className="glass noise overflow-hidden rounded-2xl p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-white/40">Actionable Token Ratio (ATR)</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                compressionData.actionableTokenRatio >= compressionData.atrTarget
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}>
                {compressionData.actionableTokenRatio >= compressionData.atrTarget ? "Target Met" : "Below Target"}
              </span>
            </div>

            {/* ATR Speedometer SVG */}
            <div className="flex justify-center py-4">
              <svg width="160" height="90" viewBox="0 0 160 90">
                {/* Background arc */}
                <path
                  d="M 15 85 A 65 65 0 0 1 145 85"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                {/* Target zone (>=0.70) */}
                <path
                  d="M 15 85 A 65 65 0 0 1 145 85"
                  fill="none"
                  stroke="rgba(0,229,160,0.1)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${0.30 * 204} 204`}
                  strokeDashoffset={`-${0.70 * 204}`}
                />
                {/* Current value arc */}
                <path
                  d="M 15 85 A 65 65 0 0 1 145 85"
                  fill="none"
                  stroke={compressionData.actionableTokenRatio >= compressionData.atrTarget ? "#00e5a0" : "#f59e0b"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${compressionData.actionableTokenRatio * 204} 204`}
                />
                {/* Center text */}
                <text x="80" y="70" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="monospace">
                  {(compressionData.actionableTokenRatio * 100).toFixed(0)}%
                </text>
                <text x="80" y="86" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10">
                  Target: {(compressionData.atrTarget * 100).toFixed(0)}%
                </text>
              </svg>
            </div>

            {/* Pass Breakdown */}
            <div className="space-y-1.5 mt-2">
              {Object.entries(compressionData.passBreakdown).map(([pass, ratio]) => {
                const passLabels = {
                  filler_removal: "Filler Removal",
                  redundant_history: "Redundant History",
                  boilerplate_collapse: "Boilerplate Collapse",
                  semantic_dedup: "Semantic Dedup",
                  context_pruning: "Context Pruning",
                };
                return (
                  <div key={pass} className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 w-28 truncate">{passLabels[pass] ?? pass}</span>
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/50 w-8 text-right">{(ratio * 100).toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Phantom Tokens Counter */}
          <motion.div variants={fadeUp} className="glass noise overflow-hidden rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Ghost size={16} className="text-violet-400" />
                <span className="text-xs text-white/40">Phantom Tokens Stripped</span>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Last 24 Hours</p>
                  <p className="text-3xl font-bold text-violet-400">
                    {livePhantom24h.toLocaleString()}
                  </p>
                  <p className="text-white/20 text-[10px] mt-0.5">tokens eliminated</p>
                </div>
                <div className="border-t border-white/5 pt-4">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Last 7 Days</p>
                  <p className="text-2xl font-bold text-violet-300">
                    {compressionData.phantomTokens7d.toLocaleString()}
                  </p>
                  <p className="text-white/20 text-[10px] mt-0.5">tokens eliminated</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <p className="text-violet-400 text-[10px] font-bold uppercase tracking-wider">
                5-Pass Engine &middot; {compressionData.compressionPasses} passes active
              </p>
            </div>
          </motion.div>

          {/* Defended Capital */}
          <motion.div variants={fadeUp} className="glass noise overflow-hidden rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={16} className="text-accent" />
                <span className="text-xs text-white/40">Defended Capital</span>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Saved (24h)</p>
                  <p className="text-3xl font-bold text-accent">
                    ${liveDefended24h.toFixed(2)}
                  </p>
                  <p className="text-white/20 text-[10px] mt-0.5">
                    {livePhantom24h.toLocaleString()} tokens &times; $0.645/M
                  </p>
                </div>
                <div className="border-t border-white/5 pt-4">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Saved (7d)</p>
                  <p className="text-2xl font-bold text-emerald-300">
                    ${compressionData.defendedCapital7d.toFixed(2)}
                  </p>
                  <p className="text-white/20 text-[10px] mt-0.5">
                    {compressionData.phantomTokens7d.toLocaleString()} tokens &times; ${(compressionData.inferenceRate * 1000000).toFixed(2)}/M
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                Margin Floor: 80% &middot; Currently {fmtPct(liveGrossMargin)}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ================================================================ */}
        {/* MODULE 2: Semantic Routing & Infrastructure Arbitrage            */}
        {/* ================================================================ */}
        <Section
          icon={Network}
          title="Semantic Routing & Infrastructure Arbitrage"
          subtitle="Model offload ratios and hardware utilization"
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {/* Donut */}
          <motion.div variants={fadeUp} className="glass noise overflow-hidden rounded-2xl p-5">
            <div className="mb-3 text-xs text-white/40">Model Offload Ratios</div>
            <DonutChart data={sr.offloadRatio ?? {}} />
          </motion.div>

          {/* Hardware arbitrage */}
          <motion.div variants={fadeUp} className="glass noise overflow-hidden rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-white/40">Hardware Arbitrage</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${edgeTargetMet ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}
              >
                {edgeTargetMet ? "Target Met" : "Below 80% Edge"}
              </span>
            </div>

            <div className="space-y-4">
              {Object.entries(sr.hardwareArbitrage ?? {}).map(([tier, ratio]) => {
                const tierColors = {
                  workersAI_edge: "from-accent to-emerald-600",
                  aws_inferentia2: "from-primary to-indigo-400",
                  nvidia_h100: "from-amber-400 to-amber-600",
                };
                const tierLabels = {
                  workersAI_edge: "Workers AI Edge (Llama 8B)",
                  aws_inferentia2: "AWS Inferentia2 (Mid Tier)",
                  nvidia_h100: "NVIDIA H100 (Premium)",
                };
                return (
                  <div key={tier}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-white/60">{tierLabels[tier] ?? tier}</span>
                      <span className="font-semibold text-white">{(ratio * 100).toFixed(0)}%</span>
                    </div>
                    <Bar
                      value={ratio}
                      max={1}
                      color={tierColors[tier] ?? "from-gray-400 to-gray-600"}
                      threshold={tier === "workersAI_edge" ? 0.8 : undefined}
                    />
                  </div>
                );
              })}
              {Object.keys(sr.hardwareArbitrage ?? {}).length === 0 && (
                <p className="text-sm text-white/30">No inference data yet</p>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* ================================================================ */}
        {/* MODULE 3: Triage Engine & Sales Velocity                        */}
        {/* ================================================================ */}
        <Section
          icon={Target}
          title="Triage Engine & Sales Velocity"
          subtitle="Top-of-funnel pipeline monitoring"
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <Card label="Leads Scored" value={fmt(tv.leadsScored)} icon={Target} iconColor="text-primary" />
          <Card
            label="High Intent Escalations"
            value={fmt(tv.highIntentEscalations)}
            sub={`>${tv.escalationThreshold ?? 85}/100 threshold`}
            icon={TrendingUp}
            iconColor="text-accent"
          />
          <Card
            label="Escalation Rate"
            value={`${escRate}%`}
            icon={PieChart}
            iconColor={
              parseFloat(escRate) > 40
                ? "text-red-400"
                : parseFloat(escRate) > 20
                  ? "text-amber-400"
                  : "text-emerald-400"
            }
          />
          <Card label="Active Pods" value={fmt(tv.activePods)} icon={Server} iconColor="text-blue-400" />
        </motion.div>

        {/* ================================================================ */}
        {/* MODULE 4: Security & Governance (Risk Audit)                    */}
        {/* ================================================================ */}
        <Section
          icon={ShieldCheck}
          title="Security & Governance"
          subtitle="Execution approval, skill scanning, and threat monitoring"
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <StatusDot
            label="Exec Approval Mode"
            active={sg.executionApprovalMode}
            yesLabel="Enforced"
            noLabel="Disabled"
            icon={ShieldCheck}
          />
          <StatusDot
            label="Skill Scanner"
            active={sg.skillScannerStatus === "active"}
            yesLabel="Active"
            noLabel="Inactive"
            icon={ScanSearch}
          />
          <Card
            label="Threats Blocked (24h)"
            value={fmt(sg.threatsBlocked24h)}
            icon={ShieldAlert}
            iconColor={sg.threatsBlocked24h > 0 ? "text-amber-400" : "text-emerald-400"}
          />
          <Card
            label="Loop Breakers Tripped"
            value={fmt(sg.loopBreakersTripped24h)}
            sub="Logic + Financial"
            icon={RotateCcw}
            iconColor={sg.loopBreakersTripped24h > 0 ? "text-amber-400" : "text-emerald-400"}
          />
        </motion.div>

        {/* ================================================================ */}
        {/* MODULE 5: Pipeline & ROI God View (Phase 7)                    */}
        {/* ================================================================ */}
        <Section
          icon={Sparkles}
          title="Pipeline & ROI God View"
          subtitle="Live venture economics &middot; AI vs. Human SDR displacement"
        />

        {/* Panel 1: Pipeline Health */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <Card
            label="Active Engagements"
            value={fmt(pipeline.activeEngagements)}
            sub={`${fmt(pipeline.statusBreakdown?.running ?? 0)} running · ${fmt(pipeline.statusBreakdown?.waiting_cooldown ?? 0)} cooling`}
            icon={Activity}
            iconColor="text-primary"
          />
          <Card
            label="Human Takeovers"
            value={fmt(pipeline.humanTakeovers)}
            sub="AI muted — operator in control"
            icon={Users}
            iconColor="text-amber-400"
          />
          <Card
            label="Pending Handoffs"
            value={fmt(pipeline.pendingHandoffs)}
            sub="Awaiting human review"
            icon={Target}
            iconColor="text-accent"
          />
          <Card
            label="Total Leads"
            value={fmt(pipeline.totalLeads)}
            sub={`${fmt(pipeline.statusBreakdown?.ready_for_outreach ?? 0)} queued for outreach`}
            icon={Zap}
            iconColor="text-blue-400"
          />
        </motion.div>

        {/* Panel 2: AI vs. Human SDR ROI */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="glass noise mt-4 rounded-2xl p-5 border border-white/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <DollarSign size={18} className="text-emerald-400" />
            <h3 className="text-white font-bold text-sm">AI vs. Human SDR — Cost Displacement</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Cost comparison */}
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-400/60 mb-1">
                  AI Annual Cost (projected)
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                  {fmtUSD(roi.annualizedAiCost)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-red-400/60 mb-1">
                  Human SDR Cost (displaced)
                </div>
                <div className="text-2xl font-bold text-red-400 line-through decoration-red-400/50">
                  {fmtUSD(roi.humanSDRCostUSD || 110000)}
                </div>
              </div>
            </div>

            {/* Center: Displacement multiple */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {roi.displacementMultiple != null
                  ? roi.displacementMultiple >= 1000
                    ? `${Math.round(roi.displacementMultiple / 1000)}k`
                    : fmt(roi.displacementMultiple)
                  : "—"}&times;
              </div>
              <div className="text-xs text-white/40 mt-1">
                cheaper than a human SDR
              </div>
              <div className="text-sm font-semibold text-emerald-400 mt-2">
                {fmtUSD(roi.annualSavingsUSD)} saved/yr
              </div>
            </div>

            {/* Right: COGS breakdown */}
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
                  Total AI COGS (to date)
                </div>
                <div className="text-lg font-bold text-white/80">
                  ${roi.totalCOGS != null ? roi.totalCOGS.toFixed(4) : "0.0000"}
                </div>
                <div className="text-[10px] text-white/20">
                  Inference: ${roi.totalAiCostUSD != null ? roi.totalAiCostUSD.toFixed(4) : "0"} · Infra: ${roi.totalInfraCostUSD != null ? roi.totalInfraCostUSD.toFixed(4) : "0"}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
                  Avg Gross Margin
                </div>
                <div className={`text-lg font-bold ${(roi.averageGrossMargin ?? 0) >= 0.80 ? "text-emerald-400" : "text-amber-400"}`}>
                  {((roi.averageGrossMargin ?? 0) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Cost displacement bar */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-[10px] text-white/30 mb-1">
              <span>AI COGS: ${roi.totalCOGS != null ? roi.totalCOGS.toFixed(4) : "0"}</span>
              <span>Human SDR: $110,000/yr</span>
            </div>
            <div className="relative h-3 rounded-full bg-red-400/15 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-accent"
                style={{
                  width: `${Math.max(
                    ((roi.annualizedAiCost ?? 0) / 110000) * 100,
                    0.5
                  )}%`,
                  minWidth: "4px",
                }}
              />
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" /> AI
              </span>
              <span className="flex items-center gap-1 text-red-400/50">
                <span className="inline-block w-2 h-2 rounded-full bg-red-400/30" /> Human (displaced)
              </span>
            </div>
          </div>
        </motion.div>

        {/* Panel 3: Token Compression Pipeline ROI */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Card
            label="Tokens Compressed"
            value={fmtNum(roi.compressionTokensSaved)}
            sub={`${fmtNum(roi.compressionCharsSaved)} characters eliminated`}
            icon={Ghost}
            iconColor="text-purple-400"
          />
          <Card
            label="Compression Savings"
            value={`$${roi.compressionCostSavingsUSD != null ? roi.compressionCostSavingsUSD.toFixed(4) : "0.0000"}`}
            sub="Phantom tokens defended"
            icon={ShieldCheck}
            iconColor="text-emerald-400"
          />
        </motion.div>

        {/* Panel 4: Channel Efficacy */}
        <div className="mt-4 mb-2 flex items-center gap-2">
          <Network size={16} className="text-primary opacity-70" />
          <h3 className="text-sm font-bold text-white/70">Channel Efficacy</h3>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[
            { key: "email", label: "Email", icon: Mail, color: "text-primary", barColor: "from-primary to-primary/70" },
            { key: "sms", label: "SMS", icon: MessageSquare, color: "text-accent", barColor: "from-accent to-accent/70" },
            { key: "linkedin_dm", label: "LinkedIn DM", icon: Linkedin, color: "text-blue-400", barColor: "from-blue-400 to-blue-400/70" },
          ].map(({ key, label, icon: ChIcon, color, barColor }) => {
            const ch = channels[key] ?? {};
            const openPct = ((ch.openRate ?? 0) * 100).toFixed(0);
            const replyPct = ((ch.replyRate ?? 0) * 100).toFixed(0);
            return (
              <motion.div
                key={key}
                variants={fadeUp}
                className="glass noise rounded-2xl p-4 border border-white/5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <ChIcon size={16} className={color} />
                  <span className="text-sm font-bold text-white/80">{label}</span>
                  <span className="ml-auto text-xs text-white/30 font-mono">
                    {fmt(ch.attempts)} sent
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="text-white/40">Open Rate</span>
                      <span className={color}>{openPct}%</span>
                    </div>
                    <Bar value={ch.openRate ?? 0} max={1} color={barColor} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="text-white/40">Reply Rate</span>
                      <span className={color}>{replyPct}%</span>
                    </div>
                    <Bar value={ch.replyRate ?? 0} max={1} color={barColor} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer */}
        <div className="mt-12 pb-8 text-center text-xs text-white/20">
          Clawbot FinOps 2.0 &middot; Referral Service LLC &middot; Zero-Egress Edge Architecture
        </div>
      </div>
      ))}
    </div>
  );
}
