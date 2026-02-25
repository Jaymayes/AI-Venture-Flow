import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Target,
  RefreshCw,
  Mail,
  MessageSquare,
  Phone,
  Database,
  Flame,
  Search,
  ChevronDown,
  Shield,
  Users,
  TrendingUp,
  BarChart3,
  Zap,
} from "lucide-react";
import { fetchHandoffs, initiateTakeover } from "../lib/triage-client";

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

const timeAgo = (iso) => {
  if (!iso) return "\u2014";
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
  if (score >= 85)
    return {
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
      label: "High Intent",
    };
  if (score >= 70)
    return {
      bg: "bg-amber-500/20",
      text: "text-amber-400",
      dot: "bg-amber-400",
      label: "Warm",
    };
  return {
    bg: "bg-red-500/20",
    text: "text-red-400",
    dot: "bg-red-400",
    label: "Exploratory",
  };
};

const channelIcon = (ch) => {
  switch (ch) {
    case "email":
      return <Mail size={14} className="text-blue-400" />;
    case "sms":
      return <MessageSquare size={14} className="text-green-400" />;
    case "voice":
      return <Phone size={14} className="text-purple-400" />;
    case "m2m":
      return <Database size={14} className="text-orange-400" />;
    default:
      return <Mail size={14} className="text-cyan-400" />;
  }
};

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({ label, value, icon: Icon, iconColor = "text-primary" }) {
  return (
    <motion.div
      variants={fadeUp}
      className="glass noise relative overflow-hidden rounded-2xl p-4"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs text-white/40">{label}</div>
          <div className={`mt-1 text-2xl font-bold ${iconColor}`}>{value}</div>
        </div>
        {Icon && (
          <Icon size={22} className={`${iconColor} shrink-0 opacity-50`} />
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Handoff Card
// ---------------------------------------------------------------------------

function HandoffCard({ handoff, onTakeover, takingOver }) {
  const [, navigate] = useLocation();
  const ic = intentColor(handoff.intentScore ?? 0);
  const isTakingOver = takingOver === handoff.engagementId;

  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-xl p-4 border border-white/5 hover:border-primary/20 transition-all"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white font-semibold text-sm">
              {handoff.prospectName || "Unknown"}
            </p>
            <span className="text-white/20">|</span>
            <p className="text-white/50 text-xs truncate">
              {handoff.prospectRole || "N/A"},{" "}
              {handoff.prospectCompany || "N/A"}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap">
            {/* Intent Score */}
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${ic.bg} ${ic.text} font-bold`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${ic.dot}`} />
              {handoff.intentScore ?? 0}/100
            </div>

            {/* Reply channel */}
            <div className="flex items-center gap-1 text-white/30">
              {channelIcon(handoff.replyChannel)}
              <span className="capitalize">{handoff.replyChannel || "email"}</span>
            </div>

            {/* Schedule Human Partner */}
            {handoff.scheduleHumanPartner && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                <Flame size={10} />
                Schedule Human Partner
              </span>
            )}

            {/* Takeover badge */}
            {handoff.isHumanTakeover && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-[10px] font-bold">
                <Shield size={10} />
                Taken Over
              </span>
            )}

            {/* Time */}
            <span className="text-white/25">{timeAgo(handoff.handoffAt)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <button
            onClick={() => navigate(`/triage/${handoff.engagementId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/50 text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors"
          >
            View Details
          </button>
          {!handoff.isHumanTakeover && (
            <button
              onClick={() => onTakeover(handoff.engagementId)}
              disabled={isTakingOver}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition disabled:opacity-50"
            >
              {isTakingOver ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Zap size={12} />
              )}
              Take Over
            </button>
          )}
        </div>
      </div>

      {/* Human Partner Reason */}
      {handoff.humanPartnerReason && (
        <div className="mt-2 text-[10px] text-amber-400/60">
          {handoff.humanPartnerReason}
        </div>
      )}
    </motion.div>
  );
}

// ===========================================================================
// Main: TriageLaunchpad
// ===========================================================================

export default function TriageLaunchpad() {
  const [, navigate] = useLocation();
  const [handoffs, setHandoffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [takingOverId, setTakingOverId] = useState(null);

  // Filters
  const [filter, setFilter] = useState("all"); // all | needs_triage | taken_over
  const [sortBy, setSortBy] = useState("intent_desc"); // intent_desc | time
  const [search, setSearch] = useState("");

  // ── Fetch ──
  const refresh = useCallback(async () => {
    try {
      const data = await fetchHandoffs();
      setHandoffs(data.handoffs ?? []);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  // ── Takeover handler ──
  const handleTakeover = async (engagementId) => {
    setTakingOverId(engagementId);
    try {
      await initiateTakeover(engagementId);
      // Optimistic remove from list
      setHandoffs((prev) =>
        prev.filter((h) => h.engagementId !== engagementId)
      );
      navigate(`/triage/${engagementId}`);
    } catch (err) {
      setError(`Takeover failed: ${err.message}`);
    } finally {
      setTakingOverId(null);
    }
  };

  // ── Derived data ──
  const filtered = handoffs
    .filter((h) => {
      if (filter === "needs_triage") return !h.isHumanTakeover;
      if (filter === "taken_over") return h.isHumanTakeover;
      return true;
    })
    .filter((h) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (h.prospectName || "").toLowerCase().includes(q) ||
        (h.prospectCompany || "").toLowerCase().includes(q) ||
        (h.prospectEmail || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "intent_desc")
        return (b.intentScore ?? 0) - (a.intentScore ?? 0);
      return (
        new Date(b.handoffAt || 0).getTime() -
        new Date(a.handoffAt || 0).getTime()
      );
    });

  const totalHandoffs = handoffs.length;
  const awaitingTriage = handoffs.filter((h) => !h.isHumanTakeover).length;
  const activeTakeovers = handoffs.filter((h) => h.isHumanTakeover).length;
  const avgIntent =
    handoffs.length > 0
      ? Math.round(
          handoffs.reduce((sum, h) => sum + (h.intentScore ?? 0), 0) /
            handoffs.length
        )
      : 0;

  return (
    <div className="min-h-screen">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      {/* Header bar */}
      <div className="glass noise sticky top-0 z-50 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/ceo"
                className="flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
              >
                <ArrowLeft size={14} />
                CEO Dashboard
              </Link>
              <div>
                <h1 className="text-xl font-bold">
                  <span className="gradient-text">Triage Launchpad</span>
                </h1>
                <p className="text-[11px] text-white/30">
                  Human-in-the-Loop Takeover Queue
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-white/25">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={refresh}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
                title="Refresh now"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-8">
        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
            {error}
          </div>
        )}

        {/* Stat cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6"
        >
          <StatCard
            label="Total Handoffs"
            value={totalHandoffs}
            icon={BarChart3}
            iconColor="text-primary"
          />
          <StatCard
            label="Awaiting Triage"
            value={awaitingTriage}
            icon={Target}
            iconColor="text-amber-400"
          />
          <StatCard
            label="Active Takeovers"
            value={activeTakeovers}
            icon={Users}
            iconColor="text-pink-400"
          />
          <StatCard
            label="Avg Intent Score"
            value={avgIntent}
            icon={TrendingUp}
            iconColor="text-accent"
          />
        </motion.div>

        {/* Filter / Sort / Search bar */}
        <div className="glass noise rounded-xl p-3 mb-6 flex flex-wrap items-center gap-3">
          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-lg bg-white/5 border border-white/10 px-3 py-2 pr-8 text-xs text-white/70 focus:outline-none focus:border-primary/50"
            >
              <option value="intent_desc">Intent (High → Low)</option>
              <option value="time">Most Recent</option>
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
            />
          </div>

          {/* Filter toggles */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {[
              { id: "all", label: "All" },
              { id: "needs_triage", label: "Needs Triage" },
              { id: "taken_over", label: "Taken Over" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-2 text-xs font-medium transition ${
                  filter === f.id
                    ? "bg-primary/20 text-primary"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or company..."
              className="w-full rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Handoff queue */}
        {loading && handoffs.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-center">
              <RefreshCw
                size={32}
                className="mx-auto animate-spin text-primary"
              />
              <p className="mt-4 text-sm text-white/40">
                Loading triage queue...
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/20 gap-2">
            <Target size={40} className="opacity-30" />
            <p className="text-sm font-semibold">
              No prospects in the triage queue
            </p>
            <p className="text-[11px]">
              Prospects will appear here when they cross the Event Bridge
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-3"
          >
            {filtered.map((h) => (
              <HandoffCard
                key={h.engagementId}
                handoff={h}
                onTakeover={handleTakeover}
                takingOver={takingOverId}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
