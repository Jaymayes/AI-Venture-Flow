import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  FileText,
  Loader2,
  Scale,
  Shield,
  Zap,
} from "lucide-react";
import { submitPartnerOnboard } from "../lib/triage-client";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const TIERS = [
  {
    value: 1,
    label: "Pilot",
    retainer: "$2,000",
    commission: "15%",
    desc: "Ideal for testing the partnership model with a focused engagement.",
    color: "border-emerald-500/40 bg-emerald-500/10",
    active: "border-emerald-400 bg-emerald-400/20 ring-1 ring-emerald-400/30",
    badge: "text-emerald-400",
  },
  {
    value: 2,
    label: "Standard",
    retainer: "$4,000",
    commission: "17%",
    desc: "Full pipeline access with standard commission structure.",
    color: "border-primary/40 bg-primary/10",
    active: "border-primary bg-primary/20 ring-1 ring-primary/30",
    badge: "text-primary",
  },
  {
    value: 3,
    label: "Enterprise",
    retainer: "$6,000",
    commission: "20%",
    desc: "Maximum retainer with premium commission on high-value deals.",
    color: "border-amber-500/40 bg-amber-500/10",
    active: "border-amber-400 bg-amber-400/20 ring-1 ring-amber-400/30",
    badge: "text-amber-400",
  },
];

const BLANK_FORM = {
  name: "",
  email: "",
  businessEntity: "",
  title: "Fractional CRO",
  state: "",
  specialization: "B2B Enterprise Sales",
  tier: 2,
};

export default function Onboarding() {
  const [form, setForm] = useState(BLANK_FORM);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const update = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await submitPartnerOnboard({
        name: form.name,
        email: form.email,
        businessEntity: form.businessEntity,
        title: form.title,
        state: form.state,
        specialization: form.specialization,
        tier: form.tier,
      });
      setResult(res);
      setStatus("success");
    } catch (err) {
      console.error("[Onboarding] Submit failed:", err);
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-40 top-0 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 flex items-center gap-4 px-6 py-5">
        <Link
          href="/playbook"
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition"
        >
          <ArrowLeft size={16} /> Back to Playbook
        </Link>
      </nav>

      <div className="relative z-10 mx-auto max-w-2xl px-6 pb-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Header */}
          <motion.div variants={fadeUp} className="mb-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/60">
              <FileText size={14} className="text-accent" />
              Statement of Work
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mb-3 text-3xl font-bold md:text-4xl"
          >
            Request <span className="gradient-text">Partnership</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mb-10 text-white/50">
            Complete the form below to receive your Sovereign Professional
            Statement of Work via DocuSign. Your portal access will be
            provisioned immediately.
          </motion.p>

          {/* Form / Success */}
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="glass noise rounded-2xl p-10 text-center"
              >
                <CheckCircle size={56} className="mx-auto mb-5 text-accent" />
                <h2 className="mb-3 text-2xl font-bold">SOW Dispatched</h2>
                <p className="mb-6 text-white/50">
                  Your Sovereign Professional Statement of Work has been sent to{" "}
                  <span className="font-medium text-white">{form.email}</span>.
                  Check your inbox for the DocuSign envelope.
                </p>
                {result?.legal?.envelopeId && (
                  <div className="mb-6 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/40">
                    Envelope ID: {result.legal.envelopeId}
                  </div>
                )}
                <div className="space-y-2 text-left text-sm text-white/60">
                  <p className="font-medium text-white/80">Next steps:</p>
                  {(result?.nextSteps || []).map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ChevronRight size={14} className="mt-0.5 shrink-0 text-accent" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/portal"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-semibold text-black transition hover:opacity-90"
                >
                  Open CRM Portal <ChevronRight size={16} />
                </Link>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="glass noise space-y-6 rounded-2xl p-8 md:p-10"
              >
                {/* Legal Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    Legal Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                {/* LLC Entity */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    LLC Entity Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.businessEntity}
                    onChange={(e) => update("businessEntity", e.target.value)}
                    placeholder="Smith Consulting LLC"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    Work Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="jane@smithconsulting.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                {/* Title + State row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-white/70">
                      Title
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => update("title", e.target.value)}
                      placeholder="Fractional CRO"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-white/70">
                      State
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => update("state", e.target.value)}
                      placeholder="California"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Specialization */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={form.specialization}
                    onChange={(e) => update("specialization", e.target.value)}
                    placeholder="B2B Enterprise Sales"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                {/* Tier Selection */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-white/70">
                    Engagement Tier <span className="text-red-400">*</span>
                  </label>
                  <div className="space-y-3">
                    {TIERS.map((t) => {
                      const selected = form.tier === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => update("tier", t.value)}
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            selected ? t.active : t.color + " hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                  selected
                                    ? "border-accent bg-accent"
                                    : "border-white/30"
                                }`}
                              >
                                {selected && (
                                  <div className="h-2 w-2 rounded-full bg-black" />
                                )}
                              </div>
                              <span className="font-semibold">{t.label}</span>
                              <span className={`text-xs font-medium ${t.badge}`}>
                                Tier {t.value}
                              </span>
                            </div>
                            <div className="text-right text-sm">
                              <span className="font-bold">{t.retainer}</span>
                              <span className="text-white/40">/mo</span>
                              <span className="ml-2 text-white/40">+</span>
                              <span className="ml-2 font-bold">{t.commission}</span>
                              <span className="text-white/40"> TCV</span>
                            </div>
                          </div>
                          <p className="mt-1.5 pl-8 text-xs text-white/40">
                            {t.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SOW Highlights */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
                    Your SOW includes
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-start gap-2">
                      <Scale size={14} className="mt-0.5 shrink-0 text-primary" />
                      <span className="text-xs text-white/60">
                        Right to Substitute — hire your own team
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap size={14} className="mt-0.5 shrink-0 text-accent" />
                      <span className="text-xs text-white/60">
                        Fixed retainer — not tied to referral volume
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield size={14} className="mt-0.5 shrink-0 text-amber-400" />
                      <span className="text-xs text-white/60">
                        Zero Trust portal access upon execution
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {status === "error" && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                    {errorMsg}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Dispatching SOW...
                    </>
                  ) : (
                    <>
                      Request Partnership <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
