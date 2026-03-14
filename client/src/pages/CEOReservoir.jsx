/**
 * CEOReservoir.jsx — Phase 82 + 84: CEO-only Dual-Valve Command Console
 *
 * Global master override for both reservoir pipelines:
 *   Valve 1: SP Recruitment Engine (CEO recruits Agency Owners)
 *   Valve 2: Client Lead Sales Engine (SPs pitch end-clients)
 *
 * Phase 84 adds live pipeline telemetry:
 *   - Per-bucket status counts (pending / processing / contacted / failed)
 *   - Real-time activity feed showing the last 20 lead transitions
 *   - Auto-polling every 30 seconds
 *
 * This component is rendered inside RecruitmentOps.
 * SPs NEVER see this — it is exclusively CEO-scoped.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Power,
  Loader2,
  UserPlus,
  Target,
  Gauge,
  Upload,
  Database,
  FileUp,
  AlertTriangle,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  RefreshCw,
  Mail,
  MailOpen,
  MessageSquare,
  User,
  Building2,
  Brain,
  FlaskConical,
  ArrowRight,
  Sparkles,
  Rocket,
  PlayCircle,
} from "lucide-react";
import Papa from "papaparse";
import { fetchValveStatus, toggleValve, ingestCSV, ingestBatch, fetchReservoirActivity, reenqueuePending, dispatchDrip, addSenderInbox } from "../lib/sp-client";
import { Send, Inbox, Shield, Plus } from "lucide-react";
import { getAuthToken } from "../lib/auth-store";

// Phase 91: Derive caller email from session JWT instead of hardcoding
function getCallerEmail() {
  const token = getAuthToken();
  if (!token) return "";
  try { return JSON.parse(atob(token.split(".")[1])).sub || ""; } catch { return ""; }
}

const POLL_MS = 30_000;

// ── Status badge configs ──
const STATUS_CFG = {
  pending:    { label: "Pending",    color: "text-amber-400",   bg: "bg-amber-400/10", border: "border-amber-400/20", icon: Clock },
  queued:     { label: "Queued",     color: "text-blue-400",    bg: "bg-blue-400/10",  border: "border-blue-400/20",  icon: Zap },
  processing: { label: "Processing", color: "text-blue-400",    bg: "bg-blue-400/10",  border: "border-blue-400/20",  icon: Zap },
  researching:{ label: "Researching",color: "text-purple-400",  bg: "bg-purple-400/10",border: "border-purple-400/20",icon: Brain },
  contacted:  { label: "Contacted",  color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", icon: CheckCircle2 },
  research_complete: { label: "Research Done", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", icon: Sparkles },
  failed:     { label: "Failed",     color: "text-red-400",     bg: "bg-red-400/10",   border: "border-red-400/20",   icon: XCircle },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr + "Z").getTime(); // D1 datetimes are UTC
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function CEOReservoirContent() {
  const [valveStatus, setValveStatus] = useState({ sp_recruitment: "OFF", client_lead: "OFF" });
  const [valveToggling, setValveToggling] = useState({ sp_recruitment: false, client_lead: false });
  const [toast, setToast] = useState(null);
  const [csvDragging, setCsvDragging] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const [chunkProgress, setChunkProgress] = useState(0);

  // Phase 84: Activity telemetry
  const [activity, setActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const pollRef = useRef(null);

  // Re-enqueue state
  const [reenqueuing, setReenqueuing] = useState(false);
  const [reenqueueResult, setReenqueueResult] = useState(null);

  // Epic 22: Dispatch drip state
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);
  // Epic 30: Fleet Manager state
  const [newInboxEmail, setNewInboxEmail] = useState("");
  const [newInboxTarget, setNewInboxTarget] = useState(35);
  const [addingInbox, setAddingInbox] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ── Fetch activity telemetry ──
  const loadActivity = useCallback(async () => {
    try {
      const data = await fetchReservoirActivity(getCallerEmail());
      setActivity(data);
      // Also sync valve status from the activity response
      if (data.valves) {
        setValveStatus({
          sp_recruitment: data.valves.sp_recruitment || "OFF",
          client_lead: data.valves.client_lead || "OFF",
        });
      }
    } catch {
      // silent fail on poll
    } finally {
      setActivityLoading(false);
    }
  }, []);

  // Load on mount + poll every 30s
  useEffect(() => {
    loadActivity();
    pollRef.current = setInterval(loadActivity, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [loadActivity]);

  const handleReenqueue = async () => {
    setReenqueuing(true);
    setReenqueueResult(null);
    try {
      const res = await reenqueuePending(getCallerEmail());
      setReenqueueResult(res);
      setToast({
        message: res.enqueued > 0
          ? `${res.enqueued} leads pushed into AI Pipeline!`
          : "No pending leads to enqueue.",
        type: res.enqueued > 0 ? "success" : "error",
      });
      setTimeout(loadActivity, 2000);
    } catch (err) {
      setToast({ message: `Re-enqueue failed: ${err.message}`, type: "error" });
    } finally {
      setReenqueuing(false);
    }
  };

  // Epic 22: Manual drip dispatch handler
  const handleDispatchDrip = async () => {
    setDispatching(true);
    setDispatchResult(null);
    try {
      const res = await dispatchDrip(getCallerEmail());
      setDispatchResult(res);
      setToast({
        message: res.sent > 0
          ? `${res.sent} email(s) dispatched via Deliverability Engine!`
          : "No emails dispatched — check inbox capacity or research_complete leads.",
        type: res.sent > 0 ? "success" : "error",
      });
      setTimeout(loadActivity, 2000);
    } catch (err) {
      setToast({ message: `Dispatch failed: ${err.message}`, type: "error" });
    } finally {
      setDispatching(false);
    }
  };

  // Epic 30: Add new sender inbox
  const handleAddInbox = async () => {
    if (!newInboxEmail.trim() || !newInboxEmail.includes("@")) return;
    setAddingInbox(true);
    try {
      await addSenderInbox(newInboxEmail.trim(), newInboxTarget, getCallerEmail());
      setToast({ message: `Inbox ${newInboxEmail} added — warm-up starts at 5/day`, type: "success" });
      setNewInboxEmail("");
      setTimeout(loadActivity, 1000);
    } catch (err) {
      setToast({ message: `Failed: ${err.message}`, type: "error" });
    } finally {
      setAddingInbox(false);
    }
  };

  const handleValveToggle = async (target) => {
    setValveToggling((prev) => ({ ...prev, [target]: true }));
    const newStatus = valveStatus[target] === "ON" ? "OFF" : "ON";
    const label = target === "sp_recruitment" ? "SP Recruitment" : "Client Lead";
    try {
      const res = await toggleValve(getCallerEmail(), target, newStatus);
      setValveStatus({ sp_recruitment: res.sp_recruitment, client_lead: res.client_lead });
      setToast({
        message: newStatus === "ON"
          ? `${label} Engine ARMED — pipeline is now active.`
          : `${label} Engine DISARMED — safety engaged.`,
        type: newStatus === "ON" ? "success" : "error",
      });
      // Refresh activity after toggle
      setTimeout(loadActivity, 500);
    } catch (err) {
      setToast({ message: `Toggle failed: ${err.message}`, type: "error" });
    } finally {
      setValveToggling((prev) => ({ ...prev, [target]: false }));
    }
  };

  // ── Apollo CSV column mapper (shared by chunk handler) ──
  const mapApolloRow = (row) => {
    const firstName = row["First Name"] || row["first_name"] || "";
    const lastName = row["Last Name"] || row["last_name"] || "";
    return {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
      email: row["Email"] || row["email"] || row["Work Email"] || null,
      current_role: row["Title"] || row["title"] || row["Job Title"] || "",
      current_company: row["Company"] || row["company"] || row["Organization Name"] || "",
      linkedin_url: row["Person Linkedin Url"] || row["LinkedIn Url"] || row["linkedin_url"] || null,
      phone: row["Phone"] || row["phone"] || row["Phone Number"] || null,
      industry: row["Industry"] || row["industry"] || "",
      company_size: row["# Employees"] || row["Company Size"] || "",
    };
  };

  const handleCSVDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCsvDragging(false);
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!file || !file.name.endsWith(".csv")) {
      setToast({ message: "Please upload a .csv file.", type: "error" });
      return;
    }
    setCsvUploading(true);
    setCsvResult(null);
    setChunkProgress(0);

    const callerEmail = getCallerEmail();
    let totalQueued = 0;
    let totalSkipped = 0;
    let hadError = false;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      chunkSize: 1024 * 50, // 50KB chunks (~500 rows)
      chunk: async (results, parser) => {
        parser.pause();

        try {
          const leads = results.data
            .map(mapApolloRow)
            .filter((p) => p.full_name && (p.email || p.linkedin_url));

          if (leads.length === 0) {
            parser.resume();
            return;
          }

          const res = await ingestBatch(leads, callerEmail);
          totalQueued += res.queued || 0;
          totalSkipped += res.skipped || 0;
          setChunkProgress(totalQueued);
          parser.resume();
        } catch (err) {
          console.error("Upload chunk failed:", err);
          hadError = true;
          parser.abort();
          setCsvUploading(false);
          setToast({ message: `Upload failed at row ${totalQueued}: ${err.message}`, type: "error" });
        }
      },
      complete: () => {
        if (!hadError) {
          setCsvUploading(false);
          setCsvResult({ count: totalQueued, total: totalQueued + totalSkipped });
          setToast({
            message: `${totalQueued.toLocaleString()} leads queued for AI Research!${totalSkipped > 0 ? ` (${totalSkipped} duplicates skipped)` : ""}`,
            type: "success",
          });
          setTimeout(loadActivity, 1000);
        }
      },
      error: (err) => {
        setCsvUploading(false);
        setToast({ message: `CSV parse error: ${err.message}`, type: "error" });
      },
    });
  }, [loadActivity]);

  // ── Derived stats ──
  const spCounts = activity?.counts?.sp_recruitment || { pending: 0, processing: 0, contacted: 0, failed: 0, total: 0 };
  const clCounts = activity?.counts?.client_lead || { pending: 0, processing: 0, contacted: 0, failed: 0, total: 0 };
  const totalLeads = spCounts.total + clCounts.total;
  const totalContacted = spCounts.contacted + clCounts.contacted;
  const totalPending = spCounts.pending + clCounts.pending;
  const totalFailed = spCounts.failed + clCounts.failed;

  // ── Phase 87: Downstream engagement metrics ──
  const downstream = activity?.downstream || { delivered: 0, opened: 0, replied: 0, bounced: 0, total_contacted: 0 };
  const openRate = downstream.total_contacted > 0
    ? ((downstream.opened / downstream.total_contacted) * 100).toFixed(1)
    : "0.0";
  const replyRate = downstream.total_contacted > 0
    ? ((downstream.replied / downstream.total_contacted) * 100).toFixed(1)
    : "0.0";
  const bounceRate = downstream.total_contacted > 0
    ? ((downstream.bounced / downstream.total_contacted) * 100).toFixed(1)
    : "0.0";
  const failureReasons = activity?.failureReasons || [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] rounded-xl px-5 py-3 text-sm font-semibold shadow-2xl transition-all ${
          toast.type === "success" ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Dual-Valve Command Console */}
      <div className="glass noise rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Gauge size={20} className="text-white/40" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-tight">Dual-Valve Command Console</h2>
            <p className="text-white/30 text-[11px]">CEO master override — independent pipeline controls for both buckets</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Valve 1: SP Recruitment (CEO Pipeline) */}
          <div className={`rounded-xl p-5 border-2 transition-all duration-500 ${
            valveStatus.sp_recruitment === "ON"
              ? "border-cyan-500/40 bg-cyan-500/5 shadow-[0_0_30px_rgba(6,182,212,0.08)]"
              : "border-white/5 bg-white/[0.02]"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  valveStatus.sp_recruitment === "ON"
                    ? "bg-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : "bg-white/5"
                }`}>
                  <UserPlus size={20} className={`transition-colors duration-500 ${
                    valveStatus.sp_recruitment === "ON" ? "text-cyan-400" : "text-white/20"
                  }`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">SP Recruitment Engine</h3>
                  <p className="text-white/30 text-[10px] mt-0.5">CEO Pipeline — Recruiting Agency Owners</p>
                </div>
              </div>
              <button
                onClick={() => handleValveToggle("sp_recruitment")}
                disabled={valveToggling.sp_recruitment}
                className={`relative w-16 h-8 rounded-full transition-all duration-500 cursor-pointer flex-shrink-0 ${
                  valveStatus.sp_recruitment === "ON"
                    ? "bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : "bg-white/10"
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-500 flex items-center justify-center ${
                  valveStatus.sp_recruitment === "ON" ? "left-9" : "left-1"
                }`}>
                  {valveToggling.sp_recruitment
                    ? <Loader2 size={10} className="animate-spin text-gray-500" />
                    : <Power size={10} className={valveStatus.sp_recruitment === "ON" ? "text-cyan-600" : "text-gray-400"} />
                  }
                </div>
              </button>
            </div>
            {/* Bucket 1 mini-stats */}
            <div className="flex items-center gap-4 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${valveStatus.sp_recruitment === "ON" ? "bg-cyan-400 animate-pulse" : "bg-white/20"}`} />
                <span className={`text-[10px] font-bold ${valveStatus.sp_recruitment === "ON" ? "text-cyan-400" : "text-white/25"}`}>
                  {valveStatus.sp_recruitment === "ON" ? "LIVE" : "OFF"}
                </span>
              </div>
              {activity && (
                <>
                  <span className="text-amber-400/70 text-[10px] font-mono">{spCounts.pending} queued</span>
                  <span className="text-emerald-400/70 text-[10px] font-mono">{spCounts.contacted} sent</span>
                  {spCounts.failed > 0 && <span className="text-red-400/70 text-[10px] font-mono">{spCounts.failed} failed</span>}
                </>
              )}
            </div>
          </div>
          {/* Valve 2: Client Lead Sales (SP Pipeline) */}
          <div className={`rounded-xl p-5 border-2 transition-all duration-500 ${
            valveStatus.client_lead === "ON"
              ? "border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.08)]"
              : "border-white/5 bg-white/[0.02]"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  valveStatus.client_lead === "ON"
                    ? "bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "bg-white/5"
                }`}>
                  <Target size={20} className={`transition-colors duration-500 ${
                    valveStatus.client_lead === "ON" ? "text-emerald-400" : "text-white/20"
                  }`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Client Lead Sales Engine</h3>
                  <p className="text-white/30 text-[10px] mt-0.5">SP Pipeline — SPs pitching end-clients</p>
                </div>
              </div>
              <button
                onClick={() => handleValveToggle("client_lead")}
                disabled={valveToggling.client_lead}
                className={`relative w-16 h-8 rounded-full transition-all duration-500 cursor-pointer flex-shrink-0 ${
                  valveStatus.client_lead === "ON"
                    ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    : "bg-white/10"
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-500 flex items-center justify-center ${
                  valveStatus.client_lead === "ON" ? "left-9" : "left-1"
                }`}>
                  {valveToggling.client_lead
                    ? <Loader2 size={10} className="animate-spin text-gray-500" />
                    : <Power size={10} className={valveStatus.client_lead === "ON" ? "text-emerald-600" : "text-gray-400"} />
                  }
                </div>
              </button>
            </div>
            {/* Bucket 2 mini-stats */}
            <div className="flex items-center gap-4 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${valveStatus.client_lead === "ON" ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
                <span className={`text-[10px] font-bold ${valveStatus.client_lead === "ON" ? "text-emerald-400" : "text-white/25"}`}>
                  {valveStatus.client_lead === "ON" ? "LIVE" : "OFF"}
                </span>
              </div>
              {activity && (
                <>
                  <span className="text-amber-400/70 text-[10px] font-mono">{clCounts.pending} queued</span>
                  <span className="text-emerald-400/70 text-[10px] font-mono">{clCounts.contacted} sent</span>
                  {clCounts.failed > 0 && <span className="text-red-400/70 text-[10px] font-mono">{clCounts.failed} failed</span>}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Step 19.3: Autonomous AI Pipeline Flow — Always visible ── */}
      <div className="glass noise rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Brain size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight">Autonomous AI Pipeline</h2>
              <p className="text-white/30 text-[11px]">Two-stage Llama 3 qualification engine</p>
            </div>
          </div>
          {/* Re-enqueue / Fire Engine button */}
          {totalPending > 0 && (
              <button
                onClick={handleReenqueue}
                disabled={reenqueuing}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  reenqueuing
                    ? "bg-white/5 text-white/30 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-400 hover:to-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                }`}
              >
                {reenqueuing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Rocket size={14} />
                )}
                {reenqueuing ? "Firing..." : `Fire Engine (${totalPending.toLocaleString()} pending)`}
              </button>
            )}
          </div>

          {/* Re-enqueue result badge */}
          {reenqueueResult && reenqueueResult.enqueued > 0 && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <PlayCircle size={14} className="text-emerald-400" />
              <span className="text-emerald-400 text-xs font-bold">
                {reenqueueResult.enqueued} leads enqueued into Gate 1
              </span>
              <span className="text-white/20 text-[10px] ml-auto">Processing will begin shortly</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            {/* Gate 1: ICP Filter */}
            <div className="flex-1 bg-slate-950 border border-white/5 p-4 rounded-xl text-center relative overflow-hidden">
              <div className={`absolute inset-0 ${totalPending > 0 ? "bg-gradient-to-b from-blue-500/5 to-transparent" : ""}`} />
              <div className="relative">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Gate 1: ICP Filter</p>
                <p className="text-3xl font-mono font-black text-white">
                  {(activity?.counts?.sp_recruitment?.pending || 0) + (activity?.counts?.client_lead?.pending || 0)}
                </p>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                  totalPending > 0
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-white/10 bg-white/5 text-white/30"
                }`}>
                  {totalPending > 0 ? "Queued" : "Empty"}
                </span>
              </div>
            </div>
            <ArrowRight size={16} className="text-white/10 flex-shrink-0" />
            {/* Gate 2: Deep Research */}
            <div className="flex-1 bg-slate-950 border border-amber-500/20 p-4 rounded-xl text-center relative overflow-hidden">
              <div className={`absolute inset-0 ${(activity?.researchMetrics?.researching || 0) > 0 ? "bg-gradient-to-b from-amber-500/5 to-transparent" : ""}`} />
              <div className="relative">
                <p className="text-[10px] text-amber-500 uppercase tracking-widest font-bold mb-2">Gate 2: Research</p>
                <p className="text-3xl font-mono font-black text-white">
                  {activity?.researchMetrics?.researching || 0}
                </p>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                  (activity?.researchMetrics?.researching || 0) > 0
                    ? "border-purple-500/30 bg-purple-500/10 text-purple-400 animate-pulse"
                    : "border-white/10 bg-white/5 text-white/30"
                }`}>
                  {(activity?.researchMetrics?.researching || 0) > 0 ? "Researching" : "Idle"}
                </span>
              </div>
            </div>
            <ArrowRight size={16} className="text-white/10 flex-shrink-0" />
            {/* Reservoir Ready */}
            <div className="flex-1 bg-slate-950 border border-emerald-500/20 p-4 rounded-xl text-center relative overflow-hidden">
              <div className={`absolute inset-0 ${(activity?.researchMetrics?.research_complete || 0) > 0 ? "bg-gradient-to-b from-emerald-500/5 to-transparent" : ""}`} />
              <div className="relative">
                <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold mb-2">Reservoir Ready</p>
                <p className="text-3xl font-mono font-black text-white">
                  {activity?.researchMetrics?.research_complete || 0}
                </p>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                  (activity?.researchMetrics?.research_complete || 0) > 0
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-white/5 text-white/30"
                }`}>
                  {(activity?.researchMetrics?.research_complete || 0) > 0
                    ? `Avg: ${Number(activity?.researchMetrics?.avg_score || 0).toFixed(0)}`
                    : "Waiting"
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

      {/* ── Epic 22: Deliverability & Inbox Health ── */}
      <div className="glass noise rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Shield size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight">Deliverability & Inbox Health</h2>
              <p className="text-white/30 text-[11px]">Throttled drip engine — anti-spam guardrails</p>
            </div>
          </div>
          <button
            onClick={handleDispatchDrip}
            disabled={dispatching || (activity?.researchMetrics?.research_complete || 0) === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dispatching
                ? "bg-white/5 text-white/30 cursor-not-allowed"
                : (activity?.researchMetrics?.research_complete || 0) > 0
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            {dispatching ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {dispatching ? "Dispatching..." : "Dispatch Drip Batch"}
          </button>
        </div>

        {/* Dispatch result badge */}
        {dispatchResult && dispatchResult.sent > 0 && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Send size={14} className="text-cyan-400" />
            <span className="text-cyan-400 text-xs font-bold">
              {dispatchResult.sent} email(s) dispatched
            </span>
            {dispatchResult.skipped > 0 && (
              <span className="text-white/30 text-[10px]">({dispatchResult.skipped} skipped)</span>
            )}
            {dispatchResult.failed > 0 && (
              <span className="text-red-400 text-[10px]">({dispatchResult.failed} failed)</span>
            )}
          </div>
        )}

        {/* Epic 30: Add New Inbox Form */}
        <div className="bg-slate-950 border border-white/5 rounded-xl p-4">
          <label className="text-[10px] text-white/30 uppercase tracking-wider font-bold block mb-2">Add New Inbox to Fleet</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={newInboxEmail}
              onChange={(e) => setNewInboxEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !addingInbox) handleAddInbox(); }}
              placeholder="hello@referralsvc.co"
              className="flex-1 bg-slate-800/80 border border-slate-700/50 text-white text-xs rounded-lg px-3 py-2 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
            <input
              type="number"
              value={newInboxTarget}
              onChange={(e) => setNewInboxTarget(Number(e.target.value) || 35)}
              className="w-16 bg-slate-800/80 border border-slate-700/50 text-white text-xs rounded-lg px-2 py-2 text-center focus:outline-none focus:border-cyan-500/50 font-mono"
              title="Target daily limit"
            />
            <button
              onClick={handleAddInbox}
              disabled={addingInbox || !newInboxEmail.trim()}
              className="px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-30 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              {addingInbox ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Add
            </button>
          </div>
          <p className="text-[10px] text-white/20 mt-1.5">New inboxes start at 5/day and auto-ramp +2/day until target limit</p>
        </div>

        {/* Inbox Fleet Cards */}
        {activity?.inboxMetrics && activity.inboxMetrics.length > 0 ? (
          <div className="space-y-3">
            {activity.inboxMetrics.map((inbox) => {
              const pct = inbox.daily_limit > 0 ? Math.round((inbox.sent_today / inbox.daily_limit) * 100) : 0;
              const remaining = inbox.daily_limit - inbox.sent_today;
              const isWarming = inbox.daily_limit < (inbox.target_limit ?? inbox.daily_limit);
              const warmupPct = inbox.target_limit > 0 ? Math.round((inbox.daily_limit / inbox.target_limit) * 100) : 100;
              return (
                <div key={inbox.id} className="bg-slate-950 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Inbox size={14} className="text-white/40" />
                      <span className="text-white text-xs font-bold">{inbox.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Warmup badge */}
                      {isWarming ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border border-amber-500/30 bg-amber-500/10 text-amber-400">
                          Day {inbox.warmup_day ?? 0}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                          Warmed
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                        inbox.is_active
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-red-500/30 bg-red-500/10 text-red-400"
                      }`}>
                        {inbox.is_active ? "Active" : "Paused"}
                      </span>
                    </div>
                  </div>
                  {/* Daily send progress bar */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-cyan-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-white/50 text-[10px] font-mono min-w-[80px] text-right">
                      {inbox.sent_today} / {inbox.daily_limit} <span className="text-white/20">({remaining} left)</span>
                    </span>
                  </div>
                  {/* Warmup progress toward target */}
                  {isWarming && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500/50 transition-all duration-500"
                          style={{ width: `${warmupPct}%` }}
                        />
                      </div>
                      <span className="text-amber-400/50 text-[9px] font-mono min-w-[100px] text-right">
                        {inbox.daily_limit} / {inbox.target_limit} target
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-white/20 text-xs">
            No sender inboxes configured
          </div>
        )}
      </div>

      {/* ── Step 19.3: Live Research Feed ── */}
      {activity?.recent?.some((l) => l.research_score != null) && (
        <div className="glass noise rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FlaskConical size={16} className="text-emerald-400" />
              <h2 className="text-sm font-black text-white tracking-tight">Live Research Feed</h2>
            </div>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
            {activity.recent
              .filter((l) => l.research_score != null)
              .map((lead, i) => (
                <div key={lead.id || i} className="p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white/90 text-sm font-semibold">{lead.full_name}</h4>
                      <p className="text-[11px] text-white/30">
                        {lead.current_role} {lead.current_company ? `@ ${lead.current_company}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          lead.bucket === "sp_recruitment"
                            ? "border-purple-500/30 text-purple-400"
                            : "border-cyan-500/30 text-cyan-400"
                        }`}
                      >
                        {lead.bucket === "sp_recruitment" ? "SP" : "CLIENT"}
                      </span>
                      <span
                        className={`font-mono text-base font-black ${
                          lead.research_score >= 80
                            ? "text-emerald-400"
                            : lead.research_score >= 50
                              ? "text-amber-400"
                              : "text-rose-400"
                        }`}
                      >
                        {lead.research_score}
                      </span>
                    </div>
                  </div>
                  {lead.research_summary && (
                    <p className="text-[12px] text-white/40 leading-relaxed border-l-2 border-white/10 pl-3 italic line-clamp-3">
                      {lead.research_summary}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Phase 84: Pipeline Telemetry ── */}
      <div className="glass noise rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Activity size={20} className="text-white/40" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight">Pipeline Telemetry</h2>
              <p className="text-white/30 text-[11px]">Live reservoir status — auto-refreshes every 30s</p>
            </div>
          </div>
          <button
            onClick={() => { setActivityLoading(true); loadActivity(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className={`text-white/40 ${activityLoading ? "animate-spin" : ""}`} />
            <span className="text-white/40 text-[10px] font-bold">REFRESH</span>
          </button>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl p-4 bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Database size={14} className="text-white/30" />
              <span className="text-white/40 text-[10px] font-bold">TOTAL LEADS</span>
            </div>
            <span className="text-2xl font-black text-white">{totalLeads}</span>
          </div>
          <div className="rounded-xl p-4 bg-amber-400/[0.03] border border-amber-400/10">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-amber-400/50" />
              <span className="text-amber-400/60 text-[10px] font-bold">PENDING</span>
            </div>
            <span className="text-2xl font-black text-amber-400">{totalPending}</span>
          </div>
          <div className="rounded-xl p-4 bg-emerald-400/[0.03] border border-emerald-400/10">
            <div className="flex items-center gap-2 mb-1">
              <Mail size={14} className="text-emerald-400/50" />
              <span className="text-emerald-400/60 text-[10px] font-bold">CONTACTED</span>
            </div>
            <span className="text-2xl font-black text-emerald-400">{totalContacted}</span>
          </div>
          <div className="rounded-xl p-4 bg-red-400/[0.03] border border-red-400/10">
            <div className="flex items-center gap-2 mb-1">
              <XCircle size={14} className="text-red-400/50" />
              <span className="text-red-400/60 text-[10px] font-bold">FAILED</span>
            </div>
            <span className="text-2xl font-black text-red-400">{totalFailed}</span>
          </div>
        </div>

        {/* Phase 87: Email Engagement KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl p-4 bg-violet-400/[0.03] border border-violet-400/10">
            <div className="flex items-center gap-2 mb-1">
              <MailOpen size={14} className="text-violet-400/50" />
              <span className="text-violet-400/60 text-[10px] font-bold">OPEN RATE</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-violet-400">{openRate}%</span>
              <span className="text-white/20 text-[10px] font-mono">{downstream.opened}/{downstream.total_contacted}</span>
            </div>
          </div>
          <div className="rounded-xl p-4 bg-cyan-400/[0.03] border border-cyan-400/10">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={14} className="text-cyan-400/50" />
              <span className="text-cyan-400/60 text-[10px] font-bold">REPLY RATE</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-cyan-400">{replyRate}%</span>
              <span className="text-white/20 text-[10px] font-mono">{downstream.replied}/{downstream.total_contacted}</span>
            </div>
          </div>
          <div className="rounded-xl p-4 bg-orange-400/[0.03] border border-orange-400/10">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-orange-400/50" />
              <span className="text-orange-400/60 text-[10px] font-bold">BOUNCE RATE</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-orange-400">{bounceRate}%</span>
              <span className="text-white/20 text-[10px] font-mono">{downstream.bounced}/{downstream.total_contacted}</span>
            </div>
          </div>
        </div>

        {/* Phase 87: Failure Reason Breakdown */}
        {failureReasons.length > 0 && (
          <div className="mb-5">
            <span className="text-white/50 text-xs font-bold mb-2 block">Failure Breakdown</span>
            <div className="space-y-1">
              {failureReasons.map((r) => (
                <div key={r.reason} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-white/60 text-xs">{r.reason}</span>
                  <span className="text-red-400/80 text-xs font-mono font-bold">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity Feed */}
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs font-bold">Recent Activity</span>
            {activity?.timestamp && (
              <span className="text-white/20 text-[10px] font-mono">
                Last poll: {new Date(activity.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          {activityLoading && !activity ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-white/20" />
            </div>
          ) : activity?.recent?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-white/20">
              <Database size={24} className="mb-2" />
              <span className="text-sm">No leads in reservoir yet</span>
              <span className="text-[10px] mt-1">Upload a CSV to get started</span>
            </div>
          ) : (
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
              {(activity?.recent || []).map((lead) => {
                const cfg = STATUS_CFG[lead.status] || STATUS_CFG.pending;
                const StatusIcon = cfg.icon;
                return (
                  <div
                    key={lead.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.015] hover:bg-white/[0.04] border border-white/[0.03] transition-colors"
                  >
                    {/* Status icon */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
                      <StatusIcon size={14} className={cfg.color} />
                    </div>

                    {/* Lead info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-xs font-bold truncate">{lead.full_name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                          {cfg.label.toUpperCase()}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          lead.bucket === "sp_recruitment"
                            ? "bg-cyan-400/10 text-cyan-400/60 border border-cyan-400/15"
                            : "bg-emerald-400/10 text-emerald-400/60 border border-emerald-400/15"
                        }`}>
                          {lead.bucket === "sp_recruitment" ? "B1" : "B2"}
                        </span>
                        {/* Phase 87: Email engagement indicators */}
                        {lead.opened_at && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-violet-400/10 text-violet-400 border border-violet-400/15 flex items-center gap-0.5">
                            <MailOpen size={8} /> OPENED
                          </span>
                        )}
                        {lead.replied_at && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/15 flex items-center gap-0.5">
                            <MessageSquare size={8} /> REPLIED
                          </span>
                        )}
                        {lead.bounced_at && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-orange-400/10 text-orange-400 border border-orange-400/15 flex items-center gap-0.5">
                            <AlertTriangle size={8} /> BOUNCED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {lead.current_role && (
                          <span className="text-white/25 text-[10px] flex items-center gap-1 truncate">
                            <User size={9} className="flex-shrink-0" /> {lead.current_role}
                          </span>
                        )}
                        {lead.current_company && (
                          <span className="text-white/25 text-[10px] flex items-center gap-1 truncate">
                            <Building2 size={9} className="flex-shrink-0" /> {lead.current_company}
                          </span>
                        )}
                        {lead.error_message && (
                          <span className="text-red-400/50 text-[10px] truncate max-w-[200px]" title={lead.error_message}>
                            {lead.error_message.substring(0, 60)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <span className="text-white/20 text-[10px] font-mono flex-shrink-0">
                      {timeAgo(lead.updated_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CSV Lead Upload — CEO only */}
      <div className="glass noise rounded-xl p-6 border border-white/5 space-y-4">
        <div className="flex items-center gap-3">
          <Database size={18} className="text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Load Reservoir</h3>
            <p className="text-white/30 text-xs">Drop Apollo CSV leads into the SP Recruitment Bucket — throttled by the AI pump above</p>
          </div>
        </div>
        <div
          onDragOver={(e) => { if (!csvUploading) { e.preventDefault(); setCsvDragging(true); } }}
          onDragLeave={() => setCsvDragging(false)}
          onDrop={csvUploading ? undefined : handleCSVDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            csvUploading
              ? "border-white/5 bg-slate-900/50 opacity-60 pointer-events-none cursor-not-allowed"
              : csvDragging
                ? "border-cyan-400/60 bg-cyan-400/5 cursor-pointer"
                : "border-white/10 hover:border-white/20 cursor-pointer"
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVDrop}
            disabled={csvUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:pointer-events-none"
          />
          {csvUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-cyan-400" />
              <span className="text-emerald-400 text-sm font-mono font-bold">
                Queued for AI Processing: {chunkProgress.toLocaleString()} leads...
              </span>
              <span className="text-white/30 text-xs">Streaming CSV in chunks — you can close this tab safely</span>
            </div>
          ) : csvResult ? (
            <div className="flex flex-col items-center gap-2">
              <Database size={24} className="text-emerald-400" />
              <span className="text-emerald-400 text-sm font-bold">{csvResult.count.toLocaleString()} leads queued for AI Research</span>
              <span className="text-white/30 text-xs">{csvResult.total.toLocaleString()} total rows processed</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FileUp size={24} className="text-white/20" />
              <span className="text-white/40 text-sm">
                {csvDragging ? "Drop your CSV here" : "Drag & drop a CSV file, or click to browse"}
              </span>
              <span className="text-white/20 text-xs">
                Expected columns: First Name, Last Name, Title, Company, Email, Person Linkedin Url
              </span>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-white/15 text-[10px]"><Upload size={10} /> Apollo CSV export</span>
                <span className="flex items-center gap-1 text-white/15 text-[10px]"><Database size={10} /> Custom lead lists</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
