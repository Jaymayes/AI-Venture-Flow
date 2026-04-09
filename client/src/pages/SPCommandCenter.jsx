/**
 * SPCommandCenter.jsx — Phase 72: Sovereign Infrastructure
 *
 * Micro-Agency OS for Sovereign Professionals — 7-tab command center:
 *   1. Overview — Earnings, Dynamic Compensation widget, Lead Ledger, Payout Ledger
 *   2. Lead Pipeline — Inbox/Kanban views with Full Context Briefings + Deal Room
 *   3. Treasury — SP financial ledger, escrow, payouts (Epic 9)
 *   4. AI Revenue Engine — Campaign config + Strategic Guardrails
 *   5. SOWs & Deliverables — Milestone tracking (1099 Economic Reality test)
 *   6. Team Access — Right to Substitute / Sub-contractor RBAC
 *   7. Compliance Hub — W-9 status, 1099 filing, Expense tracking
 *
 * Auth: Email + password gate. CEO bypass client-side; SP validated via API.
 * Session keys: rsllc_sp_email, rsllc_sp_slug, rsllc_sp_name, rsllc_sp_token
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Rocket,
  Target,
  Activity,
  Zap,
  LogOut,
  Users,
  Briefcase,
  DollarSign,
  ChevronDown,
  ChevronRight,
  List,
  LayoutGrid,
  RefreshCw,
  CheckCircle2,
  Clock,
  Phone,
  FileText,
  TrendingUp,
  AlertCircle,
  X,
  MessageSquare,
  Star,
  ExternalLink,
  Link2,
  Copy,
  Trophy,
  Send,
  BarChart3,
  Power,
  Shield,
  Scale,
  UserPlus,
  ClipboardList,
  Milestone,
  BadgeCheck,
  Banknote,
  Receipt,
  ShieldCheck,
  Ban,
  BookOpen,
  PenTool,
  Trash2,
  Gauge,
  AlertTriangle,
  Upload,
  FileUp,
  Database,
} from "lucide-react";
import Papa from "papaparse";
import {
  fetchPartnerLeads,
  updateLeadStage,
  generateDealRoom,
} from "../lib/partner-client";
import { setAuthToken } from "../lib/auth-store";
import {
  fetchEngineConfig,
  saveEngineConfig,
  fetchOverviewData,
  fetchComplianceStatus,
  initiateW9Signing,
  fetchSOWs,
  markSOWComplete,
  fetchTeamMembers,
  inviteTeamMember,
  revokeTeamMember,
  fetchExpenses,
  createExpense,
  ingestCSV,
  fetchSPEngineStatus,
  toggleSPEngine,
} from "../lib/sp-client";
import SPTreasuryOps from "./SPTreasuryOps";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SP_EMAIL_KEY = "rsllc_sp_email";
const SP_SLUG_KEY = "rsllc_sp_slug";
const SP_NAME_KEY = "rsllc_sp_name";
const SP_TOKEN_KEY = "rsllc_sp_token";
const API_BASE =
  import.meta.env.VITE_TRIAGE_API_BASE ||
  "https://api.referralsvc.com";

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3, color: "text-cyan-400" },
  { key: "pipeline", label: "Lead Pipeline", icon: Target, color: "text-amber-400" },
  { key: "treasury", label: "Treasury", icon: Banknote, color: "text-purple-400" },
  { key: "engine", label: "AI Revenue Engine", icon: Zap, color: "text-emerald-400" },
  { key: "sows", label: "SOWs & Deliverables", icon: ClipboardList, color: "text-violet-400" },
  { key: "team", label: "Team Access", icon: UserPlus, color: "text-blue-400" },
  { key: "compliance", label: "Compliance Hub", icon: Shield, color: "text-rose-400" },
];

const STAGES = [
  { key: "qualified", label: "Qualified", color: "cyan", icon: Target },
  { key: "consultation_scheduled", label: "Consultation", color: "amber", icon: Phone },
  { key: "proposal_sent", label: "Proposal Sent", color: "violet", icon: FileText },
  { key: "negotiation", label: "Negotiation", color: "orange", icon: MessageSquare },
  { key: "closed_won", label: "Closed Won", color: "emerald", icon: CheckCircle2 },
  { key: "closed_lost", label: "Closed Lost", color: "red", icon: X },
];

const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.key, s]));

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function fmt$(val) {
  if (!val) return "$0";
  return `$${Number(val).toLocaleString()}`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function scoreColor(score) {
  if (score >= 85) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

// ---------------------------------------------------------------------------
// Shared UI Components
// ---------------------------------------------------------------------------

function KPICard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-lg bg-slate-950 border border-slate-700 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {Icon && <Icon size={16} className={`text-${color}-400`} />}
      </div>
      <p className="text-2xl font-bold text-white tracking-tight mt-1 font-mono">{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, message, action, onAction }) {
  return (
    <div className="rounded-lg bg-slate-950 border border-slate-700 p-12 text-center max-w-lg mx-auto">
      <Icon size={48} className="text-slate-700 mx-auto mb-4" />
      <h3 className="text-slate-400 font-semibold mb-2">{title}</h3>
      <p className="text-slate-500 text-sm mb-4">{message}</p>
      {action && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-md bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 hover:bg-slate-700 transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 right-6 z-50 rounded-lg bg-slate-950 px-5 py-3 border ${
        type === "success" ? "border-emerald-500/20" : "border-red-500/20"
      } flex items-center gap-3 shadow-2xl`}
    >
      {type === "success" ? (
        <CheckCircle2 size={16} className="text-emerald-400" />
      ) : (
        <AlertCircle size={16} className="text-red-400" />
      )}
      <p className={`text-sm ${type === "success" ? "text-emerald-300" : "text-red-300"}`}>
        {message}
      </p>
    </motion.div>
  );
}

function StageBadge({ stage }) {
  const s = STAGE_MAP[stage] || { label: stage, color: "gray", icon: Clock };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-${s.color}-500/10 text-${s.color}-400 border-${s.color}-500/30`}>
      <Icon size={10} />
      {s.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const colors = {
    new: "cyan", contacted: "blue", qualified: "violet",
    converted: "emerald", nurturing: "amber", archived: "gray",
  };
  const c = colors[status] || "gray";
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-${c}-500/10 text-${c}-400 border-${c}-500/30`}>
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Auth Gate
// ---------------------------------------------------------------------------

function SPAuthGate({ onAuthenticate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    // Phase 91: Backend-validated login (CEO or SP)
    setLoading(true);
    try {
      // Try CEO login first
      const ceoRes = await fetch(`${API_BASE}/api/auth/ceo-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, password }),
      });
      if (ceoRes.ok) {
        const ceoData = await ceoRes.json();
        sessionStorage.setItem(SP_EMAIL_KEY, trimmed);
        sessionStorage.setItem(SP_SLUG_KEY, "jamarr");
        sessionStorage.setItem(SP_NAME_KEY, "Jamarr Mayes");
        if (ceoData.token) {
          sessionStorage.setItem(SP_TOKEN_KEY, ceoData.token);
          setAuthToken(ceoData.token);
        }
        onAuthenticate(trimmed, "jamarr", "Jamarr Mayes");
        return;
      }

      // Not CEO — try SP login
      const res = await fetch(`${API_BASE}/api/v1/auth/sp-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem(SP_EMAIL_KEY, trimmed);
        sessionStorage.setItem(SP_SLUG_KEY, data.slug || "");
        sessionStorage.setItem(SP_NAME_KEY, data.fullName || "Sovereign Professional");
        if (data.token) {
          sessionStorage.setItem(SP_TOKEN_KEY, data.token);
          setAuthToken(data.token);
        }
        onAuthenticate(trimmed, data.slug || "", data.fullName || "Sovereign Professional");
      } else {
        setError(data.error || "Invalid credentials.");
        setPassword("");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-accent/15 blur-[140px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 rounded-lg bg-slate-950 border border-slate-700 p-8 w-full max-w-md"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <Rocket size={32} className="text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center gradient-text mb-1">SP Command Center</h1>
        <p className="text-white/40 text-sm text-center mb-8">
          Referral Service LLC &mdash; Sovereign Professional Portal
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white/50 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2"><Mail size={16} className="text-white/30" /></div>
              <input
                type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="you@example.com" autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white/50 mb-2">Password</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2"><Lock size={16} className="text-white/30" /></div>
              <input
                type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Enter password"
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs bg-red-400/5 border border-red-400/10 rounded-lg p-3 text-center">
              {error}
            </motion.div>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-black font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : "Sign In"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors">
            <ArrowLeft size={12} /> Back to Referral Service LLC
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Context Briefing Expander
// ---------------------------------------------------------------------------

function BriefingPanel({ briefing }) {
  const [expanded, setExpanded] = useState(false);
  if (!briefing) return <p className="text-white/30 text-xs italic">No briefing available</p>;
  const { qualificationData, sentimentAnalysis, recommendedNextSteps } = briefing;
  return (
    <div className="space-y-2">
      <button onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold hover:text-cyan-300 transition-colors">
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Full Context Briefing
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-3">
            {qualificationData && (
              <div className="rounded-md bg-slate-900 border border-slate-700/50 p-3">
                <h4 className="text-xs font-bold text-white/60 mb-2 uppercase tracking-wide">Qualification (BANT)</h4>
                <div className="space-y-1 text-xs text-white/50">
                  {qualificationData.icpFitSummary && <p><span className="text-white/70 font-medium">ICP Fit:</span> {qualificationData.icpFitSummary}</p>}
                  {qualificationData.budgetIndicators && <p><span className="text-white/70 font-medium">Budget:</span> {qualificationData.budgetIndicators}</p>}
                  {qualificationData.timeline && <p><span className="text-white/70 font-medium">Timeline:</span> {qualificationData.timeline}</p>}
                  {qualificationData.painPoints && <p><span className="text-white/70 font-medium">Pain Points:</span> {qualificationData.painPoints}</p>}
                </div>
              </div>
            )}
            {sentimentAnalysis && (
              <div className="rounded-md bg-slate-900 border border-slate-700/50 p-3">
                <h4 className="text-xs font-bold text-white/60 mb-2 uppercase tracking-wide">Sentiment Analysis</h4>
                <div className="space-y-1 text-xs text-white/50">
                  <p><span className="text-white/70 font-medium">Overall:</span> {sentimentAnalysis.overallSentiment}</p>
                  <p><span className="text-white/70 font-medium">Trust:</span> {sentimentAnalysis.trustLevel}</p>
                  <p><span className="text-white/70 font-medium">Trajectory:</span> {sentimentAnalysis.engagementTrajectory}</p>
                </div>
              </div>
            )}
            {recommendedNextSteps && (
              <div className="rounded-md bg-slate-900 border border-slate-700/50 p-3">
                <h4 className="text-xs font-bold text-white/60 mb-2 uppercase tracking-wide">Recommended Next Steps</h4>
                <div className="space-y-1 text-xs text-white/50">
                  {recommendedNextSteps.immediateAction && <p><span className="text-emerald-400 font-medium">Action:</span> {recommendedNextSteps.immediateAction}</p>}
                  {recommendedNextSteps.talkingPoints && Array.isArray(recommendedNextSteps.talkingPoints) && (
                    <div><span className="text-white/70 font-medium">Talking Points:</span>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">{recommendedNextSteps.talkingPoints.map((tp, i) => <li key={i}>{tp}</li>)}</ul>
                    </div>
                  )}
                  {recommendedNextSteps.objectionsToAnticipate && Array.isArray(recommendedNextSteps.objectionsToAnticipate) && (
                    <div><span className="text-amber-400 font-medium">Objections:</span>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">{recommendedNextSteps.objectionsToAnticipate.map((o, i) => <li key={i}>{o}</li>)}</ul>
                    </div>
                  )}
                  {recommendedNextSteps.closingStrategy && <p><span className="text-cyan-400 font-medium">Closing Strategy:</span> {recommendedNextSteps.closingStrategy}</p>}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inbox Card
// ---------------------------------------------------------------------------

function InboxCard({ lead, onStageChange, updatingId, onGenerateDealRoom, dealRoomLinks, generatingDealRoom }) {
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUpdating = updatingId === lead.id;
  const briefing = lead.context_briefing;
  const dealLink = dealRoomLinks?.[lead.id];
  const isGenerating = generatingDealRoom === lead.id;
  const canDealRoom = ["proposal_sent", "negotiation"].includes(lead.status);

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-lg bg-slate-950 border border-slate-700 p-5 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold text-sm truncate">{lead.prospect_name || "Unknown"}</h3>
            {lead.decision_maker_identified && <Star size={12} className="text-amber-400 flex-shrink-0" />}
            {(lead.drip_count ?? 0) > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 flex-shrink-0" title={`${lead.drip_count} AI follow-ups sent`}>
                <Mail size={10} className="text-blue-400" />
                <span className="text-[10px] font-semibold text-blue-400">{lead.drip_count}</span>
              </div>
            )}
          </div>
          <p className="text-white/40 text-xs truncate">{lead.prospect_company || "No company"} {lead.prospect_role ? `· ${lead.prospect_role}` : ""}</p>
        </div>
        <StageBadge stage={lead.status} />
      </div>
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <Target size={12} className="text-white/30" />
          <span className={`text-xs font-bold ${scoreColor(lead.tofu_score || 0)}`}>{lead.tofu_score ?? "—"}</span>
          <span className="text-white/20 text-xs">ToFu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp size={12} className="text-white/30" />
          <span className="text-xs font-bold text-white/70">{lead.intent_score ?? "—"}</span>
          <span className="text-white/20 text-xs">Intent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign size={12} className="text-white/30" />
          <span className="text-xs font-bold text-emerald-400">{fmt$(lead.estimated_arr)}</span>
          <span className="text-white/20 text-xs">ARR</span>
        </div>
      </div>
      <BriefingPanel briefing={briefing} />
      {canDealRoom && (
        <div className="mt-3 pt-3 border-t border-white/5">
          {dealLink ? (
            <div className="flex items-center gap-2">
              <Link2 size={12} className="text-violet-400 flex-shrink-0" />
              <a href={dealLink} target="_blank" rel="noopener noreferrer" className="text-violet-400 text-xs font-medium hover:text-violet-300 transition-colors truncate flex-1">{dealLink}</a>
              <button onClick={() => { navigator.clipboard.writeText(dealLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-500/10 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-colors flex-shrink-0">
                {copied ? <CheckCircle2 size={10} /> : <Copy size={10} />} {copied ? "Copied" : "Copy"}
              </button>
              <a href={dealLink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors flex-shrink-0">
                <ExternalLink size={12} />
              </a>
            </div>
          ) : (
            <button onClick={() => onGenerateDealRoom(lead.id)} disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/20 text-violet-300 text-xs font-semibold hover:from-violet-500/30 hover:to-purple-500/30 transition-all disabled:opacity-50">
              {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
              {isGenerating ? "Generating..." : "Generate Deal Room Link"}
            </button>
          )}
        </div>
      )}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-white/20 text-xs">{fmtDate(lead.updated_at)}</span>
        <div className="relative">
          <button onClick={() => setShowStageMenu(!showStageMenu)} disabled={isUpdating}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs font-medium hover:bg-white/10 transition-all disabled:opacity-50">
            {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <>Update Stage <ChevronDown size={12} /></>}
          </button>
          <AnimatePresence>
            {showStageMenu && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 bottom-full mb-1 w-48 rounded-md bg-slate-950 border border-slate-700 overflow-hidden z-50">
                {STAGES.filter((s) => s.key !== lead.status).map((s) => {
                  const Icon = s.icon;
                  return (
                    <button key={s.key} onClick={() => { setShowStageMenu(false); onStageChange(lead.id, s.key); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/5 hover:text-${s.color}-400 transition-colors`}>
                      <Icon size={12} /> {s.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Kanban Column
// ---------------------------------------------------------------------------

function KanbanColumn({ stage, leads, onStageChange, updatingId }) {
  const s = STAGE_MAP[stage.key] || stage;
  const Icon = s.icon;
  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-6 h-6 rounded-md bg-${s.color}-500/10 flex items-center justify-center`}>
          <Icon size={12} className={`text-${s.color}-400`} />
        </div>
        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wide">{s.label}</h3>
        <span className={`ml-auto text-xs font-bold text-${s.color}-400 bg-${s.color}-500/10 px-2 py-0.5 rounded-full`}>{leads.length}</span>
      </div>
      <div className="space-y-2 min-h-[120px]">
        {leads.length === 0 && (
          <div className="rounded-lg bg-slate-950 border border-slate-700 p-4 text-center"><p className="text-slate-600 text-xs">No leads</p></div>
        )}
        {leads.map((lead) => (
          <motion.div key={lead.id} layout className="rounded-lg bg-slate-950 border border-slate-700 p-3 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between mb-1.5">
              <h4 className="text-white font-semibold text-xs truncate flex-1">{lead.prospect_name || "Unknown"}</h4>
              <span className={`text-xs font-bold ${scoreColor(lead.tofu_score || 0)} ml-2`}>{lead.tofu_score ?? "—"}</span>
            </div>
            <p className="text-white/30 text-xs truncate mb-2">{lead.prospect_company || "—"}</p>
            <div className="flex items-center justify-between">
              <span className="text-emerald-400/70 text-xs font-medium">{fmt$(lead.estimated_arr)}</span>
              <div className="relative group">
                <button disabled={updatingId === lead.id} className="text-white/30 hover:text-white/60 transition-colors p-1" title="Change stage">
                  {updatingId === lead.id ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} />}
                </button>
                <div className="hidden group-hover:block absolute right-0 bottom-full mb-1 w-44 rounded-md bg-slate-950 border border-slate-700 overflow-hidden z-50">
                  {STAGES.filter((st) => st.key !== stage.key).map((st) => {
                    const StIcon = st.icon;
                    return (
                      <button key={st.key} onClick={() => onStageChange(lead.id, st.key)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-${st.color}-400 transition-colors`}>
                        <StIcon size={10} /> {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Overview
// ---------------------------------------------------------------------------

function OverviewTab({ spSlug, spEmail }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Expense tracker state (Phase 76)
  const [expenses, setExpenses] = useState([]);
  const [totalOverhead, setTotalOverhead] = useState(0);
  const [expCategory, setExpCategory] = useState("Software");
  const [expAmount, setExpAmount] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expLogging, setExpLogging] = useState(false);
  const [expToast, setExpToast] = useState(null);

  const load = useCallback(async () => {
    if (!spSlug) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [d, expData] = await Promise.all([
        fetchOverviewData(spSlug, spEmail),
        fetchExpenses(spEmail).catch(() => ({ expenses: [], totalOverhead: 0 })),
      ]);
      setData(d);
      setExpenses(expData.expenses || []);
      setTotalOverhead(expData.totalOverhead || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [spSlug, spEmail]);

  useEffect(() => { load(); }, [load]);

  const handleLogExpense = async () => {
    const amt = parseFloat(expAmount);
    if (!expCategory || isNaN(amt) || amt <= 0) return;
    setExpLogging(true);
    try {
      const res = await createExpense({ expense_category: expCategory, amount: amt, description: expDesc }, spEmail);
      setExpenses((prev) => [{ ...res.expense, date_logged: new Date().toISOString() }, ...prev]);
      setTotalOverhead((prev) => prev + amt);
      setExpAmount(""); setExpDesc("");
      setExpToast({ message: `$${amt.toFixed(2)} expense logged.`, type: "success" });
    } catch (err) {
      setExpToast({ message: `Log failed: ${err.message}`, type: "error" });
    } finally {
      setExpLogging(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-cyan-400" /></div>;
  if (error) return <EmptyState icon={AlertCircle} title="Unable to Load Data" message="Connection issue — please check your network and try again." action="Try Again" onAction={load} />;
  if (!data) return <EmptyState icon={BarChart3} title="No Overview Data" message="Your analytics will appear here once your Digital Business Card is active." />;

  const { analytics = {}, leadStats = {}, earnings = {}, leads = [], ledger = [] } = data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Total Earnings" value={fmt$(earnings.totalEarnings)} icon={DollarSign} color="amber" />
        <KPICard label="Card Views" value={analytics.views ?? 0} icon={Eye} color="blue" />
        <KPICard label="Active Pipeline" value={leadStats.totalLeads ?? 0} icon={Users} color="violet" />
        <KPICard label="Lifetime Commission" value={fmt$(earnings.totalCommissions)} icon={Trophy} color="emerald" />
      </div>

      {/* Dynamic Compensation Widget */}
      <div className="rounded-lg bg-slate-950 border border-slate-700 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Banknote size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white/70">Dynamic Compensation</h3>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            Tier 2: Elite Commander
          </span>
        </div>
        {(() => {
          const retainer = 2500;
          const tcv = earnings.totalEarnings || 0;
          const commission = tcv * 0.15;
          const total = retainer + commission;
          const retainerPct = total > 0 ? Math.round((retainer / total) * 100) : 50;
          const commissionPct = total > 0 ? 100 - retainerPct : 50;
          return (
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white/30 text-xs mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-white">{fmt$(total)}</p>
                </div>
                <p className="text-white/20 text-xs">= Fixed Retainer + (TCV × 15%)</p>
              </div>
              {/* Stacked bar */}
              <div className="w-full h-4 rounded-full overflow-hidden bg-white/5 flex">
                <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500" style={{ width: `${retainerPct}%` }} />
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500" style={{ width: `${commissionPct}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-white/50">Fixed Retainer</span>
                  <span className="text-amber-400 font-bold">{fmt$(retainer)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-white/50">Commission (15%)</span>
                  <span className="text-emerald-400 font-bold">{fmt$(commission)}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Phase 76: Overhead & Expenses */}
      <div className="rounded-lg bg-slate-950 border border-slate-700 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-rose-400" />
            <h3 className="text-sm font-bold text-white/70">Overhead & Expenses</h3>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Total: {fmt$(totalOverhead)}
          </span>
        </div>

        {/* Log Expense Form */}
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <select
            value={expCategory} onChange={(e) => setExpCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-400/40 transition-all md:w-48"
          >
            <option value="Software">Software</option>
            <option value="Workspace">Workspace</option>
            <option value="Sub-contractor Pay">Sub-contractor Pay</option>
            <option value="Marketing">Marketing</option>
            <option value="Equipment">Equipment</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)}
            placeholder="Amount ($)" min="0" step="0.01"
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-rose-400/40 transition-all md:w-32"
          />
          <input
            type="text" value={expDesc} onChange={(e) => setExpDesc(e.target.value)}
            placeholder="Description (optional)"
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-rose-400/40 transition-all flex-1"
          />
          <button
            onClick={handleLogExpense}
            disabled={expLogging || !expAmount}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center gap-1.5 whitespace-nowrap"
          >
            {expLogging ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
            Log Expense
          </button>
        </div>

        {/* Expense List */}
        {expenses.length === 0 ? (
          <p className="text-white/20 text-xs text-center py-4">No expenses logged yet. Track your overhead to prove Economic Reality.</p>
        ) : (
          <div className="max-h-[250px] overflow-y-auto space-y-2">
            {expenses.slice(0, 20).map((exp, i) => (
              <div key={exp.id || i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap">
                    {exp.expense_category}
                  </span>
                  <p className="text-white/40 text-xs truncate">{exp.description || "—"}</p>
                </div>
                <div className="flex items-center gap-3 ml-2">
                  <span className="text-white font-bold text-sm">{fmt$(exp.amount)}</span>
                  <span className="text-white/20 text-[10px] whitespace-nowrap">{fmtDate(exp.date_logged)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {expToast && <Toast message={expToast.message} type={expToast.type} onDismiss={() => setExpToast(null)} />}
      </AnimatePresence>

      {/* Two-column: Pipeline + Payout Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline Table */}
        <div className="rounded-lg bg-slate-950 border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white/70">Lead Ledger</h3>
            <span className="text-xs text-white/30">{leads.length} leads</span>
          </div>
          {leads.length === 0 ? (
            <p className="text-white/20 text-xs text-center py-6">No leads captured yet. Share your DBC link to start generating leads.</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {leads.map((l, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-medium truncate">{l.visitorName || l.visitor_name || "Unknown"}</p>
                    <p className="text-white/30 text-[10px] truncate">{l.visitorEmail || l.visitor_email || ""}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <StatusBadge status={l.status || "new"} />
                    <span className="text-white/20 text-[10px] whitespace-nowrap">{fmtDate(l.createdAt || l.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout Ledger */}
        <div className="rounded-lg bg-slate-950 border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white/70">Commission Ledger</h3>
            <span className="text-xs text-white/30">{ledger.length} transactions</span>
          </div>
          {ledger.length === 0 ? (
            <p className="text-white/20 text-xs text-center py-6">No commission transactions yet. Close deals to earn commissions.</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {ledger.map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-xs font-medium">{fmt$(tx.commissionAmount || tx.commission_amount)}</p>
                    <p className="text-white/30 text-[10px]">Deal: {fmt$(tx.totalRevenue || tx.total_revenue)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.status === "paid" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    }`}>{tx.status}</span>
                    <span className="text-white/20 text-[10px]">{fmtDate(tx.createdAt || tx.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Lead Pipeline
// ---------------------------------------------------------------------------

function PipelineTab({ spEmail }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("inbox");
  const [updatingId, setUpdatingId] = useState(null);
  const [dealRoomLinks, setDealRoomLinks] = useState({});
  const [generatingDealRoom, setGeneratingDealRoom] = useState(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPartnerLeads(spEmail);
      setLeads(data.leads || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [spEmail]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const handleStageChange = useCallback(async (leadId, newStage) => {
    setUpdatingId(leadId);
    try {
      await updateLeadStage(leadId, newStage, null, spEmail);
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStage, updated_at: new Date().toISOString() } : l));
    } catch (err) { setError(`Stage update failed: ${err.message}`); }
    finally { setUpdatingId(null); }
  }, [spEmail]);

  const handleGenDealRoom = useCallback(async (leadId) => {
    setGeneratingDealRoom(leadId);
    try {
      const data = await generateDealRoom(leadId, spEmail);
      if (data.magicLink) setDealRoomLinks((prev) => ({ ...prev, [leadId]: data.magicLink }));
    } catch (err) { setError(`Deal room generation failed: ${err.message}`); }
    finally { setGeneratingDealRoom(null); }
  }, [spEmail]);

  const kpis = useMemo(() => {
    const total = leads.length;
    const active = leads.filter((l) => !["closed_won", "closed_lost"].includes(l.status)).length;
    const won = leads.filter((l) => l.status === "closed_won").length;
    const totalArr = leads.reduce((sum, l) => sum + (l.estimated_arr || 0), 0);
    return { total, active, won, totalArr };
  }, [leads]);

  const leadsByStage = useMemo(() => {
    const grouped = {};
    STAGES.forEach((s) => (grouped[s.key] = []));
    leads.forEach((l) => { if (grouped[l.status]) grouped[l.status].push(l); else if (grouped.qualified) grouped.qualified.push(l); });
    return grouped;
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Total Leads" value={kpis.total} icon={Users} color="cyan" />
        <KPICard label="Active Pipeline" value={kpis.active} icon={Briefcase} color="amber" />
        <KPICard label="Closed Won" value={kpis.won} icon={CheckCircle2} color="emerald" />
        <KPICard label="Pipeline ARR" value={fmt$(kpis.totalArr)} icon={DollarSign} color="violet" />
      </div>

      {/* View toggle + refresh */}
      <div className="flex items-center justify-between">
        <div className="rounded-md bg-slate-900 border border-slate-700 p-0.5 flex">
          <button onClick={() => setView("inbox")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "inbox" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>
            <List size={14} className="inline mr-1" /> Inbox
          </button>
          <button onClick={() => setView("kanban")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "kanban" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>
            <LayoutGrid size={14} className="inline mr-1" /> Kanban
          </button>
        </div>
        <button onClick={loadLeads} disabled={loading} className="p-2 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-slate-950 border border-red-500/30 p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm flex-1">{error.includes("fetch") || error.includes("Network") ? "Connection issue — please check your network and try again." : error}</p>
          <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 transition-colors"><X size={14} /></button>
        </motion.div>
      )}

      {loading && <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-cyan-400" /></div>}

      {!loading && leads.length === 0 && !error && (
        <EmptyState icon={Briefcase} title="No Assigned Leads"
          message="Leads dispatched through the Escalation Protocol will appear here with full context briefings and qualification data." />
      )}

      {!loading && leads.length > 0 && view === "inbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {leads.map((lead) => (
            <InboxCard key={lead.id} lead={lead} onStageChange={handleStageChange} updatingId={updatingId}
              onGenerateDealRoom={handleGenDealRoom} dealRoomLinks={dealRoomLinks} generatingDealRoom={generatingDealRoom} />
          ))}
        </div>
      )}

      {!loading && leads.length > 0 && view === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map((stage) => (
              <KanbanColumn key={stage.key} stage={stage} leads={leadsByStage[stage.key] || []} onStageChange={handleStageChange} updatingId={updatingId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: AI Revenue Engine
// ---------------------------------------------------------------------------

function EngineConfigTab({ spEmail }) {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState({ prospectsFound: 0, emailsSent: 0, opens: 0, replies: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Form state
  const [targetIcp, setTargetIcp] = useState("");
  const [valueProp, setValueProp] = useState("");
  const [toneGuide, setToneGuide] = useState("");
  const [negativeKw, setNegativeKw] = useState("");
  const [brandSafety, setBrandSafety] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Phase 77: Advanced Guardrails
  const [toneStrictness, setToneStrictness] = useState("Consultative");
  const [maxDailyOutreach, setMaxDailyOutreach] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Phase 78: CSV Ingestion
  const [csvDragging, setCsvDragging] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  // Phase 82: SP-scoped Client Lead Engine
  const [clientLeadActive, setClientLeadActive] = useState(false);
  const [clientLeadToggling, setClientLeadToggling] = useState(false);

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
    try {
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      if (parsed.errors.length > 0) {
        setToast({ message: `CSV parse error: ${parsed.errors[0].message}`, type: "error" });
        setCsvUploading(false);
        return;
      }
      // Map Apollo CSV columns → Enterprise Reservoir upload-leads schema
      const leads = parsed.data.map((row) => {
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
      }).filter((p) => p.full_name && (p.email || p.linkedin_url));
      if (leads.length === 0) {
        setToast({ message: "No valid leads found. Ensure CSV has First Name, Last Name, and Email or Person Linkedin Url columns.", type: "error" });
        setCsvUploading(false);
        return;
      }
      const res = await ingestCSV(leads, spEmail, "sp_recruitment");
      setCsvResult({ count: res.inserted || leads.length, total: leads.length });
      setToast({ message: `${res.inserted || leads.length} leads loaded into SP Recruitment Reservoir.`, type: "success" });
    } catch (err) {
      setToast({ message: `CSV upload failed: ${err.message}`, type: "error" });
    } finally {
      setCsvUploading(false);
    }
  }, [spEmail]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Phase 82: Fetch SP's own client lead engine status (non-blocking)
    try {
      const es = await fetchSPEngineStatus(spEmail);
      setClientLeadActive(!!es.client_lead_active);
    } catch { /* non-fatal — default false */ }
    try {
      const data = await fetchEngineConfig(spEmail);
      if (data.config) {
        setConfig(data.config);
        setTargetIcp(data.config.target_icp || "");
        setValueProp(data.config.value_proposition || "");
        setToneGuide(data.config.tone_guidelines || "");
        setNegativeKw(data.config.negative_keywords || "");
        setBrandSafety(data.config.brand_safety_guidelines || "");
        setIsActive(!!data.config.is_active);
        setToneStrictness(data.config.tone_strictness || "Consultative");
        setMaxDailyOutreach(data.config.max_daily_outreach ?? 50);
      }
      setStats(data.stats || { prospectsFound: 0, emailsSent: 0, opens: 0, replies: 0 });
      setRecentActivity(data.recentActivity || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [spEmail]);

  useEffect(() => { load(); }, [load]);

  const handleClientLeadToggle = async () => {
    setClientLeadToggling(true);
    const newActive = !clientLeadActive;
    try {
      const res = await toggleSPEngine(spEmail, newActive);
      setClientLeadActive(!!res.client_lead_active);
      setToast({
        message: res.client_lead_active
          ? "Client Lead Engine ARMED — your pipeline is now active."
          : "Client Lead Engine DISARMED — safety engaged.",
        type: res.client_lead_active ? "success" : "error",
      });
    } catch (err) {
      setToast({ message: `Toggle failed: ${err.message}`, type: "error" });
    } finally {
      setClientLeadToggling(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveEngineConfig({
        target_icp: targetIcp,
        value_proposition: valueProp,
        tone_guidelines: toneGuide,
        negative_keywords: negativeKw,
        brand_safety_guidelines: brandSafety,
        is_active: isActive,
        tone_strictness: toneStrictness,
        max_daily_outreach: maxDailyOutreach,
      }, spEmail);
      setDirty(false);
      setToast({ message: "Engine configuration saved.", type: "success" });
    } catch (err) {
      setToast({ message: `Save failed: ${err.message}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const openRate = stats.emailsSent > 0 ? Math.round((stats.opens / stats.emailsSent) * 100) : 0;

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-emerald-400" /></div>;

  return (
    <div className="space-y-6">
      {/* Phase 82: SP-scoped Client Lead Sales Engine */}
      <div className={`rounded-lg bg-slate-950 p-5 border-2 transition-all duration-500 ${
        clientLeadActive
          ? "border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.12)]"
          : "border-white/10"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              clientLeadActive
                ? "bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                : "bg-white/5"
            }`}>
              <Target size={28} className={`transition-colors duration-500 ${
                clientLeadActive ? "text-emerald-400" : "text-white/20"
              }`} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Client Lead Sales Engine
              </h2>
              <p className="text-white/40 text-xs mt-0.5">
                {clientLeadActive
                  ? "Your pipeline is active — AI is prospecting and sending outreach on your behalf"
                  : "Your pipeline is paused — toggle ON to start AI-driven client outreach"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClientLeadToggle}
            disabled={clientLeadToggling}
            className={`relative w-20 h-10 rounded-full transition-all duration-500 cursor-pointer flex-shrink-0 ${
              clientLeadActive
                ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                : "bg-white/10"
            }`}
          >
            <div className={`absolute top-1 w-8 h-8 rounded-full bg-white shadow-lg transition-all duration-500 flex items-center justify-center ${
              clientLeadActive ? "left-11" : "left-1"
            }`}>
              {clientLeadToggling
                ? <Loader2 size={14} className="animate-spin text-gray-500" />
                : <Power size={14} className={clientLeadActive ? "text-emerald-600" : "text-gray-400"} />
              }
            </div>
          </button>
        </div>
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${clientLeadActive ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
            <span className={`text-xs font-bold ${clientLeadActive ? "text-emerald-400" : "text-white/30"}`}>
              {clientLeadActive ? "LIVE" : "OFF"}
            </span>
          </div>
          <span className="text-white/15 text-[10px]">AI prospects and sends outreach for your services</span>
        </div>
      </div>

      {/* Engine config error */}
      {error && (
        <div className="rounded-lg bg-slate-950 border border-amber-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
            <p className="text-white/50 text-xs">Engine config unavailable — please try again.</p>
          </div>
          <button onClick={load} className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex-shrink-0">Retry</button>
        </div>
      )}

      {/* Engine KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Prospects Found" value={stats.prospectsFound} icon={Users} color="cyan" />
        <KPICard label="Emails Sent" value={stats.emailsSent} icon={Send} color="violet" />
        <KPICard label="Open Rate" value={`${openRate}%`} icon={Eye} color="amber" />
        <KPICard label="Replies" value={stats.replies} icon={MessageSquare} color="emerald" />
      </div>

      {/* Config Form + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Config Form — 2 cols */}
        <div className="lg:col-span-2 rounded-lg bg-slate-950 border border-slate-700 p-5 space-y-5">
          <h3 className="text-sm font-bold text-white/70 flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" /> Engine Configuration
          </h3>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-2">Target ICP</label>
            <textarea
              value={targetIcp}
              onChange={(e) => { setTargetIcp(e.target.value); setDirty(true); }}
              placeholder="E.g., E-commerce founders in Phoenix doing $1M-$5M ARR"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-400/40 focus:ring-1 focus:ring-emerald-400/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-2">Value Proposition</label>
            <textarea
              value={valueProp}
              onChange={(e) => { setValueProp(e.target.value); setDirty(true); }}
              placeholder="E.g., I build high-converting Shopify funnels that reduce cart abandonment by 30%."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-400/40 focus:ring-1 focus:ring-emerald-400/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-2">Tone Guidelines</label>
            <input
              type="text"
              value={toneGuide}
              onChange={(e) => { setToneGuide(e.target.value); setDirty(true); }}
              placeholder="E.g., Direct, analytical, authoritative."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-400/40 focus:ring-1 focus:ring-emerald-400/20 transition-all"
            />
          </div>

          {/* Strategic Guardrails Divider */}
          <div className="flex items-center gap-3 pt-3">
            <div className="h-px flex-1 bg-white/5" />
            <div className="flex items-center gap-1.5 px-2">
              <Shield size={12} className="text-rose-400" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Strategic Guardrails</span>
            </div>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-2 flex items-center gap-1.5">
              <Ban size={12} className="text-rose-400" /> Negative Keywords
            </label>
            <textarea
              value={negativeKw}
              onChange={(e) => { setNegativeKw(e.target.value); setDirty(true); }}
              placeholder="E.g., cheap, discount, free trial, MLM, crypto"
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-rose-400/40 focus:ring-1 focus:ring-rose-400/20 transition-all resize-none"
            />
            <p className="text-white/15 text-[10px] mt-1">Prospects matching these keywords will be automatically excluded from outreach.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-2 flex items-center gap-1.5">
              <BookOpen size={12} className="text-rose-400" /> Brand Safety Guidelines
            </label>
            <textarea
              value={brandSafety}
              onChange={(e) => { setBrandSafety(e.target.value); setDirty(true); }}
              placeholder="E.g., Never mention competitor pricing. Always lead with value. No aggressive follow-ups after 3 touches."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-rose-400/40 focus:ring-1 focus:ring-rose-400/20 transition-all resize-none"
            />
            <p className="text-white/15 text-[10px] mt-1">Ethical boundaries that govern how the Llama 3.1 AI agent communicates on your behalf.</p>
          </div>

          {/* Phase 77: Advanced Guardrails */}
          <div className="pt-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 w-full"
            >
              <div className="h-px flex-1 bg-white/5" />
              <div className="flex items-center gap-1.5 px-2">
                <Gauge size={12} className="text-violet-400" />
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Advanced Guardrails</span>
                <ChevronDown size={12} className={`text-white/30 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </div>
              <div className="h-px flex-1 bg-white/5" />
            </button>
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-2 flex items-center gap-1.5">
                    <Gauge size={12} className="text-violet-400" /> Tone Strictness
                  </label>
                  <select
                    value={toneStrictness}
                    onChange={(e) => { setToneStrictness(e.target.value); setDirty(true); }}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/20 transition-all"
                  >
                    <option value="Aggressive">Aggressive — Bold, direct closing language</option>
                    <option value="Consultative">Consultative — Warm, advisory approach</option>
                    <option value="Academic">Academic — Research-driven, methodical tone</option>
                  </select>
                  <p className="text-white/15 text-[10px] mt-1">Controls the intensity and style of AI-generated outreach messages.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-2 flex items-center gap-1.5">
                    <Send size={12} className="text-violet-400" /> Max Daily Outreach
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range" min="5" max="200" step="5"
                      value={maxDailyOutreach}
                      onChange={(e) => { setMaxDailyOutreach(parseInt(e.target.value)); setDirty(true); }}
                      className="flex-1 h-2 rounded-full appearance-none bg-white/10 accent-violet-400"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" min="5" max="200"
                        value={maxDailyOutreach}
                        onChange={(e) => { setMaxDailyOutreach(Math.min(200, Math.max(5, parseInt(e.target.value) || 5))); setDirty(true); }}
                        className="w-16 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-center focus:outline-none focus:border-violet-400/40 transition-all"
                      />
                      <span className="text-white/30 text-xs">/day</span>
                    </div>
                  </div>
                  <p className="text-white/15 text-[10px] mt-1">Maximum number of outreach attempts the AI can make per day. Lower = more targeted; Higher = more volume.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Campaign Active Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-semibold text-white">Activate Autonomous Hunting</p>
              <p className="text-white/30 text-xs mt-0.5">AI will autonomously prospect and send outreach</p>
            </div>
            <button
              onClick={() => { setIsActive(!isActive); setDirty(true); }}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                isActive
                  ? "bg-emerald-500/30 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "bg-white/10 border border-white/10"
              }`}
            >
              <div className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 ${
                isActive
                  ? "left-7 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : "left-0.5 bg-white/30"
              }`} />
            </button>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Configuration"}
          </button>
        </div>

        {/* Recent Activity — 1 col */}
        <div className="rounded-lg bg-slate-950 border border-slate-700 p-5">
          <h3 className="text-sm font-bold text-white/70 mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-white/20 text-xs text-center py-8">
              No activity yet. {!isActive && "Activate the engine to begin hunting."}
            </p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    a.status === "replied" ? "bg-emerald-500/10" : a.status === "opened" ? "bg-amber-500/10" : "bg-blue-500/10"
                  }`}>
                    <Send size={12} className={
                      a.status === "replied" ? "text-emerald-400" : a.status === "opened" ? "text-amber-400" : "text-blue-400"
                    } />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-medium truncate">{a.prospectName}</p>
                    <p className="text-white/30 text-[10px] truncate">{a.company}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        a.status === "replied" ? "bg-emerald-500/10 text-emerald-400" :
                        a.status === "opened" ? "bg-amber-500/10 text-amber-400" :
                        "bg-blue-500/10 text-blue-400"
                      }`}>{a.status}</span>
                      <span className="text-white/20 text-[10px]">{a.timestamp ? fmtDate(a.timestamp) : ""}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Phase 77: Escalation Briefings */}
          {recentActivity.filter((a) => a.status === "replied").length > 0 && (
            <div className="mt-5 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-400" />
                <h4 className="text-xs font-bold text-white/50">Escalation Briefings</h4>
              </div>
              <div className="space-y-2">
                {recentActivity.filter((a) => a.status === "replied").slice(0, 5).map((a, i) => (
                  <div key={`esc-${i}`} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-xs font-medium truncate">{a.prospectName}</p>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400">HOT LEAD</span>
                    </div>
                    <p className="text-white/30 text-[10px]">{a.company} — Replied {a.timestamp ? fmtDate(a.timestamp) : "recently"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4: SOWs & Deliverables
// ---------------------------------------------------------------------------

function SOWManagerContent({ spEmail }) {
  const [sows, setSows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSOWs(spEmail);
      setSows(data.sows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [spEmail]);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (sowId) => {
    setCompleting(sowId);
    try {
      await markSOWComplete(sowId, spEmail);
      setSows(prev => prev.map(s => s.id === sowId ? { ...s, milestone_status: "completed" } : s));
    } catch (err) {
      setError(err.message);
    } finally {
      setCompleting(null);
    }
  };

  // KPI computations
  const activeSows = sows.filter(s => s.milestone_status !== "accepted").length;
  const milestonesDue = sows.filter(s =>
    s.due_date && new Date(s.due_date) <= new Date() &&
    s.milestone_status !== "completed" && s.milestone_status !== "accepted"
  ).length;
  const delivered = sows.filter(s =>
    s.milestone_status === "completed" || s.milestone_status === "accepted"
  ).length;
  const totalValue = sows.reduce((sum, s) => sum + (s.price || 0), 0);

  const sowStatusBadge = (status) => {
    const map = {
      not_started: { label: "Not Started", bg: "bg-white/5", text: "text-white/40", border: "border-white/10" },
      in_progress: { label: "In Progress", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
      completed: { label: "Completed", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
      accepted: { label: "Accepted", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
    };
    const b = map[status] || map.not_started;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${b.bg} ${b.text} border ${b.border}`}>
        {b.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="animate-spin text-violet-400" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Unable to Load SOW Data"
        message="Connection issue — please try again."
        action="Try Again"
        onAction={load}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-slate-950 border border-slate-700 p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <ClipboardList size={20} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">SOWs & Deliverables</h3>
            <p className="text-white/30 text-xs">1099 Economic Reality Test — Milestone-Based Delivery</p>
          </div>
        </div>
      </div>

      {/* KPI cards — live data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Active SOWs" value={activeSows} icon={ClipboardList} color="violet" />
        <KPICard label="Milestones Due" value={milestonesDue} icon={Clock} color="amber" />
        <KPICard label="Delivered" value={delivered} icon={CheckCircle2} color="emerald" />
        <KPICard label="Total Value" value={fmt$(totalValue)} icon={DollarSign} color="cyan" />
      </div>

      {/* SOW list or empty state */}
      {sows.length === 0 ? (
        <div className="rounded-lg bg-slate-950 border border-slate-700 p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/5 flex items-center justify-center mx-auto mb-5">
            <Scale size={32} className="text-violet-400/30" />
          </div>
          <h3 className="text-white/50 font-semibold mb-2">No Active Statements of Work</h3>
          <p className="text-white/25 text-sm max-w-md mx-auto mb-4">
            SOWs define your deliverables, milestones, and pricing — proving you operate as an independent business entity under the Economic Reality test.
          </p>
          <div className="flex items-center justify-center gap-6 text-[10px] text-white/15">
            <span className="flex items-center gap-1"><CheckCircle2 size={10} /> Milestone tracking</span>
            <span className="flex items-center gap-1"><DollarSign size={10} /> Price-per-deliverable</span>
            <span className="flex items-center gap-1"><FileText size={10} /> Auto-generated SOW PDFs</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sows.map((sow) => (
            <motion.div
              key={sow.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-slate-950 border border-slate-700 p-5 hover:border-white/10 transition"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {sow.deliverable_name}
                    </h4>
                    {sowStatusBadge(sow.milestone_status)}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-white/30">
                    <span className="flex items-center gap-1">
                      <DollarSign size={11} /> {fmt$(sow.price)}
                    </span>
                    {sow.due_date && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {fmtDate(sow.due_date)}
                      </span>
                    )}
                    {sow.notes && (
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <FileText size={11} /> {sow.notes}
                      </span>
                    )}
                  </div>
                </div>
                {(sow.milestone_status === "not_started" || sow.milestone_status === "in_progress") && (
                  <button
                    onClick={() => handleComplete(sow.id)}
                    disabled={completing === sow.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 shadow-[0_0_15px_rgba(16,185,129,0.15)] whitespace-nowrap"
                  >
                    {completing === sow.id ? (
                      <><Loader2 size={13} className="animate-spin" /> Updating...</>
                    ) : (
                      <><CheckCircle2 size={13} /> Mark Complete</>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 5: Team Access
// ---------------------------------------------------------------------------

function TeamAccessContent({ spEmail }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Invite form state
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("junior_success_lead");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTeamMembers(spEmail);
      setMembers(data.members || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [spEmail]);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async () => {
    if (!invName.trim() || !invEmail.trim()) return;
    setInviting(true);
    try {
      const data = await inviteTeamMember({ name: invName, email: invEmail, role: invRole }, spEmail);
      setMembers((prev) => [data.member, ...prev]);
      setInvName(""); setInvEmail(""); setInvRole("junior_success_lead"); setShowForm(false);
      setToast({ message: `${invName} invited successfully.`, type: "success" });
    } catch (err) {
      setToast({ message: `Invite failed: ${err.message}`, type: "error" });
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (member) => {
    try {
      await revokeTeamMember(member.id, spEmail);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setToast({ message: `${member.name} access revoked.`, type: "success" });
    } catch (err) {
      setToast({ message: `Revoke failed: ${err.message}`, type: "error" });
    }
  };

  const roleBadge = (role) => {
    const map = {
      junior_success_lead: { label: "Jr. Success Lead", color: "blue" },
      triage_agent: { label: "Triage Agent", color: "cyan" },
      analyst: { label: "Analyst", color: "violet" },
    };
    const r = map[role] || { label: role, color: "white" };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-${r.color}-500/10 text-${r.color}-400 border border-${r.color}-500/20`}>
        {r.label}
      </span>
    );
  };

  const activeCount = members.length;
  const triageCount = members.filter((m) => m.role === "triage_agent").length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-400" /></div>;
  if (error) return <EmptyState icon={AlertCircle} title="Unable to Load Team" message="Connection issue — please try again." action="Try Again" onAction={load} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-slate-950 border border-slate-700 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <UserPlus size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Team Access & Delegation</h3>
              <p className="text-white/30 text-xs">Right to Substitute — Sub-Contractor RBAC Management</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-black text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <UserPlus size={14} /> Invite Member
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KPICard label="Active Sub-Contractors" value={activeCount} icon={Users} color="blue" />
        <KPICard label="Triage Agents" value={triageCount} icon={Activity} color="cyan" />
        <KPICard label="Total Invited" value={activeCount} icon={Send} color="violet" />
      </div>

      {/* Invite Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-lg bg-slate-950 border border-blue-500/30 p-5 space-y-4">
              <h4 className="text-sm font-bold text-white/70 flex items-center gap-2">
                <UserPlus size={16} className="text-blue-400" /> Invite Team Member
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">Name</label>
                  <input
                    type="text" value={invName} onChange={(e) => setInvName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-400/40 focus:ring-1 focus:ring-blue-400/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">Email</label>
                  <input
                    type="email" value={invEmail} onChange={(e) => setInvEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-400/40 focus:ring-1 focus:ring-blue-400/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">Role</label>
                  <select
                    value={invRole} onChange={(e) => setInvRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400/40 focus:ring-1 focus:ring-blue-400/20 transition-all"
                  >
                    <option value="junior_success_lead">Jr. Success Lead</option>
                    <option value="triage_agent">Triage Agent</option>
                    <option value="analyst">Analyst</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleInvite}
                disabled={inviting || !invName.trim() || !invEmail.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center gap-2"
              >
                {inviting ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : <><Send size={14} /> Send Invitation</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Grid */}
      {members.length === 0 ? (
        <div className="rounded-lg bg-slate-950 border border-slate-700 p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/5 flex items-center justify-center mx-auto mb-5">
            <UserPlus size={32} className="text-blue-400/30" />
          </div>
          <h3 className="text-white/50 font-semibold mb-2">No Sub-Contractors Added</h3>
          <p className="text-white/25 text-sm max-w-md mx-auto mb-4">
            Invite team members and assign RBAC roles — proving your Right to Substitute under the control test. Sub-contractors operate under your SOWs, not the platform&apos;s direction.
          </p>
          <div className="flex items-center justify-center gap-6 text-[10px] text-white/15">
            <span className="flex items-center gap-1"><Shield size={10} /> Role-based access</span>
            <span className="flex items-center gap-1"><Users size={10} /> Triage Agent role</span>
            <span className="flex items-center gap-1"><BadgeCheck size={10} /> Admin delegation</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {members.map((m) => (
            <div key={m.id} className="rounded-lg bg-slate-950 border border-slate-700 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{(m.name || "?")[0].toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{m.name}</p>
                  <p className="text-white/30 text-xs truncate">{m.email}</p>
                  <div className="mt-1">{roleBadge(m.role)}</div>
                </div>
              </div>
              <button
                onClick={() => handleRevoke(m)}
                className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center transition-colors flex-shrink-0"
                title="Revoke access"
              >
                <Trash2 size={14} className="text-rose-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Legal Disclaimer */}
      <div className="rounded-lg bg-slate-950 border border-amber-500/30 p-4">
        <div className="flex items-start gap-3">
          <Scale size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-white/30 text-[11px] leading-relaxed">
            <strong className="text-amber-400/70">Legal Notice:</strong> As a Sovereign Professional, you are solely responsible for the compensation and tax reporting (1099-NEC) of your subcontractors. RSLLC does not employ, direct, or compensate your team members.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 6: Compliance Hub
// ---------------------------------------------------------------------------

function ComplianceHubContent({ spEmail }) {
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplianceStatus(spEmail);
      setCompliance(data.compliance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [spEmail]);

  useEffect(() => { load(); }, [load]);

  // Handle return from DocuSign ceremony
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("docusign") === "completed") {
      setToast({ message: "W-9 signing initiated — status will update shortly.", type: "success" });
      window.history.replaceState({}, "", window.location.pathname);
      load(); // Refetch compliance status
    }
  }, [load]);

  const handleSignW9 = async () => {
    setSigning(true);
    try {
      const data = await initiateW9Signing(spEmail);
      if (data.signingUrl) {
        window.location.href = data.signingUrl;
        return;
      }
      if (data.fallbackToEmail) {
        setToast({ message: "W-9 has been sent to your email for signing.", type: "success" });
      }
    } catch (err) {
      const msg = err.message || "Failed to initiate signing";
      if (msg.includes("not configured")) {
        setToast({ message: "DocuSign integration not yet configured. Contact admin.", type: "error" });
      } else if (msg.includes("already")) {
        setToast({ message: "W-9 already completed!", type: "success" });
        load();
      } else {
        setToast({ message: `Signing failed: ${msg}`, type: "error" });
      }
    } finally {
      setSigning(false);
    }
  };

  const w9 = compliance?.w9_status || "not_submitted";
  const s1099 = compliance?.status_1099 || "not_filed";
  const overhead = compliance?.overhead_expenses_logged || 0;

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-rose-400" /></div>;
  if (error) return <EmptyState icon={AlertCircle} title="Unable to Load Compliance Data" message="Connection issue — please try again." action="Try Again" onAction={load} />;

  const w9Badge = {
    completed: { label: "Completed", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    pending: { label: "Pending Review", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    not_submitted: { label: "Not Submitted", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  }[w9] || { label: w9, bg: "bg-white/5", text: "text-white/30", border: "border-white/10" };

  const s1099Badge = {
    accepted: { label: "Accepted", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    filed: { label: "Filed", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    not_filed: { label: "Not Filed", bg: "bg-white/5", text: "text-white/30", border: "border-white/10" },
  }[s1099] || { label: s1099, bg: "bg-white/5", text: "text-white/30", border: "border-white/10" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-slate-950 border border-slate-700 p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Shield size={20} className="text-rose-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Compliance Hub</h3>
            <p className="text-white/30 text-xs">W-9 Status, 1099 Filings & Overhead Expense Tracking</p>
          </div>
        </div>
      </div>

      {/* Compliance status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* W-9 Status */}
        <div className={`rounded-lg bg-slate-950 p-5 border ${w9 === "completed" ? "border-emerald-500/30" : "border-slate-700"}`}>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-rose-400" />
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wide">W-9 Status</h4>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${w9Badge.bg} ${w9Badge.text} border ${w9Badge.border}`}>
              {w9 === "completed" && <CheckCircle2 size={10} className="inline mr-1" />}
              {w9Badge.label}
            </span>
          </div>
          {w9 !== "completed" ? (
            <div className="space-y-2">
              <p className="text-white/20 text-[10px]">Required for 1099 contractor classification.</p>
              <button
                onClick={handleSignW9}
                disabled={signing}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-xs hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
              >
                {signing ? (
                  <><Loader2 size={14} className="animate-spin" /> Connecting...</>
                ) : (
                  <><PenTool size={14} /> Sign W-9 via DocuSign</>
                )}
              </button>
            </div>
          ) : (
            <p className="text-emerald-400/50 text-[10px]">W-9 signed and verified. You are compliant.</p>
          )}
        </div>

        {/* 1099 Status */}
        <div className="rounded-lg bg-slate-950 border border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Receipt size={16} className="text-rose-400" />
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wide">1099 Status</h4>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s1099Badge.bg} ${s1099Badge.text} border ${s1099Badge.border}`}>
              {s1099Badge.label}
            </span>
          </div>
          <p className="text-white/20 text-[10px]">Annual 1099-NEC filing status for IRS reporting. Generated at year-end.</p>
        </div>

        {/* Overhead Expenses */}
        <div className="rounded-lg bg-slate-950 border border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Banknote size={16} className="text-rose-400" />
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wide">Overhead Logged</h4>
          </div>
          <p className="text-2xl font-bold text-white mb-2">${overhead.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          <p className="text-white/20 text-[10px]">Track business expenses (tools, software, marketing) to prove investment in your own practice.</p>
        </div>
      </div>

      {/* Bottom info panel */}
      <div className="rounded-lg bg-slate-950 border border-slate-700 p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/5 flex items-center justify-center mx-auto mb-5">
          <ShieldCheck size={32} className="text-rose-400/30" />
        </div>
        <h3 className="text-white/50 font-semibold mb-2">1099 Compliance Framework</h3>
        <p className="text-white/25 text-sm max-w-md mx-auto mb-4">
          This hub tracks your 1099 contractor compliance — W-9 filings, IRS reporting status, and overhead expenses. These records reinforce your independent contractor classification.
        </p>
        <div className="flex items-center justify-center gap-6 text-[10px] text-white/15">
          <span className="flex items-center gap-1"><FileText size={10} /> W-9 signing</span>
          <span className="flex items-center gap-1"><Receipt size={10} /> 1099-NEC tracking</span>
          <span className="flex items-center gap-1"><Banknote size={10} /> Expense log</span>
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Shell
// ---------------------------------------------------------------------------

function SPDashboard({ spEmail, spSlug, spName, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen relative">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[160px]" />
        <div className="absolute bottom-0 -right-40 h-[500px] w-[500px] rounded-full bg-accent/8 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors cursor-pointer">
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Home</span>
              </div>
            </Link>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/15">
                <Rocket size={16} className="text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">SP Command Center</h1>
                <p className="text-[10px] text-white/25">{spName || spEmail}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">Connected</span>
            </div>
            <button onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs border border-white/10 hover:bg-white/10 hover:text-white/60 transition">
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-700 mb-6 overflow-x-auto">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white/10 text-white border border-white/10 shadow-lg"
                    : "text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent"
                }`}>
                <TabIcon size={14} className={isActive ? tab.color : ""} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active panel */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {activeTab === "overview" && <OverviewTab spSlug={spSlug} spEmail={spEmail} />}
          {activeTab === "pipeline" && <PipelineTab spEmail={spEmail} />}
          {activeTab === "treasury" && <SPTreasuryOps />}
          {activeTab === "engine" && <EngineConfigTab spEmail={spEmail} />}
          {activeTab === "sows" && <SOWManagerContent spEmail={spEmail} />}
          {activeTab === "team" && <TeamAccessContent spEmail={spEmail} />}
          {activeTab === "compliance" && <ComplianceHubContent spEmail={spEmail} />}
        </motion.div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root Export
// ---------------------------------------------------------------------------

export default function SPCommandCenter() {
  const [spEmail, setSpEmail] = useState(null);
  const [spSlug, setSpSlug] = useState(null);
  const [spName, setSpName] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const email = sessionStorage.getItem(SP_EMAIL_KEY);
    const slug = sessionStorage.getItem(SP_SLUG_KEY);
    const name = sessionStorage.getItem(SP_NAME_KEY);
    // Rehydrate in-memory auth store from sessionStorage (survives page refresh)
    const storedToken = sessionStorage.getItem(SP_TOKEN_KEY);
    if (storedToken) setAuthToken(storedToken);
    if (email) {
      setSpEmail(email);
      setSpSlug(slug || "");
      setSpName(name || "");
    }
    setChecking(false);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem(SP_EMAIL_KEY);
    sessionStorage.removeItem(SP_SLUG_KEY);
    sessionStorage.removeItem(SP_NAME_KEY);
    sessionStorage.removeItem(SP_TOKEN_KEY);
    setAuthToken(null);
    setSpEmail(null);
    setSpSlug(null);
    setSpName(null);
  };

  if (checking) return null;

  if (!spEmail) {
    return (
      <SPAuthGate
        onAuthenticate={(email, slug, name) => {
          setSpEmail(email);
          setSpSlug(slug);
          setSpName(name);
        }}
      />
    );
  }

  return <SPDashboard spEmail={spEmail} spSlug={spSlug} spName={spName} onLogout={handleLogout} />;
}
