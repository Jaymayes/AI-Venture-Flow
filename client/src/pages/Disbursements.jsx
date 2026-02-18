import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  FileText,
  RefreshCw,
  Banknote,
  UserCheck,
  Lock,
} from "lucide-react";
import { MOCK_COMMISSIONS } from "../lib/mock-disbursements";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DISBURSEMENT_API =
  "https://moltbot-triage-engine.jamarr.workers.dev/api/disbursement";
const POLL_INTERVAL = 30_000;

// Use mock data until live Stripe Connect accounts exist
const USE_MOCK = true;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtUSD = (n) =>
  `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtPct = (n) => `${((n ?? 0) * 100).toFixed(1)}%`;
const fmtDate = (iso) => {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const marginColor = (m) =>
  m >= 0.80 ? "text-emerald-400" : m >= 0.75 ? "text-amber-400" : "text-red-400";
const marginBg = (m) =>
  m >= 0.80 ? "bg-emerald-500/20" : m >= 0.75 ? "bg-amber-500/20" : "bg-red-500/20";
const marginBorder = (m) =>
  m >= 0.80 ? "border-emerald-500/30" : m >= 0.75 ? "border-amber-500/30" : "border-red-500/30";

const statusConfig = {
  staged: { label: "Pending Approval", color: "text-cyan-400", bg: "bg-cyan-500/20", icon: Clock },
  blocked: { label: "W-9 Blocked", color: "text-amber-400", bg: "bg-amber-500/20", icon: Lock },
  audit_required: { label: "Audit Required", color: "text-red-400", bg: "bg-red-500/20", icon: AlertTriangle },
  disbursed: { label: "Disbursed", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: CheckCircle2 },
  approved: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: CheckCircle2 },
};

const w9Config = {
  verified: { label: "W-9 Verified", color: "text-emerald-400", bg: "bg-emerald-500/15", icon: UserCheck },
  received: { label: "W-9 Received", color: "text-cyan-400", bg: "bg-cyan-500/15", icon: FileText },
  pending: { label: "W-9 Pending", color: "text-amber-400", bg: "bg-amber-500/15", icon: AlertTriangle },
};

// ---------------------------------------------------------------------------
// API Layer
// ---------------------------------------------------------------------------

async function fetchDashboardLedger() {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 400));
    return { timestamp: new Date().toISOString(), ...MOCK_COMMISSIONS };
  }

  const res = await fetch(`${DISBURSEMENT_API}/dashboard`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function executeCEOApproval(commissionId) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return { success: true, transferId: `tr_mock_${Date.now()}`, amountUSD: 0 };
  }

  const res = await fetch(`${DISBURSEMENT_API}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commissionId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Transfer failed");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Stat Card (reusable)
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub, icon: Icon, iconColor = "text-primary" }) {
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
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Commission Row — The Gate-Enforcing Component
// ---------------------------------------------------------------------------

function CommissionRow({ commission, onApprove, isApproving }) {
  const s = statusConfig[commission.status] ?? statusConfig.staged;
  const w9 = w9Config[commission.w9Status] ?? w9Config.pending;
  const W9Icon = w9.icon;
  const StatusIcon = s.icon;

  const isW9Valid = commission.w9Status === "verified" || commission.w9Status === "received";
  const isMarginHealthy = (commission.marginHealth?.grossMargin ?? 0) >= 0.80;
  const isExecutable = isW9Valid && isMarginHealthy && commission.status === "staged";

  const deal = commission.deal ?? {};
  const margin = commission.marginHealth ?? {};

  return (
    <motion.div
      variants={fadeUp}
      className={`glass noise relative overflow-hidden rounded-2xl border ${
        !isMarginHealthy
          ? "border-red-500/40"
          : !isW9Valid
          ? "border-amber-500/40"
          : "border-white/5"
      }`}
    >
      <div className="p-4">
        {/* Header Row: SP name + status badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">{commission.spName}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.color}`}>
                <StatusIcon size={10} />
                {s.label}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-white/40">{commission.spBusinessEntity}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-bold text-white">{fmtUSD(deal.commissionUSD)}</div>
            <div className="text-[10px] text-white/30">
              {deal.commissionPercent}% of {fmtUSD(deal.tcvUSD)} TCV
            </div>
          </div>
        </div>

        {/* Detail Grid */}
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-4">
          <div>
            <span className="text-white/30">Client</span>
            <div className="font-medium text-white/80">{deal.clientName}</div>
          </div>
          <div>
            <span className="text-white/30">TCV</span>
            <div className="font-medium text-white/80">{fmtUSD(deal.tcvUSD)}</div>
          </div>
          <div>
            <span className="text-white/30">Gross Margin</span>
            <div className={`font-bold ${marginColor(margin.grossMargin)}`}>
              {fmtPct(margin.grossMargin)}
            </div>
          </div>
          <div>
            <span className="text-white/30">COGS</span>
            <div className="font-medium text-white/80">{fmtUSD(margin.cogsUSD)}</div>
          </div>
        </div>

        {/* Gate Badges + Action Row */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* W-9 Badge */}
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ${w9.bg} ${w9.color}`}>
              <W9Icon size={10} />
              {w9.label}
            </span>

            {/* Margin Badge */}
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ${marginBg(margin.grossMargin)} ${marginColor(margin.grossMargin)}`}>
              <TrendingUp size={10} />
              Margin {fmtPct(margin.grossMargin)}
            </span>

            {/* Staged date */}
            <span className="text-[10px] text-white/25">
              Staged {fmtDate(commission.stagedAt)}
            </span>
          </div>

          {/* THE CEO GATE — Approve & Disburse button */}
          {commission.status === "staged" && (
            <button
              disabled={!isExecutable || isApproving}
              onClick={() => onApprove(commission.commissionId)}
              className={`shrink-0 rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200 ${
                isExecutable
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95"
                  : "bg-white/5 text-white/25 cursor-not-allowed"
              }`}
            >
              {isApproving ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={12} className="animate-spin" />
                  Transferring...
                </span>
              ) : isExecutable ? (
                <span className="flex items-center gap-1.5">
                  <Banknote size={12} />
                  Approve & Disburse
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Lock size={12} />
                  {!isW9Valid ? "W-9 Required" : "Audit Required"}
                </span>
              )}
            </button>
          )}

          {/* Disbursed confirmation */}
          {commission.status === "disbursed" && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 size={14} />
              <span>Paid {fmtDate(commission.disbursedAt)}</span>
            </div>
          )}
        </div>

        {/* Block reason (if blocked/audit_required) */}
        {commission.blockReason && (
          <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-[11px] text-red-300/80">
            <AlertTriangle size={11} className="inline mr-1 -mt-0.5" />
            {commission.blockReason}
          </div>
        )}
      </div>

      {/* Margin health bar at bottom */}
      <div className="h-1 w-full bg-white/5">
        <div
          className={`h-full transition-all duration-700 ${
            isMarginHealthy
              ? "bg-gradient-to-r from-primary to-accent"
              : "bg-gradient-to-r from-red-500 to-amber-500"
          }`}
          style={{ width: `${Math.min((margin.grossMargin ?? 0) * 100, 100)}%` }}
        />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function Section({ icon: Icon, title, count, iconColor = "text-primary" }) {
  return (
    <div className="mb-3 mt-8 flex items-center gap-2.5 first:mt-0">
      {Icon && <Icon size={18} className={`${iconColor} opacity-70`} />}
      <h2 className="text-sm font-bold text-white/80">{title}</h2>
      {count != null && (
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/50">
          {count}
        </span>
      )}
    </div>
  );
}

// ===========================================================================
// Core Disbursement Content (shared between tab and standalone page)
// ===========================================================================

function useDisbursementState() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchDashboardLedger();
      setData(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  // CEO Approval handler
  const handleApprove = async (commissionId) => {
    const commission = [
      ...(data?.pendingApproval ?? []),
    ].find((c) => c.commissionId === commissionId);

    if (!commission) return;
    setConfirmModal(commission);
  };

  const confirmApproval = async () => {
    if (!confirmModal) return;
    const commissionId = confirmModal.commissionId;
    setConfirmModal(null);
    setApprovingId(commissionId);

    try {
      await executeCEOApproval(commissionId);
      await fetchData();
    } catch (err) {
      setError(`Transfer failed: ${err.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  return {
    data, loading, error, lastUpdated, approvingId, confirmModal,
    fetchData, handleApprove, confirmApproval, setConfirmModal,
  };
}

// ---------------------------------------------------------------------------
// Confirmation Modal (shared)
// ---------------------------------------------------------------------------

function ConfirmationModal({ confirmModal, onCancel, onConfirm }) {
  return (
    <AnimatePresence>
      {confirmModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="glass noise w-full max-w-md rounded-2xl border border-white/10 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <Banknote size={20} className="text-accent" />
              <h3 className="text-lg font-bold">Confirm Disbursement</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Partner</span>
                <span className="font-semibold">{confirmModal.spName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Client</span>
                <span>{confirmModal.deal?.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">TCV</span>
                <span>{fmtUSD(confirmModal.deal?.tcvUSD)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Commission</span>
                <span className="text-lg font-bold text-accent">
                  {fmtUSD(confirmModal.deal?.commissionUSD)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Margin</span>
                <span className={`font-bold ${marginColor(confirmModal.marginHealth?.grossMargin)}`}>
                  {fmtPct(confirmModal.marginHealth?.grossMargin)}
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[11px] text-amber-300/80">
              <AlertTriangle size={11} className="inline mr-1 -mt-0.5" />
              This action will transfer {fmtUSD(confirmModal.deal?.commissionUSD)} from the Referral Service LLC master Stripe balance to the partner's connected bank account. This cannot be undone.
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-semibold text-white/50 hover:text-white hover:border-white/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 rounded-lg bg-gradient-to-r from-primary to-accent py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition"
              >
                Approve & Transfer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Disbursement Body (the actual dashboard content — no header/chrome)
// ---------------------------------------------------------------------------

function DisbursementBody({ state }) {
  const {
    data, loading, error, approvingId, confirmModal,
    handleApprove, confirmApproval, setConfirmModal,
  } = state;
  const totals = data?.totals ?? {};

  return (
    <>
      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs text-red-300">
          <XCircle size={14} />
          {error}
        </div>
      )}

      {/* Aggregate Stat Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <StatCard
          label="Pending Approval"
          value={fmtUSD(totals.pendingAmountUSD)}
          sub={`${totals.pendingCount ?? 0} commission${(totals.pendingCount ?? 0) !== 1 ? "s" : ""}`}
          icon={Clock}
          iconColor="text-cyan-400"
        />
        <StatCard
          label="Blocked / Audit"
          value={totals.blockedCount ?? 0}
          sub="Requires review"
          icon={ShieldAlert}
          iconColor="text-amber-400"
        />
        <StatCard
          label="Disbursed (30d)"
          value={fmtUSD(totals.disbursedAmountLast30Days)}
          sub={`${totals.disbursedLast30Days ?? 0} transfer${(totals.disbursedLast30Days ?? 0) !== 1 ? "s" : ""}`}
          icon={CheckCircle2}
          iconColor="text-emerald-400"
        />
        <StatCard
          label="Margin Gate"
          value="0.80"
          sub="Minimum threshold"
          icon={ShieldCheck}
          iconColor="text-primary"
        />
      </motion.div>

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="mt-10 flex flex-col items-center gap-3 text-white/30">
          <RefreshCw size={24} className="animate-spin" />
          <span className="text-sm">Loading disbursement ledger...</span>
        </div>
      )}

      {data && (
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          {/* Section: Pending Approval */}
          <Section
            icon={DollarSign}
            title="Pending CEO Approval"
            count={(data.pendingApproval ?? []).length}
            iconColor="text-cyan-400"
          />
          {(data.pendingApproval ?? []).length === 0 ? (
            <div className="glass noise rounded-2xl p-6 text-center text-sm text-white/30">
              No commissions awaiting approval
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(data.pendingApproval ?? []).map((c) => (
                <CommissionRow
                  key={c.commissionId}
                  commission={c}
                  onApprove={handleApprove}
                  isApproving={approvingId === c.commissionId}
                />
              ))}
            </div>
          )}

          {/* Section: Blocked / Audit Required */}
          {(data.blocked ?? []).length > 0 && (
            <>
              <Section
                icon={AlertTriangle}
                title="Blocked / Audit Required"
                count={(data.blocked ?? []).length}
                iconColor="text-amber-400"
              />
              <div className="flex flex-col gap-3">
                {(data.blocked ?? []).map((c) => (
                  <CommissionRow
                    key={c.commissionId}
                    commission={c}
                    onApprove={handleApprove}
                    isApproving={false}
                  />
                ))}
              </div>
            </>
          )}

          {/* Section: Recently Disbursed */}
          {(data.recentlyDisbursed ?? []).length > 0 && (
            <>
              <Section
                icon={CheckCircle2}
                title="Recently Disbursed"
                count={(data.recentlyDisbursed ?? []).length}
                iconColor="text-emerald-400"
              />
              <div className="flex flex-col gap-3">
                {(data.recentlyDisbursed ?? []).map((c) => (
                  <CommissionRow
                    key={c.commissionId}
                    commission={c}
                    onApprove={handleApprove}
                    isApproving={false}
                  />
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        confirmModal={confirmModal}
        onCancel={() => setConfirmModal(null)}
        onConfirm={confirmApproval}
      />
    </>
  );
}

// ===========================================================================
// Embeddable Tab Content (used inside CEODashboard tab system)
// ===========================================================================

export function DisbursementsContent() {
  const state = useDisbursementState();
  const { fetchData, lastUpdated, loading } = state;

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 md:px-8">
      {/* Tab header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            <span className="gradient-text">Disbursement</span> Command Center
          </h1>
          <p className="text-xs text-white/40">
            Financial Execution Approval Mode — CEO Gate
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-white/25">
              {fmtTime(lastUpdated.toISOString())}
            </span>
          )}
          <button
            onClick={fetchData}
            className="rounded-lg p-1.5 text-white/30 hover:text-white hover:bg-white/5 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <DisbursementBody state={state} />
    </div>
  );
}

// ===========================================================================
// Standalone Page (accessible at /disbursements with its own header)
// ===========================================================================

export default function Disbursements() {
  const state = useDisbursementState();
  const { fetchData, lastUpdated, loading } = state;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-32 pt-8 sm:px-6">
      {/* Standalone Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ceo" className="text-white/30 hover:text-white transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Disbursement Command Center</h1>
          <p className="text-xs text-white/40">
            Financial Execution Approval Mode — CEO Gate
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-white/25">
              {fmtTime(lastUpdated.toISOString())}
            </span>
          )}
          <button
            onClick={fetchData}
            className="rounded-lg p-1.5 text-white/30 hover:text-white hover:bg-white/5 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <DisbursementBody state={state} />
    </div>
  );
}
