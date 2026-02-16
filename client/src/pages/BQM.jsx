import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock,
  AlertTriangle,
  Shield,
  Target,
  Briefcase,
  Scale,
  UserCheck,
  MessageSquare,
  FileText,
  Star,
  Award,
  ThumbsUp,
  ThumbsDown,
  Minus,
  CheckCircle2,
  XCircle,
  CircleDot,
  Handshake,
  BadgeCheck,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

// ---------------------------------------------------------------------------
// BQM Data
// ---------------------------------------------------------------------------

const SESSION_STRUCTURE = [
  { phase: "Opening Frame", time: "2 min", desc: "Set peer-to-peer context" },
  { phase: "Portfolio Review", time: "8 min", desc: "Evidence-based deal analysis" },
  { phase: "Scenario Response", time: "8 min", desc: "Live strategic reasoning" },
  { phase: "Model Alignment", time: "5 min", desc: "1099 structure & economics" },
  { phase: "Mutual Evaluation", time: "2 min", desc: "Two-way fit assessment" },
];

const OPENING_SCRIPT = {
  context:
    "The opening frame establishes this as a mutual evaluation, not a job interview. You are two business principals exploring whether a strategic partnership makes sense. This framing is not just tone -- it is a legal requirement to maintain IC classification.",
  script: `"[Name], appreciate you making the time. Before we get into it, I want to frame this correctly. This isn't an interview. I'm not hiring for a role. Referral Service LLC partners with independent professionals who manage our AI-driven sales pods on a deliverable basis. This conversation is about whether our model is a fit for how you operate, and whether you're the right caliber of closer for our enterprise pipeline. Fair?"`,
  legalNotes: [
    "Do NOT use language like 'hiring', 'position', 'role', or 'job offer'",
    "Frame as 'partnership', 'engagement', 'strategic alignment'",
    "Avoid any reference to work schedules, office locations, or reporting structure",
    "Never say 'you would report to' -- instead say 'you would interface with'",
  ],
};

const PORTFOLIO_QUESTIONS = [
  {
    id: "q1",
    question:
      "Walk me through your highest-value deal from the last 18 months. What was the TCV, the sales cycle length, and what made you the right closer for that engagement?",
    purpose:
      "Establishes ACV range, deal complexity, and self-awareness. You're looking for $50K+ TCV, multi-stakeholder cycles, and strategic (not transactional) selling.",
    greenFlags: [
      "Specific TCV number without hesitation",
      "Multi-stakeholder deal with C-suite involvement",
      "Describes a consultative, solution-based approach",
      "Takes ownership of the outcome without over-indexing on team",
    ],
    redFlags: [
      "Vague on numbers -- 'it was a big deal'",
      "Transactional language -- 'I just closed it'",
      "No mention of strategic positioning or discovery",
      "Attributes success entirely to product or marketing",
    ],
    rubricDimension: "Deal Caliber",
  },
  {
    id: "q2",
    question:
      "Tell me about a deal you lost that you should have won. What happened, and what would you do differently today?",
    purpose:
      "Tests intellectual honesty, loss analysis capability, and growth orientation. Elite closers study their losses more than their wins.",
    greenFlags: [
      "Specific, candid about what went wrong",
      "Shows pattern recognition -- identifies systemic issue",
      "Describes what they changed in their process afterward",
      "No blame-shifting to product, marketing, or timing",
    ],
    redFlags: [
      "Cannot name a meaningful loss",
      "Blames external factors exclusively",
      "Gets defensive or dismissive about the question",
      "No evidence of post-mortem analysis",
    ],
    rubricDimension: "Self-Awareness",
  },
  {
    id: "q3",
    question:
      "Do you have client testimonials or references from previous engagements that speak to the transformation you delivered -- not just the sale, but the business outcome?",
    purpose:
      "Legally critical. Client testimonials demonstrate they make services available to the general public -- a hallmark of IC status. Also validates they deliver outcomes, not just close.",
    greenFlags: [
      "Has testimonials ready or can provide within 48 hours",
      "References speak to business outcomes, not just relationships",
      "Multiple clients across different engagements",
      "Comfortable sharing -- indicates professional confidence",
    ],
    redFlags: [
      "No testimonials available and no plan to obtain them",
      "All references are internal managers, not clients",
      "Hesitant or defensive about sharing references",
      "Testimonials are generic, not outcome-specific",
    ],
    rubricDimension: "Market Presence",
  },
];

const SCENARIO_QUESTIONS = [
  {
    id: "s1",
    question:
      "Here's the scenario: Our Triage Engine has escalated a lead -- a VP of Operations at a mid-market logistics company, 87/100 intent score. The Context Briefing shows they've engaged with three pieces of content about AI-driven workforce optimization, asked two pricing questions via chat, and their company just closed a Series B. You have 24 hours before the scheduled call. Walk me through your prep and your opening strategy.",
    purpose:
      "Tests strategic preparation, consultative approach, and ability to work within an AI-augmented workflow. They need to demonstrate they can consume a Context Briefing and convert it into a deal strategy.",
    greenFlags: [
      "Asks clarifying questions about the Context Briefing format",
      "Mentions researching the company and the specific stakeholder",
      "Plans a discovery-first approach, not a pitch",
      "References the Series B context as a timing signal",
      "Thinks about multi-threading -- who else needs to be in the room",
    ],
    redFlags: [
      "Jumps straight to pitching the product",
      "Ignores the AI-generated intelligence entirely",
      "No mention of preparation or research",
      "Treats it as a transactional cold call, not a strategic meeting",
    ],
    rubricDimension: "Strategic Execution",
  },
  {
    id: "s2",
    question:
      "Second scenario: You're three weeks into a deal cycle. The economic buyer is engaged, but their legal team is pushing back on our AI Disclosure requirements -- they want to remove the mandatory bot-labeling from customer-facing interactions. How do you handle this?",
    purpose:
      "Tests integrity under commercial pressure and understanding of compliance as a selling point. Elite closers understand that security and compliance are trust accelerators, not obstacles.",
    greenFlags: [
      "Holds the line on compliance -- understands it's non-negotiable",
      "Reframes compliance as a competitive advantage",
      "Proposes creative solutions that satisfy legal without gutting disclosure",
      "References similar objection-handling from past experience",
    ],
    redFlags: [
      "Suggests removing or weakening the disclosure",
      "Treats compliance as 'something to get around'",
      "Has no framework for navigating legal objections",
      "Prioritizes closing over integrity",
    ],
    rubricDimension: "Integrity Under Pressure",
  },
];

const MODEL_ALIGNMENT = [
  {
    id: "m1",
    question:
      "This engagement operates on a 1099 basis with a deliverable-focused Statement of Work. You set your own hours, use your own tools, and have full Right to Substitute -- meaning you can hire sub-contractors to manage additional pods. Is that consistent with how you prefer to operate?",
    purpose:
      "Confirms IC alignment and surfaces any expectation of W-2 benefits, fixed schedules, or employment-style oversight. Must be affirmatively aligned -- not reluctantly accepting.",
    greenFlags: [
      "Already operates as an independent contractor or has an LLC/S-Corp",
      "Enthusiastic about the flexibility and scalability",
      "Asks intelligent questions about the SOW structure",
      "Immediately sees the Right to Substitute as a scaling lever",
    ],
    redFlags: [
      "Asks about benefits, PTO, or health insurance",
      "Expresses concern about 'lack of stability'",
      "Wants a fixed schedule or guaranteed hours",
      "Does not understand or is uncomfortable with 1099 classification",
    ],
    rubricDimension: "1099 Alignment",
  },
  {
    id: "m2",
    question:
      "Our compensation model is a fixed FMV retainer in the $2K-$6K range for strategic oversight, plus 15-20% commission on Total Contract Value. The retainer scales with the number of pods you manage. What questions do you have about the economics?",
    purpose:
      "Tests financial sophistication and ability to model their own earnings. Strong candidates will immediately start doing mental math on multi-pod scenarios.",
    greenFlags: [
      "Asks about average TCV per deal to model earnings",
      "Calculates multi-pod scenarios unprompted",
      "Understands the retainer as a floor, not a ceiling",
      "Sees the commission structure as uncapped upside",
    ],
    redFlags: [
      "Fixates solely on the retainer as their income",
      "Asks 'what's the OTE?' (W-2 thinking)",
      "No questions about the economics at all",
      "Treats commission as a bonus, not a core income stream",
    ],
    rubricDimension: "Financial Sophistication",
  },
];

const CLOSING_SCRIPT = {
  script: `"[Name], I've enjoyed this conversation. Here's where I am: I think there's potential alignment here, but I want to be straight with you -- I evaluate these partnerships the same way you'd evaluate a new client engagement. I'm going to review my notes, check your references, and if everything tracks, I'll send over a draft SOW for your review within 72 hours. On your end, take a look at our full architecture at referralsvc.com/recruit and let me know if you have questions. Sound good?"`,
  legalNotes: [
    "Never pressure for an immediate decision -- IC relationships are mutual",
    "Frame the SOW as 'for your review', not 'for you to sign'",
    "Maintain the peer dynamic through the close -- you are both evaluating",
    "Follow up within 72 hours. Longer signals disorganization.",
  ],
};

const RUBRIC_DIMENSIONS = [
  { dim: "Deal Caliber", weight: 25, desc: "Proven $50K+ TCV closing ability with strategic, multi-stakeholder deals" },
  { dim: "Self-Awareness", weight: 15, desc: "Intellectual honesty, loss analysis, and continuous improvement orientation" },
  { dim: "Market Presence", weight: 15, desc: "Client testimonials, public-facing portfolio, established as an independent professional" },
  { dim: "Strategic Execution", weight: 20, desc: "Ability to consume AI-generated intelligence and execute a consultative strategy" },
  { dim: "Integrity Under Pressure", weight: 10, desc: "Holds the line on compliance and reframes security as a trust accelerator" },
  { dim: "1099 Alignment", weight: 10, desc: "Genuinely prefers independent operation; sees Right to Substitute as a lever" },
  { dim: "Financial Sophistication", weight: 5, desc: "Models multi-pod economics; understands retainer + commission architecture" },
];

const OUTCOMES = [
  {
    score: "85-100",
    label: "Strong Advance",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    icon: CheckCircle2,
    action: "Send draft SOW within 72 hours. Begin DocuSign onboarding flow.",
  },
  {
    score: "70-84",
    label: "Conditional Advance",
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    icon: CircleDot,
    action: "Request additional portfolio evidence or a second scenario call. Revisit within 7 days.",
  },
  {
    score: "Below 70",
    label: "No Advance",
    color: "text-red-400",
    bg: "bg-red-500/20",
    icon: XCircle,
    action: "Respectful decline. Thank them for their time. Do not provide detailed feedback on deficiencies.",
  },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function Accordion({ title, icon: Icon, iconColor = "text-accent", badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass noise overflow-hidden rounded-2xl">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className={iconColor} />}
          <span className="font-semibold">{title}</span>
          {badge && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
              {badge}
            </span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-white/30" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-5 py-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FlagList({ items, type }) {
  const isGreen = type === "green";
  const Icon = isGreen ? ThumbsUp : ThumbsDown;
  const color = isGreen ? "text-emerald-400" : "text-red-400";
  const label = isGreen ? "Green Flags" : "Red Flags";
  return (
    <div>
      <div className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest ${color}`}>
        <Icon size={12} /> {label}
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-white/60">
            <span className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${isGreen ? "bg-emerald-400" : "bg-red-400"}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuestionBlock({ q }) {
  return (
    <Accordion title={q.question.slice(0, 80) + "..."} icon={MessageSquare} badge={q.rubricDimension}>
      {/* Full question */}
      <div className="mb-5">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">Ask</div>
        <p className="text-sm italic leading-relaxed text-white/80">"{q.question}"</p>
      </div>

      {/* Purpose */}
      <div className="mb-5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">Purpose</div>
        <p className="text-sm leading-relaxed text-white/60">{q.purpose}</p>
      </div>

      {/* Flags */}
      <div className="grid gap-5 md:grid-cols-2">
        <FlagList items={q.greenFlags} type="green" />
        <FlagList items={q.redFlags} type="red" />
      </div>
    </Accordion>
  );
}

function ScriptBlock({ label, script, notes }) {
  return (
    <div>
      <div className="mb-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">{label}</div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm italic leading-relaxed text-white/80">{script}</p>
        </div>
      </div>
      {notes && notes.length > 0 && (
        <div className="mt-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <AlertTriangle size={12} /> Legal Guardrails
          </div>
          <ul className="space-y-1.5">
            {notes.map((n) => (
              <li key={n} className="flex items-start gap-2 text-sm text-white/60">
                <Shield size={12} className="mt-0.5 shrink-0 text-amber-400/60" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// BQM Page
// ===========================================================================

export default function BQM() {
  return (
    <div className="relative overflow-x-hidden">
      {/* ── Ambient gradients ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-accent/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            {/* nav */}
            <motion.div variants={fadeUp} className="mb-8 flex items-center justify-between">
              <Link href="/">
                <button className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white">
                  <ArrowLeft size={14} /> Home
                </button>
              </Link>
              <Link
                href="/outreach"
                className="flex items-center gap-1.5 text-sm text-accent transition hover:text-white"
              >
                Outreach Templates <ChevronRight size={14} />
              </Link>
            </motion.div>

            {/* hero */}
            <motion.div variants={fadeUp} className="mb-12 text-center">
              <div className="mb-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                  <ClipboardCheck size={14} />
                  Internal Protocol
                </span>
              </div>
              <h1 className="mb-4 text-3xl font-extrabold md:text-5xl">
                <span className="gradient-text">Brief Qualifying Meeting</span>
              </h1>
              <p className="mx-auto max-w-2xl text-white/50">
                Peer-to-peer strategic verification protocol for Sovereign Professional candidates.
                25-minute structured session with objective scoring rubric.
              </p>
            </motion.div>

            {/* session overview bar */}
            <motion.div variants={fadeUp} className="glass noise mb-10 overflow-hidden rounded-2xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
                <Clock size={16} className="text-accent" />
                <span className="text-sm font-semibold">Session Structure</span>
                <span className="ml-auto text-xs text-white/40">Total: 25 minutes</span>
              </div>
              <div className="grid grid-cols-2 gap-px md:grid-cols-5">
                {SESSION_STRUCTURE.map((s) => (
                  <div key={s.phase} className="border-b border-white/5 p-4 md:border-b-0 md:border-r md:last:border-r-0">
                    <div className="text-lg font-bold text-accent">{s.time}</div>
                    <div className="text-sm font-semibold">{s.phase}</div>
                    <div className="text-[11px] text-white/40">{s.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* ══════════ PHASE 1: OPENING FRAME ══════════ */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="mb-4 mt-10 flex items-center gap-3">
              <Handshake size={20} className="text-accent" />
              <div>
                <h2 className="text-lg font-bold">Phase 1: Opening Frame</h2>
                <p className="text-xs text-white/40">Set the peer-to-peer context (2 min)</p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="glass noise rounded-2xl p-5">
              <p className="mb-4 text-sm leading-relaxed text-white/60">{OPENING_SCRIPT.context}</p>
              <ScriptBlock label="Opening Script" script={OPENING_SCRIPT.script} notes={OPENING_SCRIPT.legalNotes} />
            </motion.div>
          </motion.div>

          {/* ══════════ PHASE 2: PORTFOLIO REVIEW ══════════ */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="mb-4 mt-12 flex items-center gap-3">
              <FileText size={20} className="text-accent" />
              <div>
                <h2 className="text-lg font-bold">Phase 2: Portfolio Review</h2>
                <p className="text-xs text-white/40">Evidence-based deal analysis (8 min)</p>
              </div>
            </motion.div>

            <div className="space-y-3">
              {PORTFOLIO_QUESTIONS.map((q) => (
                <motion.div key={q.id} variants={fadeUp}>
                  <QuestionBlock q={q} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ══════════ PHASE 3: SCENARIO RESPONSE ══════════ */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="mb-4 mt-12 flex items-center gap-3">
              <Target size={20} className="text-accent" />
              <div>
                <h2 className="text-lg font-bold">Phase 3: Scenario Response</h2>
                <p className="text-xs text-white/40">Live strategic reasoning (8 min)</p>
              </div>
            </motion.div>

            <div className="space-y-3">
              {SCENARIO_QUESTIONS.map((q) => (
                <motion.div key={q.id} variants={fadeUp}>
                  <QuestionBlock q={q} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ══════════ PHASE 4: MODEL ALIGNMENT ══════════ */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="mb-4 mt-12 flex items-center gap-3">
              <Scale size={20} className="text-accent" />
              <div>
                <h2 className="text-lg font-bold">Phase 4: Model Alignment</h2>
                <p className="text-xs text-white/40">1099 structure and economics verification (5 min)</p>
              </div>
            </motion.div>

            <div className="space-y-3">
              {MODEL_ALIGNMENT.map((q) => (
                <motion.div key={q.id} variants={fadeUp}>
                  <QuestionBlock q={q} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ══════════ PHASE 5: CLOSE ══════════ */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="mb-4 mt-12 flex items-center gap-3">
              <BadgeCheck size={20} className="text-accent" />
              <div>
                <h2 className="text-lg font-bold">Phase 5: Mutual Evaluation Close</h2>
                <p className="text-xs text-white/40">Two-way fit assessment (2 min)</p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="glass noise rounded-2xl p-5">
              <ScriptBlock label="Closing Script" script={CLOSING_SCRIPT.script} notes={CLOSING_SCRIPT.legalNotes} />
            </motion.div>
          </motion.div>

          {/* ══════════ SCORING RUBRIC ══════════ */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="mb-4 mt-14 flex items-center gap-3">
              <Star size={20} className="text-accent" />
              <div>
                <h2 className="text-lg font-bold">Scoring Rubric</h2>
                <p className="text-xs text-white/40">Weighted objective evaluation across 7 dimensions</p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="glass noise overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-white/40">Dimension</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-white/40">Weight</th>
                      <th className="hidden px-5 py-3 text-xs font-semibold uppercase text-white/40 md:table-cell">Criteria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RUBRIC_DIMENSIONS.map((r) => (
                      <tr key={r.dim} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-semibold text-white">{r.dim}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-bold text-accent">
                            {r.weight}%
                          </span>
                        </td>
                        <td className="hidden px-5 py-3 text-white/50 md:table-cell">{r.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/10">
                      <td className="px-5 py-3 font-bold text-white">Total</td>
                      <td className="px-5 py-3 text-center font-bold text-accent">100%</td>
                      <td className="hidden px-5 py-3 md:table-cell" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </motion.div>

            {/* scoring guide */}
            <motion.div variants={fadeUp} className="mt-4 glass noise rounded-2xl p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Per-Dimension Scoring
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                {[
                  { score: "5", label: "Exceptional", desc: "Exceeds criteria; demonstrates mastery", color: "text-emerald-400", bg: "border-emerald-500/30" },
                  { score: "4", label: "Strong", desc: "Meets all criteria with evidence", color: "text-blue-400", bg: "border-blue-500/30" },
                  { score: "3", label: "Adequate", desc: "Meets minimum threshold", color: "text-amber-400", bg: "border-amber-500/30" },
                  { score: "1-2", label: "Below", desc: "Does not meet criteria", color: "text-red-400", bg: "border-red-500/30" },
                ].map((s) => (
                  <div key={s.score} className={`rounded-xl border ${s.bg} bg-white/[0.02] p-3 text-center`}>
                    <div className={`text-2xl font-extrabold ${s.color}`}>{s.score}</div>
                    <div className="text-xs font-semibold text-white/70">{s.label}</div>
                    <div className="mt-0.5 text-[10px] text-white/40">{s.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* ══════════ OUTCOME THRESHOLDS ══════════ */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="mb-4 mt-12 flex items-center gap-3">
              <Award size={20} className="text-accent" />
              <div>
                <h2 className="text-lg font-bold">Outcome Thresholds</h2>
                <p className="text-xs text-white/40">Post-BQM decision framework</p>
              </div>
            </motion.div>

            <div className="space-y-3">
              {OUTCOMES.map((o) => (
                <motion.div key={o.score} variants={fadeUp} className="glass noise overflow-hidden rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${o.bg}`}>
                      <o.icon size={20} className={o.color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${o.color}`}>{o.score}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.bg} ${o.color}`}>
                          {o.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-white/60">{o.action}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ══════════ LEGAL COMPLIANCE REMINDER ══════════ */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="mt-14"
          >
            <motion.div variants={fadeUp} className="glass noise overflow-hidden rounded-3xl border-amber-500/20 p-8 md:p-10">
              <div className="mb-4 flex items-center gap-3">
                <AlertTriangle size={20} className="text-amber-400" />
                <h3 className="text-lg font-bold text-amber-400">IC Compliance Checklist</h3>
              </div>
              <p className="mb-5 text-sm text-white/50">
                Every BQM must satisfy these constraints to maintain Sovereign Professional classification
                under the Department of Labor's economic reality test.
              </p>
              <ul className="space-y-3">
                {[
                  "Never discuss work schedules, required hours, or mandatory availability windows",
                  "Never reference reporting structures -- use 'interface with' instead of 'report to'",
                  "Emphasize deliverable-based outcomes, not time-based expectations",
                  "Highlight Right to Substitute in every conversation about engagement structure",
                  "Request evidence of other clients/engagements -- reinforces 'available to the general public' factor",
                  "Never use language: 'hire', 'employ', 'position', 'role', 'job', 'onboard' (use 'engage', 'partner', 'align')",
                  "The candidate must be free to set their own methods, tools, and processes",
                  "Do not provide equipment, office space, or company email addresses",
                ].map((rule) => (
                  <li key={rule} className="flex items-start gap-3 text-sm text-white/70">
                    <Shield size={14} className="mt-0.5 shrink-0 text-amber-400/60" />
                    {rule}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* footer */}
          <div className="mt-12 pb-8 text-center text-xs text-white/20">
            Referral Service LLC &middot; BQM Protocol v1.0 &middot; Internal Use Only
          </div>
        </div>
      </div>
    </div>
  );
}
