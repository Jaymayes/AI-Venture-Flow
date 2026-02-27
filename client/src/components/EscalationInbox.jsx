/**
 * EscalationInbox.jsx — High-Intent Lead Escalation Queue
 *
 * Displays leads that scored >= 85/100 on the 6-Signal Intent Matrix,
 * triggering HITL (Human-in-the-Loop) escalation from the StateGraph.
 *
 * Each card shows:
 *   - Prospect name, title, company
 *   - Intent score with color-coded badge
 *   - Reply channel (email/sms/voice)
 *   - Time since escalation
 *   - "View Briefing" button → slides open GLM-5 Full Context Briefing
 *   - "Claim & Schedule" button → activates human takeover
 *
 * Data source: GET /api/triage/handoffs (filtered client-side for score >= 85)
 *              GET /api/triage/briefing/{id} (for the slide-over panel)
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  RefreshCw,
  Mail,
  MessageSquare,
  Phone,
  Database,
  Flame,
  Brain,
  X,
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
  BarChart3,
  TrendingUp,
  UserCheck,
  Loader2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { fetchEscalations, fetchBriefing, claimEscalation } from "../lib/sp-api-client";

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

const usd = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

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

// ---------------------------------------------------------------------------
// Briefing Section (reusable layout for the slide-over)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Escalation Briefing Slide-Over Panel
// ---------------------------------------------------------------------------

function BriefingPanel({ briefing, onClose, loading }) {
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
                <h2 className="text-lg font-bold text-white">Full Context Briefing</h2>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold animate-pulse">
                  LIVE
                </span>
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
        {prospect && (
          <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold">{prospect.name}</p>
                <p className="text-white/50 text-xs">{prospect.title}</p>
                <p className="text-white/30 text-[11px]">
                  {prospect.company} &middot; {prospect.industry} &middot; {prospect.employees} employees
                </p>
                {prospect.funding && (
                  <p className="text-primary/60 text-[10px] mt-1">
                    {prospect.funding} &middot; {prospect.location}
                  </p>
                )}
              </div>
              {intentTelemetry && (
                <div className="text-right">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {intentTelemetry.score}/100
                  </div>
                  <p className="text-[10px] text-white/25 mt-1">Intent Score</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* 1. Intent Telemetry */}
        {intentTelemetry && (
          <BriefingSection icon={BarChart3} iconColor="text-cyan-400" title="Intent Telemetry">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5 text-center">
                <p className="text-lg font-bold text-emerald-400">{intentTelemetry.score}</p>
                <p className="text-[9px] text-white/30">Score</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5 text-center">
                <p className="text-lg font-bold text-amber-400">{intentTelemetry.timeframe || "Q1"}</p>
                <p className="text-[9px] text-white/30">Target Close</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5 text-center">
                <p className="text-lg font-bold text-primary">{intentTelemetry.estimatedDealCycle || "30d"}</p>
                <p className="text-[9px] text-white/30">Deal Cycle</p>
              </div>
            </div>
            {intentTelemetry.trigger && (
              <>
                <p className="text-xs text-white/50 mb-2 font-medium">Escalation Trigger</p>
                <p className="text-xs text-amber-400/80 mb-3">{intentTelemetry.trigger}</p>
              </>
            )}
            {intentTelemetry.triggerDetails?.length > 0 && (
              <div className="space-y-1.5">
                {intentTelemetry.triggerDetails.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-white/40">
                    <CheckCircle2 size={11} className="text-emerald-400/60 mt-0.5 shrink-0" />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            )}
          </BriefingSection>
        )}

        {/* 2. Firmographic & Value-Based Anchoring */}
        {firmographic && (
          <BriefingSection icon={DollarSign} iconColor="text-emerald-400" title="Value-Based Anchoring">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {firmographic.currentSdrCount != null && (
                <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                  <p className="text-[10px] text-white/30">Current SDR Headcount</p>
                  <p className="text-xl font-bold text-white">
                    {firmographic.currentSdrCount} <span className="text-xs text-white/30">FTEs</span>
                  </p>
                </div>
              )}
              {firmographic.estimatedLaborBurn != null && (
                <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                  <p className="text-[10px] text-white/30">Annual Labor Burn</p>
                  <p className="text-xl font-bold text-red-400">{usd(firmographic.estimatedLaborBurn)}</p>
                  {firmographic.laborBurnCalculation && (
                    <p className="text-[9px] text-white/20">{firmographic.laborBurnCalculation}</p>
                  )}
                </div>
              )}
            </div>
            {firmographic.targetTcv != null && (
              <div className="rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/10 p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-white/40">Target Contract Value</p>
                    <p className="text-2xl font-bold gradient-text">{usd(firmographic.targetTcv)}</p>
                  </div>
                  {firmographic.contractTier && (
                    <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                      {firmographic.contractTier}
                    </span>
                  )}
                </div>
              </div>
            )}
            {firmographic.painPoints?.length > 0 && (
              <>
                <p className="text-xs text-white/50 mb-2 font-medium">Identified Pain Points</p>
                <div className="space-y-2">
                  {firmographic.painPoints.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-white/40">
                      <AlertTriangle size={11} className="text-amber-400/60 mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </BriefingSection>
        )}

        {/* 3. Sentiment & Emotional Subtext */}
        {sentiment && (
          <BriefingSection icon={HeartPulse} iconColor="text-pink-400" title="Sentiment & Emotional Subtext">
            {sentiment.dominantEmotion && (
              <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/50 font-medium">Dominant Emotion</p>
                  {sentiment.emotionConfidence != null && (
                    <span className="text-[10px] text-white/25">
                      {Math.round(sentiment.emotionConfidence * 100)}% confidence
                    </span>
                  )}
                </div>
                <p className="text-sm text-pink-400 font-semibold">{sentiment.dominantEmotion}</p>
              </div>
            )}
            {sentiment.unspokenConcern && (
              <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 mb-3">
                <p className="text-[10px] text-amber-400/60 mb-1 font-medium">Unspoken Concern</p>
                <p className="text-xs text-amber-300/80">{sentiment.unspokenConcern}</p>
              </div>
            )}
            {sentiment.buyingSignals?.length > 0 && (
              <>
                <p className="text-xs text-white/50 mb-2 font-medium">Buying Signals</p>
                <div className="space-y-1.5 mb-3">
                  {sentiment.buyingSignals.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-white/40">
                      <TrendingUp size={11} className="text-emerald-400/60 mt-0.5 shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {sentiment.riskFactors?.length > 0 && (
              <>
                <p className="text-xs text-white/50 mb-2 font-medium">Risk Factors</p>
                <div className="space-y-1.5">
                  {sentiment.riskFactors.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-white/40">
                      <AlertTriangle size={11} className="text-red-400/60 mt-0.5 shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </BriefingSection>
        )}

        {/* 4. Conversation Abstract */}
        {conversationAbstract && (
          <BriefingSection icon={ScrollText} iconColor="text-violet-400" title="Conversation Abstract">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-white/30">
                {conversationAbstract.totalTouchpoints} touchpoints
              </span>
              {conversationAbstract.discoveryComplete && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  <CheckCircle2 size={10} />
                  Discovery Complete
                </span>
              )}
            </div>
            {conversationAbstract.touchpoints?.length > 0 && (
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
            )}
            {conversationAbstract.doNotRepeat?.length > 0 && (
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
            )}
          </BriefingSection>
        )}

        {/* 5. GLM-5 Strategic Directives */}
        {directives && (
          <BriefingSection icon={Swords} iconColor="text-amber-400" title="GLM-5 Strategic Directives">
            {directives.strategicPosture && (
              <div className="rounded-lg bg-gradient-to-r from-amber-500/5 to-primary/5 border border-amber-500/10 p-3 mb-3">
                <p className="text-[10px] text-amber-400/60 mb-1">Strategic Posture</p>
                <p className="text-xs text-white/70 italic">{directives.strategicPosture}</p>
              </div>
            )}
            <div className="space-y-3">
              {directives.opening && (
                <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">1</span>
                    <p className="text-xs text-white/60 font-medium">The Opening</p>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed pl-7">{directives.opening}</p>
                </div>
              )}
              {directives.proofPoint && (
                <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-500/15 text-blue-400 text-[10px] font-bold">2</span>
                    <p className="text-xs text-white/60 font-medium">The Proof Point</p>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed pl-7">{directives.proofPoint}</p>
                </div>
              )}
              {directives.objectionHandling && (
                <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/15 text-amber-400 text-[10px] font-bold">3</span>
                    <p className="text-xs text-white/60 font-medium">Objection Handling</p>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed pl-7">{directives.objectionHandling}</p>
                </div>
              )}
              {directives.close && (
                <div className="rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/10 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-primary/20 text-primary text-[10px] font-bold">4</span>
                    <p className="text-xs text-white/60 font-medium">The Close</p>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed pl-7">{directives.close}</p>
                  {directives.recommendedPackage && (
                    <div className="mt-2 pl-7 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                        {directives.recommendedPackage}
                      </span>
                    </div>
                  )}
                </div>
              )}
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
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-white/20">
            Orchestrated by <span className="text-primary/50 font-medium">{briefing.orchestrationModel || "Z.AI GLM-5"}</span>{" "}
            {briefing.edgeModel && <>
              &middot; Edge: <span className="text-white/30">{briefing.edgeModel}</span>
            </>}
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
// Escalation Card
// ---------------------------------------------------------------------------

function EscalationCard({ handoff, onViewBriefing, onClaim, claiming }) {
  const score = handoff.intentScore ?? handoff.hitlIntentScore ?? 0;
  const isClaiming = claiming === handoff.engagementId;

  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-xl p-4 border border-white/5 hover:border-emerald-500/20 transition-all group"
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
              {handoff.prospectRole || "N/A"}, {handoff.prospectCompany || "N/A"}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap">
            {/* Intent score badge */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {score}/100
            </div>

            {/* Channel */}
            <div className="flex items-center gap-1 text-white/30">
              {channelIcon(handoff.replyChannel)}
              <span className="capitalize">{handoff.replyChannel || "email"}</span>
            </div>

            {/* Time ago */}
            <div className="flex items-center gap-1 text-white/25">
              <Clock size={12} />
              {timeAgo(handoff.lastActivity || handoff.createdAt)}
            </div>

            {/* HITL badge */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold">
              <Flame size={10} />
              HITL
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      {handoff.summary && (
        <p className="text-[11px] text-white/35 mt-2 line-clamp-2 leading-relaxed">
          {handoff.summary}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => onViewBriefing(handoff.engagementId)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20 hover:bg-primary/20 transition"
        >
          <Brain size={13} />
          View Briefing
        </button>
        <button
          onClick={() => onClaim(handoff.engagementId)}
          disabled={isClaiming}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 text-white text-xs font-semibold hover:from-emerald-600 hover:to-emerald-500 transition disabled:opacity-50"
        >
          {isClaiming ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <UserCheck size={13} />
          )}
          {isClaiming ? "Claiming..." : "Claim & Schedule"}
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function EscalationInbox() {
  const { token, logout } = useAuth();
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(null);

  // Briefing panel state
  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);

  // ── Fetch escalation queue ──
  const loadEscalations = useCallback(async () => {
    try {
      const data = await fetchEscalations(token);
      if (data?.unauthorized) {
        logout();
        return;
      }
      // Filter for high-intent only (>= 85)
      const highIntent = (data?.handoffs || data?.items || []).filter(
        (h) => (h.intentScore ?? h.hitlIntentScore ?? 0) >= 85
      );
      setEscalations(highIntent);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, logout]);

  useEffect(() => {
    loadEscalations();
  }, [loadEscalations]);

  // ── Refresh ──
  const handleRefresh = () => {
    setRefreshing(true);
    loadEscalations();
  };

  // ── Open briefing ──
  const handleViewBriefing = async (engagementId) => {
    setShowBriefing(true);
    setBriefingLoading(true);
    setBriefing(null);
    try {
      const data = await fetchBriefing(token, engagementId);
      if (data?.unauthorized) {
        logout();
        return;
      }
      setBriefing(data);
    } catch (err) {
      console.error("[EscalationInbox] Briefing fetch failed:", err);
      setBriefing(null);
    } finally {
      setBriefingLoading(false);
    }
  };

  // ── Claim lead ──
  const handleClaim = async (engagementId) => {
    setClaiming(engagementId);
    try {
      const result = await claimEscalation(token, engagementId);
      if (result?.unauthorized) {
        logout();
        return;
      }
      // Remove from list after successful claim
      setEscalations((prev) => prev.filter((e) => e.engagementId !== engagementId));
    } catch (err) {
      console.error("[EscalationInbox] Claim failed:", err);
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/10">
            <Target size={18} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Escalation Inbox</h2>
            <p className="text-[11px] text-white/30">
              High-intent leads (score &ge; 85) requiring human engagement
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-xs border border-white/10 hover:bg-white/10 transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 size={32} className="mx-auto animate-spin text-primary" />
            <p className="mt-3 text-sm text-white/40">Loading escalation queue...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4 text-center">
          <AlertTriangle size={24} className="mx-auto text-red-400 mb-2" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 px-4 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && escalations.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl bg-white/[0.02] border border-white/5 p-8 text-center"
        >
          <Target size={40} className="mx-auto text-white/15 mb-3" />
          <p className="text-white/40 text-sm font-medium">No high-intent escalations</p>
          <p className="text-white/20 text-xs mt-1">
            Leads scoring &ge; 85/100 on the 6-Signal Matrix will appear here.
          </p>
        </motion.div>
      )}

      {/* Escalation cards */}
      {!loading && !error && escalations.length > 0 && (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
          {escalations.map((handoff) => (
            <EscalationCard
              key={handoff.engagementId}
              handoff={handoff}
              onViewBriefing={handleViewBriefing}
              onClaim={handleClaim}
              claiming={claiming}
            />
          ))}
        </motion.div>
      )}

      {/* Briefing slide-over panel */}
      <AnimatePresence>
        {showBriefing && (
          <BriefingPanel
            briefing={briefing}
            loading={briefingLoading}
            onClose={() => {
              setShowBriefing(false);
              setBriefing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
