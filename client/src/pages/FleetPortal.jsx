import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import {
  Eye,
  Download,
  Users,
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  DollarSign,
} from "lucide-react";
import { Link } from "wouter";

const API_BASE =
  import.meta.env.VITE_TRIAGE_API_BASE ||
  "https://moltbot-triage-engine.jamarr.workers.dev";

const STATUS_COLORS = {
  new: "bg-blue-500/20 text-blue-300",
  contacted: "bg-amber-500/20 text-amber-300",
  qualified: "bg-emerald-500/20 text-emerald-300",
  converted: "bg-purple-500/20 text-purple-300",
  nurturing: "bg-cyan-500/20 text-cyan-300",
  archived: "bg-white/10 text-white/40",
};

export default function FleetPortal() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const spEmail = sessionStorage.getItem("rsllc_fleet_email") || "";
      const res = await fetch(
        `${API_BASE}/api/v1/partners/${slug}/dashboard`,
        { headers: { "x-partner-email": spEmail } },
      );
      if (!res.ok) {
        if (res.status === 404) throw new Error("Card not found");
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

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw size={24} className="text-emerald-400 animate-spin" />
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

  const { card, analytics, leadStats, leads, earnings } = data;

  const totalEarningsFmt = ((earnings?.totalEarnings ?? 0) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "usd",
  });

  const kpis = [
    {
      label: "Total Earnings",
      value: totalEarningsFmt,
      icon: DollarSign,
      color: "text-amber-400",
      bg: "from-amber-500/20 to-amber-500/5",
      isFormatted: true,
    },
    {
      label: "Total Card Views",
      value: analytics.views,
      icon: Eye,
      color: "text-blue-400",
      bg: "from-blue-500/20 to-blue-500/5",
    },
    {
      label: "Contact Saves",
      value: analytics.downloads,
      icon: Download,
      color: "text-emerald-400",
      bg: "from-emerald-500/20 to-emerald-500/5",
    },
    {
      label: "Leads Generated",
      value: leadStats.totalLeads,
      icon: Users,
      color: "text-purple-400",
      bg: "from-purple-500/20 to-purple-500/5",
    },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-500/15 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-white/30 text-xs tracking-widest uppercase mb-1">
              Referral Service LLC
            </p>
            <h1 className="text-2xl font-bold gradient-text">
              Sovereign Professional Portal
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {card.fullName}
              {card.company ? ` — ${card.company}` : ""}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors"
          >
            <ArrowLeft size={12} />
            Home
          </Link>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass noise rounded-xl p-5 border border-white/5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.bg} flex items-center justify-center`}
                >
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

        {/* Chat KPI (smaller, below main row) */}
        {analytics.chats > 0 && (
          <div className="glass noise rounded-xl p-4 border border-white/5 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center">
              <MessageSquare size={14} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-white/40 text-xs">AI Chat Sessions</p>
              <p className="text-lg font-bold text-white">{analytics.chats}</p>
            </div>
          </div>
        )}

        {/* Lead Ledger */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass noise rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Lead Ledger</h2>
              <p className="text-xs text-white/30 mt-0.5">
                {leadStats.totalLeads} total
                {leadStats.newLeads > 0 &&
                  ` · ${leadStats.newLeads} new`}
                {leadStats.qualifiedLeads > 0 &&
                  ` · ${leadStats.qualifiedLeads} qualified`}
                {leadStats.convertedLeads > 0 &&
                  ` · ${leadStats.convertedLeads} converted`}
              </p>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchDashboard();
              }}
              className="text-white/30 hover:text-white/60 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {leads.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Users size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No leads captured yet</p>
              <p className="text-white/20 text-xs mt-1">
                Leads will appear here as visitors engage with your card
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-white/30 text-xs border-b border-white/5">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
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
                      <td className="px-5 py-3 text-sm text-white">
                        {lead.visitorName || "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-white/60">
                        {lead.visitorEmail || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status] || STATUS_COLORS.archived}`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-white/30 text-right">
                        {new Date(lead.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
