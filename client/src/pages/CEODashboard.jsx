import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import CEONav from "../components/CEONav";
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
  Gauge,
  PieChart,
  Network,
  RefreshCw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FINOPS_URL =
  "https://moltbot-triage-engine.jamarr.workers.dev/api/finops/metrics";
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
// CEO Dashboard Page
// ===========================================================================

export default function CEODashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

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

  useEffect(() => {
    fetchMetrics();
    const id = setInterval(fetchMetrics, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // ----- loading / fatal states -----
  if (loading && !metrics) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw size={32} className="mx-auto animate-spin text-primary" />
          <p className="mt-4 text-sm text-white/40">Loading FinOps telemetry...</p>
        </div>
      </div>
    );
  }

  const m = metrics ?? {};
  const ue = m.unitEconomics ?? {};
  const sr = m.semanticRouting ?? {};
  const tv = m.triageVelocity ?? {};
  const sg = m.securityGovernance ?? {};
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

      {/* CEO Tab Nav */}
      <CEONav />

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
              onClick={fetchMetrics}
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
              current={ue.currentGrossMargin ?? 0}
              target={ue.targetGrossMargin ?? 0.8}
            />
            <div className="mt-2 text-center text-xs text-white/30">
              GrossMargin = (Revenue &minus; COGS) / Revenue &ge; 80%
            </div>
          </motion.div>

          {/* CPL */}
          <Card
            label="Cost Per Lead"
            value={fmtUSD(ue.averageCPL)}
            sub="Ceiling: $50.00"
            icon={DollarSign}
            iconColor={cplColor(ue.averageCPL ?? 0)}
          >
            <div className="mt-3">
              <Bar value={ue.averageCPL ?? 0} max={60} threshold={50} color="from-emerald-400 to-emerald-600" />
            </div>
          </Card>

          {/* COGS 24h */}
          <Card
            label="COGS (24h)"
            value={fmtUSD(ue.cogs24h)}
            sub={`${ue.executionCount ?? 0} executions`}
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
            value={fmt(ue.totalTokens24h?.input)}
            icon={Cpu}
            iconColor="text-blue-400"
          />
          <Card
            label="Output Tokens (24h)"
            value={fmt(ue.totalTokens24h?.output)}
            sub="3-10x costlier than input"
            icon={Cpu}
            iconColor="text-purple-400"
          />
          <Card
            label="Executions (24h)"
            value={fmt(ue.executionCount)}
            icon={Activity}
            iconColor="text-accent"
          />
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

        {/* Footer */}
        <div className="mt-12 pb-8 text-center text-xs text-white/20">
          Clawbot FinOps 2.0 &middot; Referral Service LLC &middot; Zero-Egress Edge Architecture
        </div>
      </div>
    </div>
  );
}
