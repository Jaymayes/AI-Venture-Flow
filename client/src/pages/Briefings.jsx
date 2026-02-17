import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import CEONav from "../components/CEONav";
import {
  ArrowLeft,
  FileText,
  Phone,
  Target,
  Brain,
  MessageSquare,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  Trophy,
  Sparkles,
  X,
  Send,
  Loader2,
  BookOpen,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BRIEFINGS_URL =
  "https://moltbot-triage-engine.jamarr.workers.dev/api/briefings";
const KNOWLEDGE_INGEST_URL =
  "https://moltbot-triage-engine.jamarr.workers.dev/api/knowledge/ingest";
const POLL_INTERVAL = 30_000;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const scoreColor = (score) => {
  if (score >= 91) return { bg: "bg-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400", label: "High Intent" };
  if (score >= 86) return { bg: "bg-amber-500/20", text: "text-amber-400", dot: "bg-amber-400", label: "Elevated" };
  return { bg: "bg-red-500/20", text: "text-red-400", dot: "bg-red-400", label: "Threshold" };
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const formatTimestamp = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// ---------------------------------------------------------------------------
// Section Accordion
// ---------------------------------------------------------------------------

function BriefingSection({ icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass noise rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <Icon size={18} className="text-cyan-400 shrink-0" />
        <span className="font-semibold text-white/90 flex-1">{title}</span>
        {open ? (
          <ChevronDown size={16} className="text-white/40" />
        ) : (
          <ChevronRight size={16} className="text-white/40" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { duration: 0.25 } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-sm text-white/70 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Closed-Won Modal — RAG Flywheel
// ---------------------------------------------------------------------------

function ClosedWonModal({ briefing, onClose, onSuccess }) {
  const [summary, setSummary] = useState("");
  const [tcv, setTcv] = useState("");
  const [winningArg, setWinningArg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const prospectName = briefing?.trigger?.from ?? "Unknown";
  const industry = briefing?.trigger?.qualificationData ?? "";

  const handleSubmit = async () => {
    if (!summary.trim() && !winningArg.trim()) {
      setError("Provide at least a deal summary or winning argument.");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Build the knowledge document content from the SP's input + briefing context
    const parts = [];
    parts.push(`CLOSED-WON DEAL REPORT`);
    parts.push(`Lead: ${prospectName}`);
    parts.push(`Intent Score: ${briefing?.trigger?.intentScore ?? "N/A"}/100`);
    parts.push(`Closed By: Sovereign Professional`);
    if (tcv.trim()) parts.push(`TCV: ${tcv.trim()}`);
    parts.push(`Date: ${new Date().toISOString().split("T")[0]}`);
    parts.push("");

    if (summary.trim()) {
      parts.push("DEAL SUMMARY:");
      parts.push(summary.trim());
      parts.push("");
    }

    if (winningArg.trim()) {
      parts.push("WINNING ARGUMENT / WHAT CLOSED THE DEAL:");
      parts.push(winningArg.trim());
      parts.push("");
    }

    // Include the original qualification data as context
    if (briefing?.qualificationData) {
      parts.push("ORIGINAL QUALIFICATION DATA:");
      parts.push(briefing.qualificationData);
      parts.push("");
    }

    if (briefing?.recommendedNextSteps) {
      parts.push("AI-RECOMMENDED STEPS (for training reference):");
      parts.push(briefing.recommendedNextSteps);
    }

    const title = `Closed-Won: ${prospectName} — ${new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;

    try {
      const res = await fetch(KNOWLEDGE_INGEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          source: "closed-won",
          content: parts.join("\n"),
          // Extract industry hint from qualification data
          ...(industry.toLowerCase().includes("saas") ? { industry: "SaaS" } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative glass noise rounded-2xl p-6 w-full max-w-lg border border-white/10 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Success state */}
          {result ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Knowledge Indexed</h3>
              <p className="text-white/50 text-sm mb-4">
                Your deal intelligence has been embedded into the RAG knowledge base.
                The AI will use this to draft smarter outreach for similar prospects.
              </p>
              <div className="glass noise rounded-lg p-3 text-left text-xs text-white/40 space-y-1 mb-4">
                <p><span className="text-white/60">Document ID:</span> {result.documentId}</p>
                <p><span className="text-white/60">Chunks created:</span> {result.chunksCreated}</p>
                <p><span className="text-white/60">Status:</span> <span className="text-emerald-400">{result.status}</span></p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/15 transition-colors text-sm"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Trophy size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Mark as Closed-Won</h3>
                  <p className="text-white/40 text-xs">Train the AI with your winning strategy</p>
                </div>
              </div>

              {/* Lead context */}
              <div className="glass noise rounded-lg p-3 mb-5 text-xs text-white/50">
                <div className="flex items-center gap-2 mb-1">
                  <Phone size={12} />
                  <span className="text-white/70 font-mono">{prospectName}</span>
                  <span className="text-white/30">|</span>
                  <span>Score: {briefing?.trigger?.intentScore}/100</span>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* TCV */}
                <div>
                  <label className="block text-sm font-semibold text-white/60 mb-1.5">
                    Total Contract Value (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $150,000"
                    value={tcv}
                    onChange={(e) => setTcv(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/90 text-sm placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-colors"
                  />
                </div>

                {/* Deal Summary */}
                <div>
                  <label className="block text-sm font-semibold text-white/60 mb-1.5">
                    Deal Summary
                  </label>
                  <textarea
                    placeholder="What happened? What were the key moments in the negotiation? What objections did you overcome?"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/90 text-sm placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Winning Argument */}
                <div>
                  <label className="block text-sm font-semibold text-white/60 mb-1.5">
                    Winning Argument / What Closed the Deal
                  </label>
                  <textarea
                    placeholder="What was the single most compelling point? The pain point that resonated? The demo moment that sealed it?"
                    value={winningArg}
                    onChange={(e) => setWinningArg(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/90 text-sm placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2 text-white/30 text-xs">
                  <BookOpen size={14} className="shrink-0 mt-0.5" />
                  <p>
                    Your insights will be embedded into the knowledge base. Future AI-drafted
                    outreach for similar prospects will be grounded in your real deal intelligence.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-xs p-2 rounded-lg bg-red-400/5 border border-red-400/10">
                    <AlertTriangle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500/80 to-cyan-500/80 text-white font-semibold text-sm hover:from-emerald-500 hover:to-cyan-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Training AI...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Submit &amp; Train AI
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Briefing Card (list item)
// ---------------------------------------------------------------------------

function BriefingCard({ briefing, isSelected, onClick }) {
  const sc = scoreColor(briefing.intentScore);

  return (
    <motion.button
      variants={fadeUp}
      onClick={onClick}
      className={`w-full text-left glass noise rounded-xl p-4 transition-all border ${
        isSelected
          ? "border-cyan-400/50 ring-1 ring-cyan-400/20"
          : "border-white/5 hover:border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Phone size={14} className="text-white/40 shrink-0" />
          <span className="text-white/90 font-mono text-sm truncate">
            {briefing.from}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
          {briefing.intentScore}/100
        </div>
      </div>

      <p className="text-white/50 text-xs leading-relaxed line-clamp-2 mb-2">
        {briefing.qualificationPreview}
      </p>

      <div className="flex items-center gap-1.5 text-white/30 text-xs">
        <Clock size={12} />
        <span>{timeAgo(briefing.generatedAt)}</span>
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Briefing Detail Panel
// ---------------------------------------------------------------------------

function BriefingDetail({ briefing, loading, onClosedWon }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/30">
        <RefreshCw size={20} className="animate-spin mr-2" />
        Loading briefing...
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/30 gap-3">
        <FileText size={40} className="opacity-30" />
        <p>Select a briefing to view the full context handoff</p>
      </div>
    );
  }

  const sc = scoreColor(briefing.trigger?.intentScore ?? 0);

  return (
    <motion.div
      key={briefing.briefingId}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="glass noise rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-white font-semibold text-lg mb-1">
              Lead: {briefing.trigger?.from ?? "Unknown"}
            </h3>
            <p className="text-white/40 text-xs font-mono">
              Briefing ID: {briefing.briefingId}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${sc.bg} ${sc.text} text-sm font-bold`}>
            <Target size={14} />
            {briefing.trigger?.intentScore}/100
            <span className="text-xs font-normal opacity-75">{sc.label}</span>
          </div>
        </div>

        <div className="flex gap-4 text-xs text-white/40">
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            {formatTimestamp(briefing.generatedAt)}
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare size={12} />
            {briefing.conversationTranscript?.length ?? 0} messages
          </div>
        </div>
      </div>

      {/* Section 1: Conversation Transcript */}
      <BriefingSection icon={MessageSquare} title="Conversation Transcript" defaultOpen>
        {briefing.conversationTranscript?.length > 0 ? (
          <div className="space-y-3">
            {briefing.conversationTranscript.map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div className="shrink-0 w-6 h-6 rounded-full bg-cyan-400/10 flex items-center justify-center mt-0.5">
                  <User size={12} className="text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white/60 font-mono text-xs">{entry.from}</span>
                    <span className="text-white/20 text-xs">{formatTimestamp(entry.timestamp)}</span>
                  </div>
                  <p className="text-white/80 text-sm">{entry.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/40 italic">
            Single inbound message — no prior conversation history.
          </p>
        )}

        {/* Show the triggering message if transcript is empty */}
        {(!briefing.conversationTranscript || briefing.conversationTranscript.length === 0) && briefing.trigger && (
          <div className="mt-3 p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/10">
            <div className="flex items-center gap-2 mb-1 text-cyan-400 text-xs font-semibold">
              <AlertTriangle size={12} />
              Triggering Message
            </div>
            <p className="text-white/80 text-sm">{briefing.trigger.content}</p>
          </div>
        )}
      </BriefingSection>

      {/* Section 2: Qualification Data */}
      <BriefingSection icon={Target} title="Qualification Data" defaultOpen>
        <p className="whitespace-pre-wrap">{briefing.qualificationData}</p>
      </BriefingSection>

      {/* Section 3: Sentiment Analysis */}
      <BriefingSection icon={Brain} title="Sentiment & Emotional Subtext">
        <p className="whitespace-pre-wrap">{briefing.sentimentAnalysis}</p>
      </BriefingSection>

      {/* Section 4: Recommended Next Steps */}
      <BriefingSection icon={Lightbulb} title="Recommended Next Steps">
        <p className="whitespace-pre-wrap">{briefing.recommendedNextSteps}</p>
      </BriefingSection>

      {/* Action buttons */}
      <div className="glass noise rounded-xl p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Claim Lead */}
          <button className="flex-1 py-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 font-semibold hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-2 text-sm">
            <CheckCircle size={16} />
            Claim This Lead
          </button>

          {/* Closed-Won — RAG Flywheel */}
          <button
            onClick={() => onClosedWon && onClosedWon(briefing)}
            className="flex-1 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-semibold hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Trophy size={16} />
            Closed-Won &amp; Train AI
          </button>
        </div>
        <p className="text-white/30 text-xs mt-3 text-center">
          Claim assigns you to this prospect. Closed-Won feeds your deal intel into the AI knowledge base.
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Briefings Page
// ---------------------------------------------------------------------------

export default function Briefings() {
  const [briefings, setBriefings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState(null);
  const [closedWonBriefing, setClosedWonBriefing] = useState(null);

  // ── Fetch briefing list ──
  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(BRIEFINGS_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBriefings(data.briefings ?? []);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error("[Briefings] List fetch failed:", err);
      setError(err.message);
    } finally {
      setListLoading(false);
    }
  }, []);

  // ── Fetch briefing detail ──
  const fetchDetail = useCallback(async (id) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${BRIEFINGS_URL}/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDetail(data);
    } catch (err) {
      console.error(`[Briefings] Detail fetch failed for ${id}:`, err);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ── Initial load + polling ──
  useEffect(() => {
    fetchList();
    const interval = setInterval(fetchList, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchList]);

  // ── Fetch detail on selection ──
  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId, fetchDetail]);

  return (
    <div className="min-h-screen">
      {/* CEO Tab Nav */}
      <CEONav />

      <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="mb-8"
      >
        <motion.div variants={fadeUp} className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
            Lead Briefings
          </h1>
        </motion.div>

        <motion.div variants={fadeUp} className="flex items-center justify-between mt-3">
          <p className="text-white/40 text-sm">
            High-intent lead handoff console for Sovereign Professionals
          </p>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-white/20 text-xs">
                Updated {timeAgo(lastRefresh.toISOString())}
              </span>
            )}
            <button
              onClick={fetchList}
              className="p-2 rounded-lg glass noise hover:bg-white/10 transition-colors"
              title="Refresh briefings"
            >
              <RefreshCw
                size={14}
                className={`text-white/40 ${listLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 glass noise rounded-xl p-4 border border-red-400/20"
        >
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle size={16} />
            <span>Failed to load briefings: {error}</span>
          </div>
        </motion.div>
      )}

      {/* Main layout — list + detail */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-5 gap-6"
      >
        {/* Briefing List */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white/60 text-sm font-semibold uppercase tracking-wider">
              Active Briefings
            </h2>
            <span className="text-white/30 text-xs">
              {briefings.length} lead{briefings.length !== 1 ? "s" : ""}
            </span>
          </div>

          {listLoading && briefings.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/30">
              <RefreshCw size={18} className="animate-spin mr-2" />
              Loading...
            </div>
          ) : briefings.length === 0 ? (
            <div className="glass noise rounded-xl p-8 text-center">
              <FileText size={32} className="mx-auto text-white/20 mb-3" />
              <p className="text-white/40 text-sm">No active briefings</p>
              <p className="text-white/20 text-xs mt-1">
                Briefings appear when leads score &gt; 85/100 intent
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="space-y-2"
            >
              {briefings.map((b) => (
                <BriefingCard
                  key={b.briefingId}
                  briefing={b}
                  isSelected={selectedId === b.briefingId}
                  onClick={() => setSelectedId(b.briefingId)}
                />
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Briefing Detail */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white/60 text-sm font-semibold uppercase tracking-wider">
              Full Context Briefing
            </h2>
            {detail && (
              <button
                onClick={() => { setSelectedId(null); setDetail(null); }}
                className="text-white/30 text-xs hover:text-white/50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <BriefingDetail
            briefing={detail}
            loading={detailLoading}
            onClosedWon={(b) => setClosedWonBriefing(b)}
          />
        </motion.div>
      </motion.div>

      {/* Closed-Won Modal */}
      {closedWonBriefing && (
        <ClosedWonModal
          briefing={closedWonBriefing}
          onClose={() => setClosedWonBriefing(null)}
          onSuccess={(data) => {
            console.log("[Briefings] Knowledge ingested:", data);
          }}
        />
      )}
      </div>
    </div>
  );
}
