import { useState, useRef, useCallback } from "react";
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
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const INGEST_URL =
  "https://moltbot-triage-engine.jamarr.workers.dev/api/ingest/csv";

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ---------------------------------------------------------------------------
// Mock Data (Pipeline table — will be replaced by live endpoint later)
// ---------------------------------------------------------------------------
const topStats = [
  {
    icon: Megaphone,
    label: "Active Outbound Campaigns",
    value: "4",
    sub: "2 SMS / 2 Email",
    color: "text-accent",
    bg: "from-accent/20 to-accent/5",
  },
  {
    icon: Users,
    label: "Candidates in BQM Stage",
    value: "12",
    sub: "3 above threshold",
    color: "text-cyan-400",
    bg: "from-cyan-400/20 to-cyan-400/5",
  },
  {
    icon: Boxes,
    label: "Deployed Pods",
    value: "2",
    sub: "1 pending activation",
    color: "text-violet-400",
    bg: "from-violet-400/20 to-violet-400/5",
  },
];

const pipelineCandidates = [
  {
    name: "Marcus Okafor",
    role: "Fractional CRO",
    intent: 92,
    status: "BQM Scheduled",
    statusType: "success",
    channel: "SMS",
    lastTouch: "2h ago",
  },
  {
    name: "Danielle Reeves",
    role: "VP of Sales",
    intent: 88,
    status: "Reply Received",
    statusType: "active",
    channel: "Email",
    lastTouch: "4h ago",
  },
  {
    name: "Terrence Hall",
    role: "Enterprise AE",
    intent: 79,
    status: "Outreach Sent",
    statusType: "pending",
    channel: "SMS",
    lastTouch: "1d ago",
  },
  {
    name: "Angela Chen",
    role: "Partner Sales Lead",
    intent: 85,
    status: "Reply Received",
    statusType: "active",
    channel: "Email",
    lastTouch: "6h ago",
  },
  {
    name: "Kevin Brooks",
    role: "Strategic Accounts",
    intent: 71,
    status: "Outreach Sent",
    statusType: "pending",
    channel: "SMS",
    lastTouch: "2d ago",
  },
  {
    name: "Jasmine Watts",
    role: "Fractional VP Sales",
    intent: 94,
    status: "Pod Deployed",
    statusType: "deployed",
    channel: "Email",
    lastTouch: "12h ago",
  },
  {
    name: "Derek Simmons",
    role: "Regional Sales Dir.",
    intent: 67,
    status: "No Response",
    statusType: "stale",
    channel: "SMS",
    lastTouch: "5d ago",
  },
  {
    name: "Natasha Williams",
    role: "Channel Partnerships",
    intent: 82,
    status: "BQM Scheduled",
    statusType: "success",
    channel: "Email",
    lastTouch: "8h ago",
  },
];

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

          {/* ── Candidate Pipeline Table (3 cols) ── */}
          <motion.div variants={fadeUp} className="lg:col-span-3">
            <div className="glass noise rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-violet-400" />
                  <h2 className="text-lg font-bold">Candidate Pipeline</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/40">
                  {pipelineCandidates.length} candidates
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                        Candidate
                      </th>
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                        Intent
                      </th>
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                        Status
                      </th>
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                        Channel
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                        Last Touch
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelineCandidates.map((c) => {
                      const cfg = statusConfig[c.statusType];
                      return (
                        <tr
                          key={c.name}
                          className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
                        >
                          {/* Name + role */}
                          <td className="py-3 pr-4">
                            <div className="font-semibold text-white">
                              {c.name}
                            </div>
                            <div className="text-xs text-white/40">
                              {c.role}
                            </div>
                          </td>

                          {/* Intent score bar */}
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className={`h-full rounded-full ${intentBg(c.intent)}`}
                                  style={{ width: `${c.intent}%` }}
                                />
                              </div>
                              <span
                                className={`text-xs font-bold ${intentColor(c.intent)}`}
                              >
                                {c.intent}
                              </span>
                            </div>
                          </td>

                          {/* Status badge */}
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}
                              />
                              {c.status}
                            </span>
                          </td>

                          {/* Channel */}
                          <td className="py-3 pr-4">
                            <span
                              className={`text-xs font-medium ${
                                c.channel === "SMS"
                                  ? "text-blue-400"
                                  : "text-purple-400"
                              }`}
                            >
                              {c.channel}
                            </span>
                          </td>

                          {/* Last touch */}
                          <td className="py-3">
                            <span className="text-xs text-white/40">
                              {c.lastTouch}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
