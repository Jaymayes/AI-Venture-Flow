import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronRight,
  Shield,
  Eye,
  AlertTriangle,
  Activity,
  XOctagon,
} from "lucide-react";
import { fetchSecOpsLedger, simulateSecOpsAttack } from "../lib/triage-client";

// ---------------------------------------------------------------------------
// Phase 14: Zero-Trust SecOps War Room — Live Threat Visualization
//
// Replaces the Phase 13 "Module in Development" placeholder.
// Reads immutable threat alerts from GET /api/secops/ledger.
// Demo simulator injects realistic payloads via POST /api/secops/simulate.
//
// Exports:
//   SecOpsLedgerContent  — named export, embedded in CEODashboard.jsx "secops" tab
//   SecOpsLedger         — default export, standalone page route
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ── Severity color helpers ──
function riskColor(score) {
  if (score >= 90) return "text-red-400";
  if (score >= 70) return "text-orange-400";
  if (score >= 50) return "text-amber-400";
  return "text-yellow-400";
}

function riskBg(score) {
  if (score >= 90) return "bg-red-500/20 border-red-500/30";
  if (score >= 70) return "bg-orange-500/20 border-orange-500/30";
  if (score >= 50) return "bg-amber-500/20 border-amber-500/30";
  return "bg-yellow-500/20 border-yellow-500/30";
}

function formatTimestamp(ts) {
  const d = new Date(typeof ts === "number" ? ts : ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// ── Stat Card ──
function StatCard({ icon: Icon, label, value, color, iconColor }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`glass noise rounded-2xl p-4 border ${color}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-white/40 text-xs">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Threat Row ──
function ThreatRow({ alert, isExpanded, onToggle }) {
  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition group"
      >
        {/* Expand indicator */}
        <span className="text-white/20 group-hover:text-white/40 transition shrink-0">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>

        {/* Timestamp */}
        <span className="text-white/50 text-xs font-mono w-40 shrink-0">
          {formatTimestamp(alert.timestamp)}
        </span>

        {/* Threat Vectors */}
        <span className="flex-1 flex flex-wrap gap-1 min-w-0">
          {(alert.threatTypes || []).map((t, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap"
            >
              {t.replace(/^BEHAVIOR_/, "")}
            </span>
          ))}
        </span>

        {/* Risk Score */}
        <span className={`text-sm font-bold tabular-nums w-12 text-right shrink-0 ${riskColor(alert.riskScore)}`}>
          {alert.riskScore}
        </span>

        {/* Status */}
        <span className="flex items-center gap-1.5 w-24 shrink-0 justify-end">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-xs font-bold">BLOCKED</span>
        </span>
      </button>

      {/* Expanded: Inspect Payload */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              <div className="flex items-center gap-2 mb-2">
                <Eye size={12} className="text-rose-400" />
                <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                  Malicious Payload — Intercepted by AST Scanner
                </span>
              </div>
              <pre className="rounded-xl bg-black/60 border border-rose-500/20 p-4 text-xs font-mono text-rose-300/80 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {alert.maliciousSnippet || "// [payload data not available]"}
              </pre>
              <div className="mt-2 flex items-center gap-4 text-[10px] text-white/30">
                <span>ID: {alert.id}</span>
                <span>Risk: {alert.riskScore}/100</span>
                <span>Vectors: {(alert.threatTypes || []).length}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Named Export — CEO Dashboard tab embedding
// ═══════════════════════════════════════════════════════════════════════════

export function SecOpsLedgerContent() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    threatsBlocked: 0,
    inQuarantine: 0,
    avgRiskScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await fetchSecOpsLedger();
      // Phase 14 alerts take priority; fall back to legacy intercepts mapped to alert shape
      const p14Alerts = data.alerts ?? [];
      const legacyAlerts = (data.intercepts ?? []).map((ic) => ({
        id: ic.id,
        timestamp: new Date(ic.timestamp).getTime(),
        threatTypes: ic.threats ?? [],
        riskScore: ic.riskScore ?? 0,
        maliciousSnippet: ic.rawPayload ?? "",
        action: "BLOCKED",
      }));
      const merged = [...p14Alerts, ...legacyAlerts].sort(
        (a, b) => b.timestamp - a.timestamp
      );
      setAlerts(merged);
      setStats(data.stats ?? { threatsBlocked: 0, inQuarantine: 0, avgRiskScore: 0 });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await simulateSecOpsAttack();
      // Small delay for KV propagation, then refresh
      await new Promise((r) => setTimeout(r, 400));
      await refresh();
    } catch (err) {
      setError(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-6 p-6"
    >
      {/* ── Header ── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <ShieldAlert size={22} className="text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Zero-Trust SecOps War Room
              </h2>
              <p className="text-white/40 text-sm">
                32-Point AST Scanner Intercepts &mdash; Immutable Threat Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/30 transition disabled:opacity-50"
            >
              <Zap size={13} className={simulating ? "animate-pulse" : ""} />
              {simulating ? "Injecting..." : "Simulate Attack"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Error Banner ── */}
      {error && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400"
        >
          {error}
        </motion.div>
      )}

      {/* ── Stat Cards ── */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          icon={XOctagon}
          label="Threats Blocked"
          value={stats.threatsBlocked}
          color="border-red-500/20"
          iconColor="bg-red-500/20 text-red-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="In Quarantine"
          value={stats.inQuarantine}
          color="border-amber-500/20"
          iconColor="bg-amber-500/20 text-amber-400"
        />
        <StatCard
          icon={Activity}
          label="Avg Risk Score"
          value={stats.avgRiskScore}
          color="border-orange-500/20"
          iconColor="bg-orange-500/20 text-orange-400"
        />
        <StatCard
          icon={Shield}
          label="Scanner Status"
          value="ACTIVE"
          color="border-emerald-500/20"
          iconColor="bg-emerald-500/20 text-emerald-400"
        />
      </motion.div>

      {/* ── Threat Table ── */}
      <motion.div
        variants={fadeUp}
        className="glass noise rounded-2xl border border-rose-500/10 overflow-hidden"
      >
        {/* Table Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <span className="w-4" /> {/* expand icon spacer */}
          <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider w-40 shrink-0">
            Timestamp
          </span>
          <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider flex-1">
            Threat Vector(s)
          </span>
          <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider w-12 text-right shrink-0">
            Risk
          </span>
          <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider w-24 text-right shrink-0">
            Status
          </span>
        </div>

        {/* Table Body */}
        {loading && alerts.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={24} className="animate-spin text-rose-400/40" />
            <span className="ml-3 text-white/30 text-sm">Loading threat telemetry...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16">
            <Shield size={32} className="mx-auto text-emerald-400/40 mb-3" />
            <p className="text-white/40 text-sm font-medium">No threats detected</p>
            <p className="text-white/20 text-xs mt-1">
              The 32-point AST scanner is active. Use &ldquo;Simulate Attack&rdquo; to populate demo data.
            </p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {alerts.map((alert) => (
              <ThreatRow
                key={alert.id}
                alert={alert}
                isExpanded={expandedId === alert.id}
                onToggle={() =>
                  setExpandedId(expandedId === alert.id ? null : alert.id)
                }
              />
            ))}
          </div>
        )}

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-white/20 text-[10px]">
              {alerts.length} threat{alerts.length !== 1 ? "s" : ""} in ledger &middot; 30-day retention
            </span>
            <span className="text-white/20 text-[10px]">
              Click any row to inspect the intercepted payload
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Default Export — Standalone page route
// ═══════════════════════════════════════════════════════════════════════════

export default function SecOpsLedger() {
  return (
    <div className="min-h-screen bg-[#0a0d14] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <SecOpsLedgerContent />
      </div>
    </div>
  );
}
