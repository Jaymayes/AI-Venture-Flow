import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Target,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  Check,
  Crosshair,
  TrendingUp,
  Users,
  Scale,
  ScanSearch,
  Cpu,
  Bot,
  Rocket,
  Award,
  Briefcase,
  HandCoins,
  Network,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Animation Variants (match Landing.jsx exactly)
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
// Data
// ---------------------------------------------------------------------------

const painPoints = [
  { stat: "70%", label: "Time spent hunting", sub: "instead of closing" },
  { stat: "85+", label: "Intent Score threshold", sub: "before you engage" },
  { stat: "0%", label: "Cold outreach", sub: "on your plate" },
];

const howItWorks = [
  {
    icon: Bot,
    step: "01",
    title: "Triage Engine Qualifies",
    desc: "Our autonomous AI SDR handles 100% of top-of-funnel: inbound lead capture, multi-channel outreach, intent scoring, and behavioral analysis. Prospects are nurtured until ready.",
  },
  {
    icon: Crosshair,
    step: "02",
    title: "Intent Threshold Triggers",
    desc: "When a prospect's composite Intent Score crosses 85/100, the engine escalates automatically. You receive a full Context Briefing -- company profile, pain points, communication history, and recommended approach.",
  },
  {
    icon: Target,
    step: "03",
    title: "You Close the Deal",
    desc: "Step into conversations with qualified, high-intent prospects who are ready to buy. You focus on what you do best -- architecting the deal structure, handling objections, and getting ink on paper.",
  },
];

const compTerms = [
  {
    icon: HandCoins,
    label: "FMV Service Retainer",
    value: "$2K - $6K",
    period: "/mo",
    desc: "Fair Market Value retainer for strategic oversight, pod management, and executive relationship maintenance.",
    features: [
      "Guaranteed monthly income",
      "Scales with pod count",
      "Paid on the 1st and 15th",
      "Independent of deal flow",
    ],
  },
  {
    icon: TrendingUp,
    label: "Commission on TCV",
    value: "15 - 20%",
    period: "per deal",
    desc: "Performance commission calculated on Total Contract Value. Includes AI Salary + Hiring Fees across the full engagement lifecycle.",
    features: [
      "Paid on contract execution",
      "Recurring revenue upside",
      "Multi-year TCV compounds",
      "No commission caps",
    ],
  },
];

const differentiators = [
  {
    icon: ShieldCheck,
    title: "Execution Approval Mode",
    desc: "Every autonomous action requires explicit human approval before execution. Your clients see an enterprise-grade system with built-in governance, not an unmonitored chatbot.",
    tag: "Governance",
  },
  {
    icon: ScanSearch,
    title: "Cisco Skill Scanner Vetting",
    desc: "All AI agent capabilities are scanned and validated against an enterprise security framework. Every skill the engine deploys has been vetted for safety, compliance, and data handling.",
    tag: "Security",
  },
  {
    icon: Cpu,
    title: "Zero-Egress Edge Architecture",
    desc: "AI inference runs on Cloudflare Workers AI at the edge. Client data never leaves the network perimeter. No third-party API calls for core operations -- purpose-built for regulated industries.",
    tag: "Infrastructure",
  },
];

const idealCandidate = [
  "5+ years B2B enterprise closing experience",
  "Proven track record in $50K+ ACV deal cycles",
  "Experience with consultative, solution-based selling",
  "Comfortable operating as a 1099 Sovereign Professional",
  "Entrepreneurial mindset -- you think in terms of leverage",
  "Strong executive presence for C-suite conversations",
];

const rightToSubstitute = [
  {
    icon: Users,
    title: "Build Your Own Team",
    desc: "Under the Right to Substitute clause, you can hire sub-contractors to manage additional pods. Scale from one deal at a time to an entire agency within our ecosystem.",
  },
  {
    icon: Network,
    title: "Multi-Pod Operations",
    desc: "Each pod runs its own Triage Engine. As a Sovereign Professional, you manage the pods; your sub-closers handle escalations. Your retainer scales with each pod you operate.",
  },
  {
    icon: Scale,
    title: "True 1099 Independence",
    desc: "You set your own hours, choose your tools, and run your business your way. Our SOW is structured to ensure genuine independent contractor classification -- no behavioral control.",
  },
];

// ===========================================================================
// Recruit Page Component
// ===========================================================================

export default function Recruit() {
  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const openApplyChat = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("openChat", { detail: { intent: "apply_deal_architect" } })
    );
  };

  return (
    <div className="relative overflow-x-hidden">
      {/* ── Ambient gradients ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-accent/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      {/* ══════════ NAV ══════════ */}
      <nav className="glass noise sticky top-0 z-50 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Referral&nbsp;Service&nbsp;LLC
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <button onClick={() => scrollTo("how")} className="text-sm text-white/70 transition hover:text-white">
              How It Works
            </button>
            <button onClick={() => scrollTo("comp")} className="text-sm text-white/70 transition hover:text-white">
              Compensation
            </button>
            <button onClick={() => scrollTo("trust")} className="text-sm text-white/70 transition hover:text-white">
              Enterprise Trust
            </button>
            <button
              type="button"
              onClick={openApplyChat}
              className="rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Apply now
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="relative z-10 flex min-h-[85vh] items-center justify-center px-6 text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="mx-auto max-w-3xl">
          {/* back */}
          <motion.div variants={fadeUp} custom={0} className="mb-6 flex justify-center">
            <Link href="/">
              <button className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white">
                <ArrowLeft size={14} /> Back to home
              </button>
            </Link>
          </motion.div>

          {/* badge */}
          <motion.div variants={fadeUp} custom={0} className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
              <Rocket size={14} />
              Now Recruiting Deal Architects
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl"
          >
            Stop Prospecting.
            <br />
            <span className="gradient-text">Start Closing.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mx-auto mb-10 max-w-2xl text-lg text-white/60 md:text-xl"
          >
            Our AI Triage Engine handles 100% of top-of-funnel prospecting, qualification,
            and intent scoring. You step in only when a prospect is ready to buy.
            No cold calls. No smile-and-dial. Just high-intent closings.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={openApplyChat}
              className="rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-semibold text-black transition hover:opacity-90"
            >
              Apply now
            </button>
            <button
              onClick={() => scrollTo("how")}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              See how it works <ChevronRight size={16} />
            </button>
          </motion.div>

          {/* pain-point stats */}
          <motion.div
            variants={fadeUp}
            custom={4}
            className="mx-auto mt-16 flex max-w-lg flex-wrap justify-center gap-10"
          >
            {painPoints.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-white">{s.stat}</div>
                <div className="text-xs text-white/50">{s.label}</div>
                <div className="text-[10px] text-white/30">{s.sub}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="mb-14 text-center"
          >
            <motion.span variants={fadeUp} className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-accent">
              The Model
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold md:text-4xl">
              AI Does the Grunt Work. You Architect the Deal.
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-white/50">
              Three steps from lead capture to closed revenue.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-3"
          >
            {howItWorks.map((h) => (
              <motion.div
                key={h.step}
                variants={fadeUp}
                className="glass noise relative overflow-hidden rounded-2xl p-6 transition hover:border-white/20"
              >
                {/* step badge */}
                <div className="absolute right-4 top-4 text-5xl font-extrabold text-white/[0.04]">
                  {h.step}
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <h.icon size={24} className="text-accent" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{h.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{h.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ COMPENSATION ══════════ */}
      <section id="comp" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="mb-14 text-center"
          >
            <motion.span variants={fadeUp} className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-accent">
              Compensation
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold md:text-4xl">
              Dual-Income Architecture
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-white/50">
              Guaranteed retainer for stability. Uncapped commission for upside.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-2"
          >
            {compTerms.map((c) => (
              <motion.div
                key={c.label}
                variants={fadeUp}
                className="glass noise relative overflow-hidden rounded-2xl p-8"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                    <c.icon size={20} className="text-accent" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                    {c.label}
                  </span>
                </div>
                <div className="mb-1 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{c.value}</span>
                  <span className="text-sm text-white/40">{c.period}</span>
                </div>
                <p className="mb-6 text-sm text-white/50">{c.desc}</p>
                <ul className="space-y-3">
                  {c.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                      <Check size={16} className="shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ SCALABILITY: RIGHT TO SUBSTITUTE ══════════ */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="mb-14 text-center"
          >
            <motion.span variants={fadeUp} className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-accent">
              Scalability
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold md:text-4xl">
              Build an Agency Inside <span className="gradient-text">Our Ecosystem</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 max-w-2xl mx-auto text-white/50">
              As a 1099 Sovereign Professional, you hold the Right to Substitute.
              Hire your own sub-contractors, manage multiple pods, and scale your earnings
              without scaling your personal hours.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-3"
          >
            {rightToSubstitute.map((r) => (
              <motion.div
                key={r.title}
                variants={fadeUp}
                className="glass noise relative overflow-hidden rounded-2xl p-6 transition hover:border-white/20"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <r.icon size={24} className="text-accent" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{r.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{r.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ ENTERPRISE TRUST ══════════ */}
      <section id="trust" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="mb-14 text-center"
          >
            <motion.span variants={fadeUp} className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-accent">
              Enterprise Trust
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold md:text-4xl">
              Secure by Design
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-white/50">
              Enterprise closers need enterprise-grade infrastructure. This is not a fragile wrapper.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-3"
          >
            {differentiators.map((d) => (
              <motion.div
                key={d.title}
                variants={fadeUp}
                className="glass noise relative overflow-hidden rounded-2xl p-6 transition hover:border-white/20"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                    <d.icon size={24} className="text-primary" />
                  </div>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {d.tag}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold">{d.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{d.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ IDEAL CANDIDATE ══════════ */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="glass noise overflow-hidden rounded-3xl p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <Award size={20} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Ideal Candidate</h2>
                  <p className="text-xs text-white/40">What we look for in a Deal Architect</p>
                </div>
              </div>

              <ul className="space-y-4">
                {idealCandidate.map((q) => (
                  <motion.li
                    key={q}
                    variants={fadeUp}
                    className="flex items-start gap-3 text-white/70"
                  >
                    <Check size={18} className="mt-0.5 shrink-0 text-accent" />
                    <span className="text-sm leading-relaxed">{q}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="relative z-10 px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="glass noise mx-auto max-w-4xl overflow-hidden rounded-3xl p-12 text-center md:p-16"
        >
          <motion.div variants={fadeUp}>
            <Briefcase size={32} className="mx-auto mb-4 text-accent" />
          </motion.div>
          <motion.h2 variants={fadeUp} className="mb-4 text-3xl font-bold md:text-4xl">
            Ready to <span className="gradient-text">Close, Not Chase?</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mb-8 max-w-lg text-white/50">
            Join a venture studio where AI handles the pipeline and you handle the relationships.
            Retainer + commission. 1099 independence. No cold calls, ever.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={openApplyChat}
              className="rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-semibold text-black transition hover:opacity-90"
            >
              Apply now
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Learn about the platform <ChevronRight size={16} />
            </Link>
          </motion.div>
        </motion.div>
      </section>

    </div>
  );
}
