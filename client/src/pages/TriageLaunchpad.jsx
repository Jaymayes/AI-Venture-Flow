import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Target,
  RefreshCw,
  Mail,
  MessageSquare,
  Phone,
  Database,
  Flame,
  Search,
  ChevronDown,
  Shield,
  Users,
  TrendingUp,
  BarChart3,
  Zap,
  X,
  Brain,
  DollarSign,
  HeartPulse,
  ScrollText,
  Swords,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe,
  Linkedin,
  MonitorSmartphone,
  Sparkles,
} from "lucide-react";
import { fetchHandoffs, initiateTakeover, fetchEscalationBriefing } from "../lib/triage-client";

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const timeAgo = (iso) => {
  if (!iso) return "\u2014";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const intentColor = (score) => {
  if (score >= 85)
    return {
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
      label: "High Intent",
    };
  if (score >= 70)
    return {
      bg: "bg-amber-500/20",
      text: "text-amber-400",
      dot: "bg-amber-400",
      label: "Warm",
    };
  return {
    bg: "bg-red-500/20",
    text: "text-red-400",
    dot: "bg-red-400",
    label: "Exploratory",
  };
};

const channelIcon = (ch) => {
  switch (ch) {
    case "email":
      return <Mail size={14} className="text-blue-400" />;
    case "sms":
      return <MessageSquare size={14} className="text-green-400" />;
    case "voice":
      return <Phone size={14} className="text-purple-400" />;
    case "m2m":
      return <Database size={14} className="text-orange-400" />;
    default:
      return <Mail size={14} className="text-cyan-400" />;
  }
};

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({ label, value, icon: Icon, iconColor = "text-primary" }) {
  return (
    <motion.div
      variants={fadeUp}
      className="glass noise relative overflow-hidden rounded-2xl p-4"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs text-white/40">{label}</div>
          <div className={`mt-1 text-2xl font-bold ${iconColor}`}>{value}</div>
        </div>
        {Icon && (
          <Icon size={22} className={`${iconColor} shrink-0 opacity-50`} />
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Escalation Briefing Slide-Over Panel
// ---------------------------------------------------------------------------

const channelBadge = (ch) => {
  switch (ch) {
    case "email":
      return { icon: Mail, color: "text-blue-400", bg: "bg-blue-500/10" };
    case "linkedin":
      return { icon: Linkedin, color: "text-sky-400", bg: "bg-sky-500/10" };
    case "web":
      return { icon: MonitorSmartphone, color: "text-emerald-400", bg: "bg-emerald-500/10" };
    default:
      return { icon: Globe, color: "text-white/40", bg: "bg-white/5" };
  }
};

function BriefingSection({ icon: Icon, iconColor, title, children }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${iconColor.replace("text-", "bg-")}/15`}>
          <Icon size={15} className={iconColor} />
        </div>
        <h3 className="text-sm font-bold text-white/90">{title}</h3>
      </div>
      <div className="pl-9">{children}</div>
    </div>
  );
}

function EscalationBriefingPanel({ briefing, onClose, loading }) {
  if (loading) {
    return (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 z-[60] h-full w-full max-w-[640px] glass noise border-l border-white/10 overflow-y-auto"
      >
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <Brain size={40} className="mx-auto animate-pulse text-primary" />
            <p className="mt-4 text-sm text-white/40">GLM-5 assembling briefing...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!briefing) return null;

  const { prospect, intentTelemetry, firmographic, sentiment, conversationAbstract, directives } = briefing;
  const usd = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 z-[60] h-full w-full max-w-[640px] glass noise border-l border-white/10 flex flex-col"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[-1] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Escalation Briefing</h2>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold animate-pulse">LIVE</span>
              </div>
              <p className="text-[11px] text-white/30">Z.AI GLM-5 Orchestration Node</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/40 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Prospect header card */}
        <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold">{prospect.name}</p>
              <p className="text-white/50 text-xs">{prospect.title}</p>
              <p className="text-white/30 text-[11px]">{prospect.company} &middot; {prospect.industry} &middot; {prospect.employees} employees</p>
              <p className="text-primary/60 text-[10px] mt-1">{prospect.funding} &middot; {prospect.location}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {intentTelemetry.score}/{intentTelemetry.threshold * 1.18 > 100 ? 100 : 100}
              </div>
              <p className="text-[10px] text-white/25 mt-1">Intent Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">

        {/* 1. Intent Telemetry */}
        <BriefingSection icon={BarChart3} iconColor="text-cyan-400" title="Intent Telemetry">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5 text-center">
              <p className="text-lg font-bold text-emerald-400">{intentTelemetry.score}</p>
              <p className="text-[9px] text-white/30">Score</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5 text-center">
              <p className="text-lg font-bold text-amber-400">{intentTelemetry.timeframe}</p>
              <p className="text-[9px] text-white/30">Target Close</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5 text-center">
              <p className="text-lg font-bold text-primary">{intentTelemetry.estimatedDealCycle}</p>
              <p className="text-[9px] text-white/30">Deal Cycle</p>
            </div>
          </div>
          <p className="text-xs text-white/50 mb-2 font-medium">Escalation Trigger</p>
          <p className="text-xs text-amber-400/80 mb-3">{intentTelemetry.trigger}</p>
          <div className="space-y-1.5">
            {intentTelemetry.triggerDetails.map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-white/40">
                <CheckCircle2 size={11} className="text-emerald-400/60 mt-0.5 shrink-0" />
                <span>{d}</span>
              </div>
            ))}
          </div>
        </BriefingSection>

        {/* 2. Firmographic & Value-Based Anchoring */}
        <BriefingSection icon={DollarSign} iconColor="text-emerald-400" title="Value-Based Anchoring">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
              <p className="text-[10px] text-white/30">Current SDR Headcount</p>
              <p className="text-xl font-bold text-white">{firmographic.currentSdrCount} <span className="text-xs text-white/30">FTEs</span></p>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
              <p className="text-[10px] text-white/30">Annual Labor Burn</p>
              <p className="text-xl font-bold text-red-400">{usd(firmographic.estimatedLaborBurn)}</p>
              <p className="text-[9px] text-white/20">{firmographic.laborBurnCalculation}</p>
            </div>
          </div>
          <div className="rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/10 p-3 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/40">Target Contract Value</p>
                <p className="text-2xl font-bold gradient-text">{usd(firmographic.targetTcv)}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold">{firmographic.contractTier}</span>
            </div>
          </div>
          <p className="text-xs text-white/50 mb-2 font-medium">Identified Pain Points</p>
          <div className="space-y-2">
            {firmographic.painPoints.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-white/40">
                <AlertTriangle size={11} className="text-amber-400/60 mt-0.5 shrink-0" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </BriefingSection>

        {/* 3. Sentiment & Emotional Subtext */}
        <BriefingSection icon={HeartPulse} iconColor="text-pink-400" title="Sentiment & Emotional Subtext">
          <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/50 font-medium">Dominant Emotion</p>
              <span className="text-[10px] text-white/25">{Math.round(sentiment.emotionConfidence * 100)}% confidence</span>
            </div>
            <p className="text-sm text-pink-400 font-semibold">{sentiment.dominantEmotion}</p>
          </div>
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 mb-3">
            <p className="text-[10px] text-amber-400/60 mb-1 font-medium">Unspoken Concern</p>
            <p className="text-xs text-amber-300/80">{sentiment.unspokenConcern}</p>
          </div>
          <p className="text-xs text-white/50 mb-2 font-medium">Buying Signals</p>
          <div className="space-y-1.5 mb-3">
            {sentiment.buyingSignals.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-white/40">
                <TrendingUp size={11} className="text-emerald-400/60 mt-0.5 shrink-0" />
                <span>{s}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/50 mb-2 font-medium">Risk Factors</p>
          <div className="space-y-1.5">
            {sentiment.riskFactors.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-white/40">
                <AlertTriangle size={11} className="text-red-400/60 mt-0.5 shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </BriefingSection>

        {/* 4. Conversation Abstract */}
        <BriefingSection icon={ScrollText} iconColor="text-violet-400" title="Conversation Abstract">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] text-white/30">{conversationAbstract.totalTouchpoints} touchpoints</span>
            {conversationAbstract.discoveryComplete && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                <CheckCircle2 size={10} />
                Discovery Complete
              </span>
            )}
          </div>
          <div className="space-y-2 mb-4">
            {conversationAbstract.touchpoints.map((tp, i) => {
              const badge = channelBadge(tp.channel);
              const BadgeIcon = badge.icon;
              return (
                <div key={i} className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${badge.bg} ${badge.color} text-[10px] font-bold`}>
                      <BadgeIcon size={10} />
                      <span className="capitalize">{tp.channel}</span>
                    </div>
                    <span className="text-[10px] text-white/20">
                      <Clock size={9} className="inline mr-0.5 -mt-px" />
                      {new Date(tp.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">{tp.summary}</p>
                </div>
              );
            })}
          </div>
          <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3">
            <p className="text-[10px] text-red-400/60 mb-1.5 font-medium">Do Not Repeat (Already Covered)</p>
            <div className="space-y-1">
              {conversationAbstract.doNotRepeat.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-white/30">
                  <X size={9} className="text-red-400/40 shrink-0" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </BriefingSection>

        {/* 5. GLM-5 Strategic Directives */}
        <BriefingSection icon={Swords} iconColor="text-amber-400" title="GLM-5 Strategic Directives">
          <div className="rounded-lg bg-gradient-to-r from-amber-500/5 to-primary/5 border border-amber-500/10 p-3 mb-3">
            <p className="text-[10px] text-amber-400/60 mb-1">Strategic Posture</p>
            <p className="text-xs text-white/70 italic">{directives.strategicPosture}</p>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">1</span>
                <p className="text-xs text-white/60 font-medium">The Opening</p>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed pl-7">{directives.opening}</p>
            </div>

            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-500/15 text-blue-400 text-[10px] font-bold">2</span>
                <p className="text-xs text-white/60 font-medium">The Proof Point</p>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed pl-7">{directives.proofPoint}</p>
            </div>

            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/15 text-amber-400 text-[10px] font-bold">3</span>
                <p className="text-xs text-white/60 font-medium">Objection Handling</p>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed pl-7">{directives.objectionHandling}</p>
            </div>

            <div className="rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/10 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-primary/20 text-primary text-[10px] font-bold">4</span>
                <p className="text-xs text-white/60 font-medium">The Close</p>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed pl-7">{directives.close}</p>
              <div className="mt-2 pl-7 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">{directives.recommendedPackage}</span>
              </div>
            </div>

            {directives.urgencyLever && (
              <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle size={13} className="text-red-400/60" />
                  <p className="text-xs text-red-400/60 font-medium">Urgency Lever</p>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed pl-5">{directives.urgencyLever}</p>
              </div>
            )}
          </div>
        </BriefingSection>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-white/20">
            Orchestrated by <span className="text-primary/50 font-medium">{briefing.orchestrationModel}</span> &middot;
            Edge: <span className="text-white/30">{briefing.edgeModel}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition"
          >
            Accept & Engage
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Handoff Card
// ---------------------------------------------------------------------------

function HandoffCard({ handoff, onTakeover, takingOver, onOpenBriefing }) {
  const [, navigate] = useLocation();
  const ic = intentColor(handoff.intentScore ?? 0);
  const isTakingOver = takingOver === handoff.engagementId;
  const isEscalation = handoff._isEscalation || (handoff.intentScore ?? 0) >= 85;

  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-xl p-4 border border-white/5 hover:border-primary/20 transition-all"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white font-semibold text-sm">
              {handoff.prospectName || "Unknown"}
            </p>
            <span className="text-white/20">|</span>
            <p className="text-white/50 text-xs truncate">
              {handoff.prospectRole || "N/A"},{" "}
              {handoff.prospectCompany || "N/A"}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap">
            {/* Intent Score */}
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${ic.bg} ${ic.text} font-bold`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${ic.dot}`} />
              {handoff.intentScore ?? 0}/100
            </div>

            {/* Reply channel */}
            <div className="flex items-center gap-1 text-white/30">
              {channelIcon(handoff.replyChannel)}
              <span className="capitalize">{handoff.replyChannel || "email"}</span>
            </div>

            {/* Schedule Human Partner */}
            {handoff.scheduleHumanPartner && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                <Flame size={10} />
                Schedule Human Partner
              </span>
            )}

            {/* Takeover badge */}
            {handoff.isHumanTakeover && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-[10px] font-bold">
                <Shield size={10} />
                Taken Over
              </span>
            )}

            {/* Time */}
            <span className="text-white/25">{timeAgo(handoff.handoffAt)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {isEscalation && (
            <button
              onClick={() => onOpenBriefing(handoff.engagementId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors animate-pulse"
            >
              <Brain size={12} />
              View Briefing
            </button>
          )}
          <button
            onClick={() => navigate(`/triage/${handoff.engagementId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/50 text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors"
          >
            View Details
          </button>
          {!handoff.isHumanTakeover && (
            <button
              onClick={() => onTakeover(handoff.engagementId)}
              disabled={isTakingOver}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition disabled:opacity-50"
            >
              {isTakingOver ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Zap size={12} />
              )}
              Take Over
            </button>
          )}
        </div>
      </div>

      {/* Human Partner Reason */}
      {handoff.humanPartnerReason && (
        <div className="mt-2 text-[10px] text-amber-400/60">
          {handoff.humanPartnerReason}
        </div>
      )}
    </motion.div>
  );
}

// ===========================================================================
// Main: TriageLaunchpad
// ===========================================================================

export default function TriageLaunchpad() {
  const [, navigate] = useLocation();
  const [handoffs, setHandoffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [takingOverId, setTakingOverId] = useState(null);

  // Filters
  const [filter, setFilter] = useState("all"); // all | needs_triage | taken_over
  const [sortBy, setSortBy] = useState("intent_desc"); // intent_desc | time
  const [search, setSearch] = useState("");

  // Escalation Briefing
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [briefingData, setBriefingData] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);

  // ── Fetch ──
  const refresh = useCallback(async () => {
    try {
      const data = await fetchHandoffs();
      setHandoffs(data.handoffs ?? []);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  // ── Takeover handler ──
  const handleTakeover = async (engagementId) => {
    setTakingOverId(engagementId);
    try {
      await initiateTakeover(engagementId);
      // Optimistic remove from list
      setHandoffs((prev) =>
        prev.filter((h) => h.engagementId !== engagementId)
      );
      navigate(`/triage/${engagementId}`);
    } catch (err) {
      setError(`Takeover failed: ${err.message}`);
    } finally {
      setTakingOverId(null);
    }
  };

  // ── Simulate Escalation — inject a demo high-intent lead ──
  const handleSimulateEscalation = () => {
    const demoLead = {
      engagementId: `esc_demo_${Date.now()}`,
      prospectName: "Marcus Chen",
      prospectRole: "VP of Revenue Operations",
      prospectCompany: "Meridian Health Systems",
      prospectEmail: "m.chen@meridianhealth.io",
      intentScore: 92,
      replyChannel: "email",
      handoffAt: new Date().toISOString(),
      isHumanTakeover: false,
      scheduleHumanPartner: true,
      humanPartnerReason: "ESCALATION: Intent score 92/100 — GLM-5 Full Context Briefing ready",
      _isEscalation: true,
    };
    setHandoffs((prev) => [demoLead, ...prev]);
  };

  // ── Open Briefing Panel ──
  const handleOpenBriefing = async (engagementId) => {
    setBriefingOpen(true);
    setBriefingLoading(true);
    setBriefingData(null);
    try {
      const data = await fetchEscalationBriefing(engagementId);
      setBriefingData(data);
    } catch (err) {
      setError(`Briefing failed: ${err.message}`);
      setBriefingOpen(false);
    } finally {
      setBriefingLoading(false);
    }
  };

  // ── Derived data ──
  const filtered = handoffs
    .filter((h) => {
      if (filter === "needs_triage") return !h.isHumanTakeover;
      if (filter === "taken_over") return h.isHumanTakeover;
      return true;
    })
    .filter((h) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (h.prospectName || "").toLowerCase().includes(q) ||
        (h.prospectCompany || "").toLowerCase().includes(q) ||
        (h.prospectEmail || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "intent_desc")
        return (b.intentScore ?? 0) - (a.intentScore ?? 0);
      return (
        new Date(b.handoffAt || 0).getTime() -
        new Date(a.handoffAt || 0).getTime()
      );
    });

  const totalHandoffs = handoffs.length;
  const awaitingTriage = handoffs.filter((h) => !h.isHumanTakeover).length;
  const activeTakeovers = handoffs.filter((h) => h.isHumanTakeover).length;
  const avgIntent =
    handoffs.length > 0
      ? Math.round(
          handoffs.reduce((sum, h) => sum + (h.intentScore ?? 0), 0) /
            handoffs.length
        )
      : 0;

  return (
    <div className="min-h-screen">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      {/* Header bar */}
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
                  <span className="gradient-text">Triage Launchpad</span>
                </h1>
                <p className="text-[11px] text-white/30">
                  Human-in-the-Loop Takeover Queue
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-white/25">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={handleSimulateEscalation}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/20 hover:border-red-500/30"
                title="Inject a simulated high-intent escalation"
              >
                <Sparkles size={14} />
                Simulate Escalation
              </button>
              <button
                onClick={refresh}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
                title="Refresh now"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-8">
        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
            {error}
          </div>
        )}

        {/* Stat cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6"
        >
          <StatCard
            label="Total Handoffs"
            value={totalHandoffs}
            icon={BarChart3}
            iconColor="text-primary"
          />
          <StatCard
            label="Awaiting Triage"
            value={awaitingTriage}
            icon={Target}
            iconColor="text-amber-400"
          />
          <StatCard
            label="Active Takeovers"
            value={activeTakeovers}
            icon={Users}
            iconColor="text-pink-400"
          />
          <StatCard
            label="Avg Intent Score"
            value={avgIntent}
            icon={TrendingUp}
            iconColor="text-accent"
          />
        </motion.div>

        {/* Filter / Sort / Search bar */}
        <div className="glass noise rounded-xl p-3 mb-6 flex flex-wrap items-center gap-3">
          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-lg bg-white/5 border border-white/10 px-3 py-2 pr-8 text-xs text-white/70 focus:outline-none focus:border-primary/50"
            >
              <option value="intent_desc">Intent (High → Low)</option>
              <option value="time">Most Recent</option>
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
            />
          </div>

          {/* Filter toggles */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {[
              { id: "all", label: "All" },
              { id: "needs_triage", label: "Needs Triage" },
              { id: "taken_over", label: "Taken Over" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-2 text-xs font-medium transition ${
                  filter === f.id
                    ? "bg-primary/20 text-primary"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or company..."
              className="w-full rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Handoff queue */}
        {loading && handoffs.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-center">
              <RefreshCw
                size={32}
                className="mx-auto animate-spin text-primary"
              />
              <p className="mt-4 text-sm text-white/40">
                Loading triage queue...
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/20 gap-2">
            <Target size={40} className="opacity-30" />
            <p className="text-sm font-semibold">
              No prospects in the triage queue
            </p>
            <p className="text-[11px]">
              Prospects will appear here when they cross the Event Bridge
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-3"
          >
            {filtered.map((h) => (
              <HandoffCard
                key={h.engagementId}
                handoff={h}
                onTakeover={handleTakeover}
                takingOver={takingOverId}
                onOpenBriefing={handleOpenBriefing}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Escalation Briefing Slide-Over */}
      <AnimatePresence>
        {briefingOpen && (
          <EscalationBriefingPanel
            briefing={briefingData}
            loading={briefingLoading}
            onClose={() => {
              setBriefingOpen(false);
              setBriefingData(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
