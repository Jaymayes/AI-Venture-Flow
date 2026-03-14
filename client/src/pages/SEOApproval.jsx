import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Lightweight Markdown renderer (no external dependency)
// Converts common markdown patterns to HTML for article preview.
// ---------------------------------------------------------------------------
function SimpleMarkdown({ children }) {
  const html = useMemo(() => {
    if (!children) return "";
    return children
      // Code blocks (```...```)
      .replace(/```[\s\S]*?```/g, (m) => {
        const code = m.replace(/```\w*\n?/, "").replace(/\n?```$/, "");
        return `<pre class="md-pre">${code.replace(/</g, "&lt;")}</pre>`;
      })
      // Inline code (`...`)
      .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
      // Headings
      .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
      // Bold + italic
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Unordered lists
      .replace(/^[*-] (.+)$/gm, '<li class="md-li">$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.+)$/gm, '<li class="md-li">$1</li>')
      // Blockquotes
      .replace(/^> (.+)$/gm, '<blockquote class="md-bq">$1</blockquote>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="md-a" target="_blank" rel="noopener">$1</a>')
      // Line breaks → paragraphs
      .replace(/\n{2,}/g, "</p><p>")
      .replace(/\n/g, "<br/>")
      // Wrap in paragraph
      .replace(/^/, "<p>")
      .replace(/$/, "</p>");
  }, [children]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
import {
  fetchSEODrafts,
  fetchSEOFullState,
  resumeSEOExecution,
  triggerSEORun,
  fetchSEOHealth,
  triggerStrategyRoadmap,
  patchSeoDraft,
} from "../lib/seo-client";
import {
  RefreshCw,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Cpu,
  DollarSign,
  BarChart3,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  Target,
  BookOpen,
  Linkedin,
  PenTool,
  Search,
  Play,
  Eye,
  Hash,
  MapPin,
  Shield,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Animation variants (matches CEODashboard pattern)
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtUSD = (n) => `$${(n ?? 0).toFixed(4)}`;
const fmtNum = (n) => (n ?? 0).toLocaleString();
const fmtPct = (n) => `${((n ?? 0) * 100).toFixed(1)}%`;

const contentTypeIcon = (type) => {
  switch (type) {
    case "blog_article": return BookOpen;
    case "linkedin_post": return Linkedin;
    case "technical_audit": return Search;
    default: return FileText;
  }
};

const contentTypeLabel = (type) => {
  switch (type) {
    case "blog_article": return "Blog Article";
    case "linkedin_post": return "LinkedIn Post";
    case "technical_audit": return "Technical Audit";
    default: return type?.replace(/_/g, " ") ?? "Unknown";
  }
};

const statusBadge = (status) => {
  switch (status) {
    case "interrupted":
      return { bg: "bg-amber-500/20", text: "text-amber-400", label: "Awaiting Approval" };
    case "completed":
      return { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Published" };
    case "running":
      return { bg: "bg-blue-500/20", text: "text-blue-400", label: "Running" };
    case "halted":
      return { bg: "bg-red-500/20", text: "text-red-400", label: "Halted" };
    default:
      return { bg: "bg-white/10", text: "text-white/50", label: status ?? "Unknown" };
  }
};

// ---------------------------------------------------------------------------
// Score Ring (SVG arc for authority dimensions)
// ---------------------------------------------------------------------------

function ScoreRing({ score, max, label, color = "#6d5cff" }) {
  const R = 28;
  const C = 2 * Math.PI * R;
  const pct = Math.min(score / max, 1);
  const strokeLen = C * pct;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={R} fill="none" stroke="#1e2235" strokeWidth="6" />
        <circle
          cx="34" cy="34" r={R} fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${strokeLen} ${C - strokeLen}`}
          strokeDashoffset={C * 0.25}
          transform="rotate(-90 34 34)"
        />
        <text x="34" y="38" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">
          {score}
        </text>
      </svg>
      <span className="text-[10px] text-white/40 text-center leading-tight max-w-[80px]">
        {label}
      </span>
      <span className="text-[10px] text-white/20">/ {max}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Authority Score Card
// ---------------------------------------------------------------------------

function AuthorityScoreCard({ authorityScore }) {
  if (!authorityScore) return null;

  const { total, technicalDepth, thoughtLeadership, seoOptimization, brandAlignment, passed, feedback } =
    authorityScore;

  const totalColor = total >= 75 ? "#00e5a0" : total >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target size={18} className="text-primary opacity-70" />
        <h3 className="text-sm font-bold">Authority Score</h3>
        <div
          className={`ml-auto flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold ${
            passed ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
          }`}
        >
          {passed ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
          {passed ? "PASSED" : "NEEDS REVISION"}
        </div>
      </div>

      {/* Total score large display */}
      <div className="flex items-center justify-center mb-5">
        <div className="relative">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#1e2235" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="50" fill="none"
              stroke={totalColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(2 * Math.PI * 50 * total) / 100} ${2 * Math.PI * 50 * (1 - total / 100)}`}
              strokeDashoffset={2 * Math.PI * 50 * 0.25}
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="55" textAnchor="middle" fill="white" fontSize="28" fontWeight="700">
              {total}
            </text>
            <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="11">
              / 100
            </text>
          </svg>
        </div>
      </div>

      {/* 4 dimension rings */}
      <div className="grid grid-cols-4 gap-3">
        <ScoreRing score={technicalDepth ?? 0} max={30} label="Technical Depth" color="#6d5cff" />
        <ScoreRing score={thoughtLeadership ?? 0} max={30} label="Thought Leadership" color="#00e5a0" />
        <ScoreRing score={seoOptimization ?? 0} max={20} label="SEO" color="#3b82f6" />
        <ScoreRing score={brandAlignment ?? 0} max={20} label="Brand" color="#f59e0b" />
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="mt-4 space-y-2">
          {feedback.assessment && (
            <div className="rounded-xl bg-white/5 border border-white/5 p-3">
              <p className="text-xs text-white/50 mb-1 font-semibold">Assessment</p>
              <p className="text-xs text-white/70 leading-relaxed">{feedback.assessment}</p>
            </div>
          )}
          {feedback.issues?.length > 0 && (
            <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3">
              <p className="text-xs text-red-400 mb-1 font-semibold">Issues</p>
              <ul className="space-y-1">
                {feedback.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-white/50 flex items-start gap-1.5">
                    <XCircle size={10} className="text-red-400 mt-0.5 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {feedback.suggestions && (
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
              <p className="text-xs text-primary mb-1 font-semibold">Suggestions</p>
              <p className="text-xs text-white/50 leading-relaxed">{feedback.suggestions}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// FinOps Summary Card
// ---------------------------------------------------------------------------

function FinOpsCard({ finOps }) {
  if (!finOps) return null;

  const totalCost = finOps.totalCostUSD ?? 0;
  const totalInput = finOps.totalInputTokens ?? 0;
  const totalOutput = finOps.totalOutputTokens ?? 0;
  const grossMargin = finOps.grossMargin ?? 0;
  const aiCalls = finOps.entries?.length ?? 0;

  const marginColor = grossMargin >= 0.80 ? "text-emerald-400" : grossMargin >= 0.70 ? "text-amber-400" : "text-red-400";

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign size={18} className="text-accent opacity-70" />
        <h3 className="text-sm font-bold">FinOps Ledger</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Total Cost</p>
          <p className="text-lg font-bold text-accent">{fmtUSD(totalCost)}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Gross Margin</p>
          <p className={`text-lg font-bold ${marginColor}`}>{fmtPct(grossMargin)}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Input Tokens</p>
          <p className="text-sm font-semibold text-white/70">{fmtNum(totalInput)}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Output Tokens</p>
          <p className="text-sm font-semibold text-white/70">{fmtNum(totalOutput)}</p>
        </div>
      </div>

      {/* Per-call breakdown */}
      {finOps.entries?.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
            AI Calls ({aiCalls})
          </p>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
            {finOps.entries.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-1.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Cpu size={10} className="text-primary opacity-50" />
                  <span className="text-white/40 truncate max-w-[120px]">
                    {entry.model?.replace("@cf/meta/", "").replace("-instruct", "") ?? "unknown"}
                  </span>
                </div>
                <span className="text-white/30">{fmtUSD(entry.costUSD)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Execution Trace Card
// ---------------------------------------------------------------------------

function ExecutionTraceCard({ trace }) {
  if (!trace || trace.length === 0) return null;

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-amber-400 opacity-70" />
        <h3 className="text-sm font-bold">Execution Trace</h3>
        <span className="ml-auto text-xs text-white/30">{trace.length} nodes</span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/10" />

        <div className="space-y-3">
          {trace.map((step, i) => (
            <div key={i} className="flex items-start gap-3 relative">
              <div className="relative z-10 w-[30px] h-[30px] rounded-full bg-surface-light border border-white/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-white/50">{i + 1}</span>
              </div>
              <div className="min-w-0 pt-1">
                <p className="text-xs font-semibold text-white/70">
                  {step.node ?? step.name ?? `Step ${i + 1}`}
                </p>
                {step.duration && (
                  <p className="text-[10px] text-white/30">{step.duration}ms</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Topic Signal Card
// ---------------------------------------------------------------------------

function TopicCard({ topic }) {
  if (!topic) return null;

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18} className="text-primary opacity-70" />
        <h3 className="text-sm font-bold">Topic Signal</h3>
      </div>

      <p className="text-white font-semibold mb-2">{topic.topic}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {topic.keywords?.map((kw, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] text-primary"
          >
            <Hash size={8} />
            {kw}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white/5 p-2 text-center">
          <p className="text-[9px] text-white/30 uppercase">Score</p>
          <p className="text-sm font-bold text-primary">{topic.trendScore ?? "—"}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2 text-center">
          <p className="text-[9px] text-white/30 uppercase">Velocity</p>
          <p className="text-sm font-bold text-accent">{topic.velocity ?? "—"}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2 text-center">
          <p className="text-[9px] text-white/30 uppercase">Source</p>
          <p className="text-[10px] font-semibold text-white/50 truncate">{topic.source ?? "AI"}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Content Preview (markdown article body)
// ---------------------------------------------------------------------------

function ContentPreview({ draft }) {
  const [expanded, setExpanded] = useState(false);

  if (!draft) return null;

  const Icon = contentTypeIcon(draft.type);
  const typeLabel = contentTypeLabel(draft.type);

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
            <Icon size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{draft.title}</p>
            <div className="flex items-center gap-3 text-[10px] text-white/30">
              <span>{typeLabel}</span>
              <span>{fmtNum(draft.wordCount)} words</span>
              {draft.targetKeywords?.length > 0 && (
                <span>{draft.targetKeywords.length} keywords</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 hover:bg-white/10 hover:text-white transition"
        >
          <Eye size={12} />
          {expanded ? "Collapse" : "Expand"}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Meta description */}
      {draft.metaDescription && (
        <div className="px-5 py-2 border-b border-white/5 bg-white/[0.02]">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Meta Description</p>
          <p className="text-xs text-white/50">{draft.metaDescription}</p>
        </div>
      )}

      {/* Article body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 max-h-[600px] overflow-y-auto">
              <div className="prose prose-invert prose-sm max-w-none text-white/70 leading-relaxed [&_h1]:text-white [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-white [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-white/90 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:space-y-1 [&_ol]:space-y-1 [&_li]:text-white/60 [&_code]:text-accent [&_code]:bg-white/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-[#0d1117] [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:text-white/40 [&_strong]:text-white/90 [&_a]:text-primary [&_a]:underline">
                <SimpleMarkdown>{draft.body}</SimpleMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed preview (first 300 chars) */}
      {!expanded && (
        <div className="px-5 py-3">
          <p className="text-xs text-white/40 leading-relaxed line-clamp-3">
            {draft.body?.replace(/[#*`_]/g, "").slice(0, 300)}...
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// New Run Trigger Panel
// ---------------------------------------------------------------------------

function NewRunPanel({ onTriggered }) {
  const [contentType, setContentType] = useState("blog_article");
  const [customTopic, setCustomTopic] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const data = await triggerSEORun(
        contentType,
        customTopic.trim() || undefined
      );
      setResult({ success: true, data });
      if (onTriggered) onTriggered(data);
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Play size={18} className="text-accent opacity-70" />
        <h3 className="text-sm font-bold">Trigger Authority Loop</h3>
      </div>

      <div className="space-y-3">
        {/* Content type selector */}
        <div>
          <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
            Content Type
          </label>
          <div className="flex gap-2">
            {[
              { value: "blog_article", label: "Blog", icon: BookOpen },
              { value: "linkedin_post", label: "LinkedIn", icon: Linkedin },
              { value: "technical_audit", label: "Audit", icon: Search },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setContentType(opt.value)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  contentType === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 bg-white/5 text-white/40 hover:text-white/70"
                }`}
              >
                <opt.icon size={12} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional topic override */}
        <div>
          <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
            Topic Override (optional)
          </label>
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="Leave blank for AI topic detection..."
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={running}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Running Authority Loop...
            </>
          ) : (
            <>
              <Play size={16} />
              Start Authority Loop
            </>
          )}
        </button>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-3 text-xs ${
              result.success
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            }`}
          >
            {result.success ? (
              <div>
                <p className="font-semibold mb-1">Authority Loop triggered</p>
                {result.data?.executionId && (
                  <p className="text-white/40">ID: {result.data.executionId}</p>
                )}
              </div>
            ) : (
              <p>{result.error}</p>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Strategic Roadmap Trigger Panel
// ---------------------------------------------------------------------------

function StrategyPanel({ onTriggered }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const data = await triggerStrategyRoadmap();
      setResult({ success: true, data });
      if (onTriggered) onTriggered(data);
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={18} className="text-primary opacity-70" />
        <h3 className="text-sm font-bold">Strategic Planning Moltworker</h3>
      </div>

      <p className="text-xs text-white/40 mb-4 leading-relaxed">
        Synthesize an executive-grade strategic roadmap from live FinOps telemetry,
        validated against the <strong className="text-white/60">Three Immutable Pillars</strong>:
        Legal, Ethical, and Profitable.
      </p>

      {/* Pillar badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] text-emerald-400 font-semibold">
          <Shield size={10} />
          Be Legal
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[10px] text-blue-400 font-semibold">
          <Eye size={10} />
          Be Ethical
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[10px] text-amber-400 font-semibold">
          <DollarSign size={10} />
          Maximize Profit
        </span>
      </div>

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={running}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary via-purple-500 to-primary py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {running ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Synthesizing Strategic Roadmap...
          </>
        ) : (
          <>
            <MapPin size={16} />
            Generate Executive Roadmap
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-3 rounded-xl border p-3 text-xs ${
            result.success
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {result.success ? (
            <div>
              <p className="font-semibold mb-1">Strategic roadmap generated</p>
              <p className="text-white/40">
                {result.data?.wordCount ?? 0} words | Cost: ${result.data?.finOps?.computeCostUSD?.toFixed(4) ?? '0.0000'}
              </p>
              {result.data?.executionId && (
                <p className="text-white/30 mt-0.5 font-mono text-[10px]">ID: {result.data.executionId}</p>
              )}
            </div>
          ) : (
            <p>{result.error}</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ===========================================================================
// Main Export: SEOApprovalContent
// ===========================================================================

export function SEOApprovalContent() {
  const [drafts, setDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [draftsError, setDraftsError] = useState(null);

  // Selected execution state
  const [executionId, setExecutionId] = useState("");
  const [executionState, setExecutionState] = useState(null);
  const [loadingState, setLoadingState] = useState(false);
  const [stateError, setStateError] = useState(null);

  // Approval flow
  const [approving, setApproving] = useState(false);
  const [denying, setDenying] = useState(false);
  const [sendingNotes, setSendingNotes] = useState(false);
  const [approvalResult, setApprovalResult] = useState(null);
  const [editNotes, setEditNotes] = useState("");

  // Agent health
  const [health, setHealth] = useState(null);

  // ── Fetch pending drafts ──
  const loadDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    setDraftsError(null);
    try {
      const data = await fetchSEODrafts();
      const raw = data?.drafts ?? data?.pendingDrafts ?? data;
      // Normalize snake_case from D1/agent API to camelCase used by UI
      const normalized = (Array.isArray(raw) ? raw : []).map((d) => ({
        ...d,
        executionId: d.executionId ?? d.execution_id ?? d.id,
        contentType: d.contentType ?? d.content_type,
        authorityScore: d.authorityScore ?? d.authority_score,
        finopsCostUsd: d.finopsCostUsd ?? d.finops_cost_usd,
        draftBody: d.draftBody ?? d.draft_body,
      }));
      setDrafts(normalized);
    } catch (err) {
      setDraftsError(err.message);
      setDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  // ── Fetch health ──
  const loadHealth = useCallback(async () => {
    try {
      const data = await fetchSEOHealth();
      setHealth(data);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    loadDrafts();
    loadHealth();
  }, [loadDrafts, loadHealth]);

  // ── Fetch full state for a specific execution ──
  const loadExecution = async (id) => {
    const lookupId = id ?? executionId.trim();
    if (!lookupId) return;

    setLoadingState(true);
    setStateError(null);
    setExecutionState(null);
    setApprovalResult(null);

    try {
      const data = await fetchSEOFullState(lookupId);
      setExecutionState(data);
      setExecutionId(lookupId);
    } catch (err) {
      setStateError(err.message);
    } finally {
      setLoadingState(false);
    }
  };

  // ── Find the selected draft from the list (for D1-only drafts) ──
  const selectedDraft = drafts.find((d) => (d.executionId ?? d.id) === executionId);
  const draftDbId = selectedDraft?.id; // The actual D1 UUID

  // ── Approve & Syndicate ──
  const handleApprove = async () => {
    if (!executionId.trim()) return;

    setApproving(true);
    setApprovalResult(null);

    try {
      // Try SEO agent resume first (for Authority Loop drafts)
      let data;
      try {
        data = await resumeSEOExecution(executionId.trim());
      } catch {
        // Fallback: approve via CRM admin endpoint (for Gemini/D1-only drafts)
        if (draftDbId) {
          data = await patchSeoDraft(draftDbId, 'approved', {
            edit_notes: editNotes.trim() || undefined,
          });
        } else {
          throw new Error('No draft ID available for approval');
        }
      }
      setApprovalResult({ success: true, data, action: 'approved' });
      setEditNotes("");
      loadDrafts();
    } catch (err) {
      setApprovalResult({ success: false, error: err.message });
    } finally {
      setApproving(false);
    }
  };

  // ── Deny / Reject ──
  const handleDeny = async () => {
    if (!draftDbId) return;

    setDenying(true);
    setApprovalResult(null);

    try {
      const data = await patchSeoDraft(draftDbId, 'rejected', {
        edit_notes: editNotes.trim() || undefined,
      });
      setApprovalResult({ success: true, data, action: 'rejected' });
      setEditNotes("");
      loadDrafts();
    } catch (err) {
      setApprovalResult({ success: false, error: err.message });
    } finally {
      setDenying(false);
    }
  };

  // ── Send Edit Notes (keeps draft pending, stores CEO feedback) ──
  const handleSendNotes = async () => {
    if (!draftDbId || !editNotes.trim()) return;

    setSendingNotes(true);
    setApprovalResult(null);

    try {
      const data = await patchSeoDraft(draftDbId, 'revision_requested', {
        edit_notes: editNotes.trim(),
      });
      setApprovalResult({ success: true, data, action: 'revision_requested' });
      setEditNotes("");
    } catch (err) {
      setApprovalResult({ success: false, error: err.message });
    } finally {
      setSendingNotes(false);
    }
  };

  // ── Derived state ──
  const st = executionState?.state ?? executionState ?? {};
  const draft = st.contentDraft;
  const authority = st.authorityScore;
  const finOps = st.finOps;
  const topic = st.selectedTopic;
  const trace = st.executionTrace ?? st.trace;
  const status = executionState?.status ?? st.status;
  const loopCount = st.loopCount ?? 0;
  const isInterrupted = status === "interrupted";

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-8">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            <span className="gradient-text">SEO Agent</span> HITL Approvals
          </h1>
          <p className="text-sm text-white/40">
            Review RAG-enriched drafts &middot; Approve for syndication
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Agent health indicator */}
          {health && (
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Agent Online
            </div>
          )}
          <button
            onClick={() => { loadDrafts(); loadHealth(); }}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <motion.div initial="hidden" animate="visible" variants={stagger}>
        {/* ── Pending Drafts Queue ── */}
        <motion.div variants={fadeUp} className="glass noise rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-400 opacity-70" />
              <h3 className="text-sm font-bold">Pending Approvals</h3>
              {!loadingDrafts && (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  {drafts.length}
                </span>
              )}
            </div>
          </div>

          {loadingDrafts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-primary" />
              <span className="ml-2 text-sm text-white/40">Loading drafts...</span>
            </div>
          ) : draftsError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {draftsError}
            </div>
          ) : !Array.isArray(drafts) || drafts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400/30 mb-2" />
              <p className="text-sm text-white/30">No drafts awaiting approval</p>
              <p className="text-xs text-white/20 mt-1">Trigger a new Authority Loop below</p>
            </div>
          ) : (
            <div className="space-y-2">
              {drafts.map((d, i) => {
                const dId = d.executionId ?? d.id ?? d.key;
                const dStatus = statusBadge(d.status ?? "interrupted");
                const dType = d.contentType ?? d.state?.contentType ?? "blog_article";
                const DIcon = contentTypeIcon(dType);

                return (
                  <button
                    key={i}
                    onClick={() => {
                      setExecutionId(dId);
                      loadExecution(dId);
                    }}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                      executionId === dId
                        ? "border-primary/40 bg-primary/5"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <DIcon size={14} className="text-white/40" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white/70 truncate">
                        {d.title ?? d.state?.contentDraft?.title ?? contentTypeLabel(dType)}
                      </p>
                      <p className="text-[10px] text-white/30 truncate">{dId}</p>
                    </div>
                    <div className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${dStatus.bg} ${dStatus.text}`}>
                      {dStatus.label}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Manual ID input */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
              Or enter Execution ID manually
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={executionId}
                onChange={(e) => setExecutionId(e.target.value)}
                placeholder="Paste execution ID..."
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all font-mono text-xs"
              />
              <button
                onClick={() => loadExecution()}
                disabled={!executionId.trim() || loadingState}
                className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loadingState ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />}
                Load
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── State Error + D1-only Draft Actions ── */}
        {stateError && selectedDraft && (
          <motion.div variants={fadeUp} className="mb-6 space-y-4">
            {/* Draft info card (for Gemini/D1-only drafts without execution state) */}
            <div className="glass noise rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                    {(() => { const I = contentTypeIcon(selectedDraft.contentType); return <I size={18} className="text-white" />; })()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedDraft.title}</p>
                    <p className="text-xs text-white/40">
                      {contentTypeLabel(selectedDraft.contentType)} &middot; {selectedDraft.executionId}
                    </p>
                  </div>
                </div>
                <div className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400">
                  pending
                </div>
              </div>

              {/* Draft body preview */}
              {selectedDraft.draftBody && (
                <div className="rounded-xl bg-white/5 border border-white/5 p-4 mb-4 max-h-[300px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs text-white/60 leading-relaxed font-sans">
                    {selectedDraft.draftBody}
                  </pre>
                </div>
              )}

              {/* CEO Edit Notes */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <PenTool size={14} className="text-primary opacity-70" />
                  <span className="text-xs font-semibold text-white/50">CEO Edit Notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add feedback, revision requests, or approval notes..."
                    rows={3}
                    className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all resize-none leading-relaxed"
                  />
                  <button
                    onClick={handleSendNotes}
                    disabled={sendingNotes || !editNotes.trim() || !draftDbId}
                    title="Send edit notes"
                    className="self-end flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 p-3 text-white hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                  >
                    {sendingNotes ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeny}
                  disabled={denying || approving || sendingNotes}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {denying ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  Deny
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approving || denying || sendingNotes}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-accent px-5 py-3 text-sm font-bold text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                >
                  {approving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Approve
                </button>
              </div>
            </div>

            {/* Approval result */}
            <AnimatePresence>
              {approvalResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`rounded-xl border p-4 ${
                    approvalResult.success
                      ? approvalResult.action === 'rejected'
                        ? "border-amber-500/30 bg-amber-500/10"
                        : approvalResult.action === 'revision_requested'
                        ? "border-blue-500/30 bg-blue-500/10"
                        : "border-emerald-500/30 bg-emerald-500/10"
                      : "border-red-500/30 bg-red-500/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {approvalResult.success ? (
                      <>
                        {approvalResult.action === 'rejected'
                          ? <XCircle size={18} className="text-amber-400" />
                          : approvalResult.action === 'revision_requested'
                          ? <Send size={18} className="text-blue-400" />
                          : <CheckCircle2 size={18} className="text-emerald-400" />
                        }
                        <p className={`text-sm font-bold ${
                          approvalResult.action === 'rejected' ? 'text-amber-400'
                          : approvalResult.action === 'revision_requested' ? 'text-blue-400'
                          : 'text-emerald-400'
                        }`}>
                          {approvalResult.action === 'revision_requested'
                            ? 'Edit notes sent — draft remains pending'
                            : `Draft ${approvalResult.action}`}
                        </p>
                      </>
                    ) : (
                      <>
                        <XCircle size={18} className="text-red-400" />
                        <p className="text-sm font-bold text-red-400">{approvalResult.error}</p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        {stateError && !selectedDraft && (
          <motion.div
            variants={fadeUp}
            className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          >
            <div className="flex items-center gap-2">
              <XCircle size={16} />
              <span className="font-semibold">Failed to load execution state</span>
            </div>
            <p className="mt-1 text-xs text-white/40">{stateError}</p>
          </motion.div>
        )}

        {/* ── Loading Skeleton ── */}
        {loadingState && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 size={32} className="mx-auto animate-spin text-primary" />
              <p className="mt-4 text-sm text-white/40">Loading execution state...</p>
            </div>
          </div>
        )}

        {/* ── Execution State Loaded ── */}
        {executionState && !loadingState && (
          <>
            {/* Status bar */}
            <motion.div
              variants={fadeUp}
              className="glass noise rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(status).bg} ${statusBadge(status).text}`}>
                  {isInterrupted ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                  {statusBadge(status).label}
                </div>
                <span className="text-xs text-white/30">
                  Loop {loopCount} &middot; {contentTypeLabel(draft?.type)}
                </span>
              </div>

              {/* Action buttons (for interrupted/pending drafts) */}
              {(isInterrupted || status === "pending") && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDeny}
                    disabled={denying || approving || !draftDbId}
                    className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {denying ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle size={16} />
                        Deny
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={approving || denying}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-accent px-5 py-2.5 text-sm font-bold text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                  >
                    {approving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Approve
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>

            {/* CEO Edit Notes */}
            {(isInterrupted || status === "pending") && (
              <motion.div variants={fadeUp} className="glass noise rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <PenTool size={16} className="text-primary opacity-70" />
                  <h3 className="text-sm font-bold">CEO Edit Notes</h3>
                  <span className="text-[10px] text-white/20">(send feedback or attach to approve/deny)</span>
                </div>
                <div className="flex items-center gap-2">
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add feedback, revision requests, or approval notes..."
                    rows={3}
                    className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all resize-none leading-relaxed"
                  />
                  <button
                    onClick={handleSendNotes}
                    disabled={sendingNotes || !editNotes.trim() || !draftDbId}
                    title="Send edit notes"
                    className="self-end flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 p-3 text-white hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                  >
                    {sendingNotes ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Approval result notification */}
            <AnimatePresence>
              {approvalResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-6 rounded-xl border p-4 ${
                    approvalResult.success
                      ? approvalResult.action === 'rejected'
                        ? "border-amber-500/30 bg-amber-500/10"
                        : approvalResult.action === 'revision_requested'
                        ? "border-blue-500/30 bg-blue-500/10"
                        : "border-emerald-500/30 bg-emerald-500/10"
                      : "border-red-500/30 bg-red-500/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {approvalResult.success ? (
                      approvalResult.action === 'rejected' ? (
                        <>
                          <XCircle size={18} className="text-amber-400" />
                          <div>
                            <p className="text-sm font-bold text-amber-400">
                              Draft rejected
                            </p>
                            <p className="text-xs text-white/40 mt-0.5">
                              Draft has been marked as rejected. It will no longer appear in the pending queue.
                            </p>
                          </div>
                        </>
                      ) : approvalResult.action === 'revision_requested' ? (
                        <>
                          <Send size={18} className="text-blue-400" />
                          <div>
                            <p className="text-sm font-bold text-blue-400">
                              Edit notes sent
                            </p>
                            <p className="text-xs text-white/40 mt-0.5">
                              CEO feedback stored. Draft remains pending for revision.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} className="text-emerald-400" />
                          <div>
                            <p className="text-sm font-bold text-emerald-400">
                              Draft approved
                            </p>
                            <p className="text-xs text-white/40 mt-0.5">
                              Content has been approved and dispatched for syndication.
                            </p>
                          </div>
                        </>
                      )
                    ) : (
                      <>
                        <XCircle size={18} className="text-red-400" />
                        <div>
                          <p className="text-sm font-bold text-red-400">Action failed</p>
                          <p className="text-xs text-white/40 mt-0.5">{approvalResult.error}</p>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Main Content Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Left column: Authority Score + FinOps */}
              <div className="space-y-6">
                <AuthorityScoreCard authorityScore={authority} />
                <FinOpsCard finOps={finOps} />
              </div>

              {/* Right column: Article preview (spans 2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <ContentPreview draft={draft} />
                <TopicCard topic={topic} />
              </div>
            </div>

            {/* Execution trace (full width) */}
            <ExecutionTraceCard trace={trace} />
          </>
        )}

        {/* ── Trigger Panels (always visible at bottom) ── */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NewRunPanel
            onTriggered={(data) => {
              if (data?.executionId) {
                setExecutionId(data.executionId);
                setTimeout(() => {
                  loadDrafts();
                  loadExecution(data.executionId);
                }, 3000);
              }
            }}
          />
          <StrategyPanel
            onTriggered={(data) => {
              if (data?.executionId) {
                setExecutionId(data.executionId);
                setTimeout(() => {
                  loadDrafts();
                  loadExecution(data.executionId);
                }, 5000);
              }
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

export default SEOApprovalContent;
