import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Shield,
  Zap,
  Phone,
  BookOpen,
  Users,
  Check,
  CheckCircle,
  Clock,
  Globe,
  Lock,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Send,
  Loader2,
  Cpu,
  TrendingUp,
  Smartphone,
  Brain,
  CreditCard,
  Banknote,
  ArrowRight,
  Database,
} from "lucide-react";
import { submitIntakeLead } from "../lib/triage-client";
import LeadMagnet from "../components/LeadMagnet";

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

/* ── data ── */
const modules = [
  {
    icon: Phone,
    title: "Digital SDR",
    desc: "AI-powered sales development representative that qualifies leads, books meetings, and nurtures prospects 24/7 with human-like conversations.",
    tags: ["Lead Qualification", "Meeting Booking", "Follow-up"],
  },
  {
    icon: Users,
    title: "Digital Support",
    desc: "Intelligent customer support agent that resolves tickets, escalates complex issues, and maintains brand voice across every channel.",
    tags: ["Ticket Resolution", "Escalation", "Multi-channel"],
  },
  {
    icon: BookOpen,
    title: "Knowledge Ops",
    desc: "Enterprise knowledge management that indexes, summarizes, and retrieves information instantly from your entire document ecosystem.",
    tags: ["Document Indexing", "Smart Search", "Summarization"],
  },
];

const antiZapierItems = [
  {
    icon: Zap,
    title: "Kill the Middleware",
    desc: "Stop paying $2,000/month for fragile Zapier chains that break every time your CRM updates. Our unified engine eliminates the middleware tax entirely.",
    tags: ["No Zapier", "No Webhooks", "No Breakage"],
  },
  {
    icon: Cpu,
    title: "One Unified Engine",
    desc: "CRM, billing, partner payouts, and AI sales development — all executing in one platform. No more reconciling five different SaaS tools.",
    tags: ["Single Platform", "Closed Loop", "Real-time"],
  },
  {
    icon: TrendingUp,
    title: "Zero Overhead Scale",
    desc: "Infinite scalability without infrastructure overhead. No servers to manage, no ops hires, no per-seat charges. Deploy in days, not months.",
    tags: ["Edge-Native", "Pay-as-You-Go", "Instant Deploy"],
  },
];

const financialLoopSteps = [
  {
    icon: Smartphone,
    label: "DBC Lead Capture",
    desc: "Prospect scans your Digital Business Card",
  },
  {
    icon: Brain,
    label: "AI Deal Room",
    desc: "AI qualifies, drafts proposals, and manages the deal",
  },
  {
    icon: CreditCard,
    label: "Stripe Checkout",
    desc: "Seamless payment collection with automated invoicing",
  },
  {
    icon: Banknote,
    label: "1-Click Payout",
    desc: "Partner commissions calculated and disbursed instantly",
  },
];

const pricingItems = [
  {
    label: "AI Salary",
    value: "$2,500",
    period: "/mo",
    desc: "Flat monthly fee per deployed AI Digital Employee. No per-seat charges.",
    features: [
      "Unlimited conversations",
      "All integrations included",
      "Custom personality tuning",
      "24/7 availability",
    ],
  },
  {
    label: "Hiring Fee",
    value: "$5,000",
    period: "one-time",
    desc: "One-time onboarding, training, and deployment fee per AI employee module.",
    features: [
      "Custom workflow design",
      "Brand voice training",
      "Integration setup",
      "30-day optimization",
    ],
  },
];

const complianceItems = [
  {
    icon: Shield,
    title: "AI Disclosure & Labeling",
    desc: "All AI interactions clearly labeled. We comply with emerging AI transparency regulations and FTC disclosure requirements.",
  },
  {
    icon: Lock,
    title: "Security Posture",
    desc: "SOC 2 Type II aligned practices. Data encrypted at rest and in transit. Regular penetration testing and vulnerability scanning.",
  },
  {
    icon: Globe,
    title: "Regulated Workflows",
    desc: "Built-in guardrails for regulated industries. Human-in-the-loop escalation for sensitive decisions. Full audit trail.",
  },
];

const navLinks = ["Audit", "Modules", "How It Works", "Pricing", "Compliance", "Incubator"];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", company: "", title: "", context: "", phone: "", smsConsent: false });
  const [formStatus, setFormStatus] = useState("idle"); // idle | loading | success | error

  const scrollTo = (id) => {
    const target = id.replace(/\s+/g, "").toLowerCase();
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setFormStatus("loading");
    try {
      await submitIntakeLead({
        prospect_name: leadForm.name,
        prospect_email: leadForm.email,
        company_name: leadForm.company,
        title: leadForm.title || undefined,
        message: leadForm.context || undefined,
        phone: leadForm.phone || undefined,
        sms_consent: leadForm.smsConsent,
      });
      setFormStatus("success");
    } catch (err) {
      console.error("[LeadCapture] Submit failed:", err);
      setFormStatus("error");
    }
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

          {/* desktop links */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((l) => (
              l === 'Incubator' ? (
                <a key={l} href="/portal/incubator/apply" className="text-sm font-semibold text-orange-400 transition hover:text-orange-300">
                  {l}
                </a>
              ) : (
                <button
                  key={l}
                  onClick={() => scrollTo(l.toLowerCase())}
                  className="text-sm text-white/70 transition hover:text-white"
                >
                  {l}
                </button>
              )
            ))}
            <Link
              href="/dashboard"
              className="text-sm text-white/70 transition hover:text-white"
            >
              Dashboard
            </Link>

            {/* ── CEO Protected Pages ── */}
            <div className="flex items-center gap-1 pl-2 border-l border-white/10">
              <Lock size={12} className="text-white/20" />
            </div>
            {/* ── CEO / SP Dropdown ── */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 transition hover:text-white">
                <Shield size={14} /> CEO / SP <ChevronDown size={12} className="opacity-50" />
              </button>
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute right-0 top-full pt-2 transition-all duration-150 z-50">
                <div className="glass noise rounded-xl border border-white/10 py-2 min-w-[200px] shadow-xl">
                  <Link
                    href="/ceo"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Shield size={14} className="text-emerald-400" /> CEO Dashboard
                  </Link>
                  <Link
                    href="/partner"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Users size={14} className="text-emerald-400/70" /> SP Command Center
                  </Link>
                  <Link
                    href="/crm"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Database size={14} className="text-cyan-400" /> CRM Portal
                  </Link>
                  <div className="border-t border-white/5 my-1" />
                  <Link
                    href="/playbook"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <BookOpen size={14} className="text-amber-400" /> Sovereign Playbook
                  </Link>
                  <Link
                    href="/recruit"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Zap size={14} className="text-accent" /> Hiring
                  </Link>
                </div>
              </div>
            </div>
            <button
              onClick={() => scrollTo("modules")}
              className="rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Explore services
            </button>
          </div>

          {/* mobile hamburger */}
          <button
            className="text-white md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* mobile menu */}
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 px-6 pb-4 md:hidden"
          >
            {navLinks.map((l) => (
              l === 'Incubator' ? (
                <a key={l} href="/portal/incubator/apply" className="block w-full py-3 text-left text-sm font-semibold text-orange-400 hover:text-orange-300">
                  {l}
                </a>
              ) : (
                <button
                  key={l}
                  onClick={() => scrollTo(l.toLowerCase())}
                  className="block w-full py-3 text-left text-sm text-white/70 hover:text-white"
                >
                  {l}
                </button>
              )
            ))}
            <Link
              href="/dashboard"
              className="block w-full py-3 text-left text-sm text-white/70 hover:text-white"
            >
              Dashboard
            </Link>
            <div className="border-t border-white/10 mt-2 pt-2">
              <p className="text-[10px] uppercase tracking-widest text-white/20 px-1 pt-2 pb-1">Command Center</p>
              <Link
                href="/ceo"
                className="flex items-center gap-2 w-full py-3 text-left text-sm font-semibold text-emerald-400 hover:text-white"
              >
                <Shield size={14} /> CEO Dashboard
              </Link>
              <Link
                href="/partner"
                className="flex items-center gap-2 w-full py-3 text-left text-sm font-semibold text-emerald-400/70 hover:text-white"
              >
                <Users size={14} /> SP Command Center
              </Link>
              <Link
                href="/playbook"
                className="flex items-center gap-2 w-full py-3 text-left text-sm font-semibold text-amber-400 hover:text-white"
              >
                <BookOpen size={14} /> Sovereign Playbook
              </Link>
              <Link
                href="/recruit"
                className="flex items-center gap-2 w-full py-3 text-left text-sm font-semibold text-accent hover:text-white"
              >
                <Zap size={14} /> Hiring
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="relative z-10 flex min-h-[85vh] items-center justify-center px-6 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mx-auto max-w-3xl"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/60">
              <Zap size={14} className="text-accent" />
              Zero-Marginal-Cost Intelligence
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="gradient-text mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl"
          >
            Autonomous SaaS
            <br />
            Affiliate Swarm
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mx-auto mb-10 max-w-xl text-lg text-white/60 md:text-xl"
          >
            Compliant, AI-generated SaaS recommendations that earn high-ticket
            recurring commissions -- published at the edge, gated by deterministic
            compliance. Zero inventory, zero marginal cost.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => scrollTo("audit")}
              className="rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-semibold text-black transition hover:opacity-90"
            >
              See Live SaaS Picks
            </button>
            <button
              onClick={() => scrollTo("modules")}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Explore services <ChevronRight size={16} />
            </button>
            <a
              href="/portal/incubator/apply"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3 font-semibold text-white transition hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20"
            >
              Apply to Incubator
            </a>
          </motion.div>

          {/* floating stats */}
          <motion.div
            variants={fadeUp}
            custom={4}
            className="mx-auto mt-16 flex max-w-lg flex-wrap justify-center gap-8"
          >
            {[
              { value: "3", label: "AI Modules" },
              { value: "24/7", label: "Availability" },
              { value: "<7d", label: "Deployment" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/40">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════ LEAD MAGNET — FREE SAAS TEARDOWN ══════════ */}
      <LeadMagnet />

      {/* ══════════ MODULES ══════════ */}
      <section id="modules" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="mb-14 text-center"
          >
            <motion.span
              variants={fadeUp}
              className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-accent"
            >
              Modules
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold md:text-4xl"
            >
              AI Digital Employees
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-white/50">
              Composable workforce modules ready to deploy into your business.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-3"
          >
            {modules.map((m) => (
              <motion.div
                key={m.title}
                variants={fadeUp}
                className="glass noise relative overflow-hidden rounded-2xl p-6 transition hover:border-white/20"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <m.icon size={24} className="text-accent" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{m.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-white/60">
                  {m.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {m.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS — ANTI-ZAPIER ══════════ */}
      <section id="howitworks" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="mb-14 text-center"
          >
            <motion.span
              variants={fadeUp}
              className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-accent"
            >
              Why Us
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold md:text-4xl"
            >
              Your Agency Stack Is{" "}
              <span className="gradient-text">Broken</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-white/50 max-w-2xl mx-auto">
              Traditional agencies bolt together isolated SaaS tools using fragile webhooks and Zapier.
              We replaced the entire stack with one unified engine.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-3"
          >
            {antiZapierItems.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="glass noise relative overflow-hidden rounded-2xl p-6 transition hover:border-white/20"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <item.icon size={24} className="text-accent" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-white/60">
                  {item.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ THE FINANCIAL LOOP ══════════ */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="mb-14 text-center"
          >
            <motion.span
              variants={fadeUp}
              className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-accent"
            >
              The Loop
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold md:text-4xl"
            >
              From Lead to Paid in{" "}
              <span className="gradient-text">Zero Clicks</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-white/50 max-w-2xl mx-auto">
              We completely closed the financial loop. When a partner brings you a lead,
              our AI qualifies them, collects payment, and calculates the commission dynamically.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="glass noise rounded-2xl p-8 md:p-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-0 items-center">
              {financialLoopSteps.map((step, i) => (
                <motion.div key={step.label} variants={fadeUp} className="contents">
                  {/* Step */}
                  <div className="flex flex-col items-center text-center md:col-span-1">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl mb-3 shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, rgba(109,92,255,0.2), rgba(0,229,160,0.2))`,
                        border: `1px solid rgba(109,92,255,0.3)`,
                      }}
                    >
                      <step.icon size={28} className="text-accent" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{step.label}</h4>
                    <p className="text-[11px] text-white/40 leading-snug max-w-[140px]">
                      {step.desc}
                    </p>
                  </div>

                  {/* Arrow connector (hidden on mobile, hidden after last step) */}
                  {i < financialLoopSteps.length - 1 && (
                    <div className="hidden md:flex md:col-span-1 items-center justify-center">
                      <ChevronRight size={24} className="text-accent/50" />
                    </div>
                  )}

                  {/* Mobile arrow (visible only on mobile, hidden after last step) */}
                  {i < financialLoopSteps.length - 1 && (
                    <div className="flex md:hidden items-center justify-center py-1">
                      <ArrowRight size={18} className="text-accent/40 rotate-90" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ JOIN THE PARTNER FLEET CTA ══════════ */}
      <section className="relative z-10 px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div variants={fadeUp}>
            <Users size={40} className="mx-auto mb-4 text-accent" />
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold md:text-4xl mb-4">
            Scale Without the{" "}
            <span className="gradient-text">Overhead</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/50 mb-8 max-w-lg mx-auto">
            Join our partner fleet and hand out Digital Business Cards that convert.
            Or let us power your agency's entire backend — from lead capture to payout.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/recruit"
              className="rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-semibold text-black transition hover:opacity-90"
            >
              Join the Partner Fleet
            </Link>
            <Link
              href="/c/jamarr"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              See It Live <ChevronRight size={16} />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════ PRICING ══════════ */}
      <section id="pricing" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="mb-14 text-center"
          >
            <motion.span
              variants={fadeUp}
              className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-accent"
            >
              Pricing
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold md:text-4xl"
            >
              Hybrid Pricing
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-white/50">
              Simple, transparent pricing. AI Salary + one-time Hiring Fee.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-2"
          >
            {pricingItems.map((p) => (
              <motion.div
                key={p.label}
                variants={fadeUp}
                className="glass noise relative overflow-hidden rounded-2xl p-8"
              >
                <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-accent">
                  {p.label}
                </span>
                <div className="mb-1 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{p.value}</span>
                  <span className="text-sm text-white/40">{p.period}</span>
                </div>
                <p className="mb-6 text-sm text-white/50">{p.desc}</p>
                <ul className="space-y-3">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-3 text-sm text-white/70"
                    >
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

      {/* ══════════ COMPLIANCE ══════════ */}
      <section id="compliance" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="mb-14 text-center"
          >
            <motion.span
              variants={fadeUp}
              className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-accent"
            >
              Compliance Notes
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold md:text-4xl"
            >
              Built for Trust
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-white/50">
              Enterprise-grade compliance and security baked into every module.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-3"
          >
            {complianceItems.map((c) => (
              <motion.div
                key={c.title}
                variants={fadeUp}
                className="glass noise relative overflow-hidden rounded-2xl p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                  <c.icon size={24} className="text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-bold">{c.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">
                  {c.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ CONTACT / LEAD CAPTURE ══════════ */}
      <section id="contact" className="relative z-10 px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="mx-auto max-w-4xl"
        >
          <motion.div variants={fadeUp} className="mb-12 text-center">
            <Send size={32} className="mx-auto mb-4 text-accent" />
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Deploy in <span className="gradient-text">Days</span>
            </h2>
            <p className="mx-auto max-w-lg text-white/50">
              Tell us about your business and we'll design a custom AI workforce
              that fits your operations. No obligation, no fluff.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="glass noise mx-auto max-w-xl overflow-hidden rounded-2xl p-8 md:p-10"
          >
            <AnimatePresence mode="wait">
              {formStatus === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-8 text-center"
                >
                  <CheckCircle size={48} className="mb-4 text-accent" />
                  <h3 className="mb-2 text-xl font-bold">You're in the pipeline</h3>
                  <p className="text-white/50">
                    Our AI SDR is already researching your company. Expect a
                    personalized follow-up within 24 hours.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleLeadSubmit}
                  className="space-y-5"
                >
                  <div>
                    <label htmlFor="lead-name" className="mb-1.5 block text-sm font-medium text-white/70">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="lead-name"
                      type="text"
                      required
                      value={leadForm.name}
                      onChange={(e) => setLeadForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Jane Smith"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="lead-email" className="mb-1.5 block text-sm font-medium text-white/70">
                      Work Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="lead-email"
                      type="email"
                      required
                      value={leadForm.email}
                      onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="jane@acme.com"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="lead-company" className="mb-1.5 block text-sm font-medium text-white/70">
                      Company <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="lead-company"
                      type="text"
                      required
                      value={leadForm.company}
                      onChange={(e) => setLeadForm((f) => ({ ...f, company: e.target.value }))}
                      placeholder="Acme Corp"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="lead-title" className="mb-1.5 block text-sm font-medium text-white/70">
                      Title / Role
                    </label>
                    <input
                      id="lead-title"
                      type="text"
                      value={leadForm.title}
                      onChange={(e) => setLeadForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="VP of Engineering"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="lead-context" className="mb-1.5 block text-sm font-medium text-white/70">
                      How can we help?
                    </label>
                    <textarea
                      id="lead-context"
                      rows={3}
                      value={leadForm.context}
                      onChange={(e) => setLeadForm((f) => ({ ...f, context: e.target.value }))}
                      placeholder="Tell us about the AI workforce challenges you're facing..."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30 resize-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="lead-phone" className="mb-1.5 block text-sm font-medium text-white/70">
                      Phone Number
                    </label>
                    <input
                      id="lead-phone"
                      type="tel"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={leadForm.smsConsent}
                      onChange={(e) => setLeadForm((f) => ({ ...f, smsConsent: e.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-primary accent-emerald-500 focus:ring-primary/30"
                    />
                    <span className="text-xs leading-relaxed text-white/50 group-hover:text-white/70 transition">
                      I agree to receive SMS communications from Referral Service LLC regarding my application, deal status, and account updates. Msg &amp; Data rates may apply. Reply STOP to opt out at any time. View our{" "}
                      <a href="/privacy" className="text-primary/70 underline hover:text-primary">Privacy Policy</a> and{" "}
                      <a href="/terms" className="text-primary/70 underline hover:text-primary">Terms</a>.
                    </span>
                  </label>

                  {formStatus === "error" && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                      Something went wrong. Please try again.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formStatus === "loading"}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
                  >
                    {formStatus === "loading" ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Get a Quote <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Open dashboard <ChevronRight size={16} />
            </Link>
          </motion.div>
        </motion.div>
      </section>

    </div>
  );
}
