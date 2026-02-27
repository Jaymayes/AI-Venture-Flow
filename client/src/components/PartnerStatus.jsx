/**
 * PartnerStatus.jsx — Sovereign Professional Status & SOW Details
 *
 * Displays the SP's current engagement tier, retainer, commission rate,
 * and pipeline summary. Serves as the SP's identity card within the
 * Launchpad Dashboard.
 *
 * Tiers (from FinOps 2.0 SP Compensation Policy):
 *   Standard:            $50K TCV  | $2,000/mo retainer | 15% commission
 *   Strategic Growth:    $150K TCV | $4,000/mo retainer | 17.5% commission
 *   Enterprise Architect: $250K+ TCV | $6,000/mo retainer | 20% commission
 *
 * Data source: GET /api/sp/ledger (SP records with tier & pipeline stats)
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Award,
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Crown,
  Star,
  Rocket,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { fetchSPLedger } from "../lib/sp-api-client";

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ---------------------------------------------------------------------------
// Tier Configuration
// ---------------------------------------------------------------------------

const TIER_CONFIG = {
  pilot: {
    label: "Standard",
    icon: Star,
    color: "text-cyan-400",
    bg: "bg-cyan-500",
    gradient: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-500/20",
    retainer: 2000,
    commission: 15,
    minTcv: 50000,
  },
  standard: {
    label: "Strategic Growth",
    icon: Rocket,
    color: "text-primary",
    bg: "bg-primary",
    gradient: "from-primary/20 to-violet-500/20",
    border: "border-primary/20",
    retainer: 4000,
    commission: 17.5,
    minTcv: 150000,
  },
  enterprise: {
    label: "Enterprise Architect",
    icon: Crown,
    color: "text-amber-400",
    bg: "bg-amber-500",
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/20",
    retainer: 6000,
    commission: 20,
    minTcv: 250000,
  },
};

// ---------------------------------------------------------------------------
// Tier Badge
// ---------------------------------------------------------------------------

function TierBadge({ tierKey }) {
  const tier = TIER_CONFIG[tierKey] || TIER_CONFIG.pilot;
  const TierIcon = tier.icon;

  return (
    <motion.div
      variants={fadeUp}
      className={`glass noise rounded-2xl p-5 border ${tier.border} relative overflow-hidden`}
    >
      {/* Background glow */}
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${tier.bg} blur-[50px] opacity-20`} />

      <div className="relative z-10">
        {/* Tier icon + label */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${tier.gradient} border ${tier.border}`}>
            <TierIcon size={24} className={tier.color} />
          </div>
          <div>
            <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Engagement Tier</p>
            <p className={`text-lg font-bold ${tier.color}`}>{tier.label}</p>
          </div>
        </div>

        {/* Tier stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 text-center">
            <p className="text-[10px] text-white/30">Monthly Retainer</p>
            <p className="text-lg font-bold text-white">
              ${tier.retainer.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 text-center">
            <p className="text-[10px] text-white/30">Commission</p>
            <p className={`text-lg font-bold ${tier.color}`}>{tier.commission}%</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 text-center">
            <p className="text-[10px] text-white/30">Min TCV</p>
            <p className="text-lg font-bold text-white/70">
              ${(tier.minTcv / 1000).toFixed(0)}K
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// SOW Status Card
// ---------------------------------------------------------------------------

function SOWStatus({ sp }) {
  const sowStatus = sp?.sowStatus || "active";
  const isActive = sowStatus === "active" || sowStatus === "signed";

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={16} className="text-accent" />
        <span className="text-[11px] text-white/40 font-medium">SOW Status</span>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/5 p-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
          <div>
            <p className="text-sm text-white font-medium capitalize">{sowStatus}</p>
            <p className="text-[10px] text-white/25">
              {sp?.onboardedAt
                ? `Since ${new Date(sp.onboardedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : "Pending activation"}
            </p>
          </div>
        </div>
        {isActive && (
          <CheckCircle2 size={18} className="text-emerald-400" />
        )}
      </div>

      {/* Contract details */}
      {sp?.name && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/30">Partner</span>
            <span className="text-white/70 font-medium">{sp.name}</span>
          </div>
          {sp?.email && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/30">Contact</span>
              <span className="text-white/50">{sp.email}</span>
            </div>
          )}
          {sp?.region && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/30">Region</span>
              <span className="text-white/50">{sp.region}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Summary
// ---------------------------------------------------------------------------

function PipelineSummary({ stats }) {
  const usd = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase size={16} className="text-primary" />
        <span className="text-[11px] text-white/40 font-medium">Pipeline Summary</span>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-cyan-400" />
            <span className="text-xs text-white/50">Total Leads</span>
          </div>
          <span className="text-sm font-bold text-white">{stats?.totalLeads ?? 0}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-xs text-white/50">Active Deals</span>
          </div>
          <span className="text-sm font-bold text-emerald-400">{stats?.activeDeals ?? 0}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-primary" />
            <span className="text-xs text-white/50">Commission Earned</span>
          </div>
          <span className="text-sm font-bold gradient-text">
            {usd(stats?.commissionEarned ?? 0)}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Award size={14} className="text-amber-400" />
            <span className="text-xs text-white/50">Conversion Rate</span>
          </div>
          <span className="text-sm font-bold text-amber-400">
            {(stats?.conversionRate ?? 0).toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tier Progression
// ---------------------------------------------------------------------------

function TierProgression({ currentTier }) {
  const tierOrder = ["pilot", "standard", "enterprise"];
  const currentIdx = tierOrder.indexOf(currentTier);

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-accent" />
        <span className="text-[11px] text-white/40 font-medium">Tier Progression</span>
      </div>

      <div className="flex items-center gap-1">
        {tierOrder.map((key, idx) => {
          const tier = TIER_CONFIG[key];
          const TierIcon = tier.icon;
          const isActive = idx <= currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={key} className="flex items-center flex-1">
              <div className={`flex flex-col items-center flex-1 ${isCurrent ? "scale-110" : ""}`}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                  isActive
                    ? `bg-gradient-to-br ${tier.gradient} border ${tier.border}`
                    : "bg-white/5 border border-white/10"
                }`}>
                  <TierIcon size={14} className={isActive ? tier.color : "text-white/20"} />
                </div>
                <span className={`text-[8px] mt-1 font-medium ${
                  isCurrent ? tier.color : isActive ? "text-white/40" : "text-white/15"
                }`}>
                  {tier.label.split(" ")[0]}
                </span>
              </div>
              {idx < tierOrder.length - 1 && (
                <ChevronRight size={12} className={`shrink-0 mx-0.5 ${
                  idx < currentIdx ? "text-white/30" : "text-white/10"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PartnerStatus() {
  const { token, logout } = useAuth();
  const [spData, setSpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchSPLedger(token);
      if (data?.unauthorized) {
        logout();
        return;
      }
      setSpData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-primary" />
          <p className="mt-3 text-sm text-white/40">Loading partner status...</p>
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
          onClick={() => { setLoading(true); loadData(); }}
          className="mt-3 px-4 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // Extract SP record (first partner or summary)
  const sp = spData?.partners?.[0] || spData?.sp || {};
  const tierKey = sp?.tier || "standard";
  const stats = spData?.stats || spData?.summary || {
    totalLeads: sp?.totalLeads ?? 0,
    activeDeals: sp?.activeDeals ?? 0,
    commissionEarned: sp?.commissionEarned ?? 0,
    conversionRate: sp?.conversionRate ?? 0,
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/10">
          <Award size={18} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Partner Status</h2>
          <p className="text-[11px] text-white/30">Your engagement tier, SOW & pipeline</p>
        </div>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
        {/* Tier badge — hero card */}
        <TierBadge tierKey={tierKey} />

        {/* Two-column grid for SOW + Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SOWStatus sp={sp} />
          <PipelineSummary stats={stats} />
        </div>

        {/* Tier progression bar */}
        <TierProgression currentTier={tierKey} />
      </motion.div>
    </div>
  );
}
