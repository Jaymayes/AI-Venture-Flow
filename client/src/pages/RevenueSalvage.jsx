import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  Shield,
  Mail,
} from "lucide-react";
import { fetchSalvageKanban } from "../lib/triage-client";

// ---------------------------------------------------------------------------
// Phase 16: Revenue Salvage Engine — Autonomous Churn Interception Kanban
//
// Replaces the Phase 17 "Module in Development" placeholder.
// 3-Column Kanban: At Risk (Triaging) | Drafting Strategy | Awaiting Approval
// Reads from GET /api/salvage/kanban (legacy deals + Phase 16 tickets).
//
// Exports:
//   RevenueSalvageContent — named export, embedded in CEODashboard.jsx "salvage" tab
//   RevenueSalvage        — default export, standalone page route
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ── Stage helpers ──
const STAGE_CONFIG = {
  triaging: {
    label: "At Risk",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    dot: "bg-red-500",
  },
  strategizing: {
    label: "Drafting Strategy",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-500",
  },
  awaiting_approval: {
    label: "Awaiting Approval",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  completed: {
    label: "Completed",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    dot: "bg-blue-500",
  },
  abandoned: {
    label: "Abandoned",
    color: "text-white/30",
    bg: "bg-white/5 border-white/10",
    dot: "bg-white/30",
  },
};

function formatMRR(mrr) {
  return `$${mrr.toLocaleString("en-US")}`;
}

function formatTCV(tcv) {
  if (tcv >= 1000000) return `$${(tcv / 1000000).toFixed(1)}M`;
  if (tcv >= 1000) return `$${(tcv / 1000).toFixed(0)}K`;
  return `$${tcv.toLocaleString("en-US")}`;
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "< 1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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

// ── Ticket Card ──
function TicketCard({ ticket, isExpanded, onToggle }) {
  const config = STAGE_CONFIG[ticket.stage] || STAGE_CONFIG.triaging;
  const riskPct = Math.round((ticket.churnRisk || 0) * 100);
  const salvagePct = Math.round((ticket.salvageProbability || 0) * 100);

  return (
    <motion.div
      layout
      variants={fadeUp}
      className={`rounded-xl border ${config.bg} overflow-hidden`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-4 hover:bg-white/[0.02] transition group"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-white/20 group-hover:text-white/40 transition shrink-0">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <h4 className="text-white font-semibold text-sm truncate">
              {ticket.clientName}
            </h4>
          </div>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
            <span className={`${config.color} text-[10px] font-bold uppercase`}>
              {config.label}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-white/50">
            <DollarSign size={11} />
            <span className="font-mono">{formatMRR(ticket.mrr)}/mo</span>
          </span>
          <span className="flex items-center gap-1 text-red-400/70">
            <AlertTriangle size={11} />
            <span className="font-mono">{riskPct}%</span>
          </span>
          <span className="flex items-center gap-1 text-emerald-400/70">
            <Shield size={11} />
            <span className="font-mono">{salvagePct}%</span>
          </span>
          <span className="flex items-center gap-1 text-white/30 ml-auto">
            <Clock size={11} />
            <span>{timeAgo(ticket.createdAt)}</span>
          </span>
        </div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Churn Signal */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle size={11} className="text-red-400" />
                  <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider">
                    Churn Signal
                  </span>
                </div>
                <p className="text-white/50 text-xs leading-relaxed">
                  {ticket.churnSignal || "No signal captured"}
                </p>
              </div>

              {/* Strategy (if available) */}
              {ticket.strategy && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap size={11} className="text-amber-400" />
                    <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                      AI Strategy
                    </span>
                  </div>
                  <p className="text-white/60 text-xs leading-relaxed">
                    {ticket.strategy}
                  </p>
                </div>
              )}

              {/* Win-Back Draft (if available) */}
              {ticket.winBackDraft && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Mail size={11} className="text-emerald-400" />
                    <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      Win-Back Draft
                    </span>
                  </div>
                  <pre className="rounded-lg bg-black/40 border border-emerald-500/10 p-3 text-xs font-mono text-emerald-300/70 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {ticket.winBackDraft}
                  </pre>
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 text-[10px] text-white/20 pt-1 border-t border-white/5">
                <span>ID: {ticket.id?.substring(0, 8)}...</span>
                <span>Triage: {ticket.triageModel || "pending"}</span>
                <span>Strategy: {ticket.strategyModel || "pending"}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Kanban Column ──
function KanbanColumn({ title, emoji, tickets, expandedId, setExpandedId, color, count }) {
  return (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-lg">{emoji}</span>
        <h3 className={`text-sm font-bold ${color}`}>{title}</h3>
        <span className="ml-auto text-white/20 text-xs font-mono bg-white/5 rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>
      <div className="space-y-2">
        {tickets.length === 0 ? (
          <div className="text-center py-8 text-white/15 text-xs">
            No tickets in this stage
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              isExpanded={expandedId === ticket.id}
              onToggle={() =>
                setExpandedId(expandedId === ticket.id ? null : ticket.id)
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Named Export — CEO Dashboard tab embedding
// ═══════════════════════════════════════════════════════════════════════════

export function RevenueSalvageContent() {
  const [tickets, setTickets] = useState([]);
  const [deals, setDeals] = useState([]);
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalTCV: 0,
    atRiskTCV: 0,
    criticalDeals: 0,
    activeTickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await fetchSalvageKanban();
      setTickets(data.tickets ?? []);
      setDeals(data.deals ?? []);
      setStats(data.stats ?? {
        totalDeals: 0, totalTCV: 0, atRiskTCV: 0, criticalDeals: 0, activeTickets: 0,
      });
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

  // ── Partition tickets into Kanban columns ──
  const triagingTickets = tickets.filter((t) => t.stage === "triaging");
  const strategizingTickets = tickets.filter((t) => t.stage === "strategizing");
  const awaitingTickets = tickets.filter((t) => t.stage === "awaiting_approval");
  const completedTickets = tickets.filter((t) => t.stage === "completed");
  const abandonedTickets = tickets.filter((t) => t.stage === "abandoned");

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
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Flame size={22} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Revenue Salvage Engine
              </h2>
              <p className="text-white/40 text-sm">
                Autonomous Churn Interception &mdash; AI-Powered Win-Back Pipeline
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
          icon={Users}
          label="Active Tickets"
          value={stats.activeTickets ?? 0}
          color="border-red-500/20"
          iconColor="bg-red-500/20 text-red-400"
        />
        <StatCard
          icon={DollarSign}
          label="MRR at Risk"
          value={formatTCV(stats.atRiskTCV ?? 0)}
          color="border-amber-500/20"
          iconColor="bg-amber-500/20 text-amber-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical Deals"
          value={stats.criticalDeals ?? 0}
          color="border-orange-500/20"
          iconColor="bg-orange-500/20 text-orange-400"
        />
        <StatCard
          icon={Shield}
          label="Pipeline Status"
          value={stats.activeTickets > 0 ? "ACTIVE" : "IDLE"}
          color="border-emerald-500/20"
          iconColor="bg-emerald-500/20 text-emerald-400"
        />
      </motion.div>

      {/* ── Kanban Board ── */}
      {loading && tickets.length === 0 ? (
        <motion.div variants={fadeUp} className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-red-400/40" />
          <span className="ml-3 text-white/30 text-sm">Loading salvage pipeline...</span>
        </motion.div>
      ) : tickets.length === 0 ? (
        <motion.div variants={fadeUp} className="glass noise rounded-2xl border border-red-500/10 text-center py-16 px-6">
          <Shield size={32} className="mx-auto text-red-400/30 mb-3" />
          <p className="text-white/40 text-sm font-medium">No salvage tickets in pipeline</p>
          <p className="text-white/20 text-xs mt-1">
            Tickets are created automatically when churn signals are detected.
          </p>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {/* Column 1: At Risk (Triaging) */}
            <KanbanColumn
              title="At Risk (Triaging)"
              emoji={"\uD83D\uDEA8"}
              tickets={triagingTickets}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              color="text-red-400"
              count={triagingTickets.length}
            />

            {/* Column 2: Drafting Strategy */}
            <KanbanColumn
              title="Drafting Strategy"
              emoji={"\u270D\uFE0F"}
              tickets={strategizingTickets}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              color="text-amber-400"
              count={strategizingTickets.length}
            />

            {/* Column 3: Awaiting Approval */}
            <KanbanColumn
              title="Awaiting Approval"
              emoji={"\u23F3"}
              tickets={awaitingTickets}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              color="text-emerald-400"
              count={awaitingTickets.length}
            />
          </div>

          {/* Completed / Abandoned rows below Kanban */}
          {(completedTickets.length > 0 || abandonedTickets.length > 0) && (
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {completedTickets.length > 0 && (
                <KanbanColumn
                  title="Completed"
                  emoji={"\u2705"}
                  tickets={completedTickets}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  color="text-blue-400"
                  count={completedTickets.length}
                />
              )}
              {abandonedTickets.length > 0 && (
                <KanbanColumn
                  title="Abandoned"
                  emoji={"\u274C"}
                  tickets={abandonedTickets}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  color="text-white/30"
                  count={abandonedTickets.length}
                />
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Footer ── */}
      {tickets.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between text-[10px] text-white/20 px-1">
            <span>
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} in pipeline &middot;{" "}
              {deals.length} legacy deal{deals.length !== 1 ? "s" : ""} tracked
            </span>
            <span>
              Triage: Llama 3.1 8B &middot; Strategy: Z.AI GLM-5 &middot; Draft: Llama 3.1 8B
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Default Export — Standalone page route
// ═══════════════════════════════════════════════════════════════════════════

export default function RevenueSalvage() {
  return (
    <div className="min-h-screen bg-[#0a0d14] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <RevenueSalvageContent />
      </div>
    </div>
  );
}
