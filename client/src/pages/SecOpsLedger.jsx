import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  Eye,
  AlertTriangle,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  Skull,
  Bug,
  Code2,
  FileWarning,
  UserX,
  Crown,
} from "lucide-react";
import {
  MOCK_THREAT_FEED,
  MOCK_SP_LIABILITY,
} from "../lib/mock-godmode";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USE_MOCK = true;
const API_BASE = "https://moltbot-triage-engine.jamarr.workers.dev/api";
const POLL_INTERVAL = 15_000; // Faster poll for security

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtTime = (iso) => {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
};

const fmtTimeAgo = (iso) => {
  if (!iso) return "\u2014";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// Verdict config
const verdictConfig = {
  BLOCKED: {
    label: "BLOCKED",
    color: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/30",
    icon: ShieldBan,
  },
  REVIEW: {
    label: "REVIEW",
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500/30",
    icon: Eye,
  },
  ALLOWED: {
    label: "ALLOWED",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/30",
    icon: ShieldCheck,
  },
};

// Threat vector icons
const vectorIcons = {
  "Exfiltration Attempt": Bug,
  "Credential Harvesting": Skull,
  "Privilege Escalation": Crown,
  "Supply Chain Injection": Code2,
  "Suspicious Import": FileWarning,
  "Suspicious Pattern": AlertTriangle,
  None: ShieldCheck,
};

// Risk score color
const riskColor = (score) => {
  if (score >= 70) return "text-red-400";
  if (score >= 40) return "text-amber-400";
  return "text-emerald-400";
};
const riskBg = (score) => {
  if (score >= 70) return "bg-red-400";
  if (score >= 40) return "bg-amber-400";
  return "bg-emerald-400";
};

// ---------------------------------------------------------------------------
// Threat Feed Item
// ---------------------------------------------------------------------------

function ThreatFeedItem({ scan }) {
  const vc = verdictConfig[scan.verdict] ?? verdictConfig.BLOCKED;
  const VerdictIcon = vc.icon;
  const VectorIcon = vectorIcons[scan.threatVector] ?? AlertTriangle;

  return (
    <motion.div
      variants={fadeUp}
      className={`glass noise rounded-xl p-4 border ${vc.border} transition-all hover:border-white/20`}
    >
      <div className="flex items-start gap-3">
        {/* Verdict icon */}
        <div className={`w-8 h-8 rounded-lg ${vc.bg} flex items-center justify-center shrink-0 mt-0.5`}>
          <VerdictIcon size={16} className={vc.color} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Top row: verdict + timestamp */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${vc.color}`}>[{vc.label}]</span>
              <span className="text-white/50 text-xs">{scan.spId}: {scan.spName}</span>
            </div>
            <span className="text-white/20 text-[10px]">{fmtTime(scan.timestamp)}</span>
          </div>

          {/* Threat vector + skill */}
          <div className="flex items-center gap-2 mb-2">
            <VectorIcon size={12} className={vc.color} />
            <span className="text-white/70 text-xs font-medium">{scan.threatVector}</span>
            <span className="text-white/20 text-[10px]">\u00b7</span>
            <span className="text-white/30 text-xs font-mono">{scan.skillName}</span>
          </div>

          {/* Risk score bar */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/30 text-[10px] w-12">Risk</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${riskBg(scan.riskScore)}`}
                style={{ width: `${scan.riskScore}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${riskColor(scan.riskScore)} w-8 text-right`}>
              {scan.riskScore}
            </span>
          </div>

          {/* Deception Assessment */}
          <p className="text-white/40 text-[11px] leading-relaxed">
            <span className="text-white/50 font-medium">LLM Assessment: </span>
            {scan.deceptionAssessment}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Quarantine Queue (Review items with action buttons)
// ---------------------------------------------------------------------------

function QuarantineItem({ scan, onApprove, onBlock }) {
  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-xl p-4 border border-amber-500/20 hover:border-amber-500/40 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye size={14} className="text-amber-400" />
            <span className="text-white font-semibold text-sm">{scan.skillName}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${riskColor(scan.riskScore)} bg-white/5`}>
              Risk {scan.riskScore}
            </span>
          </div>
          <p className="text-white/40 text-xs">
            {scan.spId} \u00b7 {scan.spName} \u00b7 {scan.threatVector}
          </p>
        </div>
        <span className="text-white/20 text-[10px]">{fmtTimeAgo(scan.timestamp)}</span>
      </div>

      {/* LLM Deception Assessment */}
      <div className="glass rounded-lg p-3 mb-3 border border-white/5">
        <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1 font-bold">Deception Assessment</p>
        <p className="text-white/60 text-xs leading-relaxed">{scan.deceptionAssessment}</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onApprove?.(scan.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs font-bold transition-all border border-emerald-500/20"
        >
          <CheckCircle2 size={14} />
          APPROVE & ALLOWLIST
        </button>
        <button
          onClick={() => onBlock?.(scan.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-bold transition-all border border-red-500/20"
        >
          <Ban size={14} />
          HARD BLOCK
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// SP Liability Index
// ---------------------------------------------------------------------------

function LiabilityRow({ sp, onRevoke }) {
  const isHighRisk = sp.blocksThisWeek >= 3;
  const statusColors = {
    flagged: { bg: "bg-red-500/20", text: "text-red-400", dot: "bg-red-400" },
    warning: { bg: "bg-amber-500/20", text: "text-amber-400", dot: "bg-amber-400" },
    clean: { bg: "bg-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400" },
  };
  const sc = statusColors[sp.status] ?? statusColors.clean;

  return (
    <motion.div
      variants={fadeUp}
      className={`glass noise rounded-xl p-4 border ${isHighRisk ? "border-red-500/30" : "border-white/10"} flex items-center justify-between gap-4 transition-all hover:border-white/20`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-8 h-8 rounded-lg ${sc.bg} flex items-center justify-center shrink-0`}>
          <span className={`text-xs font-bold ${sc.text}`}>#{sp.spId.split("-")[1]}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm truncate">{sp.spName}</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>
              <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
              {sp.status.toUpperCase()}
            </span>
          </div>
          <p className="text-white/30 text-xs">
            {sp.blocksTotal} total blocks \u00b7 Last: {fmtTimeAgo(sp.lastBlockAt)}
          </p>
        </div>
      </div>

      {/* Weekly blocks counter */}
      <div className="text-center px-3">
        <div className={`text-xl font-bold ${isHighRisk ? "text-red-400" : sp.blocksThisWeek > 0 ? "text-amber-400" : "text-white/30"}`}>
          {sp.blocksThisWeek}
        </div>
        <div className="text-[10px] text-white/30">this week</div>
      </div>

      {/* Revoke button (only for >= 3 flags) */}
      {isHighRisk && (
        <button
          onClick={() => onRevoke?.(sp.spId)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-bold transition-all border border-red-500/20 shrink-0"
        >
          <UserX size={14} />
          Revoke Access
        </button>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// SecOpsLedgerContent (Named Export for CEO Tab)
// ---------------------------------------------------------------------------

export function SecOpsLedgerContent() {
  const [threatFeed, setThreatFeed] = useState([]);
  const [liability, setLiability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = useCallback(async () => {
    if (USE_MOCK) {
      setThreatFeed(MOCK_THREAT_FEED);
      setLiability(MOCK_SP_LIABILITY);
      setLastRefresh(new Date());
      setLoading(false);
      return;
    }
    try {
      const token = sessionStorage.getItem("ceo_token") || localStorage.getItem("ceo_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [feedRes, liabilityRes] = await Promise.all([
        fetch(`${API_BASE}/security/threat-feed`, { headers }),
        fetch(`${API_BASE}/security/liability-index`, { headers }),
      ]);
      const feedData = await feedRes.json();
      const liabilityData = await liabilityRes.json();
      if (feedData.scans) setThreatFeed(feedData.scans);
      if (liabilityData.sps) setLiability(liabilityData.sps);
      setLastRefresh(new Date());
    } catch (err) {
      console.warn("[SecOps] Fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Derived stats
  const blockedCount = threatFeed.filter((s) => s.verdict === "BLOCKED").length;
  const reviewCount = threatFeed.filter((s) => s.verdict === "REVIEW").length;
  const quarantineItems = threatFeed.filter((s) => s.verdict === "REVIEW");
  const highRiskSPs = liability.filter((sp) => sp.blocksThisWeek >= 3).length;
  const avgRiskScore =
    threatFeed.length > 0
      ? Math.round(threatFeed.reduce((sum, s) => sum + s.riskScore, 0) / threatFeed.length)
      : 0;

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6 p-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <ShieldAlert size={18} className="text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Zero-Trust SecOps & Shadow AI Ledger</h2>
              <p className="text-white/40 text-sm">
                AST Scanner Intercepts \u00b7 SP Liability Index \u00b7 Quarantine Queue
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-white/20 text-[11px]">
                {lastRefresh.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            )}
            <button
              onClick={fetchData}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-rose-400 transition-all"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass noise rounded-xl p-4 border border-red-500/20">
          <p className="text-red-400 text-xs uppercase tracking-wider mb-1">Threats Blocked</p>
          <p className="text-red-400 text-2xl font-bold">{blockedCount}</p>
          <p className="text-white/30 text-[10px] mt-1">Payloads neutralized</p>
        </div>
        <div className="glass noise rounded-xl p-4 border border-amber-500/20">
          <p className="text-amber-400 text-xs uppercase tracking-wider mb-1">In Quarantine</p>
          <p className="text-amber-400 text-2xl font-bold">{reviewCount}</p>
          <p className="text-white/30 text-[10px] mt-1">Awaiting CEO review</p>
        </div>
        <div className="glass noise rounded-xl p-4 border border-rose-500/20">
          <p className="text-rose-400 text-xs uppercase tracking-wider mb-1">High-Risk SPs</p>
          <p className="text-rose-400 text-2xl font-bold">{highRiskSPs}</p>
          <p className="text-white/30 text-[10px] mt-1">&ge;3 flags this week</p>
        </div>
        <div className="glass noise rounded-xl p-4 border border-white/10">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Avg Risk Score</p>
          <p className={`text-2xl font-bold ${riskColor(avgRiskScore)}`}>{avgRiskScore}</p>
          <p className="text-white/30 text-[10px] mt-1">Across all scans</p>
        </div>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-rose-400 animate-spin" />
          <span className="text-white/40 text-sm ml-3">Loading threat intelligence...</span>
        </div>
      )}

      {!loading && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Column: Threat Feed (3 cols) */}
          <motion.div variants={fadeUp} className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldBan size={16} className="text-red-400" />
              <h3 className="text-white font-bold text-sm">Live Threat Intercept Feed</h3>
              <span className="text-white/20 text-[10px]">{threatFeed.length} events</span>
            </div>

            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
              {threatFeed.map((scan) => (
                <ThreatFeedItem key={scan.id} scan={scan} />
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column: SP Liability (2 cols) */}
          <motion.div variants={fadeUp} className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <UserX size={16} className="text-rose-400" />
              <h3 className="text-white font-bold text-sm">SP Liability Index</h3>
            </div>

            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
              {liability
                .sort((a, b) => b.blocksThisWeek - a.blocksThisWeek)
                .map((sp) => (
                  <LiabilityRow key={sp.spId} sp={sp} />
                ))}
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* Quarantine Queue */}
      {!loading && quarantineItems.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-amber-400" />
            <h3 className="text-white font-bold text-sm">Quarantine Queue</h3>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
              {quarantineItems.length} pending
            </span>
          </div>

          <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 md:grid-cols-2">
            {quarantineItems.map((scan) => (
              <QuarantineItem key={scan.id} scan={scan} />
            ))}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function SecOpsLedger() {
  return (
    <div className="min-h-screen bg-[#0a0d14] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <SecOpsLedgerContent />
      </div>
    </div>
  );
}
