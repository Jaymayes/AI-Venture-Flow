import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Check,
  Target,
  Building2,
  Cpu,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Briefcase,
  Network,
  Rocket,
  Mail,
  Linkedin,
  Sparkles,
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
// Outreach Personas Data
// ---------------------------------------------------------------------------

const personas = [
  {
    id: "closer",
    icon: Target,
    accentColor: "text-emerald-400",
    accentBg: "bg-emerald-400",
    accentBorder: "border-emerald-400/30",
    accentGlow: "bg-emerald-500/20",
    label: "Profile 1",
    title: "The High-Ticket Closer",
    hook: "Eliminating the burden of prospecting",
    angle:
      "They are burning out on cold calls. We offer an environment where they only speak to leads already warmed up by our AI triage engine.",
    targetTraits: [
      "5+ years enterprise SaaS closing experience",
      "High-TCV deal cycles ($50K+ ACV)",
      "Frustrated with smile-and-dial prospecting ratio",
      "Looking for a tech-forward sales environment",
    ],
    channels: {
      linkedin: {
        subject: "Erasing the prospecting treadmill",
        body: `Hi [Name], I'm building out the Sovereign Professional network at Referral Service LLC and your background in high-TCV SaaS sales caught my eye. We've engineered an autonomous Clawbot unit that handles 100% of top-of-funnel prospecting. Our human partners only step in when a lead crosses an 85/100 intent threshold. You close; the AI does the hunting. If you're open to managing a digital pod on a 1099 retainer + commission basis, take a look at our architecture here: referralsvc.com/recruit. Let me know if you're open to a brief chat.`,
      },
      email: {
        subject: "Your pipeline, fully automated",
        body: `Hi [Name],

I'm Jamarr Mayes, CEO of Referral Service LLC. I'm reaching out because your track record in enterprise sales tells me you understand the cost of prospecting -- both in time and in deals that slip while you're dialing.

We've built something different. Our Clawbot Autonomous Unit handles 100% of top-of-funnel: lead capture, multi-channel nurturing, behavioral scoring. When a prospect's Intent Score crosses 85/100, you get a full Context Briefing and step in to close.

No cold calls. No pipeline building. Just high-intent conversations.

We're recruiting Sovereign Professionals on a 1099 basis:
- FMV Retainer: $2K-$6K/month
- Commission: 15-20% on Total Contract Value
- Right to Substitute: hire your own team to scale

Review our model: referralsvc.com/recruit

If you're open to a 15-minute call to walk through the architecture, I'd welcome the conversation.

Best,
Jamarr Mayes
CEO, Referral Service LLC`,
      },
    },
  },
  {
    id: "fractional",
    icon: Building2,
    accentColor: "text-blue-400",
    accentBg: "bg-blue-400",
    accentBorder: "border-blue-400/30",
    accentGlow: "bg-blue-500/20",
    label: "Profile 2",
    title: "The Fractional CRO / Agency Builder",
    hook: "The Right to Substitute and non-linear scaling",
    angle:
      "They want to build an agency but lack the technical infrastructure. We provide the AI; they provide the oversight and scale their own sub-contractor team.",
    targetTraits: [
      "Operating as a Fractional CRO or VP Sales",
      "Managing multiple client engagements simultaneously",
      "Entrepreneurial -- thinking in terms of leverage and systems",
      "Looking for scalable infrastructure they don't have to build",
    ],
    channels: {
      linkedin: {
        subject: "Scaling your fractional practice with autonomous pods",
        body: `Hi [Name], I see you're operating as a Fractional CRO. At Referral Service LLC, we partner with independent executives to manage our AI B2B Triage Engines for enterprise clients. We operate on deliverable-based SOWs with a 'Right to Substitute' clause, meaning you can hire your own team to manage multiple pods under our infrastructure. We offer fixed FMV retainers ($2K-$6K) plus 15-20% on TCV. If you're looking to scale your practice without the tech overhead, check out our model: referralsvc.com/recruit.`,
      },
      email: {
        subject: "Scale your practice without building the tech",
        body: `Hi [Name],

I'm Jamarr Mayes, CEO of Referral Service LLC. I came across your fractional CRO practice and wanted to share something that may complement what you're building.

We've engineered autonomous AI Triage Engines that handle full top-of-funnel for enterprise B2B -- prospecting, qualification, intent scoring, and nurturing. We're partnering with independent executives like you to provide the strategic human layer.

What makes our model different:

1. Right to Substitute -- you can hire sub-contractors to manage additional pods. This means you can scale from one engagement to many without scaling your personal hours.

2. Deliverable-based SOWs -- no behavioral control. You run your business your way.

3. Dual compensation -- FMV retainer ($2K-$6K/mo) for strategic oversight, plus 15-20% commission on Total Contract Value.

We handle the infrastructure, the AI, and the pipeline. You handle the relationships and deal architecture.

Full model: referralsvc.com/recruit

Worth a 15-minute call to explore?

Best,
Jamarr Mayes
CEO, Referral Service LLC`,
      },
    },
  },
  {
    id: "ai-native",
    icon: Cpu,
    accentColor: "text-purple-400",
    accentBg: "bg-purple-400",
    accentBorder: "border-purple-400/30",
    accentGlow: "bg-purple-500/20",
    label: "Profile 3",
    title: "The AI-Native Strategist",
    hook: "Next-generation architecture and Secure by Design infrastructure",
    angle:
      "They follow the transition from linear chains to agentic loops and understand the value of secure edge deployments. Target those engaging with AI-native communities.",
    targetTraits: [
      "Engaged with agentic AI frameworks and LLM orchestration",
      "Understands the difference between wrappers and real architecture",
      "Active in AI-native communities and technical discourse",
      "Wants to monetize deep AI knowledge on their own terms",
    ],
    channels: {
      linkedin: {
        subject: "Beyond wrappers: Edge-native B2B triage",
        body: `Hi [Name], I noticed your recent engagement around agentic AI frameworks. We've just deployed the Clawbot Autonomous Unit at Referral Service LLC -- running Llama 3.1 8B on edge hardware with strict Execution Approval Mode to mitigate RCE risks. We are currently recruiting Sovereign Professionals to provide the strategic human wrapper for these pods on enterprise deals. If you understand the mechanics of AI-driven sales and want to monetize that knowledge on a 1099 basis, review our tech stack and compensation model here: referralsvc.com/recruit.`,
      },
      email: {
        subject: "Monetize your AI expertise -- edge-native infrastructure",
        body: `Hi [Name],

I'm Jamarr Mayes, CEO of Referral Service LLC. I've been following your work around agentic AI and wanted to share what we've built.

Our Clawbot Autonomous Unit isn't another LLM wrapper. The architecture:

- Llama 3.1 8B running on Cloudflare Workers AI at the edge (zero-egress)
- LangGraph-style orchestration with DraftNode/ReviewNode loops
- Execution Approval Mode -- every autonomous action requires human sign-off
- Cisco Skill Scanner vetting for all agent capabilities
- FinOps 2.0 telemetry with real-time gross margin tracking

We're recruiting Sovereign Professionals who understand this stack to provide the strategic human layer on enterprise deals. You'd manage a pod's triage engine, handle high-intent escalations (85/100+ threshold), and close.

1099 basis. FMV retainer ($2K-$6K/mo) + 15-20% commission on TCV. Full Right to Substitute if you want to scale a team.

Architecture and compensation details: referralsvc.com/recruit

If this resonates, I'd welcome a call to walk through the technical stack.

Best,
Jamarr Mayes
CEO, Referral Service LLC`,
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Copy-to-clipboard button
// ---------------------------------------------------------------------------

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        copied
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
      }`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Expandable Template Card
// ---------------------------------------------------------------------------

function TemplateCard({ channel, icon: Icon, label, subject, body, accentColor }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass noise overflow-hidden rounded-2xl">
      {/* header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={accentColor} />
          <div>
            <div className="text-sm font-semibold">{label}</div>
            <div className="text-xs text-white/40">Subject: {subject}</div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} className="text-white/30" />
        </motion.div>
      </button>

      {/* body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  Template
                </span>
                <CopyButton text={`Subject: ${subject}\n\n${body}`} />
              </div>
              <pre className="whitespace-pre-wrap font-[Inter] text-sm leading-relaxed text-white/70">
                {body}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Persona Section
// ---------------------------------------------------------------------------

function PersonaSection({ persona }) {
  const p = persona;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={stagger}
      className="mb-16 last:mb-0"
    >
      {/* persona header */}
      <motion.div variants={fadeUp} className="mb-6 flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${p.accentGlow}`}>
          <p.icon size={28} className={p.accentColor} />
        </div>
        <div>
          <span className={`text-xs font-semibold uppercase tracking-widest ${p.accentColor}`}>
            {p.label}
          </span>
          <h2 className="text-2xl font-bold md:text-3xl">{p.title}</h2>
          <p className="mt-1 text-sm text-white/50">
            <span className="font-semibold text-white/70">Hook:</span> {p.hook}
          </p>
        </div>
      </motion.div>

      {/* angle + traits row */}
      <motion.div variants={fadeUp} className="mb-6 grid gap-5 md:grid-cols-2">
        {/* angle */}
        <div className="glass noise rounded-2xl p-5">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Angle
          </div>
          <p className="text-sm leading-relaxed text-white/60">{p.angle}</p>
        </div>

        {/* target traits */}
        <div className="glass noise rounded-2xl p-5">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Target Traits
          </div>
          <ul className="space-y-2">
            {p.targetTraits.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-white/60">
                <UserCheck size={14} className={`mt-0.5 shrink-0 ${p.accentColor}`} />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* templates */}
      <motion.div variants={fadeUp} className="space-y-3">
        <TemplateCard
          channel="linkedin"
          icon={Linkedin}
          label="LinkedIn Connection Note"
          subject={p.channels.linkedin.subject}
          body={p.channels.linkedin.body}
          accentColor={p.accentColor}
        />
        <TemplateCard
          channel="email"
          icon={Mail}
          label="Email Outreach"
          subject={p.channels.email.subject}
          body={p.channels.email.body}
          accentColor={p.accentColor}
        />
      </motion.div>
    </motion.div>
  );
}

// ===========================================================================
// Outreach Page
// ===========================================================================

export default function Outreach() {
  return (
    <div className="relative overflow-x-hidden">
      {/* ── Ambient gradients ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-accent/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      {/* ══════════ HEADER ══════════ */}
      <div className="relative z-10 px-6 py-8 md:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="mb-8 flex items-center justify-between">
              <Link href="/">
                <button className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white">
                  <ArrowLeft size={14} /> Home
                </button>
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  href="/bqm"
                  className="flex items-center gap-1.5 text-sm text-primary transition hover:text-white"
                >
                  BQM Protocol <ChevronRight size={14} />
                </Link>
                <Link
                  href="/recruit"
                  className="flex items-center gap-1.5 text-sm text-accent transition hover:text-white"
                >
                  Public page <ChevronRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* hero */}
            <motion.div variants={fadeUp} className="mb-12 text-center">
              <div className="mb-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                  <Briefcase size={14} />
                  Internal Playbook
                </span>
              </div>
              <h1 className="mb-4 text-3xl font-extrabold md:text-5xl">
                <span className="gradient-text">SP Recruitment</span> Outreach
              </h1>
              <p className="mx-auto max-w-2xl text-white/50">
                Peer-to-peer outreach templates for recruiting Sovereign Professionals.
                Three target personas, each with LinkedIn and email copy. Click to expand, copy, and personalize.
              </p>
            </motion.div>

            {/* strategy bar */}
            <motion.div
              variants={fadeUp}
              className="glass noise mb-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl md:grid-cols-3"
            >
              {[
                {
                  icon: Sparkles,
                  label: "Tone",
                  value: "Peer-to-peer, CEO-to-executive",
                },
                {
                  icon: Rocket,
                  label: "Offer",
                  value: "1099 retainer + commission, not a W-2 job",
                },
                {
                  icon: Network,
                  label: "Differentiator",
                  value: "Autonomous AI pipeline + Right to Substitute",
                },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 border-b border-white/5 p-4 md:border-b-0 md:border-r md:last:border-r-0">
                  <s.icon size={18} className="shrink-0 text-accent" />
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{s.label}</div>
                    <div className="text-sm text-white/70">{s.value}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ══════════ PERSONAS ══════════ */}
          {personas.map((p) => (
            <PersonaSection key={p.id} persona={p} />
          ))}

          {/* ══════════ USAGE NOTES ══════════ */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="mt-16"
          >
            <motion.div variants={fadeUp} className="glass noise overflow-hidden rounded-3xl p-8 md:p-10">
              <h3 className="mb-4 text-lg font-bold">Deployment Notes</h3>
              <ul className="space-y-3">
                {[
                  "Always personalize the [Name] placeholder and reference a specific detail from their profile or content.",
                  "LinkedIn connection notes have a 300-character limit. The templates above are sized for InMail. For connection requests, use the first 2 sentences only.",
                  "Email templates are designed for cold outreach. Adjust the opening line if you have a warm introduction or mutual connection.",
                  "The referralsvc.com/recruit link should be replaced with your actual deployed URL when the domain is configured.",
                  "All templates position the opportunity as a peer-to-peer business arrangement, not an employment offer. Maintain this framing in follow-ups.",
                  "Follow up once at Day 3 and once at Day 7. If no response after two follow-ups, move to the next candidate.",
                ].map((note) => (
                  <li key={note} className="flex items-start gap-3 text-sm text-white/60">
                    <Check size={14} className="mt-0.5 shrink-0 text-accent" />
                    {note}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* footer spacer */}
          <div className="mt-12 pb-8 text-center text-xs text-white/20">
            Referral Service LLC &middot; SP Recruitment Playbook &middot; Internal Use
          </div>
        </div>
      </div>
    </div>
  );
}
