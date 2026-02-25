import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Phone,
  Database,
  Linkedin,
  Eye,
  Link2,
  Shield,
  ShieldOff,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Briefcase,
  Building2,
  Calendar,
  Hash,
  AlertTriangle,
  Clock,
  User,
  Zap,
  TrendingUp,
  Send,
  CheckCircle,
  Globe,
  FileText,
  Brain,
  Target,
  Crosshair,
  Flame,
  Copy,
} from "lucide-react";
import {
  fetchEngagement,
  initiateTakeover,
  releaseTakeover,
  dispatchMessage,
} from "../lib/triage-client";

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

const fmtDate = (iso) => {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleString();
};

const fmtMoney = (n) => {
  if (!n) return "\u2014";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const intentColor = (score) => {
  if (score >= 85)
    return {
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    };
  if (score >= 70)
    return {
      bg: "bg-amber-500/20",
      text: "text-amber-400",
      dot: "bg-amber-400",
    };
  return { bg: "bg-red-500/20", text: "text-red-400", dot: "bg-red-400" };
};

const statusBadge = (status) => {
  const map = {
    enrichment_pending: {
      bg: "bg-cyan-500/20",
      text: "text-cyan-400",
      label: "Enriching\u2026",
    },
    ready_for_outreach: {
      bg: "bg-teal-500/20",
      text: "text-teal-400",
      label: "Ready",
    },
    running: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Running" },
    waiting_cooldown: {
      bg: "bg-orange-500/20",
      text: "text-orange-400",
      label: "Cooldown",
    },
    prospect_replied: {
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      label: "Replied",
    },
    breakup: { bg: "bg-red-500/20", text: "text-red-400", label: "Breakup" },
    halted: {
      bg: "bg-slate-500/20",
      text: "text-slate-400",
      label: "Halted",
    },
  };
  return (
    map[status] || {
      bg: "bg-white/10",
      text: "text-white/50",
      label: status || "Unknown",
    }
  );
};

const channelMeta = (ch) => {
  const map = {
    email: {
      icon: Mail,
      color: "text-blue-400",
      dot: "bg-blue-400",
      label: "Email",
    },
    sms: {
      icon: MessageSquare,
      color: "text-green-400",
      dot: "bg-green-400",
      label: "SMS",
    },
    voice: {
      icon: Phone,
      color: "text-purple-400",
      dot: "bg-purple-400",
      label: "Voice",
    },
    linkedin_dm: {
      icon: Linkedin,
      color: "text-blue-400",
      dot: "bg-blue-400",
      label: "LinkedIn DM",
    },
    m2m: {
      icon: Database,
      color: "text-orange-400",
      dot: "bg-orange-400",
      label: "M2M",
    },
  };
  return (
    map[ch] || {
      icon: Mail,
      color: "text-cyan-400",
      dot: "bg-cyan-400",
      label: ch || "Unknown",
    }
  );
};

// ---------------------------------------------------------------------------
// Prospect Intel Sidebar
// ---------------------------------------------------------------------------

function ProspectSidebar({ engagement }) {
  const intel = engagement.prospectIntel || {};
  const sb = statusBadge(engagement.status);

  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-2xl p-5 border border-white/5 space-y-5"
    >
      {/* Name & Role */}
      <div>
        <h2 className="text-lg font-bold text-white">
          {intel.fullName || "Unknown Prospect"}
        </h2>
        <p className="text-white/50 text-sm">{intel.role || "N/A"}</p>
        <p className="text-white/30 text-xs mt-0.5">
          {intel.company || "N/A"}
          {intel.industry ? ` \u00B7 ${intel.industry}` : ""}
        </p>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sb.bg} ${sb.text}`}
        >
          {sb.label}
        </span>
        {engagement.isHumanTakeover && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-400">
            Human Takeover
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-2 text-xs">
        {intel.companySize && (
          <div className="flex items-center gap-2 text-white/40">
            <Building2 size={12} />
            <span>{intel.companySize} employees</span>
          </div>
        )}
        {intel.tenure && (
          <div className="flex items-center gap-2 text-white/40">
            <Briefcase size={12} />
            <span>{intel.tenure}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-white/40">
          <Hash size={12} />
          <span>{engagement.outreachHistory?.length ?? 0} outreach attempts</span>
        </div>
        <div className="flex items-center gap-2 text-white/40">
          <Calendar size={12} />
          <span>Started {timeAgo(engagement.startedAt)}</span>
        </div>
      </div>

      {/* Contact links */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
          Contact
        </p>
        {intel.email && (
          <a
            href={`mailto:${intel.email}`}
            className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition"
          >
            <Mail size={12} />
            {intel.email}
            <ExternalLink size={10} className="opacity-50" />
          </a>
        )}
        {intel.phone && (
          <a
            href={`tel:${intel.phone}`}
            className="flex items-center gap-2 text-xs text-green-400 hover:text-green-300 transition"
          >
            <Phone size={12} />
            {intel.phone}
          </a>
        )}
        {intel.linkedinUrl && (
          <a
            href={intel.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition"
          >
            <Linkedin size={12} />
            LinkedIn Profile
            <ExternalLink size={10} className="opacity-50" />
          </a>
        )}
      </div>

      {/* Hiring Signals */}
      {intel.hiringSignals && intel.hiringSignals.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">
            Hiring Signals
          </p>
          <div className="space-y-1.5">
            {intel.hiringSignals.map((sig, i) => (
              <div
                key={i}
                className="rounded-lg bg-white/5 px-3 py-2 text-xs"
              >
                <span className="text-white/70 font-medium">
                  {sig.role || sig.title}
                </span>
                {sig.department && (
                  <span className="text-white/30"> · {sig.department}</span>
                )}
                {sig.daysPosted != null && (
                  <span className="text-white/20 ml-1">
                    ({sig.daysPosted}d posted)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funding Rounds */}
      {intel.fundingRounds && intel.fundingRounds.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">
            Funding
          </p>
          <div className="space-y-1.5">
            {intel.fundingRounds.map((round, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs"
              >
                <span className="text-white/70 font-medium">
                  {round.roundType || round.type}
                </span>
                <div className="text-right">
                  <span className="text-accent font-bold">
                    {fmtMoney(round.amountUSD || round.amount)}
                  </span>
                  {round.date && (
                    <span className="text-white/20 text-[10px] ml-1.5">
                      {new Date(round.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// AI Research Panel (Phase 11: Deep Intel UI)
// ---------------------------------------------------------------------------

function AIResearchPanel({ enrichedIntel }) {
  if (!enrichedIntel || enrichedIntel.status === "failed") return null;

  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-2xl p-5 border border-white/5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Globe size={16} className="text-accent" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">
          AI Research
        </h3>
        <span
          className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
            enrichedIntel.status === "success"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-amber-500/20 text-amber-400"
          }`}
        >
          {enrichedIntel.status === "success" ? "Full Scan" : "Partial"}
        </span>
      </div>

      {/* Website link */}
      {enrichedIntel.sourceUrl && (
        <a
          href={enrichedIntel.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition truncate"
        >
          <ExternalLink size={10} />
          {enrichedIntel.normalizedDomain || enrichedIntel.sourceUrl}
        </a>
      )}

      {/* Value Proposition (hero element) */}
      {enrichedIntel.valueProposition && (
        <div className="rounded-lg bg-accent/5 border border-accent/10 px-3 py-2">
          <p className="text-[10px] text-accent/60 uppercase tracking-wider font-semibold mb-1">
            Value Proposition
          </p>
          <p className="text-sm text-white/80 leading-relaxed">
            {enrichedIntel.valueProposition}
          </p>
        </div>
      )}

      {/* Meta Description */}
      {enrichedIntel.metaDescription && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">
            Tagline
          </p>
          <p className="text-xs text-white/60 leading-relaxed">
            {enrichedIntel.metaDescription}
          </p>
        </div>
      )}

      {/* Key Headings (h1Tags) */}
      {enrichedIntel.h1Tags?.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1.5">
            Key Headings
          </p>
          <div className="space-y-1">
            {enrichedIntel.h1Tags.slice(0, 3).map((h, i) => (
              <div
                key={i}
                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/60"
              >
                {h}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Keywords (chips) */}
      {enrichedIntel.productKeywords?.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1.5">
            Product Keywords
          </p>
          <div className="flex flex-wrap gap-1.5">
            {enrichedIntel.productKeywords.slice(0, 8).map((kw, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Content Links */}
      {enrichedIntel.recentContentLinks?.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1.5">
            Recent Content
          </p>
          <div className="space-y-1">
            {enrichedIntel.recentContentLinks.slice(0, 3).map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-blue-400/70 hover:text-blue-300 transition truncate"
              >
                <FileText size={10} className="shrink-0" />
                {link.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer: scan timestamp */}
      {enrichedIntel.enrichedAt && (
        <p className="text-[10px] text-white/20 pt-1">
          Scanned {timeAgo(enrichedIntel.enrichedAt)}
          {enrichedIntel.scrapingDurationMs
            ? ` · ${(enrichedIntel.scrapingDurationMs / 1000).toFixed(1)}s`
            : ""}
        </p>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Conversation Timeline
// ---------------------------------------------------------------------------

function AttemptCard({ attempt, index }) {
  const [expanded, setExpanded] = useState(false);
  const cm = channelMeta(attempt.channel);
  const Icon = cm.icon;
  const content = attempt.generatedDraft || attempt.content || "";
  const truncated = content.length > 300;

  return (
    <div className="relative pl-8">
      {/* Timeline dot */}
      <div
        className={`absolute left-0 top-2 h-3 w-3 rounded-full border-2 border-surface ${cm.dot}`}
      />

      <div className="glass noise rounded-xl p-4 border border-white/5">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs">
            <Icon size={14} className={cm.color} />
            <span className={`font-semibold ${cm.color}`}>{cm.label}</span>
            <span className="text-white/30">Attempt #{index + 1}</span>
          </div>
          <span className="text-[10px] text-white/25">
            {fmtDate(attempt.sentAt || attempt.timestamp)}
          </span>
        </div>

        {/* Email subject */}
        {attempt.channel === "email" && attempt.subject && (
          <div className="mb-2 text-xs text-white/50">
            <span className="text-white/30">Subject: </span>
            {attempt.subject}
          </div>
        )}

        {/* Content */}
        <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
          {expanded || !truncated
            ? content
            : content.slice(0, 300) + "\u2026"}
        </div>
        {truncated && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-[10px] text-primary hover:text-primary/80 transition"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}

        {/* Signal badges */}
        <div className="flex items-center gap-3 mt-2 text-[10px]">
          {attempt.opened && (
            <span className="flex items-center gap-1 text-cyan-400">
              <Eye size={10} /> Opened
            </span>
          )}
          {attempt.clicked && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Link2 size={10} /> Clicked
            </span>
          )}
        </div>

        {/* Reply bubble */}
        {attempt.replied && attempt.replyContent && (
          <div className="mt-3 border-l-2 border-accent pl-3">
            <div className="flex items-center gap-1.5 text-[10px] text-accent font-semibold mb-1">
              <Zap size={10} />
              Prospect Reply
            </div>
            <div className="text-sm text-white/80 leading-relaxed">
              {attempt.replyContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationTimeline({ attempts }) {
  if (!attempts || attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-white/20 gap-2">
        <MessageSquare size={32} className="opacity-30" />
        <p className="text-sm">No outreach attempts yet</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4 pl-2">
      {/* Timeline connector line */}
      <div className="absolute left-[5px] top-4 bottom-4 w-px bg-white/10" />

      {attempts.map((attempt, i) => (
        <AttemptCard key={i} attempt={attempt} index={i} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Competitor Kill-Sheet Card (P8.5: Vanguard Research Agent)
// ---------------------------------------------------------------------------

const THREAT_COLORS = {
  LOW: { border: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400", label: "LOW THREAT" },
  MODERATE: { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-400", label: "MODERATE THREAT" },
  CRITICAL: { border: "border-red-500/50", bg: "bg-red-500/10", text: "text-red-400", label: "CRITICAL THREAT" },
};

function CompetitorKillSheetCard({ intel }) {
  if (!intel) return null;

  const threat = THREAT_COLORS[intel.threat_level] ?? THREAT_COLORS.MODERATE;

  const copyLandmine = (text) => {
    navigator.clipboard?.writeText(text);
  };

  return (
    <div
      className={`rounded-xl ${threat.border} border-2 bg-black/30 p-4 mb-4`}
    >
      {/* Header row: Competitor name + Threat badge + FLASH INTEL */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <div className="p-1 rounded bg-red-500/10">
          <Crosshair size={14} className="text-red-400" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-white/50">
          Vanguard Intel
        </span>
        <span className={`ml-auto px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${threat.bg} ${threat.text}`}>
          {threat.label}
        </span>
      </div>

      {/* Competitor Name */}
      <h4 className="text-base font-bold text-white/95 mb-2">
        vs. {intel.competitor_name}
      </h4>

      {/* FLASH INTEL badge + recent signal */}
      {intel.recent_signal && (
        <div className="flex items-start gap-2 mb-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 tracking-wider mt-0.5">
            Flash Intel
          </span>
          <span className="text-xs text-amber-200/80 leading-relaxed">
            {intel.recent_signal}
          </span>
        </div>
      )}

      {/* Pricing Delta */}
      {intel.pricing_delta && (
        <div className="mb-3">
          <span className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">
            Pricing Delta
          </span>
          <p className="text-sm text-white/70 mt-0.5">{intel.pricing_delta}</p>
        </div>
      )}

      {/* Our Wedge — The Kill Shot */}
      <div className="mb-3 p-2.5 rounded-lg bg-accent/5 border border-accent/20">
        <div className="flex items-center gap-1.5 mb-1">
          <Flame size={11} className="text-accent" />
          <span className="text-[10px] text-accent/70 font-bold uppercase tracking-wider">
            Kill Shot
          </span>
        </div>
        <p className="text-sm text-white/90 font-semibold leading-relaxed">
          {intel.our_wedge}
        </p>
      </div>

      {/* Landmines — Copy-pasteable discovery questions */}
      {intel.landmines && intel.landmines.length > 0 && (
        <div>
          <span className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">
            Landmine Questions
          </span>
          <ul className="mt-1.5 space-y-1.5">
            {intel.landmines.map((mine, i) => (
              <li
                key={i}
                className="group flex items-start gap-2 text-sm text-white/80 leading-relaxed cursor-pointer hover:text-white/95 transition-colors"
                onClick={() => copyLandmine(mine)}
                title="Click to copy"
              >
                <span className="flex-shrink-0 w-4 h-4 rounded bg-red-500/10 text-red-400 text-[9px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="font-semibold flex-1">{mine}</span>
                <Copy
                  size={12}
                  className="flex-shrink-0 mt-0.5 text-white/10 group-hover:text-white/40 transition-colors"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Intel timestamp */}
      {intel.intel_timestamp && (
        <div className="mt-3 text-[9px] text-white/15 font-mono text-right">
          Vanguard updated: {new Date(intel.intel_timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Context Briefing Panel (P3: Full Context Briefing — Handoff Fidelity)
// ---------------------------------------------------------------------------

function ContextBriefingPanel({ briefing }) {
  if (!briefing) return null;

  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-2xl border-l-4 border-l-accent/40 border border-white/5 p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-accent/10">
          <Brain size={16} className="text-accent" />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-white/40">
          Context Briefing
        </h3>
        <span className="ml-auto text-[10px] text-white/20 font-mono">
          {briefing.synthesizedAt
            ? new Date(briefing.synthesizedAt).toLocaleString()
            : ""}
        </span>
      </div>

      {/* Deal Hypothesis */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-1">
          <Target size={12} className="text-primary" />
          <span className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">
            Deal Hypothesis
          </span>
        </div>
        <p className="text-sm text-white/90 font-medium leading-relaxed">
          {briefing.dealHypothesis}
        </p>
      </div>

      {/* Conversation Summary */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-1">
          <MessageSquare size={12} className="text-cyan-400" />
          <span className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">
            Conversation Summary
          </span>
        </div>
        <p className="text-sm text-white/70 leading-relaxed">
          {briefing.conversationSummary}
        </p>
      </div>

      {/* Psychographic Narrative */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-1">
          <User size={12} className="text-purple-400" />
          <span className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">
            Buyer Psychograph
          </span>
        </div>
        <p className="text-sm text-white/60 italic leading-relaxed">
          {briefing.psychographicNarrative}
        </p>
      </div>

      {/* ── Phase 8.5: Competitor Kill-Sheet (Vanguard Intel) ── */}
      {briefing.marketIntel && (
        <CompetitorKillSheetCard intel={briefing.marketIntel} />
      )}

      {/* Tactical Playbook */}
      {briefing.tacticalPlaybook && briefing.tacticalPlaybook.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={12} className="text-amber-400" />
            <span className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">
              Tactical Playbook
            </span>
          </div>
          <ol className="space-y-1.5">
            {briefing.tacticalPlaybook.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-white/80 leading-relaxed"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Legal Disclaimer (DoL Safe Harbor / AKS Compliance) ── */}
      <div className="text-[10px] text-white/25 border-t border-white/5 pt-3 mt-4 leading-relaxed">
        <span className="text-amber-500/60 mr-1">&#9888;</span>
        CLAWBOT LEGAL NOTICE: The above tactical playbook is an AI-generated
        probabilistic heuristic provided as ambient intelligence only. The
        Sovereign Professional retains absolute independent discretion regarding
        its use, modification, or dismissal per SOW Addendum C &#167; 2.
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Trace Log (Collapsible)
// ---------------------------------------------------------------------------

function TraceLog({ trace }) {
  const [open, setOpen] = useState(false);

  if (!trace || trace.length === 0) return null;

  return (
    <div className="glass noise rounded-xl border border-white/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs text-white/40 hover:text-white/60 transition"
      >
        <span className="font-semibold uppercase tracking-wider">
          Trace Log ({trace.length} entries)
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1 max-h-60 overflow-y-auto">
              {trace.map((entry, i) => (
                <div
                  key={i}
                  className="font-mono text-[11px] text-white/30 leading-relaxed"
                >
                  {typeof entry === "string" ? entry : JSON.stringify(entry)}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Human Composer (Phase 5)
// ---------------------------------------------------------------------------

const SMS_LIMIT = 160;

function HumanComposer({ engagement, engagementId, onSent, onError }) {
  const intel = engagement.prospectIntel || {};

  // Derive default channel from prospect data
  const defaultChannel = intel.phone ? "sms" : "email";
  const [channel, setChannel] = useState(defaultChannel);
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState(() => {
    // Pre-fill with Re: {last email subject}
    const lastEmail = [...(engagement.outreachHistory || [])]
      .reverse()
      .find((a) => a.channel === "email" && a.subject);
    return lastEmail ? `Re: ${lastEmail.subject}` : "";
  });
  const [sending, setSending] = useState(false);
  const [successFlash, setSuccessFlash] = useState(null);

  const canSendEmail = !!intel.email;
  const canSendSMS = !!intel.phone;
  const isEmpty = !message.trim();

  const handleSend = async () => {
    setSending(true);
    try {
      await dispatchMessage(engagementId, {
        channel,
        message: message.trim(),
        subject: channel === "email" ? subject : undefined,
      });
      setSuccessFlash(channel);
      setMessage("");
      setTimeout(() => setSuccessFlash(null), 3000);
      onSent();
    } catch (err) {
      onError(`Dispatch failed: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const smsLen = message.length;
  const smsColor =
    smsLen >= SMS_LIMIT
      ? "text-red-400"
      : smsLen >= 140
        ? "text-amber-400"
        : "text-white/30";

  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-2xl p-5 border border-primary/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/40">
          <Send size={16} className="text-primary" />
          Human Composer
        </h2>

        {/* Channel toggle */}
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          <button
            onClick={() => setChannel("email")}
            disabled={!canSendEmail}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
              channel === "email"
                ? "bg-blue-500/20 text-blue-400"
                : "text-white/40 hover:text-white/70"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <Mail size={12} />
            Email
          </button>
          <button
            onClick={() => setChannel("sms")}
            disabled={!canSendSMS}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
              channel === "sms"
                ? "bg-green-500/20 text-green-400"
                : "text-white/40 hover:text-white/70"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <MessageSquare size={12} />
            SMS
          </button>
        </div>
      </div>

      {/* Success flash */}
      <AnimatePresence>
        {successFlash && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400"
          >
            <CheckCircle size={14} />
            Message sent via {successFlash} to{" "}
            {successFlash === "email" ? intel.email : intel.phone}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email subject line */}
      {channel === "email" && (
        <div className="mb-3">
          <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={sending}
            placeholder="Email subject line..."
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 disabled:opacity-50"
          />
        </div>
      )}

      {/* Message body */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] text-white/30 uppercase tracking-wider">
            {channel === "sms" ? "SMS Message" : "Message Body"}
          </label>
          {channel === "sms" && (
            <span className={`text-[10px] font-mono font-bold ${smsColor}`}>
              {smsLen}/{SMS_LIMIT}
            </span>
          )}
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={sending}
          maxLength={channel === "sms" ? SMS_LIMIT : undefined}
          rows={channel === "sms" ? 3 : 6}
          placeholder={
            channel === "sms"
              ? "Short, punchy message (160 chars max)..."
              : "Compose your reply..."
          }
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 resize-none disabled:opacity-50"
        />
      </div>

      {/* Recipient info + Send button */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-white/25">
          Sending to:{" "}
          <span className="text-white/50">
            {channel === "email" ? intel.email : intel.phone}
          </span>
        </div>
        <button
          onClick={handleSend}
          disabled={sending || isEmpty}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          {sending ? "Sending..." : `Send ${channel === "sms" ? "SMS" : "Email"}`}
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Confirmation Modal
// ---------------------------------------------------------------------------

function ConfirmModal({ title, description, warning, confirmLabel, onCancel, onConfirm, children }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="glass noise w-full max-w-md rounded-2xl border border-white/10 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} className="text-primary" />
            <h3 className="text-lg font-bold">{title}</h3>
          </div>

          <p className="text-sm text-white/60 mb-4">{description}</p>

          {children}

          {warning && (
            <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[11px] text-amber-300/80">
              <AlertTriangle size={11} className="inline mr-1 -mt-0.5" />
              {warning}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-semibold text-white/50 hover:text-white hover:border-white/20 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-lg bg-gradient-to-r from-primary to-accent py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition"
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ===========================================================================
// Main: EngagementDetail
// ===========================================================================

export default function EngagementDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const engagementId = params.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal state
  const [showTakeoverModal, setShowTakeoverModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [releaseReason, setReleaseReason] = useState("");

  // ── Fetch ──
  const refresh = useCallback(async () => {
    try {
      const result = await fetchEngagement(engagementId);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [engagementId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Takeover handler ──
  const handleTakeover = async () => {
    setActionLoading(true);
    try {
      await initiateTakeover(engagementId, { notes: notes || undefined });
      setShowTakeoverModal(false);
      setNotes("");
      await refresh();
    } catch (err) {
      setError(`Takeover failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Release handler ──
  const handleRelease = async () => {
    setActionLoading(true);
    try {
      await releaseTakeover(engagementId, {
        reason: releaseReason || undefined,
      });
      setShowReleaseModal(false);
      setReleaseReason("");
      navigate("/triage");
    } catch (err) {
      setError(`Release failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const engagement = data?.engagement || {};
  const handoff = data?.handoff || {};
  const meta = data?.meta || {};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={32} className="mx-auto animate-spin text-primary" />
          <p className="mt-4 text-sm text-white/40">Loading engagement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="glass noise sticky top-0 z-50 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/triage"
                className="flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
              >
                <ArrowLeft size={14} />
                Triage Queue
              </Link>
              <div>
                <h1 className="text-xl font-bold">
                  <span className="gradient-text">
                    {engagement.prospectIntel?.fullName || "Engagement Detail"}
                  </span>
                </h1>
                <p className="text-[11px] text-white/30">
                  {engagement.engagementId || engagementId}
                </p>
              </div>
            </div>

            <button
              onClick={refresh}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-auto max-w-7xl px-4 md:px-8 mt-4">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
            {error}
          </div>
        </div>
      )}

      {/* Main content — 3 column grid */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Column 1: Prospect Intel Sidebar + AI Research */}
          <div className="lg:col-span-1 space-y-6">
            <ProspectSidebar engagement={engagement} />
            <AIResearchPanel enrichedIntel={engagement.prospectIntel?.enrichedIntel} />
          </div>

          {/* Columns 2-3: Timeline + Trace */}
          <div className="lg:col-span-2 space-y-6">
            {/* Intent score bar */}
            {handoff.intentScore != null && (
              <motion.div
                variants={fadeUp}
                className="glass noise rounded-xl p-4 border border-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40 font-semibold">
                    Intent Score
                  </span>
                  <span
                    className={`text-lg font-bold ${intentColor(handoff.intentScore).text}`}
                  >
                    {handoff.intentScore}/100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                    style={{ width: `${handoff.intentScore}%` }}
                  />
                </div>
              </motion.div>
            )}

            {/* Full Context Briefing (P3: Handoff Fidelity) */}
            <ContextBriefingPanel briefing={handoff.contextBriefing} />

            {/* Conversation Timeline */}
            <motion.div
              variants={fadeUp}
              className="glass noise rounded-2xl p-5 border border-white/5"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/40 mb-5">
                <MessageSquare size={16} />
                Omnichannel Conversation
              </h2>
              <ConversationTimeline attempts={engagement.outreachHistory} />
            </motion.div>

            {/* Trace Log */}
            <TraceLog trace={engagement.trace} />

            {/* ── Human Composer (only visible during takeover) ── */}
            {engagement.isHumanTakeover && (
              <HumanComposer
                engagement={engagement}
                engagementId={engagementId}
                onSent={refresh}
                onError={setError}
              />
            )}
          </div>
        </motion.div>

        {/* ── Sticky Action Bar ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="sticky bottom-0 z-40 mt-6"
        >
          <div className="glass noise rounded-2xl border border-white/10 p-4">
            {engagement.isHumanTakeover ? (
              /* Already taken over */
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/20 text-pink-400 text-sm font-bold">
                    <Shield size={16} />
                    HUMAN TAKEOVER ACTIVE
                  </div>
                  <div className="text-xs text-white/40">
                    <span className="text-white/60">
                      {engagement.humanTakeoverBy || "Operator"}
                    </span>
                    {" \u00B7 "}
                    {timeAgo(engagement.humanTakeoverAt)}
                  </div>
                </div>
                <button
                  onClick={() => setShowReleaseModal(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/5 hover:text-white transition disabled:opacity-50"
                >
                  <ShieldOff size={16} />
                  Release Back to AI
                </button>
              </div>
            ) : (
              /* Not taken over */
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-white/40">
                  AI is autonomously managing this engagement.
                </div>
                <button
                  onClick={() => setShowTakeoverModal(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition disabled:opacity-50"
                >
                  {actionLoading ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Shield size={16} />
                  )}
                  Initiate Human Takeover
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Takeover Confirmation Modal ── */}
      {showTakeoverModal && (
        <ConfirmModal
          title="Initiate Human Takeover"
          description="This will mute AI outreach for this prospect. All inbound signals will still be logged, but no automated messages will be sent."
          warning="The AI engagement cycle will halt immediately. You must manually manage all communication with this prospect until takeover is released."
          confirmLabel="Confirm Takeover"
          onCancel={() => setShowTakeoverModal(false)}
          onConfirm={handleTakeover}
        >
          <div>
            <label className="text-xs text-white/40 mb-1 block">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why are you taking over this engagement?"
              rows={3}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>
        </ConfirmModal>
      )}

      {/* ── Release Confirmation Modal ── */}
      {showReleaseModal && (
        <ConfirmModal
          title="Release Back to AI"
          description="This will re-enable AI outreach for this prospect. The engagement cycle will resume automatically."
          warning="Make sure you've completed any pending human follow-ups before releasing."
          confirmLabel="Release to AI"
          onCancel={() => setShowReleaseModal(false)}
          onConfirm={handleRelease}
        >
          <div>
            <label className="text-xs text-white/40 mb-1 block">
              Reason (optional)
            </label>
            <textarea
              value={releaseReason}
              onChange={(e) => setReleaseReason(e.target.value)}
              placeholder="Outcome or reason for release..."
              rows={3}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>
        </ConfirmModal>
      )}
    </div>
  );
}
