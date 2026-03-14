import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  RefreshCw,
  CheckCircle,
  Clock,
  DollarSign,
  CalendarClock,
  ArrowRightCircle,
  Loader2,
  Shield,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  Users,
  Target,
  Percent,
  Lock,
  Unlock,
} from "lucide-react";
import {
  fetchTreasuryLedger,
  approveTreasuryPayout,
  fetchFinopsLedger,
  approveFinopsPayout,
  releaseEscrowPayout,
} from "../lib/triage-client";

// ---------------------------------------------------------------------------
// Phase 17: Autonomous Treasury — Disbursements Engine
// Phase 23: FinOps Ledger — Partner Payout & Margin Compliance
//
// Exports:
//   DisbursementsContent — named export, embedded in CEODashboard.jsx "disbursements" tab
//   Disbursements        — default export, standalone page route
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ── Currency formatting ──
const usdFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatUSD(amount) {
  return usdFormat.format(amount);
}

function formatDate(ts) {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function formatNextPayout(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
}

function formatEscrowRelease(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(d);
}

// ── Category badge colors ──
const CATEGORY_STYLES = {
  infrastructure: { label: "Infra", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  "ai-inference": { label: "AI", bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  "voice-api": { label: "Voice", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  "owner-draw": { label: "Draw", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  other: { label: "Other", bg: "bg-white/5", text: "text-white/40", border: "border-white/10" },
};

// ── Tier badge styles ──
const TIER_STYLES = {
  pilot: { label: "Pilot", bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
  standard: { label: "Standard", bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  enterprise: { label: "Enterprise", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
};

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

// ── Payout Table Row (Treasury) ──
function PayoutRow({ ticket, onApprove, approving }) {
  const category = CATEGORY_STYLES[ticket.category] || CATEGORY_STYLES.other;
  const isPending = ticket.status === "PENDING";
  const isApproving = approving === ticket.id;

  return (
    <motion.tr
      layout
      variants={fadeUp}
      className="border-b border-white/5 hover:bg-white/[0.02] transition"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">{ticket.payee}</span>
        </div>
        {ticket.memo && (
          <p className="text-white/25 text-[10px] mt-0.5 max-w-[240px] truncate">
            {ticket.memo}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${category.bg} ${category.text} ${category.border}`}
        >
          {category.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-white font-mono text-sm font-semibold">
          {formatUSD(ticket.amount)}
        </span>
        <span className="text-white/20 text-[10px] ml-1">{ticket.currency}</span>
      </td>
      <td className="px-4 py-3">
        {isPending ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Clock size={10} className="text-amber-400" />
            <span className="text-amber-400 text-[10px] font-bold uppercase">Pending</span>
          </span>
        ) : (
          <div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle size={10} className="text-emerald-400" />
              <span className="text-emerald-400 text-[10px] font-bold uppercase">Cleared</span>
            </span>
            {ticket.txId && (
              <p className="text-white/20 text-[10px] font-mono mt-0.5">{ticket.txId}</p>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-white/30 text-xs">
        {ticket.status === "CLEARED" && ticket.clearedAt
          ? formatDate(ticket.clearedAt)
          : formatDate(ticket.timestamp)}
      </td>
      <td className="px-4 py-3 text-right">
        {isPending ? (
          <button
            onClick={() => onApprove(ticket.id)}
            disabled={isApproving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApproving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <ArrowRightCircle size={12} />
                Approve &amp; Transfer
              </>
            )}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-white/15 text-xs">
            <ExternalLink size={10} />
            Settled
          </span>
        )}
      </td>
    </motion.tr>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase 23: FinOps Ledger Row — Partner Payout with Margin Badge
// ═══════════════════════════════════════════════════════════════════════════

function MarginBadge({ pct, healthy }) {
  if (healthy) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle size={10} className="text-emerald-400" />
        <span className="text-emerald-400 text-[10px] font-bold">{pct}%</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 animate-pulse">
      <AlertTriangle size={10} className="text-red-400" />
      <span className="text-red-400 text-[10px] font-bold">{pct}%</span>
    </span>
  );
}

function LedgerRow({ record, onApprove, onRelease, approving, releasing }) {
  const tier = TIER_STYLES[record.engagement_tier] || TIER_STYLES.standard;
  const isPending = record.status === "pending_payout";
  const isFlagged = record.status === "flagged";
  const isPaid = record.status === "paid";
  const isEscrow = record.status === "escrow";
  const isReady = record.status === "ready_for_release";
  const isApproving = approving === record.id;
  const isReleasing = releasing === record.id;
  const marginPct = Math.round((record.gross_margin_pct || 0) * 10000) / 100;
  const isHealthy = record.margin_healthy === 1;

  return (
    <motion.tr
      layout
      variants={fadeUp}
      className={`border-b border-white/5 hover:bg-white/[0.02] transition ${
        isFlagged ? "bg-red-500/[0.03]" : isReady ? "bg-emerald-500/[0.02]" : ""
      }`}
    >
      {/* Partner + Prospect */}
      <td className="px-4 py-3">
        <span className="text-white text-sm font-medium block">
          {record.prospect_name || "Unknown"}
        </span>
        <span className="text-white/30 text-[10px]">
          {record.prospect_company || "—"} &middot; Partner: {record.partner_name || record.partner_email}
        </span>
      </td>

      {/* Tier */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${tier.bg} ${tier.text} ${tier.border}`}
        >
          {tier.label}
        </span>
      </td>

      {/* TCV */}
      <td className="px-4 py-3 text-right">
        <span className="text-white font-mono text-sm font-semibold">
          {formatUSD(record.tcv)}
        </span>
      </td>

      {/* Partner Payout */}
      <td className="px-4 py-3 text-right">
        <span className="text-amber-400 font-mono text-sm font-semibold">
          {formatUSD(record.partner_total_payout)}
        </span>
        <p className="text-white/20 text-[10px]">
          {formatUSD(record.partner_retainer)} + {((record.partner_commission_rate || 0) * 100).toFixed(1)}%
        </p>
      </td>

      {/* AI COGS */}
      <td className="px-4 py-3 text-right">
        <span className="text-violet-400 font-mono text-xs">
          {formatUSD(record.ai_cogs)}
        </span>
      </td>

      {/* Gross Margin */}
      <td className="px-4 py-3">
        <MarginBadge pct={marginPct} healthy={isHealthy} />
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {isPaid ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle size={10} className="text-emerald-400" />
            <span className="text-emerald-400 text-[10px] font-bold uppercase">Paid</span>
          </span>
        ) : isEscrow ? (
          <div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Lock size={10} className="text-amber-400" />
              <span className="text-amber-400 text-[10px] font-bold uppercase">In Escrow</span>
            </span>
            {record.escrow_release_date && (
              <p className="text-amber-400/50 text-[10px] mt-0.5">
                Releases: {formatEscrowRelease(record.escrow_release_date)}
              </p>
            )}
          </div>
        ) : isReady ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 animate-pulse">
            <Unlock size={10} className="text-cyan-400" />
            <span className="text-cyan-400 text-[10px] font-bold uppercase">Ready</span>
          </span>
        ) : isFlagged ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
            <AlertTriangle size={10} className="text-red-400" />
            <span className="text-red-400 text-[10px] font-bold uppercase">Flagged</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Clock size={10} className="text-amber-400" />
            <span className="text-amber-400 text-[10px] font-bold uppercase">Pending</span>
          </span>
        )}
      </td>

      {/* Action */}
      <td className="px-4 py-3 text-right">
        {isPaid ? (
          <span className="inline-flex items-center gap-1 text-white/15 text-xs">
            <ExternalLink size={10} />
            Settled
          </span>
        ) : isEscrow ? (
          <span className="inline-flex items-center gap-1 text-amber-400/40 text-xs">
            <Lock size={10} />
            30-day hold
          </span>
        ) : isReady ? (
          <button
            onClick={() => onRelease(record.id)}
            disabled={isReleasing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed animate-pulse hover:animate-none"
          >
            {isReleasing ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Releasing...
              </>
            ) : (
              <>
                <Unlock size={12} />
                Authorize Transfer
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => onApprove(record.id)}
            disabled={isApproving}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
              isFlagged
                ? "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
            }`}
          >
            {isApproving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRightCircle size={12} />
                {isFlagged ? "Override & Pay" : "Approve"}
              </>
            )}
          </button>
        )}
      </td>
    </motion.tr>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase 23: Partner FinOps Ledger Panel
// ═══════════════════════════════════════════════════════════════════════════

function PartnerFinOpsLedger() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(null);
  const [releasing, setReleasing] = useState(null);
  const [confirmRelease, setConfirmRelease] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await fetchFinopsLedger();
      setRecords(data.records ?? []);
      setSummary(data.summary ?? null);
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

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await approveFinopsPayout(id);
      // Optimistic update
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "paid" } : r))
      );
      if (summary) {
        setSummary((prev) => ({
          ...prev,
          pendingCount: Math.max(0, (prev.pendingCount || 0) - 1),
          paidCount: (prev.paidCount || 0) + 1,
        }));
      }
    } catch (err) {
      setError(`Approval failed: ${err.message}`);
    } finally {
      setApproving(null);
    }
  };

  const handleReleaseRequest = (id) => {
    const record = records.find((r) => r.id === id);
    setConfirmRelease(record || { id });
  };

  const handleReleaseConfirm = async () => {
    if (!confirmRelease) return;
    const id = confirmRelease.id;
    setConfirmRelease(null);
    setReleasing(id);
    try {
      await releaseEscrowPayout(id);
      // Optimistic update
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "paid" } : r))
      );
      if (summary) {
        setSummary((prev) => ({
          ...prev,
          readyForReleaseCount: Math.max(0, (prev.readyForReleaseCount || 0) - 1),
          paidCount: (prev.paidCount || 0) + 1,
        }));
      }
    } catch (err) {
      setError(`Escrow release failed: ${err.message}`);
    } finally {
      setReleasing(null);
    }
  };

  return (
    <motion.div variants={stagger} className="space-y-6">
      {/* ── Header ── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Target size={22} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Partner FinOps Ledger
              </h2>
              <p className="text-white/40 text-sm">
                Closed Won Deals &mdash; Payout Calculations &amp; 80% Margin Gate
              </p>
            </div>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
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

      {/* ── KPI Cards ── */}
      {summary && (
        <motion.div variants={stagger} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            icon={DollarSign}
            label="Total TCV"
            value={formatUSD(summary.totalTcv || 0)}
            color="border-emerald-500/20"
            iconColor="bg-emerald-500/20 text-emerald-400"
          />
          <StatCard
            icon={Users}
            label="Partner Payouts"
            value={formatUSD(summary.totalPayouts || 0)}
            color="border-amber-500/20"
            iconColor="bg-amber-500/20 text-amber-400"
          />
          <StatCard
            icon={Lock}
            label="In Escrow"
            value={`${summary.escrowCount || 0} (${formatUSD(summary.escrowAmount || 0)})`}
            color="border-amber-500/20"
            iconColor="bg-amber-500/20 text-amber-400"
          />
          <StatCard
            icon={Unlock}
            label="Ready to Release"
            value={`${summary.readyForReleaseCount || 0} (${formatUSD(summary.readyForReleaseAmount || 0)})`}
            color="border-cyan-500/20"
            iconColor="bg-cyan-500/20 text-cyan-400"
          />
          <StatCard
            icon={Percent}
            label="Avg Gross Margin"
            value={`${summary.avgGrossMargin || 0}%`}
            color={(summary.avgGrossMargin || 0) >= 80 ? "border-emerald-500/20" : "border-red-500/20"}
            iconColor={(summary.avgGrossMargin || 0) >= 80 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}
          />
          <StatCard
            icon={TrendingUp}
            label="Studio Net Revenue"
            value={formatUSD(summary.totalNetRevenue || 0)}
            color="border-cyan-500/20"
            iconColor="bg-cyan-500/20 text-cyan-400"
          />
        </motion.div>
      )}

      {/* ── Flagged Margin Warning ── */}
      {summary && (summary.flaggedCount || 0) > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-center gap-3"
        >
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 text-sm font-semibold">
              Margin Alert: {summary.flaggedCount} deal{summary.flaggedCount !== 1 ? "s" : ""} below 80% target
            </p>
            <p className="text-red-400/60 text-xs mt-0.5">
              Review flagged payouts before approving. Override requires CEO authorization.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Ledger Table ── */}
      {loading && records.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex items-center justify-center py-16"
        >
          <RefreshCw size={24} className="animate-spin text-cyan-400/40" />
          <span className="ml-3 text-white/30 text-sm">
            Loading partner ledger...
          </span>
        </motion.div>
      ) : records.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="glass noise rounded-2xl border border-cyan-500/10 text-center py-16 px-6"
        >
          <Shield size={32} className="mx-auto text-cyan-400/30 mb-3" />
          <p className="text-white/40 text-sm font-medium">
            No closed-won deals yet
          </p>
          <p className="text-white/20 text-xs mt-1">
            Payout records are created automatically when a partner moves a lead to Closed Won.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={fadeUp}
          className="glass noise rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                    Deal / Partner
                  </th>
                  <th className="px-4 py-3 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-white/40 text-[10px] font-bold uppercase tracking-wider text-right">
                    TCV
                  </th>
                  <th className="px-4 py-3 text-white/40 text-[10px] font-bold uppercase tracking-wider text-right">
                    Partner Payout
                  </th>
                  <th className="px-4 py-3 text-white/40 text-[10px] font-bold uppercase tracking-wider text-right">
                    AI COGS
                  </th>
                  <th className="px-4 py-3 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                    Margin
                  </th>
                  <th className="px-4 py-3 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-white/40 text-[10px] font-bold uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {records.map((record) => (
                    <LedgerRow
                      key={record.id}
                      record={record}
                      onApprove={handleApprove}
                      onRelease={handleReleaseRequest}
                      approving={approving}
                      releasing={releasing}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-white/20 text-[10px]">
              {records.length} deal{records.length !== 1 ? "s" : ""} &middot;{" "}
              {summary?.escrowCount || 0} escrow &middot;{" "}
              {summary?.readyForReleaseCount || 0} ready &middot;{" "}
              {summary?.pendingCount || 0} pending &middot; {summary?.paidCount || 0} paid &middot;{" "}
              {summary?.flaggedCount || 0} flagged
            </span>
            <span className="text-white/20 text-[10px]">
              D1: partner_payouts &middot; 30-day escrow &middot; 80% margin target
            </span>
          </div>
        </motion.div>
      )}
      {/* ── Escrow Release Confirmation Modal ── */}
      <AnimatePresence>
        {confirmRelease && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmRelease(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass noise rounded-2xl border border-cyan-500/20 p-6 max-w-md w-full mx-4 shadow-2xl shadow-cyan-500/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Unlock size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Authorize Escrow Release</h3>
                  <p className="text-white/40 text-xs">Jamarr Mayes &mdash; CEO HITL Authorization</p>
                </div>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Deal</span>
                  <span className="text-white font-medium">
                    {confirmRelease.prospect_company || confirmRelease.prospect_name || `Payout #${confirmRelease.id}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Partner</span>
                  <span className="text-white font-medium">
                    {confirmRelease.partner_name || confirmRelease.partner_email || "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Amount</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {formatUSD(confirmRelease.partner_total_payout || 0)}
                  </span>
                </div>
              </div>

              <p className="text-white/50 text-xs mb-5 leading-relaxed">
                This will create a <span className="text-cyan-400 font-semibold">Stripe Transfer</span> to the
                partner&apos;s connected account. This action is irreversible. Are you sure you want to release
                these funds?
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setConfirmRelease(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReleaseConfirm}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-bold hover:bg-cyan-500/30 transition"
                >
                  Confirm &amp; Transfer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Named Export — CEO Dashboard tab embedding
// ═══════════════════════════════════════════════════════════════════════════

export function DisbursementsContent() {
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({
    totalPending: 0,
    totalCleared: 0,
    pendingAmountUSD: 0,
    clearedAmountUSD: 0,
    nextPayoutDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await fetchTreasuryLedger();
      setTickets(data.tickets ?? []);
      setSummary(
        data.summary ?? {
          totalPending: 0,
          totalCleared: 0,
          pendingAmountUSD: 0,
          clearedAmountUSD: 0,
          nextPayoutDate: "",
        }
      );
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

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      const result = await approveTreasuryPayout(id);
      if (result.ticket) {
        setTickets((prev) =>
          prev.map((t) => (t.id === id ? result.ticket : t))
        );
        setSummary((prev) => ({
          ...prev,
          totalPending: Math.max(0, prev.totalPending - 1),
          totalCleared: prev.totalCleared + 1,
          pendingAmountUSD: Math.max(0, prev.pendingAmountUSD - result.ticket.amount),
          clearedAmountUSD: prev.clearedAmountUSD + result.ticket.amount,
        }));
      }
    } catch (err) {
      setError(`Approval failed: ${err.message}`);
    } finally {
      setApproving(null);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-6 p-6"
    >
      {/* ══════════════════════════════════════════════════════════════════════
          Phase 23: Partner FinOps Ledger (top section — primary view)
         ══════════════════════════════════════════════════════════════════════ */}
      <PartnerFinOpsLedger />

      {/* ── Divider ── */}
      <div className="border-t border-white/5 my-2" />

      {/* ══════════════════════════════════════════════════════════════════════
          Phase 17: Autonomous Treasury (vendor payouts — secondary section)
         ══════════════════════════════════════════════════════════════════════ */}

      {/* ── Header ── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Banknote size={22} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Autonomous Treasury
              </h2>
              <p className="text-white/40 text-sm">
                Vendor Payouts &amp; Owner Draws &mdash; HITL Approval Gate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={refreshing ? "animate-spin" : ""}
              />
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
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <StatCard
          icon={CheckCircle}
          label="Total Cleared (30d)"
          value={formatUSD(summary.clearedAmountUSD)}
          color="border-emerald-500/20"
          iconColor="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard
          icon={DollarSign}
          label="Pending Payables"
          value={formatUSD(summary.pendingAmountUSD)}
          color="border-amber-500/20"
          iconColor="bg-amber-500/20 text-amber-400"
        />
        <StatCard
          icon={CalendarClock}
          label="Next Payout Date"
          value={formatNextPayout(summary.nextPayoutDate)}
          color="border-blue-500/20"
          iconColor="bg-blue-500/20 text-blue-400"
        />
      </motion.div>

      {/* ── Ledger Table ── */}
      {loading && tickets.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex items-center justify-center py-16"
        >
          <RefreshCw size={24} className="animate-spin text-amber-400/40" />
          <span className="ml-3 text-white/30 text-sm">
            Loading treasury ledger...
          </span>
        </motion.div>
      ) : tickets.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="glass noise rounded-2xl border border-amber-500/10 text-center py-16 px-6"
        >
          <Shield size={32} className="mx-auto text-amber-400/30 mb-3" />
          <p className="text-white/40 text-sm font-medium">
            Treasury ledger is empty
          </p>
          <p className="text-white/20 text-xs mt-1">
            Payouts are created automatically when vendor invoices are processed.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={fadeUp}
          className="glass noise rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                    Payee
                  </th>
                  <th className="px-4 py-3 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-white/40 text-[10px] font-bold uppercase tracking-wider text-right">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-white/40 text-[10px] font-bold uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {tickets.map((ticket) => (
                    <PayoutRow
                      key={ticket.id}
                      ticket={ticket}
                      onApprove={handleApprove}
                      approving={approving}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-white/20 text-[10px]">
              {tickets.length} payout{tickets.length !== 1 ? "s" : ""} &middot;{" "}
              {summary.totalPending} pending &middot; {summary.totalCleared}{" "}
              cleared
            </span>
            <span className="text-white/20 text-[10px]">
              KV prefix: finops:payout:* &middot; TTL: 180d
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

export default function Disbursements() {
  return (
    <div className="min-h-screen bg-[#0a0d14] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <DisbursementsContent />
      </div>
    </div>
  );
}
