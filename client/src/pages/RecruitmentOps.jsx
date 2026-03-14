/**
 * RecruitmentOps.jsx — Phase 86: Scorched Earth Purge
 *
 * All legacy Triage Engine (moltbot-triage-engine) connections removed:
 *   - Dead "Clawbot Target Ingestion" CSV upload zone (replaced by Load Reservoir in CEOReservoir.jsx)
 *   - Dead "Prospect Pipeline" table (replaced by Phase 84 Recent Activity feed)
 *   - Dead "Top Stats Row" (replaced by Phase 84 Pipeline Telemetry cards)
 *   - Dead polling intervals pinging the old Triage Engine every 30s
 *
 * What remains:
 *   1. Page header
 *   2. CEOReservoirContent — the live Dual-Valve Command Console + Telemetry + Load Reservoir
 *   3. SP Psychological Efficacy Matrix — conditionally rendered when SP data exists
 */

import { useState, useEffect, useCallback } from "react";
import { getAuthToken } from "../lib/auth-store";
import { motion } from "framer-motion";
import {
  Users,
  Brain,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { CEOReservoirContent } from "./CEOReservoir";

// ---------------------------------------------------------------------------
// Constants — Efficacy Matrix still reads from the Triage Engine (only live
// endpoint remaining). When SPs onboard and generate handoff data, this will
// populate automatically.
// ---------------------------------------------------------------------------
const API_BASE =
  import.meta.env.VITE_TRIAGE_API_BASE ||
  "https://moltbot-triage-engine.jamarr.workers.dev";
// Phase 91: Auth token sourced from auth-store (no more env key exposure)
const EFFICACY_POLL_MS = 60_000; // poll once per minute (was 30s)

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ===========================================================================
// Component
// ===========================================================================
export default function RecruitmentOps() {
  // ── SP Efficacy Matrix state — live only, no mock fallback ──
  const [spEfficacy, setSpEfficacy] = useState([]);

  // ── Epic 4: Pending Applications state ──
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsError, setAppsError] = useState(null);
  const [mutatingId, setMutatingId] = useState(null);

  // ── Fetch applications with AbortController ──
  useEffect(() => {
    const controller = new AbortController();
    async function fetchApps() {
      setAppsLoading(true);
      setAppsError(null);
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/api/v1/partners/applications`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!controller.signal.aborted) {
          setApplications(data.applications || []);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setAppsError(err.message || "Failed to load applications");
        }
      } finally {
        if (!controller.signal.aborted) setAppsLoading(false);
      }
    }
    fetchApps();
    return () => controller.abort();
  }, []);

  // ── Approve / Reject handlers with optimistic mutation ──
  const handleAction = useCallback(async (appId, action) => {
    if (mutatingId) return;
    setMutatingId(appId);
    setAppsError(null);
    const prev = [...applications];
    // Optimistic: remove from list
    setApplications((a) => a.filter((x) => x.id !== appId));
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/v1/partners/${action}/${appId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `${action} failed (${res.status})`);
      }
    } catch (err) {
      setApplications(prev); // rollback
      setAppsError(err.message);
    } finally {
      setMutatingId(null);
    }
  }, [mutatingId, applications]);

  // ── Poll SP Efficacy data ──
  useEffect(() => {
    let cancelled = false;

    async function fetchEfficacy() {
      try {
        const res = await fetch(
          `${API_BASE}/api/recruitment/sp-efficacy`,
          { headers: { "Content-Type": "application/json", ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}) } }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setSpEfficacy(
            data.map((sp) => ({
              spId: sp.spId,
              spName: sp.spName,
              totalHandoffs: sp.totalHandoffs,
              sentimentDeltas: sp.sentimentDeltas ?? [],
              avgSentimentDelta: sp.postHandoffSentimentDelta ?? 0,
              emergencyFlags: sp.emergencyFlags,
              emergencyResolutions: sp.emergencyResolutions,
              emergencyResolutionRate: sp.emergencyResolutionRate,
              ceoOverrides: sp.ceoOverrides,
              ceoOverrideRate: sp.overrideFrequency ?? 0,
              trend: sp.trend,
            }))
          );
        }
      } catch {
        setSpEfficacy([]);
      }
    }

    fetchEfficacy();
    const interval = setInterval(fetchEfficacy, EFFICACY_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-accent/20">
              <Users size={20} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold md:text-3xl">
                Recruitment <span className="gradient-text">Operations</span>
              </h1>
              <p className="text-sm text-white/40">
                Sovereign Professional Pipeline &amp; CSV Ingestion
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Epic 4: Pending Applications Table ── */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
              <ClipboardList size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">
                Partner <span className="gradient-text">Applications</span>
              </h2>
              <p className="text-sm text-white/40">
                Review, approve, or reject incoming SP applications
              </p>
            </div>
          </div>

          {/* Error banner */}
          {appsError && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {appsError}
              <button
                className="ml-3 text-red-400 underline hover:text-red-300"
                onClick={() => setAppsError(null)}
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur">
            {appsLoading ? (
              <div className="flex items-center justify-center py-12 text-white/30">
                <Loader2 size={20} className="animate-spin mr-2" />
                Loading applications...
              </div>
            ) : applications.filter((a) => a.status === "pending").length === 0 ? (
              <div className="py-12 text-center text-white/30 text-sm">
                No pending applications
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-white/40 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">LinkedIn</th>
                    <th className="px-4 py-3 hidden md:table-cell">Experience</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications
                    .filter((a) => a.status === "pending")
                    .map((app) => (
                      <tr
                        key={app.id}
                        className="border-b border-slate-800/50 hover:bg-white/[0.02] transition"
                      >
                        <td className="px-4 py-3 font-medium text-white/90">
                          {app.full_name}
                          {app.company && (
                            <span className="block text-xs text-white/30 mt-0.5">
                              {app.company}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white/60 font-mono text-xs">
                          {app.email}
                        </td>
                        <td className="px-4 py-3">
                          {app.linkedin_url ? (
                            <a
                              href={app.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition text-xs"
                            >
                              <ExternalLink size={12} />
                              Profile
                            </a>
                          ) : (
                            <span className="text-white/20 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-white/40 text-xs max-w-[200px] truncate">
                          {app.experience_summary || "—"}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-white/30 text-xs">
                          {new Date(app.created_at + "Z").toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={!!mutatingId}
                              onClick={() => handleAction(app.id, "approve")}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition disabled:opacity-40"
                            >
                              {mutatingId === app.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <CheckCircle size={12} />
                              )}
                              Approve
                            </button>
                            <button
                              disabled={!!mutatingId}
                              onClick={() => handleAction(app.id, "reject")}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition disabled:opacity-40"
                            >
                              <XCircle size={12} />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* ── Dual-Valve Command Console + Telemetry + Load Reservoir ── */}
        <motion.div variants={fadeUp} className="mb-8">
          <CEOReservoirContent />
        </motion.div>

        {/* ================================================================ */}
        {/* SP Psychological Efficacy Matrix — hidden until SPs generate data */}
        {/* ================================================================ */}
        {spEfficacy && spEfficacy.length > 0 && (
          <motion.div variants={fadeUp} className="mt-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20">
                <Brain size={20} className="text-rose-400" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold">
                  SP Psychological{" "}
                  <span className="gradient-text">Efficacy Matrix</span>
                </h2>
                <p className="text-sm text-white/40">
                  Post-handoff sentiment tracking &middot; Emergency resolution
                  rates
                </p>
              </div>
            </div>

            {/* SP Efficacy Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              {spEfficacy.map((sp) => {
                const isWarming = sp.trend === "warming";
                const TrendIcon = isWarming ? TrendingUp : TrendingDown;
                const trendColor = isWarming
                  ? "text-emerald-400"
                  : "text-red-400";
                const trendBg = isWarming
                  ? "bg-emerald-500/20"
                  : "bg-red-500/20";
                const overrideHighRisk = sp.ceoOverrideRate >= 0.1;

                return (
                  <div
                    key={sp.spId}
                    className={`glass noise rounded-2xl p-5 transition border ${
                      overrideHighRisk
                        ? "border-red-500/30"
                        : "border-white/10"
                    } hover:border-white/20`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm">
                          {sp.spName}
                        </span>
                        <span className="text-white/30 text-xs font-mono">
                          {sp.spId}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${trendBg} ${trendColor}`}
                      >
                        <TrendIcon size={10} />
                        {sp.trend.toUpperCase()}
                      </span>
                    </div>

                    {/* Sentiment Delta Heatmap (mini sparkline) */}
                    <div className="mb-4">
                      <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">
                        Post-Handoff Sentiment Delta (&Delta;)
                      </p>
                      <div className="flex items-end gap-1 h-8">
                        {sp.sentimentDeltas.map((delta, i) => {
                          const height = Math.min(
                            100,
                            Math.abs(delta) * 120 + 10
                          );
                          const isPos = delta >= 0;
                          return (
                            <div
                              key={i}
                              className="flex-1 rounded-sm transition-all"
                              style={{
                                height: `${height}%`,
                                background: isPos
                                  ? `rgba(0,229,160,${0.3 + Math.abs(delta)})`
                                  : `rgba(239,68,68,${0.3 + Math.abs(delta)})`,
                              }}
                              title={`Handoff ${i + 1}: ${
                                delta >= 0 ? "+" : ""
                              }${(delta * 100).toFixed(0)}%`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-white/20">
                          Recent handoffs &rarr;
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            isWarming ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          Avg &Delta;{" "}
                          {sp.avgSentimentDelta >= 0 ? "+" : ""}
                          {(sp.avgSentimentDelta * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Emergency Resolution Rate */}
                      <div className="text-center p-2 rounded-lg bg-white/5">
                        <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">
                          Emergency
                          <br />
                          Resolution
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            sp.emergencyResolutionRate >= 0.8
                              ? "text-emerald-400"
                              : sp.emergencyResolutionRate >= 0.5
                                ? "text-amber-400"
                                : "text-red-400"
                          }`}
                        >
                          {(sp.emergencyResolutionRate * 100).toFixed(0)}%
                        </p>
                        <p className="text-[9px] text-white/20">
                          {sp.emergencyResolutions}/{sp.emergencyFlags} saved
                        </p>
                      </div>

                      {/* CEO Override Frequency */}
                      <div
                        className={`text-center p-2 rounded-lg ${
                          overrideHighRisk ? "bg-red-500/10" : "bg-white/5"
                        }`}
                      >
                        <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">
                          CEO
                          <br />
                          Override
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            overrideHighRisk ? "text-red-400" : "text-white/60"
                          }`}
                        >
                          {(sp.ceoOverrideRate * 100).toFixed(0)}%
                        </p>
                        <p className="text-[9px] text-white/20">
                          {sp.ceoOverrides}/{sp.totalHandoffs} deals
                        </p>
                        {overrideHighRisk && (
                          <p className="text-[8px] text-red-400 font-bold mt-0.5 animate-pulse">
                            TERMINATION RISK
                          </p>
                        )}
                      </div>

                      {/* Total Handoffs */}
                      <div className="text-center p-2 rounded-lg bg-white/5">
                        <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">
                          Total
                          <br />
                          Handoffs
                        </p>
                        <p className="text-lg font-bold text-white/70">
                          {sp.totalHandoffs}
                        </p>
                        <p className="text-[9px] text-white/20">lifetime</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
