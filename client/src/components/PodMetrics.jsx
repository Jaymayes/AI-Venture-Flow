/**
 * PodMetrics.jsx — Pod Telemetry & FinOps Dashboard
 *
 * Displays real-time operational telemetry for the Sovereign Professional:
 *   - Total Active Outreach (leads in pipeline)
 *   - Current CPL (Cost Per Lead) — FinOps budget protection
 *   - Total Pipeline Value (aggregate TCV of scored leads)
 *   - Model Tier Distribution (edge/mid/premium routing)
 *   - Gross Margin Posture (target >= 80%)
 *   - Token Governor Status (TPM usage)
 *
 * Data source: GET /api/triage/analytics (God View telemetry)
 *              GET /api/finops/disbursements (margin & payout data)
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  DollarSign,
  TrendingUp,
  Zap,
  Shield,
  BarChart3,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Cpu,
  Gauge,
  Target,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { fetchAnalytics, fetchDisbursements } from "../lib/sp-api-client";

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function MetricCard({ label, value, subValue, icon: Icon, iconColor = "text-primary", accent }) {
  return (
    <motion.div
      variants={fadeUp}
      className="glass noise relative overflow-hidden rounded-2xl p-4"
    >
      {/* Accent glow */}
      {accent && (
        <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${accent} blur-[40px] opacity-30`} />
      )}
      <div className="flex items-start justify-between relative z-10">
        <div className="min-w-0">
          <div className="text-[11px] text-white/40 font-medium">{label}</div>
          <div className={`mt-1 text-2xl font-bold ${iconColor}`}>{value}</div>
          {subValue && (
            <div className="text-[10px] text-white/25 mt-0.5">{subValue}</div>
          )}
        </div>
        {Icon && (
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${iconColor.replace("text-", "bg-")}/10`}>
            <Icon size={18} className={`${iconColor} opacity-70`} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Margin Gauge
// ---------------------------------------------------------------------------

function MarginGauge({ marginPct }) {
  const isHealthy = marginPct >= 80;
  const clamp = Math.max(0, Math.min(100, marginPct));

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield size={16} className={isHealthy ? "text-emerald-400" : "text-red-400"} />
          <span className="text-[11px] text-white/40 font-medium">Gross Margin Posture</span>
        </div>
        <span className={`text-sm font-bold ${isHealthy ? "text-emerald-400" : "text-red-400"}`}>
          {marginPct.toFixed(1)}%
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamp}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${
            isHealthy
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : "bg-gradient-to-r from-red-500 to-amber-500"
          }`}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[9px] text-white/20">0%</span>
        <span className="text-[9px] text-white/30 font-medium">Target: 80%</span>
        <span className="text-[9px] text-white/20">100%</span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Model Tier Distribution
// ---------------------------------------------------------------------------

function TierDistribution({ tiers }) {
  const total = (tiers?.edge || 0) + (tiers?.mid || 0) + (tiers?.premium || 0);
  if (total === 0) return null;

  const pctEdge = ((tiers.edge / total) * 100).toFixed(0);
  const pctMid = ((tiers.mid / total) * 100).toFixed(0);
  const pctPremium = ((tiers.premium / total) * 100).toFixed(0);

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cpu size={16} className="text-primary" />
        <span className="text-[11px] text-white/40 font-medium">Model Tier Routing</span>
      </div>
      <div className="space-y-2.5">
        {/* Edge Tier */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/50">Edge (Llama 3.3)</span>
            <span className="text-[10px] text-cyan-400 font-bold">{pctEdge}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${pctEdge}%` }} />
          </div>
        </div>
        {/* Mid Tier */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/50">Mid (Llama 70B)</span>
            <span className="text-[10px] text-amber-400 font-bold">{pctMid}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-amber-500" style={{ width: `${pctMid}%` }} />
          </div>
        </div>
        {/* Premium Tier */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/50">Premium (Z.AI GLM-5)</span>
            <span className="text-[10px] text-primary font-bold">{pctPremium}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pctPremium}%` }} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[9px] text-white/20">
        <Target size={9} />
        <span>Target edge ratio: 80%</span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PodMetrics() {
  const { token, logout } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [disbursements, setDisbursements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const usd = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n);

  const usdShort = (n) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return usd(n);
  };

  const loadMetrics = useCallback(async () => {
    try {
      const [analyticsData, disbData] = await Promise.all([
        fetchAnalytics(token),
        fetchDisbursements(token),
      ]);

      if (analyticsData?.unauthorized || disbData?.unauthorized) {
        logout();
        return;
      }

      setAnalytics(analyticsData);
      setDisbursements(disbData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, logout]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  // ── Compute derived metrics ──
  const totalOutreach = analytics?.totalLeads ?? analytics?.pipeline?.totalLeads ?? 0;
  const highIntent = analytics?.highIntentCount ?? analytics?.pipeline?.highIntent ?? 0;
  const avgScore = analytics?.avgIntentScore ?? analytics?.pipeline?.avgScore ?? 0;
  const pipelineValue = analytics?.pipelineValueUSD ?? analytics?.pipeline?.totalTCV ?? 0;

  // CPL from analytics or compute from disbursements
  const cpl = analytics?.costPerLead ?? analytics?.finops?.costPerLead ?? 0;

  // Margin from disbursements
  const payouts = disbursements?.payouts || [];
  const grossMarginPct =
    payouts.length > 0
      ? payouts.reduce((sum, p) => sum + (p.grossMarginPct ?? 0), 0) / payouts.length
      : 80; // Default to target when no data

  // Model tiers (from analytics if available)
  const modelTiers = analytics?.modelTiers || analytics?.finops?.modelTiers || null;

  // TPM usage
  const tpmCurrent = analytics?.tpmCurrent ?? analytics?.finops?.tpmCurrent ?? 0;
  const tpmThrottle = analytics?.tpmThrottle ?? 50000;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-primary" />
          <p className="mt-3 text-sm text-white/40">Loading telemetry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4 text-center">
        <AlertTriangle size={24} className="mx-auto text-red-400 mb-2" />
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-3 px-4 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/10">
            <Activity size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Pod Telemetry</h2>
            <p className="text-[11px] text-white/30">Real-time FinOps & pipeline metrics</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-xs border border-white/10 hover:bg-white/10 transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Primary KPIs */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4"
      >
        <MetricCard
          label="Active Outreach"
          value={totalOutreach}
          subValue={`${highIntent} high-intent`}
          icon={BarChart3}
          iconColor="text-cyan-400"
          accent="bg-cyan-500"
        />
        <MetricCard
          label="Cost Per Lead"
          value={usd(cpl)}
          subValue="Target: < $50.00"
          icon={DollarSign}
          iconColor={cpl <= 50 ? "text-emerald-400" : "text-red-400"}
          accent={cpl <= 50 ? "bg-emerald-500" : "bg-red-500"}
        />
        <MetricCard
          label="Pipeline Value"
          value={usdShort(pipelineValue)}
          subValue={`Avg score: ${avgScore.toFixed(0)}/100`}
          icon={TrendingUp}
          iconColor="text-primary"
          accent="bg-primary"
        />
        <MetricCard
          label="TPM Usage"
          value={`${(tpmCurrent / 1000).toFixed(1)}K`}
          subValue={`Throttle: ${(tpmThrottle / 1000).toFixed(0)}K`}
          icon={Gauge}
          iconColor={tpmCurrent < tpmThrottle * 0.8 ? "text-amber-400" : "text-red-400"}
          accent="bg-amber-500"
        />
      </motion.div>

      {/* Secondary metrics row */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-3"
      >
        <MarginGauge marginPct={grossMarginPct} />
        {modelTiers ? (
          <TierDistribution tiers={modelTiers} />
        ) : (
          <motion.div variants={fadeUp} className="glass noise rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-accent" />
              <span className="text-[11px] text-white/40 font-medium">Execution Governor</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5 text-center">
                <p className="text-lg font-bold text-emerald-400">{disbursements?.summary?.totalApproved ?? 0}</p>
                <p className="text-[9px] text-white/30">Approved Payouts</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5 text-center">
                <p className="text-lg font-bold text-amber-400">{disbursements?.summary?.totalPending ?? 0}</p>
                <p className="text-[9px] text-white/30">Pending Approval</p>
              </div>
            </div>
            {disbursements?.summary?.pendingAmountUSD != null && (
              <div className="mt-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 p-2.5 text-center">
                <p className="text-xs text-white/40">Pending Disbursement</p>
                <p className="text-lg font-bold gradient-text">
                  {usd(disbursements.summary.pendingAmountUSD)}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
