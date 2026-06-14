import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Activity, RefreshCw, Gauge, ListTree, CircleDot } from "lucide-react";
import { getAuthToken } from "../lib/auth-store";

// V1 Agent Control Room — pragmatic, D1-native observability (no OTel/SDK).
// Three panes from existing ledgers via the worker's /api/observability/* + the
// systemStatus already returned by /api/analytics/global:
//   1) Node-Health Grid   ← analytics/global systemStatus (ONLINE/DEGRADED/OFFLINE)
//   2) Latency rollup      ← /api/observability/latency (system_finops_ledger.latency_ms)
//   3) Global timeline     ← /api/observability/timeline (system_logs, the "waterfall")
// Camp-A API base default so it survives an unset env var.

const API_BASE = import.meta.env.VITE_TRIAGE_API_BASE || "https://api.referralsvc.com";

const NODE_LABELS = {
  tofuRadar: "ToFu Radar", finopsLedger: "FinOps Ledger", escalationProtocol: "Escalation Protocol",
  dealRoom: "Deal Room", tofuIntake: "ToFu Intake", partnerPortal: "Partner Portal",
  dripEngine: "Drip Engine", slackCommandCenter: "Slack Pulse", dispatchEngine: "Dispatch Engine",
  stripeWebhook: "Stripe Webhook", kickoffEngine: "Kickoff Engine", autonomousTreasury: "Auto Treasury",
  escrowEngine: "Escrow Engine",
};
const STATUS_STYLE = {
  ONLINE:   "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  DEGRADED: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  OFFLINE:  "bg-red-500/10 border-red-500/30 text-red-400",
};
const LEVEL_STYLE = {
  fatal: "text-red-400", error: "text-red-400", warn: "text-amber-400",
  info: "text-cyan-400", debug: "text-white/40",
};

export default function AgentObservability() {
  const [nodes, setNodes] = useState(null);
  const [latency, setLatency] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const get = async (path) => {
      try {
        const r = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
        if (!r.ok) return null;
        if (!(r.headers.get("content-type") || "").includes("application/json")) return null;
        return await r.json();
      } catch { return null; }
    };
    const [global, lat, tl] = await Promise.all([
      get("/api/analytics/global"),
      get("/api/observability/latency"),
      get("/api/observability/timeline?limit=100"),
    ]);
    setNodes(global?.systemStatus ?? null);
    setLatency(lat?.models ?? []);
    setEvents(tl?.events ?? []);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
            <Activity size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Agent Control Room</h2>
            <p className="text-white/40 text-xs">D1-native observability · node health · latency · event timeline</p>
          </div>
        </div>
        <button onClick={fetchAll} className="p-2 rounded-lg glass noise hover:bg-white/10 transition-colors" title="Refresh">
          <RefreshCw size={14} className={`text-white/40 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 1. Node-Health Grid */}
      <div className="glass noise rounded-2xl p-5 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <CircleDot size={14} className="text-primary" />
          <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider">Live Node Status</h3>
        </div>
        {nodes ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(nodes).map(([key, status]) => (
              <div key={key} className={`rounded-xl border px-3 py-2 ${STATUS_STYLE[status] || STATUS_STYLE.OFFLINE}`}>
                <div className="text-[11px] text-white/60">{NODE_LABELS[key] || key}</div>
                <div className="text-xs font-bold">{status}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-xs">No status — /api/analytics/global unreachable or unauthorized.</p>
        )}
      </div>

      {/* 2. Latency rollup */}
      <div className="glass noise rounded-2xl p-5 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <Gauge size={14} className="text-amber-400" />
          <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider">AI-Call Latency (24h, per model)</h3>
        </div>
        {latency.length ? (
          <table className="w-full text-xs">
            <thead><tr className="text-white/40 text-left">
              <th className="py-1">Model</th><th>Calls</th><th>Avg ms</th><th>Max ms</th>
            </tr></thead>
            <tbody>
              {latency.map((m, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="py-1.5 text-white/80 font-mono">{m.model}</td>
                  <td className="text-white/60">{m.calls}</td>
                  <td className="text-amber-400 font-semibold">{m.avg_ms ?? "—"}</td>
                  <td className="text-white/60">{m.max_ms ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-white/30 text-xs">No latency rows yet — populates after Migration 059 + the aiTollbooth latency bind ship.</p>
        )}
      </div>

      {/* 3. Global timeline (pragmatic session waterfall) */}
      <div className="glass noise rounded-2xl p-5 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <ListTree size={14} className="text-cyan-400" />
          <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider">Event Timeline ({events.length})</h3>
          {lastRefresh && <span className="text-white/20 text-[10px] ml-auto">updated {lastRefresh.toLocaleTimeString()}</span>}
        </div>
        {events.length ? (
          <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
            {events.map((e, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2">
                <span className="text-white/30 text-[10px] font-mono shrink-0 w-32">{e.created_at}</span>
                <span className={`text-[10px] font-bold uppercase shrink-0 w-10 ${LEVEL_STYLE[e.level] || "text-white/40"}`}>{e.level}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-white/70 text-xs truncate">
                    <span className="text-white/50">{e.service}</span>
                    {e.endpoint ? <span className="text-white/30"> · {e.endpoint}</span> : null}
                    {e.threat_type ? <span className="text-amber-400/70"> · {e.threat_type}</span> : null}
                    {e.latency_ms != null ? <span className="text-cyan-400/70"> · {e.latency_ms}ms</span> : null}
                  </div>
                  {e.msg ? <div className="text-white/30 text-[11px] truncate">{e.msg}</div> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-xs">No events — system_logs empty or endpoint unreachable.</p>
        )}
      </div>
    </div>
  );
}
