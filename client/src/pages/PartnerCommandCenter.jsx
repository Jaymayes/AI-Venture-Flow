import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import {
  Eye,
  Users,
  DollarSign,
  Trophy,
  ArrowLeft,
  RefreshCw,
  Zap,
  Target,
  Activity,
  BarChart3,
  Mail,
  CheckCircle2,
  Clock,
  Pause,
  Play,
} from "lucide-react";
import { Link } from "wouter";

const API_BASE =
  import.meta.env.VITE_TRIAGE_API_BASE ||
  "https://api.referralsvc.com";

const STATUS_COLORS = {
  new: "bg-blue-500/20 text-blue-300",
  contacted: "bg-amber-500/20 text-amber-300",
  qualified: "bg-emerald-500/20 text-emerald-300",
  converted: "bg-purple-500/20 text-purple-300",
  nurturing: "bg-cyan-500/20 text-cyan-300",
  archived: "bg-white/10 text-white/40",
};

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "revenue-engine", label: "AI Revenue Engine", icon: Zap },
];

export default function PartnerCommandCenter() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [campaignLoading, setCampaignLoading] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const spEmail = sessionStorage.getItem("rsllc_fleet_email") || "";
      const res = await fetch(
        `${API_BASE}/api/v1/partners/${slug}/dashboard`,
        { headers: { "x-partner-email": spEmail } },
      );
      if (!res.ok) {
        if (res.status === 404) throw new Error("Partner not found");
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to load dashboard");
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
        setError(null);
      } else {
        throw new Error(json.error || "Unknown error");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchCampaign = useCallback(async () => {
    setCampaignLoading(true);
    try {
      const spEmail = sessionStorage.getItem("rsllc_fleet_email") || "";
      const res = await fetch(
        `${API_BASE}/api/v1/partners/${slug}/campaign`,
        { headers: { "x-partner-email": spEmail } },
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success) setCampaign(json);
      }
    } catch {
      // Non-fatal — campaign data may not exist yet
    } finally {
      setCampaignLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  useEffect(() => {
    if (activeTab === "revenue-engine" && !campaign) {
      fetchCampaign();
    }
  }, [activeTab, campaign, fetchCampaign]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw size={24} className="text-violet-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass noise rounded-2xl p-8 max-w-md w-full border border-white/10 text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/40 text-xs hover:text-white/60 transition-colors"
          >
            <ArrowLeft size={12} />
            Back to Referral Service LLC
          </Link>
        </div>
      </div>
    );
  }

  const { card, analytics, leadStats, leads, earnings, ledger } = data;

  const pendingFmt = `$${((earnings?.pendingPayouts ?? 0) / 100).toFixed(2)}`;
  const earnedFmt = `$${((earnings?.totalEarnings ?? 0) / 100).toFixed(2)}`;

  const kpis = [
    { label: "Card Views", value: analytics.views, icon: Eye, color: "text-blue-400", bg: "from-blue-500/20 to-blue-500/5" },
    { label: "Leads Generated", value: leadStats.totalLeads, icon: Users, color: "text-purple-400", bg: "from-purple-500/20 to-purple-500/5" },
    { label: "Pending Commission", value: pendingFmt, icon: DollarSign, color: "text-amber-400", bg: "from-amber-500/20 to-amber-500/5", isFormatted: true },
    { label: "Lifetime Earned", value: earnedFmt, icon: Trophy, color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5", isFormatted: true },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-between mb-6"
        >
          <div>
            <p className="text-white/30 text-xs tracking-widest uppercase mb-1">
              Referral Service LLC
            </p>
            <h1 className="text-2xl font-bold gradient-text">
              SP Command Center
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Welcome back,{" "}
              <span className="text-white font-medium">{card.fullName}</span>
              {card.company ? ` \u2014 ${card.company}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setLoading(true); fetchDashboard(); }}
              className="text-white/30 hover:text-white/60 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors"
            >
              <ArrowLeft size={12} />
              Home
            </Link>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.05 }}
          className="flex gap-1 mb-8 p-1 glass noise rounded-xl border border-white/5 w-fit"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB: Dashboard                                                */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "dashboard" && (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {kpis.map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.05 * i }}
                  className="glass noise rounded-xl p-5 border border-white/5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.bg} flex items-center justify-center`}>
                      <kpi.icon size={18} className={kpi.color} />
                    </div>
                    <p className="text-white/40 text-xs">{kpi.label}</p>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {kpi.isFormatted ? kpi.value : kpi.value.toLocaleString()}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Pipeline */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.15 }}
                className="glass noise rounded-2xl border border-white/5 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Pipeline</h2>
                    <p className="text-xs text-white/30 mt-0.5">
                      {leadStats.totalLeads} total
                      {leadStats.newLeads > 0 && ` \u00B7 ${leadStats.newLeads} new`}
                      {leadStats.qualifiedLeads > 0 && ` \u00B7 ${leadStats.qualifiedLeads} qualified`}
                      {leadStats.convertedLeads > 0 && ` \u00B7 ${leadStats.convertedLeads} converted`}
                    </p>
                  </div>
                  <Users size={14} className="text-white/20" />
                </div>

                {leads.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <Users size={32} className="text-white/10 mx-auto mb-3" />
                    <p className="text-white/30 text-sm">No leads captured yet</p>
                    <p className="text-white/20 text-xs mt-1">
                      Leads appear here as visitors engage with your card.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left min-w-[500px]">
                      <thead>
                        <tr className="text-white/30 text-xs border-b border-white/5 sticky top-0 bg-black/40 backdrop-blur">
                          <th className="px-5 py-3 font-medium">Name</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                          <th className="px-5 py-3 font-medium text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((lead) => (
                          <tr
                            key={lead.id}
                            className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-5 py-3">
                              <p className="text-sm text-white truncate">{lead.visitorName || "\u2014"}</p>
                              <p className="text-xs text-white/30 truncate">{lead.visitorEmail || ""}</p>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status] || STATUS_COLORS.archived}`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs text-white/30 text-right whitespace-nowrap">
                              {new Date(lead.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>

              {/* Right: Payout Ledger */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2 }}
                className="glass noise rounded-2xl border border-white/5 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Payout Ledger</h2>
                    <p className="text-xs text-white/30 mt-0.5">
                      {earnings.totalCommissions} transaction{earnings.totalCommissions !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <DollarSign size={14} className="text-white/20" />
                </div>

                {(!ledger || ledger.length === 0) ? (
                  <div className="px-5 py-12 text-center">
                    <DollarSign size={32} className="text-white/10 mx-auto mb-3" />
                    <p className="text-white/30 text-sm">No commission transactions yet</p>
                    <p className="text-white/20 text-xs mt-1">
                      Commissions appear here when your referred deals close.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    <div className="divide-y divide-white/5">
                      {ledger.map((tx) => (
                        <div key={tx.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                          <div>
                            <p className="text-sm font-medium text-white">
                              ${(tx.commissionAmount / 100).toFixed(2)}
                            </p>
                            <p className="text-xs text-white/30">
                              Deal rev: ${(tx.totalRevenue / 100).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              tx.status === "paid"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}>
                              {tx.status}
                            </span>
                            <p className="text-xs text-white/30 mt-1">
                              {new Date(tx.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB: AI Revenue Engine                                        */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "revenue-engine" && (
          <RevenueEngineTab
            campaign={campaign}
            loading={campaignLoading}
            onRefresh={fetchCampaign}
            partnerName={card.fullName}
          />
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/20 text-xs hover:text-white/40 transition-colors"
          >
            <ArrowLeft size={12} />
            referralsvc.com
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue Engine Tab Component
// ---------------------------------------------------------------------------

function RevenueEngineTab({ campaign, loading, onRefresh, partnerName }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={20} className="text-violet-400 animate-spin" />
      </div>
    );
  }

  // No campaign configured yet — onboarding CTA
  if (!campaign?.config) {
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="glass noise rounded-2xl border border-white/5 p-8 text-center max-w-lg mx-auto"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/10 flex items-center justify-center mx-auto mb-5">
          <Zap size={28} className="text-violet-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Your AI Revenue Engine
        </h2>
        <p className="text-white/40 text-sm leading-relaxed mb-6">
          Once activated, our AI hunts for qualified prospects on your behalf
          24/7. It drafts personalized outreach, manages follow-ups, and books
          meetings directly into your pipeline.
        </p>
        <div className="space-y-3 text-left mb-8">
          {[
            "AI-drafted outreach tailored to your service offering",
            "Autonomous follow-up sequences with adaptive timing",
            "Prospects routed directly to your Digital Business Card",
          ].map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-white/50 text-xs">{feature}</p>
            </div>
          ))}
        </div>
        <p className="text-white/20 text-xs">
          Contact your account manager to activate your Revenue Engine.
        </p>
      </motion.div>
    );
  }

  const cfg = campaign.config;
  const stats = campaign.stats || {};
  const recentActivity = campaign.recentActivity || [];

  const engineKpis = [
    {
      label: "Prospects Found",
      value: stats.prospectsFound ?? 0,
      icon: Target,
      color: "text-violet-400",
      bg: "from-violet-500/20 to-violet-500/5",
    },
    {
      label: "Emails Sent",
      value: stats.emailsSent ?? 0,
      icon: Mail,
      color: "text-blue-400",
      bg: "from-blue-500/20 to-blue-500/5",
    },
    {
      label: "Open Rate",
      value: stats.emailsSent > 0
        ? `${Math.round(((stats.opens ?? 0) / stats.emailsSent) * 100)}%`
        : "\u2014",
      icon: Eye,
      color: "text-cyan-400",
      bg: "from-cyan-500/20 to-cyan-500/5",
      isFormatted: true,
    },
    {
      label: "Replies",
      value: stats.replies ?? 0,
      icon: Activity,
      color: "text-emerald-400",
      bg: "from-emerald-500/20 to-emerald-500/5",
    },
  ];

  return (
    <>
      {/* Engine Status Bar */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="glass noise rounded-xl border border-white/5 p-4 mb-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${cfg.is_active ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
          <div>
            <p className="text-sm font-medium text-white">
              {cfg.is_active ? "Engine Active" : "Engine Paused"}
            </p>
            <p className="text-xs text-white/30">
              Hunting for {partnerName}
              {cfg.target_verticals?.length > 0 && ` in ${JSON.parse(cfg.target_verticals).join(", ")}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            cfg.is_active
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-white/10 text-white/40"
          }`}>
            {cfg.is_active ? "LIVE" : "PAUSED"}
          </span>
          <button
            onClick={onRefresh}
            className="text-white/30 hover:text-white/60 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </motion.div>

      {/* Engine KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {engineKpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.05 * i }}
            className="glass noise rounded-xl p-5 border border-white/5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon size={18} className={kpi.color} />
              </div>
              <p className="text-white/40 text-xs">{kpi.label}</p>
            </div>
            <p className="text-3xl font-bold text-white">
              {kpi.isFormatted ? kpi.value : (typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Two-Column: Config + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Campaign Config */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }}
          className="glass noise rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Campaign Config</h2>
            <Target size={14} className="text-white/20" />
          </div>
          <div className="px-5 py-4 space-y-4">
            <ConfigRow label="Service Offering" value={cfg.service_offering} />
            <ConfigRow label="DBC Link" value={`referralsvc.com/c/${cfg.dbc_slug}`} />
            <ConfigRow
              label="Target Verticals"
              value={
                cfg.target_verticals && cfg.target_verticals !== "[]"
                  ? JSON.parse(cfg.target_verticals).join(", ")
                  : "All industries"
              }
            />
            <ConfigRow
              label="Company Size"
              value={`${cfg.headcount_min}\u2013${cfg.headcount_max} employees`}
            />
            <ConfigRow
              label="Campaign Type"
              value="hunt_for_sp"
              badge
            />
          </div>
        </motion.div>

        {/* Right: Recent Activity */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="glass noise rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
            <Activity size={14} className="text-white/20" />
          </div>

          {recentActivity.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Clock size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No activity yet</p>
              <p className="text-white/20 text-xs mt-1">
                Outreach events will appear here as the engine runs.
              </p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <div className="divide-y divide-white/5">
                {recentActivity.map((item, i) => (
                  <div key={i} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-white truncate">{item.prospectName}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                        item.status === "sent" ? "bg-blue-500/20 text-blue-300"
                          : item.status === "opened" ? "bg-amber-500/20 text-amber-300"
                          : item.status === "replied" ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/10 text-white/40"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/30 truncate">
                      {item.company} &middot; {item.channel}
                    </p>
                    <p className="text-xs text-white/20 mt-0.5">
                      {new Date(item.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

function ConfigRow({ label, value, badge = false }) {
  return (
    <div className="flex items-start justify-between">
      <p className="text-xs text-white/40">{label}</p>
      {badge ? (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
          {value}
        </span>
      ) : (
        <p className="text-xs text-white/70 text-right max-w-[60%] truncate">{value}</p>
      )}
    </div>
  );
}
