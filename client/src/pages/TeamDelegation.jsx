import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Shield,
  DollarSign,
  Clock,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Zap,
  Cpu,
  RefreshCw,
} from "lucide-react";
import {
  createDelegationInvite,
  fetchDelegationInvites,
  revokeDelegationInvite,
  fetchDelegationTeam,
  fetchDelegationMetrics,
} from "../lib/triage-client";

// ---------------------------------------------------------------------------
// Animation presets (consistent with ComplianceDashboard, CEODashboard)
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ---------------------------------------------------------------------------
// Status color configs
// ---------------------------------------------------------------------------

const STATUS_COLORS = {
  active: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    label: "Active",
  },
  pending: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    dot: "bg-amber-400",
    label: "Pending",
  },
  revoked: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    dot: "bg-red-400",
    label: "Revoked",
  },
  expired: {
    bg: "bg-white/10",
    text: "text-white/40",
    dot: "bg-white/30",
    label: "Expired",
  },
  suspended: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    dot: "bg-orange-400",
    label: "Suspended",
  },
};

const SCOPE_LABELS = {
  "triage:read": { label: "Triage Read", icon: "👁️" },
  "triage:execute": { label: "Triage Execute", icon: "⚡" },
  "engagement:read": { label: "Engagement Read", icon: "📖" },
  "engagement:execute": { label: "Engagement Execute", icon: "🎯" },
};

// ---------------------------------------------------------------------------
// StatusPill
// ---------------------------------------------------------------------------

function StatusPill({ status }) {
  const config = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// InviteForm — Create Sub-Contractor Invite
// ---------------------------------------------------------------------------

function InviteForm({ onInviteCreated }) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [maxBudget, setMaxBudget] = useState("");
  const [scopes, setScopes] = useState([
    "triage:read",
    "triage:execute",
    "engagement:read",
    "engagement:execute",
  ]);
  const [creating, setCreating] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const toggleScope = (scope) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleCreate = async () => {
    if (scopes.length === 0) {
      setError("Select at least one permission scope.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const result = await createDelegationInvite({
        subContractorEmail: email || undefined,
        scopes,
        expiresInDays,
        maxTokenBudget: maxBudget ? parseFloat(maxBudget) : undefined,
      });
      setInviteResult(result.invite);
      onInviteCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const copyInviteCode = () => {
    if (inviteResult?.inviteCode) {
      navigator.clipboard.writeText(inviteResult.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl border border-white/10">
      <button
        onClick={() => {
          setExpanded(!expanded);
          setInviteResult(null);
        }}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-cyan-400/20 flex items-center justify-center">
            <UserPlus size={20} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Invite Sub-Contractor
            </h3>
            <p className="text-xs text-white/40">
              Generate a scoped, time-bound access invite
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-white/40" />
        ) : (
          <ChevronDown size={16} className="text-white/40" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-4 border-t border-white/5 pt-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5">
                  Sub-Contractor Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Leave blank for open invite"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20"
                />
              </div>

              {/* Scopes */}
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-2">
                  Permission Scopes
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(SCOPE_LABELS).map(([scope, config]) => (
                    <button
                      key={scope}
                      onClick={() => toggleScope(scope)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        scopes.includes(scope)
                          ? "bg-cyan-500/20 border-cyan-400/30 text-cyan-300"
                          : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                      }`}
                    >
                      {config.icon} {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry + Budget row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">
                    Expires In
                  </label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400/40"
                  >
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">
                    Token Budget (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="No limit"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="text-red-400 text-xs bg-red-400/5 border border-red-400/10 rounded-lg p-3">
                  {error}
                </div>
              )}

              {/* Result */}
              {inviteResult && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-4"
                >
                  <p className="text-xs text-emerald-300 font-semibold mb-2">
                    Invite Created Successfully
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-white/70 bg-black/30 px-3 py-2 rounded-lg font-mono truncate">
                      {inviteResult.inviteCode}
                    </code>
                    <button
                      onClick={copyInviteCode}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      {copied ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} className="text-white/40" />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Create button */}
              {!inviteResult && (
                <button
                  onClick={handleCreate}
                  disabled={creating || scopes.length === 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-black font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {creating ? "Generating..." : "Generate Invite"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// SubContractorTable — Active Team Roster
// ---------------------------------------------------------------------------

function SubContractorTable({ team, onRevoke }) {
  if (!team || team.length === 0) {
    return (
      <motion.div
        variants={fadeUp}
        className="glass noise rounded-2xl p-6 border border-white/10 text-center"
      >
        <Users size={32} className="text-white/20 mx-auto mb-3" />
        <p className="text-sm text-white/40">
          No sub-contractors yet. Create an invite to start building your team.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-2xl border border-white/10 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users size={16} className="text-cyan-400" />
          Team Roster ({team.length})
        </h3>
      </div>
      <div className="divide-y divide-white/5">
        {team.map((sub) => (
          <div
            key={sub.email}
            className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center text-xs font-bold text-cyan-300">
                  {sub.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {sub.name}
                  </p>
                  <p className="text-xs text-white/40 truncate">{sub.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 ml-4">
              {/* Scopes */}
              <div className="hidden md:flex items-center gap-1">
                {sub.scopes?.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40"
                  >
                    {SCOPE_LABELS[s]?.icon ?? "?"}
                  </span>
                ))}
              </div>

              {/* Token usage */}
              <div className="text-right hidden sm:block">
                <p className="text-xs font-mono text-white/60">
                  ${sub.tokenUsage?.computeCostUSD?.toFixed(4) ?? "0.0000"}
                </p>
                <p className="text-[10px] text-white/30">
                  {sub.tokenUsage?.aiCallCount ?? 0} calls
                </p>
              </div>

              {/* Status */}
              <StatusPill status={sub.status} />

              {/* Revoke */}
              {sub.status === "active" && (
                <button
                  onClick={() => onRevoke?.(sub.inviteId)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                  title="Revoke access"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// FinOpsSubMeterPanel — Aggregate Financial View
// ---------------------------------------------------------------------------

function FinOpsSubMeterPanel({ metrics }) {
  if (!metrics) return null;

  return (
    <motion.div variants={fadeUp}>
      <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
        <DollarSign size={14} className="text-amber-400" />
        Sub-Contractor FinOps
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass noise rounded-xl p-4 border border-white/10">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
            Total Compute
          </p>
          <p className="text-lg font-bold text-white font-mono">
            ${metrics.totalComputeCostUSD?.toFixed(4) ?? "0.0000"}
          </p>
        </div>
        <div className="glass noise rounded-xl p-4 border border-white/10">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
            AI Calls
          </p>
          <p className="text-lg font-bold text-white font-mono">
            {metrics.totalAICallCount ?? 0}
          </p>
        </div>
        <div className="glass noise rounded-xl p-4 border border-white/10">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
            Input Tokens
          </p>
          <p className="text-lg font-bold text-white font-mono">
            {(metrics.totalInputTokens ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="glass noise rounded-xl p-4 border border-white/10">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
            Output Tokens
          </p>
          <p className="text-lg font-bold text-white font-mono">
            {(metrics.totalOutputTokens ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Per-sub breakdown */}
      {metrics.perSubContractor?.length > 0 && (
        <div className="mt-3 glass noise rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5">
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
              Per-Operator Breakdown
            </p>
          </div>
          <div className="divide-y divide-white/5">
            {metrics.perSubContractor.map((sub) => (
              <div
                key={sub.email}
                className="px-4 py-2.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Cpu size={12} className="text-cyan-400/60 flex-shrink-0" />
                  <span className="text-xs text-white/60 truncate">
                    {sub.name ?? sub.email}
                  </span>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <span className="text-xs font-mono text-amber-300">
                    ${sub.computeCostUSD?.toFixed(4)}
                  </span>
                  <span className="text-[10px] text-white/30">
                    {sub.aiCallCount} calls
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// PendingInvitesTable
// ---------------------------------------------------------------------------

function PendingInvitesTable({ invites, onRevoke }) {
  const pending = invites?.filter(
    (i) => i.status === "pending" || i.status === "active"
  );
  if (!pending || pending.length === 0) return null;

  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-2xl border border-white/10 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock size={16} className="text-amber-400" />
          Invites ({pending.length})
        </h3>
      </div>
      <div className="divide-y divide-white/5">
        {pending.map((invite) => (
          <div
            key={invite.id}
            className="px-6 py-3 flex items-center justify-between"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-white/50 truncate max-w-[180px]">
                  {invite.id}
                </code>
                <StatusPill status={invite.status} />
              </div>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-white/30">
                <span>
                  {invite.subContractorEmail
                    ? `→ ${invite.subContractorEmail}`
                    : "Open invite"}
                </span>
                <span>
                  Expires{" "}
                  {new Date(invite.expiresAt).toLocaleDateString()}
                </span>
                <span>
                  {invite.scopes?.length ?? 0} scope(s)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(invite.id);
                }}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
                title="Copy invite code"
              >
                <Copy size={12} />
              </button>
              {invite.status !== "revoked" && (
                <button
                  onClick={() => onRevoke?.(invite.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                  title="Revoke invite"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// TeamDelegationContent — Main Dashboard Component
// ---------------------------------------------------------------------------

const POLL_INTERVAL = 30_000;

export function TeamDelegationContent() {
  const [team, setTeam] = useState([]);
  const [invites, setInvites] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [teamData, invitesData, metricsData] = await Promise.all([
        fetchDelegationTeam().catch(() => ({ team: [] })),
        fetchDelegationInvites().catch(() => ({ invites: [] })),
        fetchDelegationMetrics().catch(() => null),
      ]);
      setTeam(teamData.team ?? []);
      setInvites(invitesData.invites ?? []);
      setMetrics(metricsData);
      setError(null);
    } catch (err) {
      console.error("[DELEGATION] Failed to load data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRevoke = async (inviteId) => {
    try {
      await revokeDelegationInvite(inviteId);
      loadData();
    } catch (err) {
      console.error("[DELEGATION] Revoke failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold gradient-text">
            Team Delegation
          </h2>
          <p className="text-xs text-white/40 mt-1">
            SOW Clause 2 — Right to Substitute. Manage your sub-contractor workforce.
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </motion.div>

      {/* Error banner */}
      {error && (
        <motion.div
          variants={fadeUp}
          className="bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </motion.div>
      )}

      {/* Summary cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        <div className="glass noise rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">
              Active Subs
            </p>
            <Users size={14} className="text-cyan-400 opacity-50" />
          </div>
          <p className="text-2xl font-bold text-white">
            {team.filter((s) => s.status === "active").length}
          </p>
        </div>
        <div className="glass noise rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">
              Pending Invites
            </p>
            <Clock size={14} className="text-amber-400 opacity-50" />
          </div>
          <p className="text-2xl font-bold text-white">
            {invites.filter((i) => i.status === "pending").length}
          </p>
        </div>
        <div className="glass noise rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">
              Team Compute
            </p>
            <Zap size={14} className="text-amber-400 opacity-50" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            ${metrics?.totalComputeCostUSD?.toFixed(2) ?? "0.00"}
          </p>
        </div>
      </motion.div>

      {/* Invite form */}
      <InviteForm onInviteCreated={loadData} />

      {/* Team roster */}
      <SubContractorTable team={team} onRevoke={handleRevoke} />

      {/* FinOps sub-metering */}
      <FinOpsSubMeterPanel metrics={metrics} />

      {/* Pending invites */}
      <PendingInvitesTable invites={invites} onRevoke={handleRevoke} />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Default export — standalone page with SP auth gate styling
// ---------------------------------------------------------------------------

export default function TeamDelegation() {
  return (
    <div className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto relative">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[140px]" />
      </div>
      <div className="relative z-10">
        <TeamDelegationContent />
      </div>
    </div>
  );
}
