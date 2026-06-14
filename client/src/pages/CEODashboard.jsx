import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { getAuthToken } from "../lib/auth-store";
import Briefings from "./Briefings";
import RecruitmentOps from "./RecruitmentOps";
import AgentObservability from "../components/AgentObservability";
import { DisbursementsContent } from "./Disbursements";
import { SPOnboardingContent } from "./SPOnboarding";
import { RevenueSalvageContent } from "./RevenueSalvage";
import { SecOpsLedgerContent } from "./SecOpsLedger";
import { ComplianceDashboardContent } from "./ComplianceDashboard";
import { TeamDelegationContent } from "./TeamDelegation";
import { SEOApprovalContent } from "./SEOApproval";
import { TofuRadarContent } from "./TofuRadar";
import { SPRecruitmentContent } from "./SPRecruitment";
import { getAnalytics, fetchGlobalAnalytics, runMatrixSimulation } from "../lib/triage-client";
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
  PenTool,
  Award,
  Globe,
  CheckCircle2,
  Briefcase,
  Wallet,
  AlertTriangle,
  Eye,
  Download,
  MessageCircle,
  ArrowUpRight,
  Handshake,
  FastForward,
  Send,
  Archive,
  Copy,
  X,
  Clock,
  Loader,
  Play,
  ChevronRight,
  FolderOpen,
  Calendar,
  Video,
  Phone,
  BarChart3,
  ClipboardList,
  Loader2,
  Gauge,
} from "lucide-react";
import {
  AreaChart, Area, BarChart as RechartsBarChart, Bar as RechartsBar,
  PieChart as RechartsPie, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_TRIAGE_API_BASE || "https://api.referralsvc.com";
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

// Phase 63: Skeleton loader for loading states
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

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
        {segs.map((s) => (
          <circle
            key={s.label}
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
        {segs.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
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
    <motion.div variants={fadeUp} className="relative overflow-hidden rounded-lg bg-slate-950 border border-slate-700 p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
          <div className={`mt-1 text-2xl font-bold font-mono ${iconColor}`}>{value}</div>
          {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
        </div>
        {Icon && <Icon size={18} className={`${iconColor} shrink-0 opacity-50`} />}
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
    <motion.div variants={fadeUp} className="relative overflow-hidden rounded-lg bg-slate-950 border border-slate-700 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`}
            />
            <span className={`text-lg font-bold ${ok ? "text-emerald-400" : "text-red-400"}`}>
              {ok ? yesLabel : noLabel}
            </span>
          </div>
        </div>
        {Icon && <Icon size={18} className={`${ok ? "text-emerald-400" : "text-red-400"} shrink-0 opacity-50`} />}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function Section({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4 mt-8 flex items-center gap-3 first:mt-0">
      {Icon && <Icon size={18} className="text-slate-500" />}
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wide">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

// ===========================================================================
// Internal Tab System
// ===========================================================================

const ceoTabs = [
  { id: "dashboard", label: "Dashboard", icon: Activity, color: "emerald" },
  { id: "tofu-radar", label: "ToFu Radar", icon: Target, color: "purple" },
  { id: "sp-recruitment", label: "SP Recruitment", icon: Award, color: "sky" },
  { id: "briefings", label: "Escalation Briefings", icon: Radio, color: "cyan" },
  { id: "recruiting", label: "Recruitment Ops", icon: Users, color: "violet" },
  { id: "disbursements", label: "Disbursements", icon: Banknote, color: "amber" },
  { id: "sp-onboarding", label: "SP Onboarding", icon: UserPlus, color: "teal" },
  { id: "revenue-salvage", label: "Revenue Salvage", icon: Flame, color: "red" },
  { id: "secops", label: "SecOps Ledger", icon: ShieldAlert, color: "rose" },
  { id: "compliance", label: "Compliance", icon: Lock, color: "indigo" },
  { id: "delegation", label: "SP Teams", icon: Users, color: "cyan" },
  { id: "seo-approvals", label: "SEO Agent", icon: PenTool, color: "emerald" },
  { id: "fleet-apps", label: "Fleet Apps", icon: ClipboardList, color: "lime" },
  { id: "agent-observability", label: "Control Room", icon: Activity, color: "cyan" },
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
  purple: {
    active: "border-purple-400 text-purple-400 bg-purple-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-purple-400",
  },
  sky: {
    active: "border-sky-400 text-sky-400 bg-sky-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-sky-400",
  },
  lime: {
    active: "border-lime-400 text-lime-400 bg-lime-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-lime-400",
  },
};

// ===========================================================================
// Fleet Applications Content (Phase 67)
// ===========================================================================

function FleetAppsContent() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // app ID being acted on
  const [rejectNotes, setRejectNotes] = useState({});

  const fetchApps = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/partners/applications`, {
        headers: { "x-api-key": getAuthToken() || "" },
      });
      const data = await res.json();
      if (data.ok) setApps(data.applications || []);
    } catch (err) {
      console.error("[FLEET] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/partners/approve/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": getAuthToken() || "" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchApps();
      } else {
        alert(data.error || "Failed to approve");
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/partners/reject/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": getAuthToken() || "" },
        body: JSON.stringify({ admin_notes: rejectNotes[id] || "" }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchApps();
      } else {
        alert(data.error || "Failed to reject");
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      rejected: "bg-red-500/10 text-red-400 border-red-500/30",
    };
    return (
      <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${map[status] || "bg-slate-500/10 text-slate-400 border-slate-500/30"}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-lime-400" />
      </div>
    );
  }

  const pending = apps.filter((a) => a.status === "pending");
  const processed = apps.filter((a) => a.status !== "pending");

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Fleet Partner Applications</h2>
          <p className="text-sm text-white/40">
            {pending.length} pending &middot; {apps.length} total
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchApps(); }}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 hover:bg-white/10 transition"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-lg bg-slate-950 border border-slate-700 p-12 text-center">
          <ClipboardList size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">No applications yet.</p>
          <p className="text-xs text-white/20 mt-1">
            Applications from /recruit will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pending first, then processed */}
          {[...pending, ...processed].map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-slate-950 border border-slate-700 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Left: Applicant info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold truncate">{app.full_name}</h3>
                    {statusBadge(app.status)}
                  </div>
                  <p className="text-xs text-white/50 truncate">{app.email}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/30">
                    {app.company && <span>{app.company}</span>}
                    {app.phone && <span>{app.phone}</span>}
                    {app.linkedin_url && (
                      <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1 text-primary hover:text-primary/80 transition">
                        <Linkedin size={11} /> LinkedIn
                      </a>
                    )}
                    <span>{new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                  {app.experience_summary && (
                    <p className="mt-2 text-xs text-white/40 line-clamp-2">{app.experience_summary}</p>
                  )}
                  {app.admin_notes && (
                    <p className="mt-1 text-xs text-white/30 italic">Notes: {app.admin_notes}</p>
                  )}
                </div>

                {/* Right: Actions (pending only) */}
                {app.status === "pending" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(app.id)}
                      disabled={actionLoading === app.id}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300
                                 hover:bg-emerald-500/30 transition disabled:opacity-50"
                    >
                      {actionLoading === app.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(app.id)}
                      disabled={actionLoading === app.id}
                      className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300
                                 hover:bg-red-500/30 transition disabled:opacity-50"
                    >
                      {actionLoading === app.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [globalRollup, setGlobalRollup] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [dbcAnalytics, setDbcAnalytics] = useState(null);
  const [dbcLeads, setDbcLeads] = useState(null);
  const [leadActionLoading, setLeadActionLoading] = useState({});
  const [dealModal, setDealModal] = useState(null);
  const [dealPaymentType, setDealPaymentType] = useState("checkout");
  const [projects, setProjects] = useState(null);
  const [projectModal, setProjectModal] = useState(null);
  const [kanbanModal, setKanbanModal] = useState(null);
  const [kanbanTasks, setKanbanTasks] = useState([]);
  const [showPlanInKanban, setShowPlanInKanban] = useState(false);
  const [showAssetsInKanban, setShowAssetsInKanban] = useState(false);
  const [kanbanAssets, setKanbanAssets] = useState([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [prospects, setProspects] = useState([]);
  const [prospectDomain, setProspectDomain] = useState("");
  const [prospectLoading, setProspectLoading] = useState(false);
  const [prospectSendTo, setProspectSendTo] = useState({});
  const [prospectSendLoading, setProspectSendLoading] = useState({});
  const [meetings, setMeetings] = useState(null);
  const [meetingBrief, setMeetingBrief] = useState(null);
  const [voiceLogs, setVoiceLogs] = useState(null);
  const [outboundTab, setOutboundTab] = useState("email");
  const [linkedinProspects, setLinkedinProspects] = useState([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [chartData, setChartData] = useState({ funnel: [], revenue: [], topPartners: [] });
  const [chartsLoaded, setChartsLoaded] = useState(false);
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
      const res = await fetch(FINOPS_URL, {
        headers: {
          "Content-Type": "application/json",
          ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error(`API Route Offline — expected JSON but received ${ct || "unknown content-type"}`);
      }
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
      const res = await fetch(
        `${API_BASE}/api/finops/compression-roi`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
          },
        }
      );
      if (!res.ok) return;
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) return;
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

  const fetchGlobal = async () => {
    try {
      const data = await fetchGlobalAnalytics();
      if (data.ok) setGlobalRollup(data);
    } catch {
      // Silent — rollup is additive
    }
  };

  const fetchDBC = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/analytics/dbc`, {
        headers: {
          "Content-Type": "application/json",
          ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}),
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setDbcAnalytics(data);
    } catch {
      // Silent — DBC analytics is additive
    }
  };

  const fetchDBCLeads = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/analytics/dbc/leads`, {
        headers: {
          "Content-Type": "application/json",
          ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}),
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setDbcLeads(data);
    } catch {
      // Silent — DBC leads is additive
    }
  };

  // Phase 50: AI Project Manager — fetch projects
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/projects`, {
        headers: {
          "Content-Type": "application/json",
          ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}),
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      // Silent — projects is additive
    }
  };

  // Phase 43: God View — Lead action handler (archive, force_drip, draft_reply)
  const handleLeadAction = async (leadId, action) => {
    setLeadActionLoading((prev) => ({ ...prev, [leadId]: action }));
    try {
      // Phase 45/63: generate_deal goes to a different endpoint
      if (action === "generate_deal") {
        const payload = { leadId, paymentType: dealPaymentType };
        if (dealPaymentType === "invoice") payload.amountCents = 50000;
        const res = await fetch(`${API_BASE}/api/v1/deals/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}),
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.ok && data.url) {
          const lead = dbcLeads?.find((l) => l.id === leadId);
          setDealModal({
            url: data.url,
            leadName: lead?.visitor_name || "Prospect",
            paymentType: data.paymentType || "checkout",
            invoiceUrl: data.invoiceUrl || null,
          });
        }
        return;
      }
      const res = await fetch(`${API_BASE}/api/v1/leads/${leadId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}),
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.ok) {
        if (action === "draft_reply" && data.draft) {
          const mailto = `mailto:${encodeURIComponent(data.draft.to)}?subject=${encodeURIComponent(data.draft.subject)}&body=${encodeURIComponent(data.draft.body)}`;
          window.open(mailto, "_blank");
        }
        fetchDBCLeads();
      }
    } catch (err) {
      console.error("Lead action failed:", err);
    } finally {
      setLeadActionLoading((prev) => ({ ...prev, [leadId]: null }));
    }
  };

  const handleRunSimulation = async () => {
    setSimLoading(true);
    setSimResult(null);
    try {
      const result = await runMatrixSimulation();
      setSimResult(result);
      // Auto-refresh all dashboard data after seed completes
      fetchMetrics();
      fetchCompression();
      fetchAnalytics();
      fetchGlobal();
      fetchDBC();
      fetchDBCLeads();
      fetchProjects();
    } catch (err) {
      setSimResult({ ok: false, error: err.message });
    } finally {
      setSimLoading(false);
    }
  };

  // ── Phase 57: Outbound Prospecting Engine ──
  const fetchProspects = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/outbound/prospects`, {
        headers: { "Content-Type": "application/json", ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        setProspects(data.prospects || []);
      }
    } catch { /* silent */ }
  };

  // ── Phase 59: Fetch upcoming meetings ──
  const fetchMeetings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/meetings/upcoming`, {
        headers: { "Content-Type": "application/json", ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      }
    } catch { /* silent */ }
  };

  // ── Phase 60: Fetch voice call logs ──
  const fetchVoiceLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/voice/logs`, {
        headers: { "Content-Type": "application/json", ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        setVoiceLogs(data.logs || []);
      }
    } catch { /* silent */ }
  };

  // ── Phase 61: Fetch LinkedIn prospects ──
  const fetchLinkedinProspects = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/outbound/linkedin`, {
        headers: { "Content-Type": "application/json", ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        setLinkedinProspects(data.prospects || []);
      }
    } catch { /* silent */ }
  };

  // ── Phase 62: Fetch charts data ──
  const fetchCharts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/analytics/charts`, {
        headers: { "Content-Type": "application/json", ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        setChartData(data);
        setChartsLoaded(true);
      }
    } catch { /* silent */ }
  };

  const generateLinkedinDM = async () => {
    if (!linkedinUrl.trim()) return;
    setLinkedinLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/outbound/linkedin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}) },
        body: JSON.stringify({ linkedin_url: linkedinUrl.trim() }),
      });
      if (res.ok) {
        setLinkedinUrl("");
        await fetchLinkedinProspects();
      }
    } catch { /* silent */ }
    setLinkedinLoading(false);
  };

  const generateProspect = async () => {
    if (!prospectDomain.trim()) return;
    setProspectLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/outbound/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}) },
        body: JSON.stringify({ domain: prospectDomain.trim() }),
      });
      if (res.ok) {
        setProspectDomain("");
        await fetchProspects();
      }
    } catch { /* silent */ }
    setProspectLoading(false);
  };

  const sendProspect = async (id) => {
    const to = (prospectSendTo[id] || "").trim();
    if (!to || !to.includes("@")) return;
    setProspectSendLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch(`${API_BASE}/api/v1/outbound/send/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}) },
        body: JSON.stringify({ to }),
      });
      await fetchProspects();
    } catch { /* silent */ }
    setProspectSendLoading((prev) => ({ ...prev, [id]: false }));
  };

  useEffect(() => {
    fetchMetrics();
    fetchCompression();
    fetchAnalytics();
    fetchGlobal();
    fetchDBC();
    fetchDBCLeads();
    fetchProjects();
    fetchProspects();
    fetchMeetings();
    fetchVoiceLogs();
    fetchLinkedinProspects();
    fetchCharts();
    const id = setInterval(fetchMetrics, POLL_INTERVAL);
    const id2 = setInterval(fetchCompression, POLL_INTERVAL);
    const id3 = setInterval(fetchAnalytics, POLL_INTERVAL);
    const id4 = setInterval(fetchGlobal, POLL_INTERVAL);
    const id5 = setInterval(fetchDBC, POLL_INTERVAL);
    const id6 = setInterval(fetchDBCLeads, POLL_INTERVAL);
    const id7 = setInterval(fetchProjects, POLL_INTERVAL);
    const id8 = setInterval(fetchProspects, POLL_INTERVAL);
    const id9 = setInterval(fetchMeetings, POLL_INTERVAL);
    const id10 = setInterval(fetchVoiceLogs, POLL_INTERVAL);
    const id11 = setInterval(fetchLinkedinProspects, POLL_INTERVAL);
    const id12 = setInterval(fetchCharts, POLL_INTERVAL);
    return () => { clearInterval(id); clearInterval(id2); clearInterval(id3); clearInterval(id4); clearInterval(id5); clearInterval(id6); clearInterval(id7); clearInterval(id8); clearInterval(id9); clearInterval(id10); clearInterval(id11); clearInterval(id12); };
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

  // ── Phase 15: Prompt-level routing observability ──
  const livePrefillDefended = roi.prefillTokensDefended24h ?? 0;
  const liveRoutingEdge = roi.routingRatioEdge24h ?? edgeRatio;
  const liveRoutingPremium = roi.routingRatioPremium24h ?? (sr.hardwareArbitrage?.nvidia_h100 ?? 0);
  const routingTargetMet = liveRoutingEdge >= 0.8;

  return (
    <div className="min-h-screen">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      {/* ── Internal Tab Bar (replaces CEONav) ── */}
      <div className="sticky top-0 z-50 bg-[#0b0e18] border-b border-slate-700">
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
      {activeTab === "tofu-radar" && <TofuRadarContent />}
      {activeTab === "sp-recruitment" && <SPRecruitmentContent />}
      {activeTab === "briefings" && <Briefings />}
      {activeTab === "recruiting" && <RecruitmentOps />}
      {activeTab === "disbursements" && <DisbursementsContent />}
      {activeTab === "sp-onboarding" && <SPOnboardingContent />}
      {activeTab === "revenue-salvage" && <RevenueSalvageContent />}
      {activeTab === "secops" && <SecOpsLedgerContent />}
      {activeTab === "compliance" && <ComplianceDashboardContent />}
      {activeTab === "delegation" && <TeamDelegationContent />}
      {activeTab === "seo-approvals" && <SEOApprovalContent />}
      {activeTab === "fleet-apps" && <FleetAppsContent />}
      {activeTab === "agent-observability" && <AgentObservability />}

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

            {/* Matrix simulation button */}
            <button
              onClick={handleRunSimulation}
              disabled={simLoading}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                simLoading
                  ? "border-purple-500/30 bg-purple-500/10 text-purple-400 cursor-wait"
                  : "border-purple-500/20 bg-purple-500/5 text-purple-300 hover:bg-purple-500/15 hover:text-purple-200"
              }`}
              title="Seed 50 AI-scored leads + 15 closed deals into CRM"
            >
              {simLoading ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <Zap size={12} />
                  Matrix Sim
                </>
              )}
            </button>

            {/* refresh + timestamp */}
            <button
              onClick={() => { fetchMetrics(); fetchCompression(); fetchAnalytics(); fetchGlobal(); fetchDBC(); fetchDBCLeads(); fetchProjects(); fetchProspects(); fetchMeetings(); fetchVoiceLogs(); fetchLinkedinProspects(); fetchCharts(); }}
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

        {/* Matrix simulation result toast */}
        {simResult && (
          <div className={`mb-4 rounded-xl border px-4 py-2 text-sm ${
            simResult.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}>
            {simResult.ok
              ? `Matrix Simulation complete: ${simResult.leadsInserted} leads scored, ${simResult.dealsCreated} deals closed ($${((simResult.totalSimulatedTcv ?? 0) / 1000).toFixed(0)}K TCV) in ${((simResult.durationMs ?? 0) / 1000).toFixed(1)}s`
              : `Simulation failed: ${simResult.error}`
            }
          </div>
        )}

        {/* ================================================================ */}
        {/* PHASE 26: Global Analytics Rollup — CEO God View                */}
        {/* ================================================================ */}
        <Section
          icon={Globe}
          title="Global Analytics Rollup"
          subtitle="End-to-end venture studio performance — Phases 19-25"
        />

        {/* Top Row: 4 Massive KPI Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Total GMV Collected */}
          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-lg bg-slate-950 border border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign size={20} className="text-emerald-400" />
              </div>
              <div className="text-xs text-white/40">Total GMV Collected</div>
            </div>
            <div className="text-3xl font-black text-emerald-400">
              ${((globalRollup?.financials?.totalGmvCollected ?? 0) / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-white/20 mt-1">
              {globalRollup?.financials?.paidCount ?? 0} paid deals
            </div>
          </motion.div>

          {/* Blended Gross Margin */}
          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-lg bg-slate-950 border border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                (globalRollup?.financials?.blendedGrossMargin ?? 0) >= 0.80
                  ? "bg-emerald-500/10" : "bg-red-500/10"
              }`}>
                {(globalRollup?.financials?.blendedGrossMargin ?? 0) >= 0.80
                  ? <CheckCircle2 size={20} className="text-emerald-400" />
                  : <AlertTriangle size={20} className="text-red-400" />
                }
              </div>
              <div className="text-xs text-white/40">Blended Gross Margin</div>
            </div>
            <div className={`text-3xl font-black ${
              (globalRollup?.financials?.blendedGrossMargin ?? 0) >= 0.80
                ? "text-emerald-400"
                : (globalRollup?.financials?.blendedGrossMargin ?? 0) >= 0.75
                  ? "text-amber-400"
                  : "text-red-400"
            }`}>
              {((globalRollup?.financials?.blendedGrossMargin ?? 0) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-white/20 mt-1">
              Target: &ge; 80% · {(globalRollup?.financials?.flaggedCount ?? 0) > 0
                ? `${globalRollup.financials.flaggedCount} flagged`
                : "All healthy"}
            </div>
          </motion.div>

          {/* Active Pipeline TCV */}
          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-lg bg-slate-950 border border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-cyan-400" />
              </div>
              <div className="text-xs text-white/40">Active Pipeline TCV</div>
            </div>
            <div className="text-3xl font-black text-cyan-400">
              ${((globalRollup?.pipeline?.activePipelineTcv ?? 0) / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-white/20 mt-1">
              {globalRollup?.pipeline?.activeLeadCount ?? 0} active leads
            </div>
          </motion.div>

          {/* Studio Net Revenue */}
          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-lg bg-slate-950 border border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Wallet size={20} className="text-violet-400" />
              </div>
              <div className="text-xs text-white/40">Studio Net Revenue</div>
            </div>
            <div className="text-3xl font-black text-violet-400">
              ${((globalRollup?.financials?.totalStudioNetRevenue ?? 0) / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-white/20 mt-1">
              After partner payouts &amp; AI COGS
            </div>
          </motion.div>
        </motion.div>

        {/* Middle Row: Network Health */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Card
            label="Active Partners"
            value={fmt(globalRollup?.partnerNetwork?.activePartners)}
            sub={`${globalRollup?.partnerNetwork?.pendingApprovals ?? 0} pending approval`}
            icon={Users}
            iconColor="text-sky-400"
          />
          <Card
            label="Total Leads"
            value={fmt(globalRollup?.pipeline?.totalLeads)}
            sub={`${globalRollup?.pipeline?.intakeLeads ?? 0} from webhook intake`}
            icon={Target}
            iconColor="text-primary"
          />
          <Card
            label="Deal Rooms"
            value={fmt(globalRollup?.dealRooms?.total)}
            sub={`${globalRollup?.dealRooms?.signed ?? 0} signed · ${globalRollup?.dealRooms?.pending ?? 0} pending`}
            icon={Briefcase}
            iconColor="text-violet-400"
          />
          <Card
            label="Closed Won (30d)"
            value={fmt(globalRollup?.pipeline?.recentClosedWon)}
            sub={`$${((globalRollup?.pipeline?.recentClosedArr ?? 0) / 1000).toFixed(0)}K ARR`}
            icon={Award}
            iconColor="text-emerald-400"
          />
        </motion.div>

        {/* Bottom Row: System Status */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-13"
        >
          {Object.entries(globalRollup?.systemStatus ?? {
            tofuRadar: 'ONLINE',
            finopsLedger: 'ONLINE',
            escalationProtocol: 'ONLINE',
            dealRoom: 'ONLINE',
            tofuIntake: 'ONLINE',
            partnerPortal: 'ONLINE',
            dripEngine: 'ONLINE',
            slackCommandCenter: 'ONLINE',
            dispatchEngine: 'ONLINE',
            stripeWebhook: 'ONLINE',
            kickoffEngine: 'ONLINE',
            autonomousTreasury: 'ONLINE',
            escrowEngine: 'ONLINE',
          }).map(([key, status]) => {
            const labels = {
              tofuRadar: "ToFu Radar",
              finopsLedger: "FinOps Ledger",
              escalationProtocol: "Escalation Protocol",
              dealRoom: "Deal Room",
              tofuIntake: "ToFu Intake",
              partnerPortal: "Partner Portal",
              dripEngine: "Drip Engine",
              slackCommandCenter: "Slack Pulse",
              dispatchEngine: "Resend API",
              stripeWebhook: "Stripe Checkout",
              kickoffEngine: "Kickoff Engine",
              autonomousTreasury: "Auto Treasury",
              escrowEngine: "Escrow Engine",
            };
            const isOnline = status === 'ONLINE';
            return (
              <motion.div
                key={key}
                variants={fadeUp}
                className="rounded-md bg-slate-900 border border-slate-700/50 p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    isOnline ? "bg-emerald-400 shadow-lg shadow-emerald-400/30" : "bg-red-400"
                  }`} />
                  <span className={`text-xs font-bold ${isOnline ? "text-emerald-400" : "text-red-400"}`}>
                    {status}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 leading-tight">{labels[key] ?? key}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ================================================================ */}
        {/* Phase 62: Analytics Command Center — Recharts Visualizations     */}
        {/* ================================================================ */}
        <Section
          icon={BarChart3}
          title="Analytics Command Center"
          subtitle="Business Intelligence — Revenue, Pipeline & Partners"
        />

        {!chartsLoaded ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[320px]" />
            <Skeleton className="h-[320px]" />
            <Skeleton className="h-[320px]" />
          </div>
        ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* ── Chart 1: Revenue Trend (AreaChart) ── */}
          <motion.div variants={fadeUp} className="rounded-lg bg-slate-950 border border-slate-700 p-5">
            <p className="text-xs font-bold text-white/60 mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-400" />
              Revenue Trend
            </p>
            {chartData.revenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData.revenue} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <RechartsTooltip
                    contentStyle={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px" }}
                    labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                    formatter={(val) => [`$${val.toLocaleString()}`, undefined]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                  <Area type="monotone" dataKey="commissions" stroke="#8b5cf6" strokeWidth={2} fill="url(#commGrad)" name="Commissions" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-white/20 text-xs">No revenue data yet</div>
            )}
          </motion.div>

          {/* ── Chart 2: Pipeline Funnel (PieChart) ── */}
          <motion.div variants={fadeUp} className="rounded-lg bg-slate-950 border border-slate-700 p-5">
            <p className="text-xs font-bold text-white/60 mb-3 flex items-center gap-2">
              <PieChart size={14} className="text-blue-400" />
              Pipeline Funnel
            </p>
            {chartData.funnel.some(f => f.value > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <RechartsPie>
                  <Pie
                    data={chartData.funnel}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  >
                    {chartData.funnel.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#6b7280"][i % 5]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}
                    iconType="circle"
                    iconSize={8}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-white/20 text-xs">No pipeline data yet</div>
            )}
          </motion.div>

          {/* ── Chart 3: Top Partners (BarChart) ── */}
          <motion.div variants={fadeUp} className="rounded-lg bg-slate-950 border border-slate-700 p-5">
            <p className="text-xs font-bold text-white/60 mb-3 flex items-center gap-2">
              <Handshake size={14} className="text-violet-400" />
              Top Partners
            </p>
            {chartData.topPartners.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <RechartsBarChart data={chartData.topPartners} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                  <RechartsTooltip
                    contentStyle={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px" }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <RechartsBar dataKey="revenue" fill="#10b981" name="Revenue" radius={[0, 4, 4, 0]} barSize={18} />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-white/20 text-xs">No partner data yet</div>
            )}
          </motion.div>
        </motion.div>
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
            className="relative overflow-hidden rounded-lg bg-slate-950 border border-slate-700 p-4 sm:col-span-2"
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
          <motion.div variants={fadeUp} className="overflow-hidden rounded-lg bg-slate-950 border border-slate-700 p-5">
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
          <motion.div variants={fadeUp} className="overflow-hidden rounded-lg bg-slate-950 border border-slate-700 p-5 flex flex-col justify-between">
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
            {/* Phase 15: Prefill Tokens Defended */}
            {livePrefillDefended > 0 && (
              <div className="border-t border-white/5 pt-4">
                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Prefill Tokens Defended</p>
                <p className="text-2xl font-bold text-cyan-300">
                  {livePrefillDefended.toLocaleString()}
                </p>
                <p className="text-white/20 text-[10px] mt-0.5">via semantic tool filtering &amp; prompt-level routing</p>
              </div>
            )}
            <div className="mt-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <p className="text-violet-400 text-[10px] font-bold uppercase tracking-wider">
                5-Pass Engine &middot; {compressionData.compressionPasses} passes active
              </p>
            </div>
          </motion.div>

          {/* Defended Capital */}
          <motion.div variants={fadeUp} className="overflow-hidden rounded-lg bg-slate-950 border border-slate-700 p-5 flex flex-col justify-between">
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
          <motion.div variants={fadeUp} className="overflow-hidden rounded-lg bg-slate-950 border border-slate-700 p-5">
            <div className="mb-3 text-xs text-white/40">Model Offload Ratios</div>
            <DonutChart data={sr.offloadRatio ?? {}} />
          </motion.div>

          {/* Hardware arbitrage */}
          <motion.div variants={fadeUp} className="overflow-hidden rounded-lg bg-slate-950 border border-slate-700 p-5">
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

        {/* Phase 15: Live Routing Ratio (Edge vs Premium) */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {/* Reasoning-Based Routing Split */}
          <motion.div variants={fadeUp} className="overflow-hidden rounded-lg bg-slate-950 border border-slate-700 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-white/40">Live Routing Ratio (Phase 15)</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${routingTargetMet ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}
              >
                {routingTargetMet ? "≥80% Edge" : "Below Target"}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-white/60">Edge Tier (R &lt; 0.3)</span>
                  <span className="font-semibold text-emerald-400">{(liveRoutingEdge * 100).toFixed(1)}%</span>
                </div>
                <Bar value={liveRoutingEdge} max={1} color="from-emerald-400 to-emerald-600" threshold={0.8} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-white/60">Premium Tier (R &ge; 0.3)</span>
                  <span className="font-semibold text-violet-400">{(liveRoutingPremium * 100).toFixed(1)}%</span>
                </div>
                <Bar value={liveRoutingPremium} max={1} color="from-violet-400 to-violet-600" />
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-white/5 p-3">
              <p className="text-[10px] text-white/40">
                Prompt-level reasoning classifier (evaluateReasoningRequirement) routes R &lt; 0.3 to Llama 3.1 8B edge
                and R &ge; 0.3 to Z.AI GLM-5 (Premium Open-Weights) via SiliconFlow. Target: &ge; 80% edge routing for margin protection.
              </p>
            </div>
          </motion.div>

          {/* Prefill Defense Summary */}
          <motion.div variants={fadeUp} className="overflow-hidden rounded-lg bg-slate-950 border border-slate-700 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-white/40">Prefill Token Defense</span>
              <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-400">
                Governor Active
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-6">
              <p className="text-5xl font-bold text-cyan-300">
                {livePrefillDefended.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-white/40">tokens defended (24h)</p>
              <p className="mt-1 text-xs text-white/20">
                ${((livePrefillDefended / 1_000_000) * 0.645).toFixed(4)} saved at blended rate
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Semantic Tool Filtering</span>
                <span className="text-cyan-400">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">P3 Token Compression</span>
                <span className="text-emerald-400">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Execution Governor</span>
                <span className="text-emerald-400">Active</span>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3">
              <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                Phase 15 Governor &middot; 3 defense layers
              </p>
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
          className="mt-4 rounded-lg bg-slate-950 border border-slate-700 p-5"
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
                className="rounded-lg bg-slate-950 border border-slate-700 p-4"
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

        {/* ================================================================ */}
        {/* MODULE 6: DBC Performance (Phase 38)                          */}
        {/* ================================================================ */}
        <Section
          icon={Eye}
          title="DBC Performance"
          subtitle="Digital Business Card telemetry &middot; Views, saves, AI chats"
        />

        {dbcAnalytics ? (
          <>
            {/* Panel 1: KPI Cards */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="grid grid-cols-2 gap-4 lg:grid-cols-4"
            >
              <Card
                label="Card Views"
                value={fmt(dbcAnalytics.totalViews)}
                sub="All-time profile impressions"
                icon={Eye}
                iconColor="text-primary"
              />
              <Card
                label="Contact Saves"
                value={fmt(dbcAnalytics.totalDownloads)}
                sub="vCard downloads"
                icon={Download}
                iconColor="text-emerald-400"
              />
              <Card
                label="AI Conversations"
                value={fmt(dbcAnalytics.totalChats)}
                sub="Chat interactions"
                icon={MessageCircle}
                iconColor="text-accent"
              />
              <Card
                label="Conversion Rate"
                value={`${dbcAnalytics.conversionRate ?? 0}%`}
                sub="Views → Contact Saves"
                icon={ArrowUpRight}
                iconColor={
                  dbcAnalytics.conversionRate >= 10
                    ? "text-emerald-400"
                    : dbcAnalytics.conversionRate >= 5
                    ? "text-amber-400"
                    : "text-red-400"
                }
              />
            </motion.div>

            {/* Panel 2: 7-Day Activity Chart */}
            {dbcAnalytics.daily?.length > 0 && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="rounded-lg bg-slate-950 border border-slate-700 p-5 mt-4"
              >
                <h3 className="text-sm font-bold text-white/70 mb-4">Last 7 Days</h3>
                <div className="flex items-end gap-1 h-24">
                  {(() => {
                    // Build 7-day view counts
                    const days = [];
                    for (let i = 6; i >= 0; i--) {
                      const d = new Date();
                      d.setDate(d.getDate() - i);
                      const key = d.toISOString().split("T")[0];
                      const views = dbcAnalytics.daily.filter(
                        (r) => r.date === key && r.event_type === "view"
                      ).reduce((s, r) => s + r.count, 0);
                      const downloads = dbcAnalytics.daily.filter(
                        (r) => r.date === key && r.event_type === "vcard_download"
                      ).reduce((s, r) => s + r.count, 0);
                      days.push({ key, views, downloads, label: d.toLocaleDateString("en-US", { weekday: "short" }) });
                    }
                    const maxVal = Math.max(1, ...days.map((d) => d.views));
                    return days.map((day) => (
                      <div key={day.key} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col items-center gap-0.5" style={{ height: "80px" }}>
                          <div
                            className="w-full rounded-t bg-gradient-to-t from-primary/80 to-primary/40 transition-all duration-300"
                            style={{ height: `${(day.views / maxVal) * 100}%`, minHeight: day.views > 0 ? "4px" : "0" }}
                            title={`${day.views} views`}
                          />
                          {day.downloads > 0 && (
                            <div
                              className="w-full rounded bg-emerald-400/60"
                              style={{ height: `${(day.downloads / maxVal) * 100}%`, minHeight: "3px" }}
                              title={`${day.downloads} saves`}
                            />
                          )}
                        </div>
                        <span className="text-[9px] text-white/30">{day.label}</span>
                      </div>
                    ));
                  })()}
                </div>
                <div className="flex items-center gap-4 mt-3 text-[10px] text-white/40">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-primary/70" /> Views
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-emerald-400/60" /> Saves
                  </span>
                </div>
              </motion.div>
            )}

            {/* Panel 3: Top Referrers */}
            {dbcAnalytics.topReferrers?.length > 0 && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="rounded-lg bg-slate-950 border border-slate-700 p-5 mt-4"
              >
                <h3 className="text-sm font-bold text-white/70 mb-3">Top Referrers</h3>
                <div className="space-y-2">
                  {dbcAnalytics.topReferrers.slice(0, 5).map((ref) => {
                    const maxRef = dbcAnalytics.topReferrers[0]?.count || 1;
                    return (
                      <div key={ref.source} className="flex items-center gap-3">
                        <span className="text-xs text-white/50 w-32 truncate">{ref.source}</span>
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                            style={{ width: `${(ref.count / maxRef) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-white/40">{ref.count}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Panel 4: DBC Leads Pipeline (Phase 39) */}
            {!dbcLeads && (
              <div className="rounded-lg bg-slate-950 border border-slate-700 p-5 mt-4">
                <Skeleton className="h-5 w-40 mb-4" />
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                </div>
                <Skeleton className="h-12 mb-2" />
                <Skeleton className="h-12 mb-2" />
                <Skeleton className="h-12 mb-2" />
                <Skeleton className="h-12" />
              </div>
            )}
            {dbcLeads && dbcLeads.totalLeads > 0 && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="rounded-lg bg-slate-950 border border-slate-700 p-5 mt-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white/70 flex items-center gap-2">
                    <Handshake size={14} className="text-primary" /> Lead Pipeline
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] text-white/40">
                    <span>{dbcLeads.totalLeads} total</span>
                    {dbcLeads.leads24h > 0 && (
                      <span className="text-emerald-400 font-medium">+{dbcLeads.leads24h} today</span>
                    )}
                    <div className="flex ml-2 rounded-lg overflow-hidden border border-white/10">
                      <button onClick={() => setDealPaymentType("checkout")}
                        className={`px-2 py-0.5 text-[9px] font-medium transition-colors ${dealPaymentType === "checkout" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-white/30 hover:text-white/50"}`}
                      >Checkout</button>
                      <button onClick={() => setDealPaymentType("invoice")}
                        className={`px-2 py-0.5 text-[9px] font-medium transition-colors ${dealPaymentType === "invoice" ? "bg-blue-500/20 text-blue-300" : "bg-white/5 text-white/30 hover:text-white/50"}`}
                      >Net-30</button>
                    </div>
                  </div>
                </div>

                {/* Lead summary KPIs */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-white/5 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-white">{dbcLeads.newLeads}</p>
                    <p className="text-[9px] text-white/40">New</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-amber-400">{Math.round(dbcLeads.avgBantScore || 0)}</p>
                    <p className="text-[9px] text-white/40">Avg BANT</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-emerald-400">{dbcLeads.convertedLeads}</p>
                    <p className="text-[9px] text-white/40">Converted</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-amber-400">${((dbcLeads.commissions?.pendingPayouts || 0) / 100).toFixed(2)}</p>
                    <p className="text-[9px] text-white/40">Pending $</p>
                    {(dbcLeads.commissions?.pendingPayouts || 0) > 0 && (
                      <button
                        disabled={payoutLoading}
                        onClick={async () => {
                          setPayoutLoading(true);
                          try {
                            const partners = dbcLeads.commissions?.pendingPartners || [];
                            for (const p of partners) {
                              await fetch(`${API_BASE}/api/v1/finops/payout/${p.partner_slug}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json", ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}) },
                              });
                            }
                            await fetchDBCLeads();
                          } catch { /* silent */ }
                          setPayoutLoading(false);
                        }}
                        className="mt-1.5 text-[10px] px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                      >
                        {payoutLoading ? "Processing..." : "💸 Disburse"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Partner Links (Phase 56) */}
                {dbcLeads.partners?.length > 0 && (
                  <div className="mb-4 space-y-1.5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Partners</p>
                    {dbcLeads.partners.map((p) => (
                      <div key={p.slug} className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-2">
                        <span className="text-xs text-white/60">{p.full_name || p.slug}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(`https://referralsvc.com/partner/${p.slug}/dashboard`)}
                          className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors flex items-center gap-1"
                        >
                          <Copy size={10} /> Copy Link
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Outbound Prospecting Engine (Phase 57 + 61) */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Outbound Prospecting</p>
                    <div className="flex ml-auto">
                      <button onClick={() => setOutboundTab("email")}
                        className={`text-[9px] px-2 py-0.5 rounded-l-md border border-white/10 transition-colors ${outboundTab === "email" ? "bg-violet-500/20 text-violet-300 border-violet-500/30" : "bg-white/5 text-white/30 hover:text-white/50"}`}>
                        <Mail size={9} className="inline mr-1" />Cold Email
                      </button>
                      <button onClick={() => setOutboundTab("linkedin")}
                        className={`text-[9px] px-2 py-0.5 rounded-r-md border border-white/10 border-l-0 transition-colors ${outboundTab === "linkedin" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-white/5 text-white/30 hover:text-white/50"}`}>
                        <Linkedin size={9} className="inline mr-1" />LinkedIn
                      </button>
                    </div>
                  </div>

                  {/* ── Cold Email Tab ── */}
                  {outboundTab === "email" && (
                    <>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={prospectDomain}
                          onChange={(e) => setProspectDomain(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && generateProspect()}
                          placeholder="Enter domain (e.g. acme.io)"
                          className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                        />
                        <button
                          onClick={generateProspect}
                          disabled={prospectLoading || !prospectDomain.trim()}
                          className="text-[10px] px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors flex items-center gap-1 disabled:opacity-30"
                        >
                          {prospectLoading ? <Loader size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          {prospectLoading ? "Generating..." : "Generate AI Pitch"}
                        </button>
                      </div>
                      {prospects.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {prospects.map((p) => (
                            <div key={p.id} className="bg-white/3 rounded-lg p-2.5">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <Globe size={12} className="text-violet-400" />
                                  <span className="text-xs text-white/70 font-medium">{p.domain}</span>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                  p.replied ? "bg-emerald-500/20 text-emerald-300" :
                                  p.status === "failed" ? "bg-red-500/20 text-red-300" :
                                  p.sequence_step === 3 ? "bg-white/10 text-white/40" :
                                  p.sequence_step === 2 ? "bg-amber-500/20 text-amber-300" :
                                  p.sequence_step === 1 ? "bg-blue-500/20 text-blue-300" :
                                  p.status === "sent" ? "bg-blue-500/20 text-blue-300" :
                                  "bg-yellow-500/20 text-yellow-300"
                                }`}>{
                                  p.replied ? "Replied!" :
                                  p.status === "failed" ? "failed" :
                                  p.sequence_step === 3 ? "Complete" :
                                  p.sequence_step === 2 ? "Day 7 Pending" :
                                  p.sequence_step === 1 ? "Day 3 Pending" :
                                  p.status === "sent" ? "sent" :
                                  "draft"
                                }</span>
                              </div>
                              <p className="text-[10px] text-white/50 mb-1 truncate">Subject: {p.subject}</p>
                              {p.next_followup_at && !p.replied && (
                                <p className="text-[10px] text-white/30 mb-1">
                                  Next follow-up: {new Date(p.next_followup_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => navigator.clipboard.writeText(`Subject: ${p.subject}\n\n${(p.draft_html || "").replace(/<[^>]+>/g, "")}`)}
                                  className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors flex items-center gap-1"
                                >
                                  <Copy size={10} /> Copy
                                </button>
                                {p.status === "draft" && (
                                  <>
                                    <input
                                      type="email"
                                      value={prospectSendTo[p.id] || ""}
                                      onChange={(e) => setProspectSendTo((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                      placeholder="to@email.com"
                                      className="flex-1 text-[10px] bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                                    />
                                    <button
                                      onClick={() => sendProspect(p.id)}
                                      disabled={prospectSendLoading[p.id] || !(prospectSendTo[p.id] || "").includes("@")}
                                      className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors flex items-center gap-1 disabled:opacity-30"
                                    >
                                      {prospectSendLoading[p.id] ? <Loader size={10} className="animate-spin" /> : <Send size={10} />}
                                      Send
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* ── LinkedIn Tab (Phase 61) ── */}
                  {outboundTab === "linkedin" && (
                    <>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && generateLinkedinDM()}
                          placeholder="LinkedIn Profile URL (e.g. linkedin.com/in/johndoe)"
                          className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
                        />
                        <button
                          onClick={generateLinkedinDM}
                          disabled={linkedinLoading || !linkedinUrl.trim()}
                          className="text-[10px] px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors flex items-center gap-1 disabled:opacity-30"
                        >
                          {linkedinLoading ? <Loader size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          {linkedinLoading ? "Generating..." : "Generate AI DMs"}
                        </button>
                      </div>
                      {linkedinProspects.length > 0 && (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {linkedinProspects.map((lp) => (
                            <div key={lp.id} className="bg-white/3 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Linkedin size={12} className="text-blue-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <span className="text-xs text-white/70 font-medium block truncate">{lp.full_name || "Unknown"}</span>
                                    <span className="text-[10px] text-white/40 block truncate">{lp.headline || ""}</span>
                                  </div>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                  lp.status === "processing" ? "bg-amber-500/20 text-amber-300 animate-pulse" :
                                  lp.status === "failed" ? "bg-red-500/20 text-red-300" :
                                  lp.status === "sent" ? "bg-emerald-500/20 text-emerald-300" :
                                  lp.status === "archived" ? "bg-white/10 text-white/40" :
                                  "bg-blue-500/20 text-blue-300"
                                }`}>{lp.status === "processing" ? "Processing..." : lp.status}</span>
                              </div>

                              {/* Connection Note */}
                              <div className="mb-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] text-white/30 uppercase tracking-wider">Connection Note</span>
                                  <span className={`text-[9px] px-1 py-0.5 rounded ${
                                    (lp.connection_draft || "").length > 290 ? "bg-red-500/20 text-red-300" : "bg-white/5 text-white/30"
                                  }`}>{(lp.connection_draft || "").length}/300</span>
                                </div>
                                <p className="text-[10px] text-white/50 bg-white/[0.02] rounded p-2 leading-relaxed">{lp.connection_draft || "—"}</p>
                                <button
                                  onClick={() => navigator.clipboard.writeText(lp.connection_draft || "")}
                                  className="mt-1 text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors flex items-center gap-1"
                                >
                                  <Copy size={10} /> Copy Note
                                </button>
                              </div>

                              {/* Follow-up DM */}
                              <div>
                                <span className="text-[9px] text-white/30 uppercase tracking-wider block mb-1">Follow-up DM</span>
                                <p className="text-[10px] text-white/50 bg-white/[0.02] rounded p-2 leading-relaxed">{lp.dm_draft || "—"}</p>
                                <button
                                  onClick={() => navigator.clipboard.writeText(lp.dm_draft || "")}
                                  className="mt-1 text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors flex items-center gap-1"
                                >
                                  <Copy size={10} /> Copy DM
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Recent leads list */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(dbcLeads.leads || []).slice(0, 8).map((lead) => (
                    <div key={lead.id} className="flex items-center gap-3 bg-white/3 rounded-lg p-2.5">
                      <div className="flex-shrink-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{
                            background: lead.bant_score >= 60 ? "linear-gradient(135deg, #10b981, #059669)" :
                              lead.bant_score >= 30 ? "linear-gradient(135deg, #f59e0b, #d97706)" :
                              "linear-gradient(135deg, #6b7280, #4b5563)",
                          }}
                        >
                          {lead.bant_score ?? "—"}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{lead.visitor_name}</p>
                        <p className="text-[10px] text-white/40 truncate">{lead.visitor_email}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          lead.status === "nurturing" ? "bg-primary/20 text-primary" :
                          lead.status === "new" ? "bg-blue-500/20 text-blue-300" :
                          lead.status === "qualified" ? "bg-emerald-500/20 text-emerald-300" :
                          lead.status === "converted" ? "bg-primary/20 text-primary" :
                          "bg-white/10 text-white/40"
                        }`}>{lead.status}</span>
                        {lead.drip_stage >= 1 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary/80 flex items-center gap-0.5 mt-0.5 w-fit ml-auto">
                            <Mail size={8} /> Nurturing
                          </span>
                        )}
                        {lead.bant_summary && (
                          <p className="text-[9px] text-white/30 mt-0.5 max-w-[120px] truncate" title={lead.bant_summary}>
                            {lead.bant_summary}
                          </p>
                        )}
                      </div>
                      {/* Phase 43: God View Action Buttons */}
                      <div className="flex-shrink-0 flex items-center gap-1 ml-1">
                        <button
                          onClick={() => handleLeadAction(lead.id, "draft_reply")}
                          disabled={!!leadActionLoading[lead.id]}
                          className="p-1 rounded hover:bg-white/10 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-30"
                          title="AI Draft Reply"
                        >
                          {leadActionLoading[lead.id] === "draft_reply" ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Send size={12} />
                          )}
                        </button>
                        <button
                          onClick={() => handleLeadAction(lead.id, "force_drip")}
                          disabled={!!leadActionLoading[lead.id] || lead.drip_stage >= 3 || lead.status === "archived" || lead.status === "converted"}
                          className="p-1 rounded hover:bg-white/10 text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-30"
                          title={`Force Drip (Stage ${lead.drip_stage} → ${lead.drip_stage + 1})`}
                        >
                          {leadActionLoading[lead.id] === "force_drip" ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <FastForward size={12} />
                          )}
                        </button>
                        <button
                          onClick={() => handleLeadAction(lead.id, "archive")}
                          disabled={!!leadActionLoading[lead.id] || lead.status === "archived"}
                          className="p-1 rounded hover:bg-white/10 text-red-400 hover:text-red-300 transition-colors disabled:opacity-30"
                          title="Archive Lead"
                        >
                          {leadActionLoading[lead.id] === "archive" ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Archive size={12} />
                          )}
                        </button>
                        <button
                          onClick={() => handleLeadAction(lead.id, "generate_deal")}
                          disabled={!!leadActionLoading[lead.id] || lead.status === "archived"}
                          className="p-1 rounded hover:bg-white/10 text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-30"
                          title="Generate Deal Room"
                        >
                          {leadActionLoading[lead.id] === "generate_deal" ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Handshake size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-lg bg-slate-950 border border-slate-700 p-5 text-center">
            <Eye size={24} className="mx-auto text-white/20 mb-2" />
            <p className="text-sm text-white/30">DBC analytics loading...</p>
          </motion.div>
        )}

        {/* ── Phase 59: Upcoming Meetings (AI Meeting Prep) ── */}
        {meetings && meetings.length > 0 && (
          <>
            <Section icon={Calendar} title="Upcoming Meetings" subtitle="AI-prepared executive briefs" />
            <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {meetings.slice(0, 6).map((mtg) => {
                const startDate = new Date(mtg.start_time);
                const now = new Date();
                const hoursUntil = Math.round((startDate.getTime() - now.getTime()) / 3600000);
                const timeLabel = hoursUntil < 1
                  ? `in ${Math.max(1, Math.round((startDate.getTime() - now.getTime()) / 60000))}m`
                  : hoursUntil < 24
                    ? `in ${hoursUntil}h`
                    : startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                return (
                  <motion.div key={mtg.id} variants={fadeUp} className="rounded-lg bg-slate-950 border border-slate-700 p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{mtg.title}</p>
                        <p className="text-[11px] text-white/50 truncate mt-0.5">
                          {mtg.attendee_name ? `${mtg.attendee_name} — ` : ""}{mtg.attendee_email}
                        </p>
                      </div>
                      {mtg.meeting_link && (
                        <a href={mtg.meeting_link} target="_blank" rel="noopener noreferrer" className="ml-2 flex-shrink-0">
                          <Video size={16} className="text-cyan-400 hover:text-cyan-300 transition-colors" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-3 text-[10px] text-white/40">
                      <span className="flex items-center gap-1"><Clock size={12} /> {startDate.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                      <span>{mtg.duration_minutes}m</span>
                      <span className={`px-1.5 py-0.5 rounded-full ${
                        hoursUntil < 2 ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-white/50"
                      }`}>{timeLabel}</span>
                    </div>

                    {mtg.attendee_domain && (
                      <p className="text-[10px] text-white/30 mb-3 flex items-center gap-1">
                        <Globe size={10} /> {mtg.attendee_domain}
                      </p>
                    )}

                    {mtg.brief_html ? (
                      <button
                        onClick={() => setMeetingBrief(mtg)}
                        className="w-full text-xs px-3 py-2 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors flex items-center justify-center gap-1"
                      >
                        <FileText size={12} /> View Brief
                      </button>
                    ) : (
                      <div className="w-full text-xs px-3 py-2 rounded-lg bg-white/5 text-white/30 flex items-center justify-center gap-1">
                        <Loader size={10} className="animate-spin" /> Preparing brief...
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}

        {/* Phase 59: Meeting Brief Modal */}
        {meetingBrief && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setMeetingBrief(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg bg-slate-950 border border-slate-700 p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText size={18} className="text-violet-400" />
                    Meeting Brief
                  </h3>
                  <p className="text-xs text-white/40 mt-1">
                    {meetingBrief.title} — {meetingBrief.attendee_name || meetingBrief.attendee_email}
                  </p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {new Date(meetingBrief.start_time).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    {meetingBrief.duration_minutes ? ` — ${meetingBrief.duration_minutes}m` : ""}
                  </p>
                </div>
                <button onClick={() => setMeetingBrief(null)} className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
                  <X size={16} />
                </button>
              </div>

              {meetingBrief.brief_html && (
                <div
                  className="prose prose-invert prose-sm max-w-none text-white/70 [&_h3]:text-violet-400 [&_h3]:text-base [&_h4]:text-white/80 [&_h4]:text-sm [&_ul]:text-sm [&_p]:text-sm [&_li]:text-sm"
                  dangerouslySetInnerHTML={{ __html: meetingBrief.brief_html }}
                />
              )}

              <div className="flex justify-end gap-2 mt-6">
                {meetingBrief.meeting_link && (
                  <a
                    href={meetingBrief.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors text-sm flex items-center gap-1"
                  >
                    <Video size={14} /> Join Meeting
                  </a>
                )}
                <button
                  onClick={() => setMeetingBrief(null)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/15 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Phase 60: Recent Calls (Voice AI Receptionist) ── */}
        {voiceLogs && voiceLogs.length > 0 && (
          <>
            <Section icon={Phone} title="Recent Calls" subtitle="AI Voice Receptionist" />
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-lg bg-slate-950 border border-slate-700 p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-2 text-white/40 font-medium">Time</th>
                      <th className="text-left py-2 px-2 text-white/40 font-medium">Caller</th>
                      <th className="text-left py-2 px-2 text-white/40 font-medium">What They Said</th>
                      <th className="text-left py-2 px-2 text-white/40 font-medium">AI Response</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">Intent</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">SMS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voiceLogs.slice(0, 10).map((log) => (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-2 text-white/30 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </td>
                        <td className="py-2.5 px-2 text-white/60 font-mono whitespace-nowrap">
                          {log.caller_number || "Unknown"}
                        </td>
                        <td className="py-2.5 px-2 text-white/50 max-w-[200px] truncate" title={log.transcript || ""}>
                          {log.transcript || "—"}
                        </td>
                        <td className="py-2.5 px-2 text-white/50 max-w-[200px] truncate" title={log.ai_response || ""}>
                          {log.ai_response || "—"}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            log.intent === "high_intent"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-white/10 text-white/40"
                          }`}>
                            {log.intent === "high_intent" ? "High Intent" : "General"}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {log.sms_triggered ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center gap-0.5">
                              <Send size={8} /> Sent
                            </span>
                          ) : (
                            <span className="text-[9px] text-white/20">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}

        {/* ── Phase 50: Active Projects (AI Managed) ── */}
        {projects && projects.length > 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-lg bg-slate-950 border border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                <Briefcase size={16} className="text-violet-400" />
                Active Projects (AI Managed)
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-violet-500/20 text-violet-300">
                  {projects.length}
                </span>
              </h3>
            </div>
            <div className="space-y-2">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3 border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.client_name}</p>
                    <p className="text-xs text-white/40 truncate">{p.client_email || "No email"}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      p.status === "active" ? "bg-emerald-500/20 text-emerald-300" :
                      p.status === "completed" ? "bg-blue-500/20 text-blue-300" :
                      "bg-amber-500/20 text-amber-300"
                    }`}>
                      {p.status}
                    </span>
                    <span className="text-xs text-white/30">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={async () => {
                        setKanbanModal(p);
                        setShowPlanInKanban(false);
                        try {
                          const res = await fetch(`${API_BASE}/api/v1/projects/${p.id}/tasks`, {
                            headers: { "Content-Type": "application/json", ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}) },
                          });
                          if (res.ok) {
                            const d = await res.json();
                            setKanbanTasks(d.tasks || []);
                          }
                        } catch { /* silent */ }
                      }}
                      className="px-3 py-1 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors text-xs flex items-center gap-1"
                    >
                      <Briefcase size={12} /> Kanban
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(`https://referralsvc.com/portal/${p.deal_id}`)}
                      className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors text-xs flex items-center gap-1"
                      title="Copy Client Portal URL"
                    >
                      <Copy size={12} /> Portal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-12 pb-8 text-center text-xs text-white/20">
          Clawbot FinOps 2.0 &middot; Referral Service LLC &middot; Zero-Egress Edge Architecture
        </div>
      </div>
      ))}

      {/* Phase 45: Deal Room URL Modal */}
      {dealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg bg-slate-950 border border-slate-700 p-6 max-w-lg w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Handshake size={18} className="text-emerald-400" />
                Deal Room Ready
              </h3>
              <button
                onClick={() => setDealModal(null)}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-white/50 mb-2">
              AI-generated SOW for <span className="text-white font-medium">{dealModal.leadName}</span>
            </p>
            {dealModal.paymentType === "invoice" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-medium mb-3">
                <FileText size={10} /> Net-30 Invoice
              </span>
            )}
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={dealModal.url}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono truncate"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(dealModal.url);
                }}
                className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5 text-sm"
              >
                <Copy size={14} /> Copy
              </button>
            </div>
            {dealModal.invoiceUrl && (
              <div className="flex items-center gap-2 mt-3">
                <input
                  readOnly
                  value={dealModal.invoiceUrl}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono truncate"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(dealModal.invoiceUrl)}
                  className="px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors flex items-center gap-1.5 text-sm"
                >
                  <FileText size={14} /> Invoice
                </button>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => window.open(dealModal.url, "_blank")}
                className="px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-colors text-sm"
              >
                Preview
              </button>
              <button
                onClick={() => setDealModal(null)}
                className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors text-sm"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Phase 52: Kanban Execution Modal */}
      {kanbanModal && (() => {
        const todo = kanbanTasks.filter(t => t.status === "todo");
        const inProg = kanbanTasks.filter(t => t.status === "in_progress");
        const done = kanbanTasks.filter(t => t.status === "done");
        const total = kanbanTasks.length;
        const doneCount = done.length;

        const advanceTask = async (taskId, currentStatus) => {
          const next = currentStatus === "todo" ? "in_progress" : currentStatus === "in_progress" ? "done" : null;
          if (!next) return;
          // Optimistic update
          setKanbanTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: next } : t));
          try {
            await fetch(`${API_BASE}/api/v1/tasks/${taskId}/status`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", ...(getAuthToken() ? { "x-api-key": getAuthToken() } : {}) },
              body: JSON.stringify({ status: next }),
            });
          } catch { /* silent */ }
        };

        const TaskCard = ({ task }) => (
          <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-violet-500/20 text-violet-300 font-mono">
                P{task.phase}
              </span>
              <span className="text-xs font-medium text-white truncate">{task.title}</span>
            </div>
            <p className="text-[11px] text-white/40 line-clamp-2 mb-2">{task.description}</p>
            {task.status !== "done" && (
              <button
                onClick={() => advanceTask(task.id, task.status)}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
              >
                <ChevronRight size={10} />
                {task.status === "todo" ? "Start" : "Complete"}
              </button>
            )}
          </div>
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setKanbanModal(null); setKanbanTasks([]); setShowAssetsInKanban(false); setKanbanAssets([]); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg bg-slate-950 border border-slate-700 p-6 max-w-4xl w-full mx-4 max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-violet-400" />
                  Project Execution
                </h3>
                <button onClick={() => { setKanbanModal(null); setKanbanTasks([]); setShowAssetsInKanban(false); setKanbanAssets([]); }} className="text-white/30 hover:text-white/60 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-white/50">
                  <span className="text-white font-medium">{kanbanModal.client_name}</span>
                  {total > 0 && (
                    <span className="ml-2 text-xs text-emerald-300">{doneCount}/{total} complete</span>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      setShowAssetsInKanban(!showAssetsInKanban);
                      if (!showAssetsInKanban) {
                        setShowPlanInKanban(false);
                        try {
                          const res = await fetch(`${API_BASE}/api/v1/portal/${kanbanModal.deal_id}/assets`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
                          if (res.ok) { const d = await res.json(); setKanbanAssets(d.assets || []); }
                        } catch { /* silent */ }
                      }
                    }}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors flex items-center gap-1"
                  >
                    <FolderOpen size={12} />
                    {showAssetsInKanban ? "Hide Assets" : "Assets"}
                  </button>
                  <button
                    onClick={() => { setShowPlanInKanban(!showPlanInKanban); if (!showPlanInKanban) setShowAssetsInKanban(false); }}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors flex items-center gap-1"
                  >
                    <FileText size={12} />
                    {showPlanInKanban ? "Hide Plan" : "View Full Plan"}
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {total > 0 && (
                <div className="mb-4">
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${Math.round((doneCount / total) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Content Modes: Kanban / Assets / Plan */}
              {showAssetsInKanban ? (
                <div className="flex-1 overflow-y-auto">
                  {kanbanAssets.length === 0 ? (
                    <div className="text-center py-10">
                      <FolderOpen size={28} className="text-white/10 mx-auto mb-3" />
                      <p className="text-white/30 text-sm">No assets uploaded by client yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {kanbanAssets.map((asset) => (
                        <div key={asset.key} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
                          <FileText size={14} className="text-violet-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/80 truncate">{asset.name}</p>
                            <p className="text-xs text-white/30">
                              {asset.size < 1024 ? `${asset.size} B` : asset.size < 1048576 ? `${(asset.size / 1024).toFixed(1)} KB` : `${(asset.size / 1048576).toFixed(1)} MB`}
                              {asset.uploaded && <span className="ml-2">{new Date(asset.uploaded).toLocaleDateString()}</span>}
                            </p>
                          </div>
                          <a
                            href={`${API_BASE}/api/v1/assets/${kanbanModal.deal_id}/${encodeURIComponent(asset.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/30 hover:text-violet-400 transition-colors"
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : !showPlanInKanban ? (
                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* To Do */}
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={14} className="text-white/40" />
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">To Do</span>
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30">{todo.length}</span>
                    </div>
                    {todo.map(t => <TaskCard key={t.id} task={t} />)}
                    {todo.length === 0 && <p className="text-[11px] text-white/20 text-center py-4">No tasks</p>}
                  </div>

                  {/* In Progress */}
                  <div className="rounded-xl bg-white/[0.02] border border-violet-500/10 p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Loader size={14} className="text-violet-400" />
                      <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">In Progress</span>
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300">{inProg.length}</span>
                    </div>
                    {inProg.map(t => <TaskCard key={t.id} task={t} />)}
                    {inProg.length === 0 && <p className="text-[11px] text-white/20 text-center py-4">No tasks</p>}
                  </div>

                  {/* Done */}
                  <div className="rounded-xl bg-white/[0.02] border border-emerald-500/10 p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Done</span>
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">{doneCount}</span>
                    </div>
                    {done.map(t => <TaskCard key={t.id} task={t} />)}
                    {done.length === 0 && <p className="text-[11px] text-white/20 text-center py-4">No tasks</p>}
                  </div>
                </div>
              ) : (
                <div
                  className="flex-1 overflow-y-auto rounded-xl bg-white/[0.03] border border-white/5 p-5 prose prose-invert prose-sm max-w-none
                             [&_h2]:text-violet-300 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
                             [&_h3]:text-white/80 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
                             [&_p]:text-white/60 [&_p]:text-sm [&_p]:leading-relaxed
                             [&_ul]:text-white/60 [&_ul]:text-sm [&_li]:mb-1
                             [&_strong]:text-white/80"
                  dangerouslySetInnerHTML={{ __html: kanbanModal.plan_html }}
                />
              )}

              {/* Footer */}
              {kanbanTasks.length === 0 && !showPlanInKanban && (
                <div className="text-center py-8">
                  <Loader size={24} className="text-violet-400/50 mx-auto mb-2 animate-spin" />
                  <p className="text-white/30 text-xs">Loading tasks...</p>
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => { setKanbanModal(null); setKanbanTasks([]); setShowAssetsInKanban(false); setKanbanAssets([]); }}
                  className="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors text-sm"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
