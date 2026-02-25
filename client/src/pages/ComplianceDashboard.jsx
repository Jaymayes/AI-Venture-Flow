import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Eye,
  RefreshCw,
  Scale,
  Database,
  Phone,
  DollarSign,
  Users,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
} from "lucide-react";
import {
  fetchComplianceSummary,
  fetchComplianceEvents,
  reviewComplianceEvent,
  refreshComplianceSummary,
} from "../lib/triage-client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL = 30_000;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ---------------------------------------------------------------------------
// Compliance Vector Display Config
// ---------------------------------------------------------------------------

const VECTOR_CONFIG = {
  CV_1099_MISCLASSIFICATION: {
    label: "1099 Classification",
    shortLabel: "1099",
    icon: Users,
    color: "violet",
    description: "DoL safe harbor for Sovereign Professional IC classification",
  },
  CV_AKS_ADHERENCE: {
    label: "AKS Compliance",
    shortLabel: "AKS",
    icon: Scale,
    color: "blue",
    description: "Anti-Kickback Statute compliance in referral flows",
  },
  CV_DATA_SOVEREIGNTY: {
    label: "Data Sovereignty",
    shortLabel: "Data",
    icon: Database,
    color: "cyan",
    description: "PII handling, Ephemeral Vault integrity, cross-border flows",
  },
  CV_TCPA_CAN_SPAM: {
    label: "TCPA / CAN-SPAM",
    shortLabel: "TCPA",
    icon: Phone,
    color: "teal",
    description: "Outreach consent, opt-out, suppression list compliance",
  },
  CV_MARGIN_COMPLIANCE: {
    label: "Margin Gate",
    shortLabel: "Margin",
    icon: DollarSign,
    color: "amber",
    description: "80% gross margin gate on SP disbursements",
  },
};

const SEVERITY_CONFIG = {
  INFO: { label: "Info", bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  WARNING: { label: "Warning", bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  VIOLATION: { label: "Violation", bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
  CRITICAL: { label: "Critical", bg: "bg-red-600/20", text: "text-red-300", border: "border-red-400/40" },
};

const STATUS_CONFIG = {
  COMPLIANT: { label: "Compliant", bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  AT_RISK: { label: "At Risk", bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  NON_COMPLIANT: { label: "Non-Compliant", bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
};

const POSTURE_CONFIG = {
  GREEN: { label: "GREEN", bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/40", glow: "shadow-emerald-500/20" },
  YELLOW: { label: "YELLOW", bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/40", glow: "shadow-amber-500/20" },
  RED: { label: "RED", bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40", glow: "shadow-red-500/20" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtTime = (iso) => {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const fmtRelative = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// ---------------------------------------------------------------------------
// Posture Banner
// ---------------------------------------------------------------------------

function PostureBanner({ summary }) {
  const posture = POSTURE_CONFIG[summary?.posture] ?? POSTURE_CONFIG.GREEN;
  const PostureIcon = summary?.posture === "GREEN" ? ShieldCheck : summary?.posture === "RED" ? ShieldAlert : AlertTriangle;

  return (
    <motion.div
      variants={fadeUp}
      className={`glass noise rounded-2xl border ${posture.border} p-6 ${posture.glow} shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`rounded-xl ${posture.bg} p-3`}>
            <PostureIcon size={28} className={posture.text} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Compliance Posture:{" "}
              <span className={posture.text}>{posture.label}</span>
            </h2>
            <p className="text-sm text-white/50">
              {summary?.totalEvents ?? 0} total events &middot;{" "}
              {summary?.eventsLast24h ?? 0} last 24h &middot;{" "}
              <span className={summary?.activeViolations > 0 ? "text-red-400 font-medium" : "text-white/50"}>
                {summary?.activeViolations ?? 0} active violations
              </span>
            </p>
          </div>
        </div>
        <p className="text-xs text-white/30">
          Last updated: {fmtRelative(summary?.lastUpdated)}
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Vector Health Cards
// ---------------------------------------------------------------------------

function VectorHealthGrid({ vectorHealth }) {
  const vectors = Object.entries(VECTOR_CONFIG);

  return (
    <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {vectors.map(([key, cfg]) => {
        const health = vectorHealth?.[key];
        const status = STATUS_CONFIG[health?.status] ?? STATUS_CONFIG.COMPLIANT;
        const Icon = cfg.icon;

        return (
          <motion.div
            key={key}
            variants={fadeUp}
            className="glass noise rounded-xl border border-white/10 p-4 hover:border-white/20 transition"
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon size={16} className="text-white/50" />
              <span className="text-xs font-medium text-white/70">{cfg.shortLabel}</span>
              <div className="ml-auto flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${status.dot}`} />
                <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Events</span>
                <span className="text-white/70">{health?.totalEvents ?? 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Violations</span>
                <span className={health?.violations > 0 ? "text-red-400" : "text-white/70"}>
                  {health?.violations ?? 0}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Unreviewed</span>
                <span className={health?.unreviewedViolations > 0 ? "text-red-400 font-medium" : "text-white/70"}>
                  {health?.unreviewedViolations ?? 0}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Compliance Event Row
// ---------------------------------------------------------------------------

function EventRow({ event, onReview }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const severity = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.INFO;
  const vectorCfg = VECTOR_CONFIG[event.vector] ?? { label: event.vector, icon: Shield, color: "gray" };
  const VectorIcon = vectorCfg.icon;

  const handleReview = async () => {
    setReviewing(true);
    try {
      await onReview(event.id);
    } finally {
      setReviewing(false);
    }
  };

  return (
    <motion.div
      variants={fadeUp}
      className={`glass noise rounded-xl border ${event.isViolation && !event.reviewed ? severity.border : "border-white/10"} overflow-hidden`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition"
      >
        <div className={`rounded-lg ${severity.bg} p-1.5`}>
          <VectorIcon size={14} className={severity.text} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/90 truncate">{event.description}</p>
          <p className="text-xs text-white/40 mt-0.5">
            {vectorCfg.label} &middot; {fmtTime(event.timestamp)}
            {event.spEmail && <span> &middot; {event.spEmail}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${severity.bg} ${severity.text}`}>
            {severity.label}
          </span>
          {event.reviewed ? (
            <CheckCircle2 size={14} className="text-emerald-400" />
          ) : event.isViolation ? (
            <AlertTriangle size={14} className="text-red-400 animate-pulse" />
          ) : null}
          {expanded ? <ChevronDown size={14} className="text-white/30" /> : <ChevronRight size={14} className="text-white/30" />}
        </div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 px-4 py-3 bg-white/[0.02]"
          >
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-white/40">Source:</span>{" "}
                <span className="text-white/70">{event.source}</span>
              </div>
              <div>
                <span className="text-white/40">Method:</span>{" "}
                <span className="text-white/70">{event.method ?? "audit"}</span>
              </div>
              <div>
                <span className="text-white/40">Event ID:</span>{" "}
                <span className="text-white/50 font-mono text-[10px]">{event.id}</span>
              </div>
              <div>
                <span className="text-white/40">Reviewed:</span>{" "}
                <span className={event.reviewed ? "text-emerald-400" : "text-white/50"}>
                  {event.reviewed ? `Yes (${fmtRelative(event.reviewedAt)})` : "No"}
                </span>
              </div>
            </div>

            {event.corrective && (
              <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400">
                  <strong>Recommended Action:</strong> {event.corrective}
                </p>
              </div>
            )}

            {event.evidence && Object.keys(event.evidence).length > 0 && (
              <details className="mt-3">
                <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60">
                  Evidence Payload
                </summary>
                <pre className="mt-1 text-[10px] text-white/40 bg-black/30 rounded-lg p-2 overflow-x-auto max-h-40">
                  {JSON.stringify(event.evidence, null, 2)}
                </pre>
              </details>
            )}

            {!event.reviewed && event.isViolation && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleReview}
                  disabled={reviewing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition disabled:opacity-50"
                >
                  <Eye size={12} />
                  {reviewing ? "Marking..." : "Mark as Reviewed"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Event Feed
// ---------------------------------------------------------------------------

function EventFeed({ events, onReview, filter, setFilter }) {
  const filteredEvents = filter === "all"
    ? events
    : filter === "violations"
    ? events.filter((e) => e.isViolation)
    : events.filter((e) => e.vector === filter);

  return (
    <motion.div variants={fadeUp}>
      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-white/40">Filter:</span>
        {[
          { id: "all", label: "All Events" },
          { id: "violations", label: "Violations Only" },
          ...Object.entries(VECTOR_CONFIG).map(([k, v]) => ({ id: k, label: v.shortLabel })),
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-xs px-2.5 py-1 rounded-full border transition ${
              filter === f.id
                ? "border-accent/50 bg-accent/20 text-accent"
                : "border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Event List */}
      <div className="space-y-2">
        {filteredEvents.length === 0 ? (
          <div className="glass noise rounded-xl border border-white/10 p-8 text-center">
            <ShieldCheck size={32} className="mx-auto text-emerald-400/50 mb-2" />
            <p className="text-sm text-white/50">No compliance events match the current filter.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <EventRow key={event.id} event={event} onReview={onReview} />
          ))
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Exported Content Component (for CEODashboard tab embedding)
// ---------------------------------------------------------------------------

export function ComplianceDashboardContent() {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [summaryData, eventsData] = await Promise.all([
        fetchComplianceSummary(),
        fetchComplianceEvents(null, false, 100),
      ]);
      setSummary(summaryData);
      setEvents(eventsData.events ?? []);
      setError(null);
    } catch (err) {
      console.error("[COMPLIANCE] Failed to load data:", err);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await refreshComplianceSummary();
      setSummary(result.summary);
      await loadData();
    } catch (err) {
      console.error("[COMPLIANCE] Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleReview = async (eventId) => {
    try {
      await reviewComplianceEvent(eventId);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, reviewed: true, reviewedAt: new Date().toISOString() } : e
        )
      );
      // Refresh summary to update violation counts
      const summaryData = await fetchComplianceSummary();
      setSummary(summaryData);
    } catch (err) {
      console.error("[COMPLIANCE] Review failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Shield size={32} className="text-accent/50 animate-pulse" />
          <p className="text-sm text-white/40">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="glass noise rounded-2xl border border-red-500/30 p-8 text-center">
          <ShieldAlert size={32} className="mx-auto text-red-400/50 mb-2" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 text-xs text-white/50 hover:text-white/70 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="mx-auto max-w-7xl px-6 py-8 space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield size={22} className="text-accent" />
            OpenClaw Legal Compliance Agent
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Passive compliance monitoring across 5 legal vectors
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 text-white/60 text-xs hover:text-white/80 hover:border-white/20 transition disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh Summary"}
        </button>
      </motion.div>

      {/* Posture Banner */}
      <PostureBanner summary={summary} />

      {/* Vector Health Grid */}
      <VectorHealthGrid vectorHealth={summary?.vectorHealth} />

      {/* Event Feed */}
      <motion.div variants={fadeUp}>
        <h2 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
          <FileText size={14} />
          Compliance Event Log ({events.length} events)
        </h2>
        <EventFeed
          events={events}
          onReview={handleReview}
          filter={filter}
          setFilter={setFilter}
        />
      </motion.div>
    </motion.div>
  );
}

export default ComplianceDashboardContent;
