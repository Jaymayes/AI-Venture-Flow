import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  qualifyCandidate,
  approveRecruitment,
  fetchRecruitmentPipeline,
  fetchRecruitmentState,
} from "../lib/triage-client";
import {
  RefreshCw,
  UserPlus,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  DollarSign,
  Star,
  Shield,
  FileText,
  Play,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Award,
  BarChart3,
  ArrowRight,
  Eye,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtUSD = (n) => {
  if (n == null) return "N/A";
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const STATUS_CONFIG = {
  running: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Running", icon: Loader2 },
  interrupted: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Awaiting CEO Approval", icon: Clock },
  completed: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Provisioned", icon: CheckCircle2 },
  halted: { bg: "bg-red-500/20", text: "text-red-400", label: "Halted", icon: AlertTriangle },
  rejected: { bg: "bg-red-500/20", text: "text-red-400", label: "Rejected", icon: XCircle },
};

const TIER_CONFIG = {
  pilot: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Standard", retainer: "$2K/mo", commission: "15%" },
  standard: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Strategic Growth", retainer: "$4K/mo", commission: "17.5%" },
  enterprise: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Enterprise Architect", retainer: "$6K/mo", commission: "20%" },
  reject: { bg: "bg-red-500/20", text: "text-red-400", label: "Below Threshold", retainer: "N/A", commission: "N/A" },
};

const getStatusConfig = (status) => STATUS_CONFIG[status] ?? STATUS_CONFIG.running;
const getTierConfig = (tier) => TIER_CONFIG[tier] ?? TIER_CONFIG.pilot;

// ---------------------------------------------------------------------------
// Score Bar
// ---------------------------------------------------------------------------

function ScoreBar({ score, max = 25, label, color }) {
  const pct = Math.min((score / max) * 100, 100);
  const colors = {
    blue: { bar: "bg-blue-500", track: "bg-blue-500/10" },
    purple: { bar: "bg-purple-500", track: "bg-purple-500/10" },
    amber: { bar: "bg-amber-500", track: "bg-amber-500/10" },
    emerald: { bar: "bg-emerald-500", track: "bg-emerald-500/10" },
  };
  const c = colors[color] ?? colors.blue;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="text-white/80 font-mono">{score}/{max}</span>
      </div>
      <div className={`h-2 rounded-full ${c.track}`}>
        <motion.div
          className={`h-full rounded-full ${c.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Card — candidate summary in the recruitment queue
// ---------------------------------------------------------------------------

function PipelineCard({ execution, onSelect, onApprove }) {
  const statusCfg = getStatusConfig(execution.status);
  const tierCfg = getTierConfig(execution.recommendedTier);
  const StatusIcon = statusCfg.icon;

  return (
    <motion.div
      variants={fadeUp}
      className="glass rounded-xl p-4 border border-white/5 hover:bg-white/[0.06] transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="text-white font-medium text-sm flex items-center gap-2">
            {execution.candidateName}
            {execution.bqmScore >= 85 && <Star size={14} className="text-amber-400" />}
          </h4>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Briefcase size={12} />
            <span>{execution.specialization}</span>
            <span className="text-white/20">|</span>
            <span>{execution.candidateEmail}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text} text-xs font-medium`}>
            <StatusIcon size={12} className={execution.status === "running" ? "animate-spin" : ""} />
            {statusCfg.label}
          </span>
          {execution.bqmScore != null && (
            <span className="text-lg font-mono font-bold text-white/90">{execution.bqmScore}</span>
          )}
        </div>
      </div>

      {/* Tier recommendation */}
      {execution.recommendedTier && execution.recommendedTier !== "reject" && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className={`px-2 py-0.5 rounded-full ${tierCfg.bg} ${tierCfg.text} font-medium`}>
            {tierCfg.label}
          </span>
          <span className="text-white/30">{tierCfg.retainer} + {tierCfg.commission}</span>
        </div>
      )}

      {execution.rejectionReason && (
        <p className="mt-2 text-red-400/70 text-xs">{execution.rejectionReason}</p>
      )}

      {/* Action buttons */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => onSelect(execution.executionId)}
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
        >
          <Eye size={12} /> View Details
        </button>
        {execution.status === "interrupted" && (
          <button
            onClick={() => onApprove(execution.executionId)}
            className="ml-auto flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-medium transition-colors"
          >
            <ThumbsUp size={12} /> Approve & Provision
          </button>
        )}
      </div>

      {/* Trace */}
      <div className="mt-2 flex items-center gap-1 text-xs text-white/20">
        {execution.trace?.map((t, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ArrowRight size={8} />}
            <span className={t.includes("ERROR") ? "text-red-400" : "text-white/30"}>{t}</span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Detail Panel — full execution state view
// ---------------------------------------------------------------------------

function DetailPanel({ executionId, onClose, onApprove }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sowExpanded, setSowExpanded] = useState(false);

  useEffect(() => {
    if (!executionId) return;
    setLoading(true);
    setError(null);
    fetchRecruitmentState(executionId)
      .then((data) => setState(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [executionId]);

  if (loading) {
    return (
      <motion.div variants={fadeUp} className="glass rounded-2xl p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-400" size={24} />
        <span className="ml-2 text-white/50">Loading execution state...</span>
      </motion.div>
    );
  }

  if (error || !state) {
    return (
      <motion.div variants={fadeUp} className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle size={18} />
          <span>{error || "State not found"}</span>
        </div>
        <button onClick={onClose} className="mt-3 text-xs text-white/50 hover:text-white">Close</button>
      </motion.div>
    );
  }

  const bqm = state.bqmScore;
  const sow = state.sow;
  const fin = state.financialSetup;
  const prov = state.accessProvisioning;
  const statusCfg = getStatusConfig(state.status);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="glass rounded-2xl p-6 space-y-4 border border-purple-500/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">{state.candidateProfile?.legalName}</h3>
          <p className="text-white/50 text-sm">
            {state.candidateProfile?.specialization} | {state.candidateProfile?.businessEntity}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full ${statusCfg.bg} ${statusCfg.text} text-sm font-medium`}>
            {statusCfg.label}
          </span>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xs">Close</button>
        </div>
      </div>

      {/* BQM Score Breakdown */}
      {bqm && (
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-white/80 text-sm font-medium flex items-center gap-2">
              <Award size={16} className="text-amber-400" />
              BQM Assessment
            </h4>
            <span className="text-2xl font-mono font-bold text-white">{bqm.totalScore}/100</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ScoreBar score={bqm.b2bAcumen} label="B2B Acumen" color="blue" />
            <ScoreBar score={bqm.domainExpertise} label="Domain Expertise" color="purple" />
            <ScoreBar score={bqm.closingAbility} label="Closing Ability" color="amber" />
            <ScoreBar score={bqm.leadershipFit} label="Leadership Fit" color="emerald" />
          </div>
          <p className="text-white/60 text-xs">{bqm.assessment}</p>
          {bqm.strengths?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {bqm.strengths.map((s, i) => (
                <span key={i} className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 text-xs rounded-full">{s}</span>
              ))}
            </div>
          )}
          {bqm.concerns?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {bqm.concerns.map((c, i) => (
                <span key={i} className="px-2 py-0.5 bg-red-500/15 text-red-300 text-xs rounded-full">{c}</span>
              ))}
            </div>
          )}
          <div className="text-xs text-white/30">{bqm.evaluationMethod} | {bqm.latencyMs}ms</div>
        </div>
      )}

      {/* Financial Setup */}
      {fin && (
        <div className="bg-white/5 rounded-xl p-4 space-y-2">
          <h4 className="text-white/80 text-sm font-medium flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-400" />
            Compensation Package
          </h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-white/40">Tier</p>
              <p className={`text-sm font-semibold ${getTierConfig(fin.tier).text}`}>{fin.tierLabel}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-white/40">Retainer</p>
              <p className="text-sm font-semibold text-emerald-400">${fin.monthlyRetainerUSD.toLocaleString()}/mo</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-white/40">Commission</p>
              <p className="text-sm font-semibold text-emerald-400">{fin.commissionPercent}%</p>
            </div>
          </div>
          {fin.tierUpgrade && (
            <p className="text-amber-400 text-xs flex items-center gap-1">
              <Star size={12} /> Tier upgraded from {fin.originalRecommendedTier}
            </p>
          )}
        </div>
      )}

      {/* SOW Summary */}
      {sow && (
        <div className="bg-white/5 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-white/80 text-sm font-medium flex items-center gap-2">
              <FileText size={16} className="text-blue-400" />
              Statement of Work — {sow.sowId}
            </h4>
            <button
              onClick={() => setSowExpanded(!sowExpanded)}
              className="text-white/30 hover:text-white text-xs flex items-center gap-1"
            >
              {sowExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {sowExpanded ? "Collapse" : "View SOW"}
            </button>
          </div>

          {/* DOL Compliance badges */}
          <div className="flex flex-wrap gap-1.5">
            <span className={`px-2 py-0.5 text-xs rounded-full ${sow.rightToSubstitute ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
              <Shield size={10} className="inline mr-1" />Right to Substitute: {sow.rightToSubstitute ? "YES" : "NO"}
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-xs rounded-full">
              Control of Methods
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-xs rounded-full">
              Own Schedule
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-xs rounded-full">
              Own Equipment
            </span>
          </div>

          <AnimatePresence>
            {sowExpanded && sow.document && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 bg-white/5 rounded-lg p-4 text-xs text-white/60 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto"
              >
                {sow.document}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Access Provisioning */}
      {prov && (
        <div className="bg-white/5 rounded-xl p-4 space-y-2">
          <h4 className="text-white/80 text-sm font-medium flex items-center gap-2">
            <Shield size={16} className="text-purple-400" />
            Access Provisioning
          </h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className={`rounded-lg p-2 text-center ${prov.crmPortalAccess ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/30"}`}>
              CRM Portal {prov.crmPortalAccess ? "Active" : "Pending"}
            </div>
            <div className={`rounded-lg p-2 text-center ${prov.welcomeEmailSent ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/30"}`}>
              Welcome Email {prov.welcomeEmailSent ? "Sent" : "Pending"}
            </div>
            <div className={`rounded-lg p-2 text-center bg-white/5 text-white/30`}>
              RBAC: {prov.rbacRole}
            </div>
          </div>
        </div>
      )}

      {/* Approve button (if interrupted) */}
      {state.status === "interrupted" && (
        <button
          onClick={() => onApprove(state.executionId)}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-3 font-medium transition-colors"
        >
          <ThumbsUp size={18} />
          Approve & Provision Access
        </button>
      )}

      {/* FinOps */}
      <div className="flex items-center gap-4 text-xs text-white/30 pt-2 border-t border-white/5">
        <span>Execution: {state.executionId?.slice(0, 8)}</span>
        <span>Started: {new Date(state.startedAt).toLocaleString()}</span>
        {state.finOps && <span>Cost: ${state.finOps.computeCostUSD?.toFixed(6)}</span>}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Candidate Application Form
// ---------------------------------------------------------------------------

function CandidateForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    legalName: "", email: "", phone: "", businessEntity: "",
    title: "", state: "", specialization: "", yearsExperience: 5,
    portfolioSubmission: "", linkedinUrl: "", referralSource: "",
    previousAnnualRevenue: "",
  });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = () => {
    if (!form.legalName || !form.email || !form.portfolioSubmission) return;
    onSubmit({
      ...form,
      yearsExperience: parseInt(form.yearsExperience) || 5,
      previousAnnualRevenue: form.previousAnnualRevenue ? parseInt(form.previousAnnualRevenue) : undefined,
    });
  };

  const inputClass = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none";

  return (
    <motion.div variants={fadeUp} className="glass rounded-2xl p-5 space-y-3">
      <h3 className="text-white font-semibold text-sm flex items-center gap-2">
        <UserPlus size={16} className="text-purple-400" />
        New SP Candidate
      </h3>
      <p className="text-white/40 text-xs">Submit a candidate for BQM evaluation and onboarding</p>

      <div className="grid grid-cols-2 gap-2">
        <input value={form.legalName} onChange={update("legalName")} placeholder="Legal Name *" className={inputClass} />
        <input value={form.email} onChange={update("email")} placeholder="Email *" className={inputClass} />
        <input value={form.phone} onChange={update("phone")} placeholder="Phone" className={inputClass} />
        <input value={form.businessEntity} onChange={update("businessEntity")} placeholder="Business Entity (LLC)" className={inputClass} />
        <input value={form.title} onChange={update("title")} placeholder="Title (VP Sales)" className={inputClass} />
        <input value={form.state} onChange={update("state")} placeholder="State (e.g. California)" className={inputClass} />
        <input value={form.specialization} onChange={update("specialization")} placeholder="Specialization (Healthcare SaaS)" className={inputClass} />
        <input value={form.yearsExperience} onChange={update("yearsExperience")} placeholder="Years Experience" type="number" className={inputClass} />
        <input value={form.linkedinUrl} onChange={update("linkedinUrl")} placeholder="LinkedIn URL (optional)" className={inputClass} />
        <input value={form.previousAnnualRevenue} onChange={update("previousAnnualRevenue")} placeholder="Prev. Annual Revenue (optional)" type="number" className={inputClass} />
      </div>

      <textarea
        value={form.portfolioSubmission}
        onChange={update("portfolioSubmission")}
        placeholder="Portfolio / Case Study Submission * (paste markdown, describe deal history, or link to portfolio)"
        rows={4}
        className={`${inputClass} w-full resize-none`}
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !form.legalName || !form.email || !form.portfolioSubmission}
        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:text-white/30 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
        {loading ? "Running BQM Pipeline..." : "Submit for BQM Evaluation"}
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component: SPRecruitmentContent
// ---------------------------------------------------------------------------

export function SPRecruitmentContent() {
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadPipeline = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchRecruitmentPipeline();
      setPipeline(data.executions ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadPipeline(); }, [loadPipeline]);

  const handleSubmitCandidate = async (candidate) => {
    setSubmitting(true);
    try {
      await qualifyCandidate(candidate);
      await loadPipeline();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (executionId) => {
    setApproving(executionId);
    try {
      await approveRecruitment(executionId);
      await loadPipeline();
      setSelectedId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setApproving(null);
    }
  };

  // Summary KPIs
  const totalCandidates = pipeline.length;
  const awaitingApproval = pipeline.filter(e => e.status === "interrupted").length;
  const provisioned = pipeline.filter(e => e.status === "completed").length;
  const rejected = pipeline.filter(e => e.status === "rejected").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-purple-400" size={32} />
        <span className="ml-3 text-white/50">Loading SP Recruitment Pipeline...</span>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-purple-400" />
            SP Recruitment Pipeline
          </h2>
          <p className="text-white/40 text-sm mt-0.5">
            BQM Verification | DOL-Compliant SOW | Compensation Tiering | HITL Provisioning
          </p>
        </div>
        <button
          onClick={() => loadPipeline(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </motion.div>

      {/* KPI Summary */}
      <motion.div variants={stagger} className="grid grid-cols-4 gap-3">
        <motion.div variants={fadeUp} className="glass rounded-xl p-4 text-center">
          <Users size={20} className="text-blue-400 mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-white">{totalCandidates}</p>
          <p className="text-white/40 text-xs">Total Candidates</p>
        </motion.div>
        <motion.div variants={fadeUp} className="glass rounded-xl p-4 text-center">
          <Clock size={20} className="text-amber-400 mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-amber-400">{awaitingApproval}</p>
          <p className="text-white/40 text-xs">Awaiting Approval</p>
        </motion.div>
        <motion.div variants={fadeUp} className="glass rounded-xl p-4 text-center">
          <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-emerald-400">{provisioned}</p>
          <p className="text-white/40 text-xs">Provisioned</p>
        </motion.div>
        <motion.div variants={fadeUp} className="glass rounded-xl p-4 text-center">
          <XCircle size={20} className="text-red-400 mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-red-400">{rejected}</p>
          <p className="text-white/40 text-xs">Rejected</p>
        </motion.div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp} className="glass rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle size={16} /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-white/30 hover:text-white text-xs">Dismiss</button>
        </motion.div>
      )}

      {/* Detail Panel (if selected) */}
      <AnimatePresence>
        {selectedId && (
          <DetailPanel
            executionId={selectedId}
            onClose={() => setSelectedId(null)}
            onApprove={handleApprove}
          />
        )}
      </AnimatePresence>

      {/* Pipeline List */}
      {pipeline.length > 0 ? (
        <motion.div variants={stagger} className="space-y-2">
          {pipeline.map((exec) => (
            <PipelineCard
              key={exec.executionId}
              execution={exec}
              onSelect={setSelectedId}
              onApprove={handleApprove}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-12 text-center">
          <UserPlus size={40} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">
            No candidates in the recruitment pipeline. Submit a candidate below to begin BQM evaluation.
          </p>
        </motion.div>
      )}

      {/* Candidate Application Form */}
      <CandidateForm onSubmit={handleSubmitCandidate} loading={submitting} />
    </motion.div>
  );
}
