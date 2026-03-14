import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Globe, Mail, Loader2, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";

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

const AUDIT_API = "https://api.referralsvc.com/api/v1/public/audit";

export default function LeadMagnet() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | scanning | done | error
  const [report, setReport] = useState(null);
  const [latency, setLatency] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("scanning");
    setReport(null);
    setErrorMsg("");

    const t0 = performance.now();
    try {
      const res = await fetch(AUDIT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email }),
      });
      const data = await res.json();
      const elapsed = Math.round(performance.now() - t0);
      setLatency(elapsed);

      if (res.ok && data.ok) {
        setReport(data.report || "Teardown complete. Report generated.");
        setStatus("done");
      } else {
        setErrorMsg(data.error || "Unexpected error. Please try again.");
        setStatus("error");
      }
    } catch (err) {
      setLatency(Math.round(performance.now() - t0));
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

  const scanningPhrases = [
    "Scanning edge nodes...",
    "Resolving tech stack via BuiltWith...",
    "Crawling site with Firecrawl...",
    "Generating AI teardown via Groq LPU...",
  ];

  return (
    <section id="audit" className="relative z-10 px-6 py-24">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
        className="mx-auto max-w-4xl"
      >
        <motion.div variants={fadeUp} className="mb-12 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
            <Zap size={14} /> Free Instant Analysis
          </span>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Get Your <span className="gradient-text">SaaS Teardown</span>
          </h2>
          <p className="mx-auto max-w-lg text-white/50">
            Enter any website and get an AI-generated competitive teardown in under 2 seconds.
            Powered by edge functions, BuiltWith, Firecrawl, and Groq LPUs.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="glass noise mx-auto max-w-xl overflow-hidden rounded-2xl p-8 md:p-10"
        >
          <AnimatePresence mode="wait">
            {status === "done" && report ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-accent" />
                    <span className="text-sm font-semibold text-accent">Teardown Complete</span>
                  </div>
                  {latency && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
                      {latency}ms
                    </span>
                  )}
                </div>

                <div className="mb-6 max-h-[400px] overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-5">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-white/80 font-sans">
                    {report}
                  </pre>
                </div>

                <button
                  onClick={() => {
                    setStatus("idle");
                    setReport(null);
                    setUrl("");
                    setEmail("");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Scan Another Site <ChevronRight size={16} />
                </button>
              </motion.div>
            ) : status === "scanning" ? (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-10 text-center"
              >
                <Loader2 size={40} className="mb-6 animate-spin text-accent" />
                <ScanningText phrases={scanningPhrases} />
                <p className="mt-3 text-xs text-white/30">
                  Parallelizing 3 edge APIs + Groq LPU inference...
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div>
                  <label htmlFor="audit-url" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-white/70">
                    <Globe size={14} className="text-white/40" />
                    Website URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="audit-url"
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.example.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label htmlFor="audit-email" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-white/70">
                    <Mail size={14} className="text-white/40" />
                    Work Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="audit-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                {status === "error" && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-semibold text-black transition hover:opacity-90"
                >
                  Generate Free SaaS Teardown <Zap size={16} />
                </button>

                <p className="text-center text-[11px] text-white/30">
                  No credit card required. Your report is generated instantly on the edge.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </section>
  );
}

function ScanningText({ phrases }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 800);
    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <p className="text-sm font-medium text-white/60">
      {phrases[index]}
    </p>
  );
}
