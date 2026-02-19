import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Users,
  Boxes,
  Upload,
  FileSpreadsheet,
  Bot,
  ArrowUpRight,
  Clock,
  CheckCircle,
  MessageSquare,
  CalendarCheck,
  UserCheck,
  AlertCircle,
  Loader2,
  X,
  FileUp,
  CheckCircle2,
  XCircle,
  Brain,
  TrendingUp,
  TrendingDown,
  Flame,
  Shield,
} from "lucide-react";
import { MOCK_SP_EFFICACY } from "../lib/mock-godmode";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const INGEST_URL =
  "https://moltbot-triage-engine.jamarr.workers.dev/api/ingest/csv";
const PIPELINE_URL =
  "https://moltbot-triage-engine.jamarr.workers.dev/api/pipeline/status";
const POLL_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ---------------------------------------------------------------------------
// Pipeline stage → UI status mapping
// ---------------------------------------------------------------------------
const stageToStatus = {
  enqueued:   { label: "Enqueued",   statusType: "pending"  },
  processing: { label: "Processing", statusType: "active"   },
  dispatched: { label: "Dispatched", statusType: "deployed" },
  halted:     { label: "Halted",     statusType: "stale"    },
  failed:     { label: "Failed",     statusType: "stale"    },
};

/** Format ISO timestamp to relative "Xh ago" / "Xd ago" string. */
function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Actual CSV schema required by the Triage Engine backend
const csvSchema = [
  { field: "name", type: "string", required: true },
  { field: "company", type: "string", required: true },
  { field: "role", type: "string", required: true },
  { field: "industry", type: "string", required: true },
  { field: "channel", type: "sms | email", required: true },
  { field: "contactAddress", type: "phone / email", required: true },
  { field: "companySize", type: "string", required: false },
  { field: "painPoints", type: "semicolon-sep", required: false },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const statusConfig = {
  deployed: {
    icon: CheckCircle,
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  success: {
    icon: CalendarCheck,
    bg: "bg-accent/20",
    text: "text-accent",
    dot: "bg-accent",
  },
  active: {
    icon: MessageSquare,
    bg: "bg-cyan-400/20",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
  },
  pending: {
    icon: Clock,
    bg: "bg-amber-400/20",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  stale: {
    icon: AlertCircle,
    bg: "bg-red-400/20",
    text: "text-red-400",
    dot: "bg-red-400",
  },
};

const intentColor = (score) => {
  if (score >= 85) return "text-emerald-400";
  if (score >= 75) return "text-amber-400";
  return "text-red-400";
};

const intentBg = (score) => {
  if (score >= 85) return "bg-emerald-400";
  if (score >= 75) return "bg-amber-400";
  return "bg-red-400";
};

// ===========================================================================
// Component
// ===========================================================================
export default function RecruitmentOps() {
  // ── Upload state ──
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // ── Pipeline state (live from Triage Engine) ──
  const [pipelineData, setPipelineData] = useState(null);
  const [pipelineLoading, setPipelineLoading] = useState(true);

  // ── Poll pipeline status every 30s ──
  useEffect(() => {
    let cancelled = false;

    async function fetchPipeline() {
      try {
        const res = await fetch(PIPELINE_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setPipelineData(data);
          setPipelineLoading(false);
        }
      } catch (err) {
        console.warn("[RecruitmentOps] Pipeline poll failed:", err.message);
        if (!cancelled) setPipelineLoading(false);
      }
    }

    fetchPipeline();
    const interval = setInterval(fetchPipeline, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Also refresh pipeline after successful CSV upload
  useEffect(() => {
    if (!uploadResult) return;
    // Short delay to let queue consumer start
    const t = setTimeout(async () => {
      try {
        const res = await fetch(PIPELINE_URL);
        if (res.ok) {
          const data = await res.json();
          setPipelineData(data);
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearTimeout(t);
  }, [uploadResult]);

  // ── Derived stats from live pipeline data ──
  const summary = pipelineData?.summary ?? {
    total: 0, enqueued: 0, processing: 0, dispatched: 0, halted: 0, failed: 0,
  };
  const prospects = pipelineData?.prospects ?? [];
  const smsCount = prospects.filter((p) => p.channel === "sms").length;
  const emailCount = prospects.filter((p) => p.channel === "email").length;

  const topStats = [
    {
      icon: Megaphone,
      label: "Total Prospects",
      value: String(summary.total),
      sub: `${smsCount} SMS / ${emailCount} Email`,
      color: "text-accent",
      bg: "from-accent/20 to-accent/5",
    },
    {
      icon: Users,
      label: "Enqueued / Processing",
      value: String(summary.enqueued + summary.processing),
      sub: `${summary.enqueued} queued · ${summary.processing} active`,
      color: "text-cyan-400",
      bg: "from-cyan-400/20 to-cyan-400/5",
    },
    {
      icon: Boxes,
      label: "Dispatched / Halted",
      value: String(summary.dispatched),
      sub: `${summary.halted} halted · ${summary.failed} failed`,
      color: "text-violet-400",
      bg: "from-violet-400/20 to-violet-400/5",
    },
  ];

  // ── Clear feedback after delay ──
  const clearFeedback = useCallback((delayMs = 8000) => {
    setTimeout(() => {
      setUploadResult(null);
      setUploadError(null);
    }, delayMs);
  }, []);

  // ── Upload CSV to OpenClaw Triage Engine ──
  const uploadCSV = useCallback(
    async (file) => {
      if (!file || isUploading) return;

      // Validate file type
      if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
        setUploadError("Invalid file type. Please upload a .csv file.");
        clearFeedback();
        return;
      }

      // Validate file size (5 MB max)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("File too large. Maximum size is 5 MB.");
        clearFeedback();
        return;
      }

      setIsUploading(true);
      setUploadResult(null);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(INGEST_URL, {
          method: "POST",
          // CF Access auth headers — inject real tokens when available
          // headers: {
          //   "CF-Access-Client-Id": "<SERVICE_TOKEN_ID>",
          //   "CF-Access-Client-Secret": "<SERVICE_TOKEN_SECRET>",
          // },
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          const msg =
            data.error ||
            (data.errors?.length
              ? `${data.errors.length} validation error(s)`
              : `Upload failed (${res.status})`);
          setUploadError(msg);
          clearFeedback(12000);
          return;
        }

        // Success — data contains: batchId, totalRows, enqueued, rejected, errors[]
        setUploadResult(data);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        clearFeedback(12000);
      } catch (err) {
        setUploadError(
          err.message === "Failed to fetch"
            ? "Cannot reach OpenClaw. Check your network connection."
            : `Upload failed: ${err.message}`
        );
        clearFeedback(12000);
      } finally {
        setIsUploading(false);
      }
    },
    [isUploading, clearFeedback]
  );

  // ── File selection handler ──
  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        uploadCSV(file);
      }
    },
    [uploadCSV]
  );

  // ── Drag & drop handlers ──
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        setSelectedFile(file);
        uploadCSV(file);
      }
    },
    [uploadCSV]
  );

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

        {/* ── Top Stats Row ── */}
        <motion.div
          variants={fadeUp}
          className="mb-8 grid gap-4 sm:grid-cols-3"
        >
          {topStats.map((s) => (
            <div
              key={s.label}
              className="glass noise rounded-2xl p-5 transition hover:border-white/20"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.bg}`}
                >
                  <s.icon size={20} className={s.color} />
                </div>
                <ArrowUpRight size={14} className="text-white/20" />
              </div>
              <div className="text-3xl font-extrabold">{s.value}</div>
              <div className="text-sm text-white/50">{s.label}</div>
              <div className="text-xs text-white/30 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </motion.div>

        {/* ── Two-column layout: CSV Ingestion + Pipeline ── */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* ── CSV Ingestion Zone (2 cols) ── */}
          <motion.div variants={fadeUp} className="lg:col-span-2">
            <div className="glass noise rounded-2xl p-6 h-full">
              <div className="flex items-center gap-2 mb-5">
                <Bot size={18} className="text-accent" />
                <h2 className="text-lg font-bold">
                  Clawbot Target Ingestion
                </h2>
              </div>

              {/* ── Functional Upload Zone ── */}
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  !isUploading && fileInputRef.current?.click()
                }
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !isUploading &&
                  fileInputRef.current?.click()
                }
                onDragEnter={handleDragIn}
                onDragOver={handleDrag}
                onDragLeave={handleDragOut}
                onDrop={handleDrop}
                className={`group relative mb-5 cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
                  isUploading
                    ? "border-white/5 bg-white/[0.01] cursor-not-allowed opacity-60"
                    : dragActive
                      ? "border-accent bg-accent/10 scale-[1.01]"
                      : "border-white/10 bg-white/[0.02] hover:border-accent/40 hover:bg-accent/5"
                }`}
              >
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />

                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-accent/20 transition group-hover:scale-110">
                  {isUploading ? (
                    <Loader2
                      size={24}
                      className="animate-spin text-accent"
                    />
                  ) : dragActive ? (
                    <FileUp size={24} className="text-accent" />
                  ) : (
                    <Upload
                      size={24}
                      className="text-white/40 transition group-hover:text-accent"
                    />
                  )}
                </div>

                {isUploading ? (
                  <>
                    <p className="text-sm font-semibold text-accent mb-1">
                      Uploading to OpenClaw...
                    </p>
                    <p className="text-xs text-white/30">
                      Parsing rows and enqueuing to prospect pipeline
                    </p>
                  </>
                ) : dragActive ? (
                  <>
                    <p className="text-sm font-semibold text-accent mb-1">
                      Drop your CSV here
                    </p>
                    <p className="text-xs text-white/30">
                      Release to begin ingestion
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-white/60 mb-1">
                      Drop .csv file here or click to upload
                    </p>
                    <p className="text-xs text-white/30">
                      Clawbot will ingest and begin outbound sequences
                      automatically
                    </p>
                  </>
                )}
              </div>

              {/* ── Upload Feedback Toast ── */}
              <AnimatePresence>
                {uploadResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2
                          size={16}
                          className="mt-0.5 shrink-0 text-emerald-400"
                        />
                        <div>
                          <p className="text-sm font-semibold text-emerald-400">
                            Batch Enqueued Successfully
                          </p>
                          <p className="text-xs text-emerald-400/70 mt-0.5">
                            {uploadResult.enqueued} of{" "}
                            {uploadResult.totalRows} prospects queued
                            {uploadResult.rejected > 0 && (
                              <span className="text-amber-400/80">
                                {" "}
                                &middot; {uploadResult.rejected} rejected
                              </span>
                            )}
                          </p>
                          {uploadResult.batchId && (
                            <p className="text-xs text-white/30 font-mono mt-1">
                              Batch: {uploadResult.batchId.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadResult(null);
                        }}
                        className="text-emerald-400/40 hover:text-emerald-400 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {/* Show per-row errors if any */}
                    {uploadResult.errors?.length > 0 && (
                      <div className="mt-2 border-t border-emerald-400/10 pt-2">
                        <p className="text-xs text-amber-400/80 mb-1">
                          Row errors:
                        </p>
                        {uploadResult.errors.slice(0, 5).map((err, i) => (
                          <p
                            key={i}
                            className="text-xs text-white/40 font-mono"
                          >
                            Row {err.row}: {err.reason}
                          </p>
                        ))}
                        {uploadResult.errors.length > 5 && (
                          <p className="text-xs text-white/30 mt-1">
                            +{uploadResult.errors.length - 5} more...
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {uploadError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <XCircle
                          size={16}
                          className="mt-0.5 shrink-0 text-red-400"
                        />
                        <div>
                          <p className="text-sm font-semibold text-red-400">
                            Ingestion Failed
                          </p>
                          <p className="text-xs text-red-400/70 mt-0.5">
                            {uploadError}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadError(null);
                        }}
                        className="text-red-400/40 hover:text-red-400 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Schema reference */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileSpreadsheet size={14} className="text-white/40" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
                    Required CSV Schema
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="pb-2 pr-4 text-left font-semibold text-white/50">
                          Field
                        </th>
                        <th className="pb-2 pr-4 text-left font-semibold text-white/50">
                          Type
                        </th>
                        <th className="pb-2 text-left font-semibold text-white/50">
                          Req
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvSchema.map((f) => (
                        <tr
                          key={f.field}
                          className="border-b border-white/[0.04]"
                        >
                          <td className="py-1.5 pr-4 font-mono text-accent/80">
                            {f.field}
                          </td>
                          <td className="py-1.5 pr-4 text-white/40">
                            {f.type}
                          </td>
                          <td className="py-1.5">
                            {f.required ? (
                              <span className="text-emerald-400">Yes</span>
                            ) : (
                              <span className="text-white/20">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AUP reminder */}
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2.5">
                <AlertCircle
                  size={14}
                  className="mt-0.5 shrink-0 text-amber-400"
                />
                <p className="text-xs text-amber-400/80">
                  All ingested lists must have verifiable opt-in consent per
                  our{" "}
                  <a
                    href="/aup"
                    className="underline decoration-amber-400/40 hover:decoration-amber-400"
                  >
                    Acceptable Use Policy
                  </a>
                  . Non-compliant lists will be quarantined.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Prospect Pipeline Table (3 cols) — Live from Triage Engine ── */}
          <motion.div variants={fadeUp} className="lg:col-span-3">
            <div className="glass noise rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-violet-400" />
                  <h2 className="text-lg font-bold">Prospect Pipeline</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/40">
                  {pipelineLoading ? "..." : `${prospects.length} prospects`}
                </span>
              </div>

              {pipelineLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="animate-spin text-violet-400" />
                  <span className="ml-3 text-sm text-white/40">Loading pipeline...</span>
                </div>
              ) : prospects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users size={32} className="text-white/10 mb-3" />
                  <p className="text-sm text-white/40 mb-1">No prospects in pipeline</p>
                  <p className="text-xs text-white/25">Upload a CSV to begin outbound sequences</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.08]">
                        <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                          Prospect
                        </th>
                        <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                          Stage
                        </th>
                        <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                          Channel
                        </th>
                        <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                          Source
                        </th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                          Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {prospects.map((p) => {
                        const mapping = stageToStatus[p.stage] ?? stageToStatus.enqueued;
                        const cfg = statusConfig[mapping.statusType];
                        return (
                          <tr
                            key={p.ingestionId}
                            className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
                          >
                            {/* Name + company + role */}
                            <td className="py-3 pr-4">
                              <div className="font-semibold text-white">
                                {p.name}
                              </div>
                              <div className="text-xs text-white/40">
                                {p.role} @ {p.company}
                              </div>
                            </td>

                            {/* Stage badge */}
                            <td className="py-3 pr-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}
                                />
                                {mapping.label}
                              </span>
                              {p.haltReason && (
                                <p className="text-[10px] text-red-400/60 mt-0.5 max-w-[140px] truncate" title={p.haltReason}>
                                  {p.haltReason}
                                </p>
                              )}
                            </td>

                            {/* Channel */}
                            <td className="py-3 pr-4">
                              <span
                                className={`text-xs font-medium ${
                                  p.channel === "sms"
                                    ? "text-blue-400"
                                    : "text-purple-400"
                                }`}
                              >
                                {p.channel.toUpperCase()}
                              </span>
                            </td>

                            {/* Source / batch */}
                            <td className="py-3 pr-4">
                              <span className="text-xs text-white/30 font-mono">
                                {p.source ?? "—"}
                              </span>
                            </td>

                            {/* Updated */}
                            <td className="py-3">
                              <span className="text-xs text-white/40">
                                {timeAgo(p.updatedAt)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ================================================================ */}
        {/* SP Psychological Efficacy Matrix                                 */}
        {/* ================================================================ */}
        <motion.div variants={fadeUp} className="mt-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20">
              <Brain size={20} className="text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">
                SP Psychological <span className="gradient-text">Efficacy Matrix</span>
              </h2>
              <p className="text-sm text-white/40">
                Post-handoff sentiment tracking &middot; Emergency resolution rates
              </p>
            </div>
          </div>

          {/* SP Efficacy Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {MOCK_SP_EFFICACY.map((sp) => {
              const isWarming = sp.trend === "warming";
              const TrendIcon = isWarming ? TrendingUp : TrendingDown;
              const trendColor = isWarming ? "text-emerald-400" : "text-red-400";
              const trendBg = isWarming ? "bg-emerald-500/20" : "bg-red-500/20";
              const overrideHighRisk = sp.ceoOverrideRate >= 0.10;

              return (
                <div
                  key={sp.spId}
                  className={`glass noise rounded-2xl p-5 transition border ${
                    overrideHighRisk ? "border-red-500/30" : "border-white/10"
                  } hover:border-white/20`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">{sp.spName}</span>
                      <span className="text-white/30 text-xs font-mono">{sp.spId}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${trendBg} ${trendColor}`}>
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
                        const height = Math.min(100, Math.abs(delta) * 120 + 10);
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
                            title={`Handoff ${i + 1}: ${delta >= 0 ? "+" : ""}${(delta * 100).toFixed(0)}%`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-white/20">Recent handoffs &rarr;</span>
                      <span className={`text-xs font-bold ${isWarming ? "text-emerald-400" : "text-red-400"}`}>
                        Avg &Delta; {sp.avgSentimentDelta >= 0 ? "+" : ""}{(sp.avgSentimentDelta * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Emergency Resolution Rate */}
                    <div className="text-center p-2 rounded-lg bg-white/5">
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Emergency<br/>Resolution</p>
                      <p className={`text-lg font-bold ${
                        sp.emergencyResolutionRate >= 0.80
                          ? "text-emerald-400"
                          : sp.emergencyResolutionRate >= 0.50
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}>
                        {(sp.emergencyResolutionRate * 100).toFixed(0)}%
                      </p>
                      <p className="text-[9px] text-white/20">
                        {sp.emergencyResolutions}/{sp.emergencyFlags} saved
                      </p>
                    </div>

                    {/* CEO Override Frequency */}
                    <div className={`text-center p-2 rounded-lg ${overrideHighRisk ? "bg-red-500/10" : "bg-white/5"}`}>
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">CEO<br/>Override</p>
                      <p className={`text-lg font-bold ${overrideHighRisk ? "text-red-400" : "text-white/60"}`}>
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
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Total<br/>Handoffs</p>
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
      </motion.div>
    </div>
  );
}
