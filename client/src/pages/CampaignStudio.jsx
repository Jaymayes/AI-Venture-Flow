/**
 * CampaignStudio.jsx — CSV Ingestion Wizard for the AI SDR Pipeline.
 *
 * Phase 7, Step 1: Drag-and-drop CSV uploader with dynamic column mapping,
 * row validation, and batch ingestion to POST /api/campaign/ingest.
 *
 * Wizard flow: idle → preview → mapping → validated → launching → done/error
 */

import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Rocket,
  RefreshCw,
  X,
  ChevronDown,
  Columns3,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { ingestCampaign } from "../lib/triage-client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const BATCH_SIZE = 200;

const SCHEMA_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "company", label: "Company", required: true },
  { key: "role", label: "Role", required: true },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "linkedinUrl", label: "LinkedIn URL", required: false },
  { key: "industry", label: "Industry", required: false },
  { key: "companySize", label: "Company Size", required: false },
  { key: "channel", label: "Channel", required: false },
  { key: "companyUrl", label: "Company URL", required: false },
];

const VALID_CHANNELS = ["email", "sms", "linkedin_dm"];

/** Fuzzy keyword hints for auto-mapping CSV headers → schema fields. */
const AUTO_MAP_HINTS = {
  name: ["name", "fullname", "contactname", "firstname", "contact"],
  company: ["company", "companyname", "organization", "org", "employer"],
  role: ["role", "title", "jobtitle", "position", "designation"],
  email: ["email", "emailaddress", "mail", "workemail"],
  phone: ["phone", "phonenumber", "mobile", "tel", "cell"],
  linkedinUrl: ["linkedin", "linkedinurl", "linkedinprofile", "li"],
  industry: ["industry", "sector", "vertical"],
  companySize: ["companysize", "employees", "size", "headcount"],
  channel: ["channel", "outreachchannel", "contactmethod", "medium"],
  companyUrl: ["companyurl", "website", "url", "companywebsite", "homepage", "domain", "web"],
};

// ---------------------------------------------------------------------------
// Sub-Component: DropZone
// ---------------------------------------------------------------------------

function DropZone({ onFile, isDragging, setIsDragging, fileInputRef }) {
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onFile(file);
  };
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <motion.div
      variants={fadeUp}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`glass noise rounded-2xl p-12 border-2 border-dashed cursor-pointer transition-all text-center ${
        isDragging
          ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
          : "border-white/10 hover:border-primary/30"
      }`}
    >
      <Upload
        size={48}
        className={`mx-auto mb-4 transition ${
          isDragging ? "text-accent" : "text-white/20"
        }`}
      />
      <p className="text-white/60 font-semibold">
        Drop your CSV here, or click to browse
      </p>
      <p className="text-white/30 text-xs mt-2">
        Max {BATCH_SIZE} prospects per batch &middot; Columns mapped visually
        after upload
      </p>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        className="hidden"
        onChange={handleChange}
      />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sub-Component: PreviewTable
// ---------------------------------------------------------------------------

function PreviewTable({ headers, rows, fileName }) {
  const preview = rows.slice(0, 5);
  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-2xl p-5 border border-white/5"
    >
      <div className="flex items-center gap-3 mb-4">
        <FileSpreadsheet size={18} className="text-primary" />
        <div>
          <h3 className="text-white font-bold text-sm">{fileName}</h3>
          <p className="text-white/30 text-xs">
            {rows.length} rows &middot; {headers.length} columns
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left text-white/40 font-medium whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, ri) => (
              <tr key={ri} className="border-b border-white/5">
                {headers.map((h, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-2 text-white/60 whitespace-nowrap max-w-[200px] truncate"
                  >
                    {row[h] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 5 && (
        <p className="text-white/20 text-[10px] mt-2 text-center">
          Showing 5 of {rows.length} rows
        </p>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sub-Component: ColumnMapper
// ---------------------------------------------------------------------------

function ColumnMapper({ headers, mapping, setMapping, onValidate }) {
  const requiredMapped = SCHEMA_FIELDS.filter((f) => f.required).every(
    (f) => mapping[f.key]
  );

  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-2xl p-5 border border-white/5"
    >
      <div className="flex items-center gap-3 mb-4">
        <Columns3 size={18} className="text-accent" />
        <div>
          <h3 className="text-white font-bold text-sm">Column Mapping</h3>
          <p className="text-white/30 text-xs">
            Map your CSV headers to Clawbot schema fields
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SCHEMA_FIELDS.map((field) => (
          <div key={field.key} className="flex items-center gap-3">
            <label className="text-xs text-white/60 w-28 shrink-0">
              {field.label}
              {field.required && (
                <span className="text-red-400 ml-0.5">*</span>
              )}
            </label>
            <div className="relative flex-1">
              <select
                value={mapping[field.key] || ""}
                onChange={(e) =>
                  setMapping((prev) => ({
                    ...prev,
                    [field.key]: e.target.value || null,
                  }))
                }
                className="w-full appearance-none rounded-lg bg-white/5 border border-white/10 px-3 py-2 pr-8 text-xs text-white/70 focus:outline-none focus:border-primary/50"
              >
                <option value="">-- Skip --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onValidate}
          disabled={!requiredMapped}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ShieldCheck size={14} />
          Validate Rows
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sub-Component: ValidationSummary
// ---------------------------------------------------------------------------

function ValidationSummary({ validRows, invalidRows, totalRows }) {
  const [showErrors, setShowErrors] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-2xl p-5 border border-white/5"
    >
      <div className="flex items-center gap-3 mb-4">
        <ShieldCheck size={18} className="text-emerald-400" />
        <h3 className="text-white font-bold text-sm">Validation Summary</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="glass noise rounded-xl p-3 border border-white/5 text-center">
          <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">
            Total
          </p>
          <p className="text-white font-bold text-xl">{totalRows}</p>
        </div>
        <div className="glass noise rounded-xl p-3 border border-emerald-400/10 text-center">
          <p className="text-emerald-400/50 text-[10px] uppercase tracking-wider mb-1">
            Valid
          </p>
          <p className="text-emerald-400 font-bold text-xl">
            {validRows.length}
          </p>
        </div>
        <div className="glass noise rounded-xl p-3 border border-red-400/10 text-center">
          <p className="text-red-400/50 text-[10px] uppercase tracking-wider mb-1">
            Invalid
          </p>
          <p className="text-red-400 font-bold text-xl">
            {invalidRows.length}
          </p>
        </div>
      </div>

      {invalidRows.length > 0 && (
        <div>
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition"
          >
            <AlertTriangle size={12} />
            {showErrors ? "Hide" : "Show"} {invalidRows.length} error
            {invalidRows.length !== 1 ? "s" : ""}
          </button>
          <AnimatePresence>
            {showErrors && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1 pr-2">
                  {invalidRows.map(({ rowIndex, errors }) => (
                    <div
                      key={rowIndex}
                      className="text-[10px] text-red-400/70 flex gap-2"
                    >
                      <span className="text-white/20 shrink-0 font-mono">
                        Row {rowIndex + 1}:
                      </span>
                      <span>{errors.join("; ")}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sub-Component: LaunchPanel
// ---------------------------------------------------------------------------

function LaunchPanel({
  validCount,
  campaignId,
  setCampaignId,
  onLaunch,
  progress,
  result,
  launchError,
  stage,
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-2xl p-5 border border-white/5"
    >
      <div className="flex items-center gap-3 mb-4">
        <Rocket size={18} className="text-primary" />
        <h3 className="text-white font-bold text-sm">Launch Campaign</h3>
      </div>

      {/* Campaign ID input */}
      <div className="mb-4">
        <label className="text-xs text-white/40 mb-1 block">
          Campaign Name (optional)
        </label>
        <div className="relative">
          <Tag
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type="text"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            placeholder="e.g. Q1-SaaS-Founders"
            className="w-full rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50"
            disabled={stage === "launching" || stage === "done"}
          />
        </div>
      </div>

      {/* Launch button */}
      {stage === "validated" && (
        <button
          onClick={onLaunch}
          disabled={validCount === 0}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-black font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Launch {validCount} Prospect{validCount !== 1 ? "s" : ""}
        </button>
      )}

      {/* Progress bar during launch */}
      {stage === "launching" && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-white/50 flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin" />
              Ingesting...
            </span>
            <span className="text-white/70 font-mono">
              {progress.sent}/{progress.total}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{
                width: `${(progress.sent / Math.max(progress.total, 1)) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Success */}
      {stage === "done" && result && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
          <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" />
          <p className="text-emerald-400 font-bold text-sm">
            Campaign Launched
          </p>
          <p className="text-white/40 text-xs mt-1">
            {result.ingested} prospect{result.ingested !== 1 ? "s" : ""}{" "}
            ingested &middot; Campaign:{" "}
            <span className="font-mono text-white/60">
              {result.campaignId}
            </span>
          </p>
          <p className="text-white/20 text-[10px] mt-2">
            The CRON heartbeat will begin first outreach in batches of 10 per
            hour.
          </p>
        </div>
      )}

      {/* Error */}
      {stage === "error" && launchError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-sm font-semibold">
              Ingestion Failed
            </p>
          </div>
          <p className="text-red-400/70 text-xs">{launchError}</p>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component: CampaignStudio
// ---------------------------------------------------------------------------

export default function CampaignStudio() {
  // ── Stage control ──
  const [stage, setStage] = useState("idle");
  // idle | preview | mapping | validated | launching | done | error

  // ── CSV data ──
  const [rawRows, setRawRows] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState(null);

  // ── Column mapping: { schemaKey: csvHeader | null } ──
  const [mapping, setMapping] = useState({});

  // ── Validation ──
  const [validRows, setValidRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);

  // ── Campaign launch ──
  const [campaignId, setCampaignId] = useState("");
  const [launchProgress, setLaunchProgress] = useState({ sent: 0, total: 0 });
  const [launchResult, setLaunchResult] = useState(null);
  const [launchError, setLaunchError] = useState(null);

  // ── Drag state ──
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // -----------------------------------------------------------------------
  // Auto-map CSV headers → schema fields via fuzzy matching
  // -----------------------------------------------------------------------
  const autoMap = useCallback((headers) => {
    const newMapping = {};
    const lowerHeaders = headers.map((h) =>
      h.toLowerCase().replace(/[^a-z0-9]/g, "")
    );

    for (const [schemaKey, keywords] of Object.entries(AUTO_MAP_HINTS)) {
      const idx = lowerHeaders.findIndex((h) =>
        keywords.some((k) => h.includes(k))
      );
      if (idx !== -1) {
        newMapping[schemaKey] = headers[idx];
      }
    }
    setMapping(newMapping);
  }, []);

  // -----------------------------------------------------------------------
  // Handle file selection (drag-drop or browse)
  // -----------------------------------------------------------------------
  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setParseError(
          "Invalid file type. Please upload a .csv file."
        );
        return;
      }

      setParseError(null);
      setFileName(file.name);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Check for parse-level errors
          if (results.errors.length > 0) {
            const first = results.errors[0];
            setParseError(
              `CSV parse error: ${first.message}${
                first.row != null ? ` (row ${first.row + 1})` : ""
              }`
            );
            // Still allow partial data if rows parsed
            if (results.data.length === 0) return;
          }

          if (results.data.length === 0) {
            setParseError("CSV is empty — no data rows found.");
            return;
          }

          const headers = results.meta.fields || [];
          setCsvHeaders(headers);
          setRawRows(results.data);
          autoMap(headers);
          setStage("preview");
        },
        error: (err) => {
          setParseError(`Failed to parse CSV: ${err.message}`);
        },
      });
    },
    [autoMap]
  );

  // -----------------------------------------------------------------------
  // Validate mapped rows against CampaignProspect schema
  // -----------------------------------------------------------------------
  const validateRows = useCallback(() => {
    const valid = [];
    const invalid = [];

    rawRows.forEach((row, i) => {
      const mapped = {};
      const errors = [];

      // Apply column mapping
      for (const field of SCHEMA_FIELDS) {
        const csvCol = mapping[field.key];
        if (csvCol) {
          const val = (row[csvCol] ?? "").toString().trim();
          if (val) mapped[field.key] = val;
        }
      }

      // Required field checks
      if (!mapped.name) errors.push("Missing Name");
      if (!mapped.company) errors.push("Missing Company");
      if (!mapped.role) errors.push("Missing Role");

      // At least one contact method
      if (!mapped.email && !mapped.phone && !mapped.linkedinUrl) {
        errors.push(
          "Need at least one contact (Email, Phone, or LinkedIn URL)"
        );
      }

      // Email format (basic check)
      if (mapped.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mapped.email)) {
        errors.push(`Invalid email format: "${mapped.email}"`);
      }

      // Channel validation
      if (mapped.channel) {
        const ch = mapped.channel.toLowerCase();
        if (!VALID_CHANNELS.includes(ch)) {
          errors.push(
            `Invalid channel "${mapped.channel}" (must be email, sms, or linkedin_dm)`
          );
        } else {
          mapped.channel = ch;
        }
      }

      if (errors.length > 0) {
        invalid.push({ rowIndex: i, errors });
      } else {
        valid.push(mapped);
      }
    });

    setValidRows(valid);
    setInvalidRows(invalid);
    setStage("validated");
  }, [rawRows, mapping]);

  // -----------------------------------------------------------------------
  // Launch campaign — batch POST to /api/campaign/ingest
  // -----------------------------------------------------------------------
  const launchCampaign = useCallback(async () => {
    if (validRows.length === 0) return;

    setStage("launching");
    setLaunchError(null);
    setLaunchProgress({ sent: 0, total: validRows.length });

    try {
      // Chunk into batches of BATCH_SIZE
      const batches = [];
      for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
        batches.push(validRows.slice(i, i + BATCH_SIZE));
      }

      let totalIngested = 0;
      let lastCampaignId = "";
      const allEngagementIds = [];

      for (const batch of batches) {
        const res = await ingestCampaign(
          batch,
          campaignId.trim() || undefined
        );
        totalIngested += res.ingested ?? batch.length;
        lastCampaignId = res.campaignId ?? lastCampaignId;
        allEngagementIds.push(...(res.engagementIds ?? []));
        setLaunchProgress((prev) => ({
          ...prev,
          sent: prev.sent + batch.length,
        }));
      }

      setLaunchResult({
        ingested: totalIngested,
        campaignId: lastCampaignId,
        engagementIds: allEngagementIds,
      });
      setStage("done");
    } catch (err) {
      setLaunchError(err.message || "Unknown error during ingestion");
      setStage("error");
    }
  }, [validRows, campaignId]);

  // -----------------------------------------------------------------------
  // Reset the studio for a new upload
  // -----------------------------------------------------------------------
  const resetStudio = useCallback(() => {
    setStage("idle");
    setRawRows([]);
    setCsvHeaders([]);
    setFileName("");
    setParseError(null);
    setMapping({});
    setValidRows([]);
    setInvalidRows([]);
    setCampaignId("");
    setLaunchProgress({ sent: 0, total: 0 });
    setLaunchResult(null);
    setLaunchError(null);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      {/* Sticky header bar */}
      <div className="glass noise sticky top-0 z-50 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/ceo"
                className="flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
              >
                <ArrowLeft size={14} />
                CEO Dashboard
              </Link>
              <div>
                <h1 className="text-xl font-bold">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Campaign Studio
                  </span>
                </h1>
                <p className="text-[11px] text-white/30">
                  CSV Uploader &middot; AI SDR Pipeline Ingestion
                </p>
              </div>
            </div>
            {stage !== "idle" && (
              <button
                onClick={resetStudio}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition"
              >
                <RefreshCw size={14} />
                Start Over
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-6 md:px-8">
        {/* Parse error banner */}
        <AnimatePresence>
          {parseError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 flex items-center gap-2"
            >
              <AlertTriangle size={16} className="shrink-0" />
              <span className="flex-1">{parseError}</span>
              <button
                onClick={() => setParseError(null)}
                className="text-red-400/50 hover:text-red-400 transition"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* >200 rows warning */}
        <AnimatePresence>
          {rawRows.length > BATCH_SIZE && stage !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400 flex items-center gap-2"
            >
              <AlertTriangle size={16} className="shrink-0" />
              CSV contains {rawRows.length} rows. Will be ingested in batches
              of {BATCH_SIZE}.
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-6"
        >
          {/* Drop Zone */}
          {stage === "idle" && (
            <DropZone
              onFile={handleFile}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              fileInputRef={fileInputRef}
            />
          )}

          {/* Preview Table */}
          {stage !== "idle" && rawRows.length > 0 && (
            <PreviewTable
              headers={csvHeaders}
              rows={rawRows}
              fileName={fileName}
            />
          )}

          {/* Column Mapper */}
          {(stage === "preview" || stage === "mapping" || stage === "validated") && (
            <ColumnMapper
              headers={csvHeaders}
              mapping={mapping}
              setMapping={setMapping}
              onValidate={validateRows}
            />
          )}

          {/* Proceed to Mapping button (after preview auto-map) */}
          {stage === "preview" && (
            <motion.div variants={fadeUp} className="flex justify-center">
              <button
                onClick={() => setStage("mapping")}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-black font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Columns3 size={16} />
                Map Columns
              </button>
            </motion.div>
          )}

          {/* Validation Summary */}
          {(stage === "validated" ||
            stage === "launching" ||
            stage === "done" ||
            stage === "error") && (
            <ValidationSummary
              validRows={validRows}
              invalidRows={invalidRows}
              totalRows={rawRows.length}
            />
          )}

          {/* Launch Panel */}
          {(stage === "validated" ||
            stage === "launching" ||
            stage === "done" ||
            stage === "error") && (
            <LaunchPanel
              validCount={validRows.length}
              campaignId={campaignId}
              setCampaignId={setCampaignId}
              onLaunch={launchCampaign}
              progress={launchProgress}
              result={launchResult}
              launchError={launchError}
              stage={stage}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
