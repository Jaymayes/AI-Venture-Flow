import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Bot,
  Shield,
  Zap,
  Phone,
  BookOpen,
  Users,
  Check,
  Clock,
  Globe,
  Lock,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

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

const navLinks = ["Modules", "Pricing", "Compliance"];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
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
              <button
                key={l}
                onClick={() => scrollTo(l.toLowerCase())}
                className="text-sm text-white/70 transition hover:text-white"
              >
                {l}
              </button>
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
            <Link
              href="/ceo"
              className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 transition hover:text-white"
            >
              <Shield size={14} /> CEO
            </Link>
            <Link
              href="/playbook"
              className="flex items-center gap-1.5 text-sm font-semibold text-amber-400 transition hover:text-white"
            >
              <BookOpen size={14} /> Playbook
            </Link>

            <Link
              href="/recruit"
              className="flex items-center gap-1.5 text-sm font-semibold text-accent transition hover:text-white"
            >
              <Zap size={14} /> Hiring
            </Link>
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
              <button
                key={l}
                onClick={() => scrollTo(l.toLowerCase())}
                className="block w-full py-3 text-left text-sm text-white/70 hover:text-white"
              >
                {l}
              </button>
            ))}
            <Link
              href="/dashboard"
              className="block w-full py-3 text-left text-sm text-white/70 hover:text-white"
            >
              Dashboard
            </Link>
            <div className="border-t border-white/10 mt-2 pt-2">
              <Link
                href="/ceo"
                className="flex items-center gap-2 w-full py-3 text-left text-sm font-semibold text-emerald-400 hover:text-white"
              >
                <Shield size={14} /> CEO Dashboard
              </Link>
              <Link
                href="/playbook"
                className="flex items-center gap-2 w-full py-3 text-left text-sm font-semibold text-amber-400 hover:text-white"
              >
                <BookOpen size={14} /> Sovereign Playbook
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
              AI-Powered Digital Employees
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="gradient-text mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl"
          >
            Modular AI
            <br />
            Venture Studio
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mx-auto mb-10 max-w-xl text-lg text-white/60 md:text-xl"
          >
            Ship ventures with composable building blocks. Deploy AI Digital
            Employees that sell, support, and manage knowledge -- in days, not
            months.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => scrollTo("pricing")}
              className="rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-semibold text-black transition hover:opacity-90"
            >
              Get a quote
            </button>
            <button
              onClick={() => scrollTo("modules")}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Explore services <ChevronRight size={16} />
            </button>
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

      {/* ══════════ CTA ══════════ */}
      <section className="relative z-10 px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="glass noise mx-auto max-w-4xl overflow-hidden rounded-3xl p-12 text-center md:p-16"
        >
          <motion.div variants={fadeUp}>
            <Clock size={32} className="mx-auto mb-4 text-accent" />
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mb-4 text-3xl font-bold md:text-4xl"
          >
            Deploy in <span className="gradient-text">Days</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mb-8 max-w-lg text-white/50"
          >
            From months to weeks. Venture modules reduce build cycles
            dramatically. Get your AI Digital Employees up and running faster
            than ever.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => scrollTo("pricing")}
              className="rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-semibold text-black transition hover:opacity-90"
            >
              Get started
            </button>
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
