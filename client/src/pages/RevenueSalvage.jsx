import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  DollarSign,
  Clock,
  AlertTriangle,
  Skull,
  TrendingDown,
  TrendingUp,
  Zap,
  Shield,
  RefreshCw,
  Loader2,
  ChevronRight,
  Eye,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants — live endpoints only, no mock fallback
// ---------------------------------------------------------------------------
const API_BASE = "https://moltbot-triage-engine.jamarr.workers.dev/api";
const POLL_INTERVAL = 30_000;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtUSD = (n) =>
  `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

const fmtDate = (iso) => {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const fmtDelta = (d) => {
  if (d == null) return "\u2014";
  const sign = d >= 0 ? "+" : "";
  return `${sign}${(d * 100).toFixed(0)}%`;
};

// Burn-Down zone classification
function getZone(days) {
  if (days <= 10) return "green";
  if (days <= 17) return "amber";
  return "red";
}

const zoneConfig = {
  green: {
    label: "Active (1\u201310d)",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    headerBg: "from-emerald-500/20 to-emerald-500/5",
  },
  amber: {
    label: "At Risk (11\u201317d)",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    dot: "bg-amber-400",
    headerBg: "from-amber-500/20 to-amber-500/5",
  },
  red: {
    label: "Critical (18\u201321d+)",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
    dot: "bg-red-400",
    headerBg: "from-red-500/20 to-red-500/5",
  },
};

// Sentiment alert config
const alertConfig = {
  frustration_spike: {
    label: "Frustration Spike",
    color: "text-red-400",
    bg: "bg-red-500/20",
    icon: TrendingDown,
  },
  disengagement: {
    label: "Disengagement",
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    icon: Clock,
  },
  churn_imminent: {
    label: "Churn Imminent",
    color: "text-red-400",
    bg: "bg-red-500/15",
    icon: Skull,
    pulse: true,
  },
};

// ---------------------------------------------------------------------------
// Deal Card
// ---------------------------------------------------------------------------

function DealCard({ deal, onTakeover }) {
  const zone = getZone(deal.daysSinceHandoff);
  const zc = zoneConfig[zone];
  const alert = deal.sentimentAlert ? alertConfig[deal.sentimentAlert] : null;
  const AlertIcon = alert?.icon;
  const [confirming, setConfirming] = useState(false);

  const handleTakeover = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 5000);
      return;
    }
    if (onTakeover) onTakeover(deal.id);
    setConfirming(false);
  };

  return (
    <motion.div
      variants={fadeUp}
      className={`glass noise rounded-xl p-4 border ${zc.border} hover:border-white/20 transition-all relative overflow-hidden`}
    >
      {/* Blinking overlay for red zone */}
      {zone === "red" && (
        <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
      )}

      {/* Header: Prospect + TCV */}
      <div className="flex items-start justify-between mb-2 relative z-10">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm truncate">{deal.prospectName}</h4>
          <p className="text-white/40 text-xs truncate">{deal.prospectCompany}</p>
        </div>
        <div className="text-right ml-3">
          <p className={`text-sm font-bold ${zc.text}`}>{fmtUSD(deal.tcv)}</p>
          <p className="text-white/30 text-[10px]">TCV</p>
        </div>
      </div>

      {/* SP + Days counter */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <span className="text-white/50 text-xs">SP: {deal.spName}</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${zc.bg} ${zc.text}`}>
          <Clock size={10} />
          Day {deal.daysSinceHandoff}
        </span>
      </div>

      {/* Sentiment bar */}
      <div className="mb-2 relative z-10">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-white/40">Sentiment</span>
          <span className={deal.sentimentDelta >= 0 ? "text-emerald-400" : "text-red-400"}>
            {fmtDelta(deal.sentimentDelta)}
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              deal.sentimentScore >= 0.6
                ? "bg-emerald-400"
                : deal.sentimentScore >= 0.3
                  ? "bg-amber-400"
                  : "bg-red-400"
            }`}
            style={{ width: `${Math.max(5, (deal.sentimentScore ?? 0) * 100)}%` }}
          />
        </div>
      </div>

      {/* Sentiment Alert Badge */}
      {alert && (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${alert.bg} mb-2 relative z-10 ${alert.pulse ? "animate-pulse" : ""}`}>
          {AlertIcon && <AlertIcon size={12} className={alert.color} />}
          <span className={`text-[11px] font-semibold ${alert.color}`}>
            {alert.label} {deal.sentimentDelta != null && `\u0394 ${deal.sentimentDelta.toFixed(2)}`}
          </span>
        </div>
      )}

      {/* Last contact */}
      <p className="text-white/20 text-[10px] mb-3 relative z-10">
        Last contact: {fmtDate(deal.lastContactAt)} via {deal.channel?.toUpperCase()}
      </p>

      {/* Hostile Takeover button (only for amber/red) */}
      {zone !== "green" && (
        <button
          onClick={handleTakeover}
          className={`
            w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all relative z-10
            ${confirming
              ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30"
              : "bg-gradient-to-r from-red-600/80 to-orange-600/80 hover:from-red-500 hover:to-orange-500 text-white/90 hover:text-white"
            }
          `}
        >
          {confirming ? (
            <>
              <Skull size={14} />
              CONFIRM HOSTILE TAKEOVER
            </>
          ) : (
            <>
              <Flame size={14} />
              Execute Takeover Protocol
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Kanban Column
// ---------------------------------------------------------------------------

function KanbanColumn({ zone, deals }) {
  const zc = zoneConfig[zone];
  const totalTCV = deals.reduce((sum, d) => sum + (d.tcv ?? 0), 0);

  return (
    <div className="flex-1 min-w-[280px]">
      {/* Column Header */}
      <div className={`glass noise rounded-t-xl p-3 border-b ${zc.border} bg-gradient-to-r ${zc.headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${zc.dot} ${zone === "red" ? "animate-pulse" : ""}`} />
            <span className={`text-xs font-bold ${zc.text}`}>{zc.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-[10px]">{deals.length} deals</span>
            <span className={`text-xs font-semibold ${zc.text}`}>{fmtUSD(totalTCV)}</span>
          </div>
        </div>
      </div>

      {/* Cards */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3 mt-3">
        {deals.length === 0 && (
          <div className="text-center py-8 text-white/20 text-xs">No deals in this zone</div>
        )}
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RevenueSalvageContent (Named Export for CEO Tab)
// ---------------------------------------------------------------------------

export function RevenueSalvageContent() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchDeals = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("ceo_token") || localStorage.getItem("ceo_token");
      const res = await fetch(`${API_BASE}/override/pipeline`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      const allDeals = [
        ...(data.pipeline?.greenZone ?? []),
        ...(data.pipeline?.amberZone ?? []),
        ...(data.pipeline?.redZone ?? []),
      ].map((d) => ({
        id: d.dealId,
        prospectName: d.clientName,
        prospectCompany: d.clientCompany,
        spName: d.spName,
        tcv: d.projectedTcv,
        daysSinceHandoff: d.daysSinceHandoff,
        stage: d.stage,
        sentimentScore: d.sentimentScore,
        sentimentDelta: d.sentimentEmergency?.delta ?? 0,
        lastContactAt: d.lastContactAt,
        channel: d.channel,
        sentimentAlert: d.sentimentEmergency?.active
          ? d.sentimentEmergency.type
          : null,
      }));
      setDeals(allDeals);
      setLastRefresh(new Date());
    } catch (err) {
      console.warn("[RevenueSalvage] Fetch failed:", err.message);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
    const interval = setInterval(fetchDeals, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchDeals]);

  // Bucket deals into zones
  const greenDeals = deals.filter((d) => getZone(d.daysSinceHandoff) === "green");
  const amberDeals = deals.filter((d) => getZone(d.daysSinceHandoff) === "amber");
  const redDeals = deals.filter((d) => getZone(d.daysSinceHandoff) === "red");

  // At-Risk TCV (amber + red)
  const atRiskTCV = [...amberDeals, ...redDeals].reduce((sum, d) => sum + (d.tcv ?? 0), 0);
  const totalTCV = deals.reduce((sum, d) => sum + (d.tcv ?? 0), 0);
  const sentimentAlerts = deals.filter((d) => d.sentimentAlert).length;

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6 p-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Flame size={18} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Revenue Salvage & Override Command</h2>
              <p className="text-white/40 text-sm">
                21-Day Burn-Down Kanban \u00b7 Intercept decaying TCV before churn
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
              onClick={fetchDeals}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-red-400 transition-all"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass noise rounded-xl p-4 border border-white/10">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Total Pipeline TCV</p>
          <p className="text-white text-2xl font-bold">{fmtUSD(totalTCV)}</p>
          <p className="text-white/30 text-[10px] mt-1">{deals.length} active deals</p>
        </div>
        <div className="glass noise rounded-xl p-4 border border-red-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
          <p className="text-red-400 text-xs uppercase tracking-wider mb-1 relative z-10">At-Risk TCV</p>
          <p className="text-red-400 text-2xl font-bold relative z-10">{fmtUSD(atRiskTCV)}</p>
          <p className="text-red-400/50 text-[10px] mt-1 relative z-10">
            {amberDeals.length + redDeals.length} deals in danger zone
          </p>
        </div>
        <div className="glass noise rounded-xl p-4 border border-amber-500/20">
          <p className="text-amber-400 text-xs uppercase tracking-wider mb-1">Sentiment Alerts</p>
          <p className="text-amber-400 text-2xl font-bold">{sentimentAlerts}</p>
          <p className="text-white/30 text-[10px] mt-1">Active emergency overlays</p>
        </div>
        <div className="glass noise rounded-xl p-4 border border-emerald-500/20">
          <p className="text-emerald-400 text-xs uppercase tracking-wider mb-1">Safe Zone</p>
          <p className="text-emerald-400 text-2xl font-bold">{greenDeals.length}</p>
          <p className="text-white/30 text-[10px] mt-1">
            {fmtUSD(greenDeals.reduce((s, d) => s + (d.tcv ?? 0), 0))} TCV protected
          </p>
        </div>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-red-400 animate-spin" />
          <span className="text-white/40 text-sm ml-3">Loading pipeline...</span>
        </div>
      )}

      {/* 21-Day Kanban Board */}
      {!loading && (
        <motion.div variants={fadeUp} className="flex gap-4 overflow-x-auto pb-4">
          <KanbanColumn zone="green" deals={greenDeals} />
          <KanbanColumn zone="amber" deals={amberDeals} />
          <KanbanColumn zone="red" deals={redDeals} />
        </motion.div>
      )}

      {/* Protocol Legend */}
      <motion.div variants={fadeUp} className="glass noise rounded-xl p-4 border border-white/10">
        <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">
          Hostile Takeover Protocol \u2014 What Happens on Execute
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <Shield size={14} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-white/70 font-medium">IAM Revocation</span>
              <p className="text-white/30">SP write-access downgraded to read-only</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Zap size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-white/70 font-medium">SOW Generation</span>
              <p className="text-white/30">$30K capped bi-weekly DocuSign envelope auto-sent</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <TrendingDown size={14} className="text-orange-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-white/70 font-medium">Drip Demotion</span>
              <p className="text-white/30">SP demoted to 15% Override drip commission</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function RevenueSalvage() {
  return (
    <div className="min-h-screen bg-[#0a0d14] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <RevenueSalvageContent />
      </div>
    </div>
  );
}
